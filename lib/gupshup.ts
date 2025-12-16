// GupShup API Configuration
// Platform-level credentials (for SaaS model where all orgs use platform's GupShup account)
const GUPSHUP_API_URL = process.env.GUPSHUP_API_URL || 'https://api.gupshup.io/wa/api/v1'
const GUPSHUP_PARTNER_API_URL = process.env.GUPSHUP_PARTNER_API_URL || 'https://partner.gupshup.io/partner/api/v1'

// Platform credentials from environment
const PLATFORM_GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY
const PLATFORM_GUPSHUP_APP_ID = process.env.GUPSHUP_APP_ID // Your WhatsApp source number
const PLATFORM_GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME || 'ZinoSend'
const GUPSHUP_PARTNER_SECRET = process.env.GUPSHUP_PARTNER_SECRET

interface GupshupConfig {
  appId: string
  apiKey: string
  appName?: string
}

interface SendTemplateParams {
  phoneNumber: string
  templateId: string
  templateName: string
  variables?: string[]
  mediaUrl?: string
}

interface SendSessionMessageParams {
  phoneNumber: string
  type: 'text' | 'image' | 'video' | 'document'
  content: string | { url: string; caption?: string; filename?: string }
}

interface CreateTemplateParams {
  name: string
  category: string
  language: string
  bodyText: string
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerContent?: string
  footer?: string
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phoneNumber?: string
  }>
}

class GupshupClient {
  private appId: string
  private apiKey: string
  private appName: string

  constructor(config: GupshupConfig) {
    this.appId = config.appId
    this.apiKey = config.apiKey
    this.appName = config.appName || config.appId
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, unknown>,
    usePartnerApi = false
  ): Promise<unknown> {
    const baseUrl = usePartnerApi ? GUPSHUP_PARTNER_API_URL : GUPSHUP_API_URL
    const url = `${baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': this.apiKey,
    }

    // Add partner secret if available and using partner API
    if (usePartnerApi && GUPSHUP_PARTNER_SECRET) {
      headers['Authorization'] = GUPSHUP_PARTNER_SECRET
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && method === 'POST') {
      const formBody: Record<string, string> = {}
      for (const [key, value] of Object.entries(body)) {
        formBody[key] = typeof value === 'object' ? JSON.stringify(value) : String(value)
      }
      options.body = new URLSearchParams(formBody).toString()
    }

    console.log(`[GupShup] ${method} ${url}`)

    const response = await fetch(url, options)
    const responseText = await response.text()

    console.log(`[GupShup] Response: ${response.status} - ${responseText.substring(0, 200)}`)

    if (!response.ok) {
      throw new Error(`Gupshup API error: ${response.status} - ${responseText}`)
    }

    try {
      return JSON.parse(responseText)
    } catch {
      return { status: 'success', response: responseText }
    }
  }

  async sendTemplateMessage(params: SendTemplateParams): Promise<{ messageId: string }> {
    const { phoneNumber, templateName, variables = [], mediaUrl } = params

    // Build template message payload
    const templateData: Record<string, unknown> = {
      id: templateName,
      params: variables,
    }

    if (mediaUrl) {
      templateData.mediaUrl = mediaUrl
    }

    const message = {
      type: 'template',
      template: templateData,
    }

    const response = await this.makeRequest('/msg', 'POST', {
      channel: 'whatsapp',
      source: this.appId,
      destination: phoneNumber.replace('+', ''),
      message: JSON.stringify(message),
      'src.name': this.appName,
    }) as { messageId?: string; id?: string }

    return { messageId: response.messageId || response.id || 'unknown' }
  }

  async sendSessionMessage(params: SendSessionMessageParams): Promise<{ messageId: string }> {
    const { phoneNumber, type, content } = params

    let message: Record<string, unknown>

    if (type === 'text') {
      message = {
        type: 'text',
        text: content as string,
      }
    } else {
      const mediaContent = content as { url: string; caption?: string; filename?: string }
      message = {
        type,
        originalUrl: mediaContent.url,
        previewUrl: mediaContent.url,
        caption: mediaContent.caption || '',
        filename: mediaContent.filename,
      }
    }

    const response = await this.makeRequest('/msg', 'POST', {
      channel: 'whatsapp',
      source: this.appId,
      destination: phoneNumber.replace('+', ''),
      message: JSON.stringify(message),
      'src.name': this.appName,
    }) as { messageId?: string; id?: string }

    return { messageId: response.messageId || response.id || 'unknown' }
  }

  async createTemplate(params: CreateTemplateParams): Promise<{ templateId: string; status: string }> {
    const { name, category, language, bodyText, headerType, headerContent, footer, buttons } = params

    // Build components array for Meta/GupShup format
    const components: Array<Record<string, unknown>> = []

    // Header component
    if (headerType && headerContent) {
      components.push({
        type: 'HEADER',
        format: headerType,
        text: headerType === 'TEXT' ? headerContent : undefined,
        example: headerType !== 'TEXT' ? { header_handle: [headerContent] } : undefined,
      })
    }

    // Body component
    components.push({
      type: 'BODY',
      text: bodyText,
    })

    // Footer component
    if (footer) {
      components.push({
        type: 'FOOTER',
        text: footer,
      })
    }

    // Buttons component
    if (buttons && buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons.map((btn) => ({
          type: btn.type,
          text: btn.text,
          url: btn.url,
          phone_number: btn.phoneNumber,
        })),
      })
    }

    const response = await this.makeRequest('/template/msg', 'POST', {
      appId: this.appId,
      elementName: name,
      category: category.toUpperCase(),
      languageCode: language,
      templateType: headerType || 'TEXT',
      vertical: category.toUpperCase(),
      content: bodyText,
      header: headerContent,
      footer: footer,
      buttons: buttons ? JSON.stringify(buttons) : undefined,
    }) as { template?: { id?: string }; id?: string; status?: string }

    return {
      templateId: response.template?.id || response.id || name,
      status: response.status || 'PENDING',
    }
  }

  async getTemplateStatus(templateName: string): Promise<{ status: string; rejectionReason?: string }> {
    const response = await this.makeRequest(`/template/list/${this.appId}`, 'GET') as {
      templates?: Array<{ elementName: string; status: string; reason?: string }>
    }

    const template = response.templates?.find((t) => t.elementName === templateName)

    return {
      status: template?.status || 'UNKNOWN',
      rejectionReason: template?.reason,
    }
  }

  async getTemplates(): Promise<Array<{ name: string; status: string; category: string }>> {
    const response = await this.makeRequest(`/template/list/${this.appId}`, 'GET') as {
      templates?: Array<{ elementName: string; status: string; category: string }>
    }

    return (response.templates || []).map((t) => ({
      name: t.elementName,
      status: t.status,
      category: t.category,
    }))
  }

  async optInUser(phoneNumber: string): Promise<boolean> {
    try {
      await this.makeRequest('/app/opt/in/' + this.appId, 'POST', {
        user: phoneNumber.replace('+', ''),
      })
      return true
    } catch (error) {
      console.error('[GupShup] Opt-in error:', error)
      return false
    }
  }

  async getMessageStatus(messageId: string): Promise<{ status: string }> {
    try {
      const response = await this.makeRequest(`/msg/${messageId}`, 'GET') as { status?: string }
      return { status: response.status || 'UNKNOWN' }
    } catch {
      return { status: 'UNKNOWN' }
    }
  }
}

// Get the platform-level GupShup client (uses YOUR credentials)
export function getPlatformGupshupClient(): GupshupClient {
  if (!PLATFORM_GUPSHUP_API_KEY || !PLATFORM_GUPSHUP_APP_ID) {
    throw new Error(
      'Platform GupShup credentials not configured. Please set GUPSHUP_API_KEY and GUPSHUP_APP_ID environment variables.'
    )
  }

  return new GupshupClient({
    appId: PLATFORM_GUPSHUP_APP_ID,
    apiKey: PLATFORM_GUPSHUP_API_KEY,
    appName: PLATFORM_GUPSHUP_APP_NAME,
  })
}

// Factory function to create client with custom credentials (for orgs with their own account)
export function createGupshupClient(appId: string, apiKey: string): GupshupClient {
  return new GupshupClient({ appId, apiKey })
}

// Helper to get client for an organization
// First checks if org has own credentials, otherwise uses platform credentials
export async function getGupshupClientForOrg(organizationId: string): Promise<GupshupClient> {
  const { prisma } = await import('./prisma')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { gupshupAppId: true, gupshupApiKey: true },
  })

  // If org has their own credentials, use them
  if (org?.gupshupAppId && org?.gupshupApiKey) {
    return createGupshupClient(org.gupshupAppId, org.gupshupApiKey)
  }

  // Otherwise, use platform credentials
  return getPlatformGupshupClient()
}

// Check if GupShup is configured (either platform or org level)
export function isGupshupConfigured(): boolean {
  return !!(PLATFORM_GUPSHUP_API_KEY && PLATFORM_GUPSHUP_APP_ID)
}

export type { GupshupClient, SendTemplateParams, SendSessionMessageParams, CreateTemplateParams }
