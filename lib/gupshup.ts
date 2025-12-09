const GUPSHUP_API_URL = process.env.GUPSHUP_API_URL || 'https://api.gupshup.io/sm/api/v1'

interface GupshupConfig {
  appId: string
  apiKey: string
}

interface SendTemplateParams {
  phoneNumber: string
  templateId: string
  variables: string[]
  mediaUrl?: string
}

interface SendSessionMessageParams {
  phoneNumber: string
  type: 'text' | 'image' | 'video' | 'document'
  content: string | { url: string; caption?: string }
}

interface CreateTemplateParams {
  name: string
  category: string
  language: string
  components: TemplateComponent[]
}

interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  text?: string
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phone_number?: string
  }>
}

interface GupshupResponse {
  status: string
  messageId?: string
  message?: string
}

class GupshupClient {
  private appId: string
  private apiKey: string

  constructor(config: GupshupConfig) {
    this.appId = config.appId
    this.apiKey = config.apiKey
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: Record<string, any>
  ): Promise<any> {
    const url = `${GUPSHUP_API_URL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apikey': this.apiKey,
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && method === 'POST') {
      options.body = new URLSearchParams(body as Record<string, string>).toString()
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gupshup API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async sendTemplateMessage(params: SendTemplateParams): Promise<{ messageId: string }> {
    const { phoneNumber, templateId, variables, mediaUrl } = params

    const message: Record<string, any> = {
      type: 'template',
      template: {
        id: templateId,
        params: variables,
      },
    }

    if (mediaUrl) {
      message.template.mediaUrl = mediaUrl
    }

    const response = await this.makeRequest('/msg', 'POST', {
      channel: 'whatsapp',
      source: this.appId,
      destination: phoneNumber.replace('+', ''),
      message: JSON.stringify(message),
      'src.name': this.appId,
    })

    return { messageId: response.messageId || response.id }
  }

  async sendSessionMessage(params: SendSessionMessageParams): Promise<{ messageId: string }> {
    const { phoneNumber, type, content } = params

    let message: Record<string, any>

    if (type === 'text') {
      message = {
        type: 'text',
        text: content as string,
      }
    } else {
      const mediaContent = content as { url: string; caption?: string }
      message = {
        type,
        originalUrl: mediaContent.url,
        previewUrl: mediaContent.url,
        caption: mediaContent.caption || '',
      }
    }

    const response = await this.makeRequest('/msg', 'POST', {
      channel: 'whatsapp',
      source: this.appId,
      destination: phoneNumber.replace('+', ''),
      message: JSON.stringify(message),
      'src.name': this.appId,
    })

    return { messageId: response.messageId || response.id }
  }

  async createTemplate(params: CreateTemplateParams): Promise<{ templateId: string; status: string }> {
    const { name, category, language, components } = params

    const response = await this.makeRequest('/template/create', 'POST', {
      appId: this.appId,
      name,
      category,
      languageCode: language,
      templateType: 'TEXT',
      vertical: 'MARKETING',
      content: JSON.stringify(components),
    })

    return {
      templateId: response.template?.id || response.id,
      status: response.status || 'PENDING',
    }
  }

  async getTemplateStatus(templateId: string): Promise<{ status: string; rejectionReason?: string }> {
    const response = await this.makeRequest(`/template/${templateId}/status`, 'GET')

    return {
      status: response.status,
      rejectionReason: response.rejectionReason,
    }
  }

  async getTemplates(): Promise<any[]> {
    const response = await this.makeRequest(`/template/list/${this.appId}`, 'GET')
    return response.templates || []
  }

  async optInUser(phoneNumber: string): Promise<boolean> {
    try {
      await this.makeRequest('/user/optin', 'POST', {
        appId: this.appId,
        phoneNumber: phoneNumber.replace('+', ''),
      })
      return true
    } catch {
      return false
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.makeRequest('/msg/read', 'POST', {
      appId: this.appId,
      messageId,
    })
  }
}

// Factory function to create client with organization credentials
export function createGupshupClient(appId: string, apiKey: string): GupshupClient {
  return new GupshupClient({ appId, apiKey })
}

// Helper to get client from organization
export async function getGupshupClientForOrg(organizationId: string) {
  const { prisma } = await import('./prisma')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { gupshupAppId: true, gupshupApiKey: true },
  })

  if (!org?.gupshupAppId || !org?.gupshupApiKey) {
    throw new Error('Gupshup credentials not configured for this organization')
  }

  return createGupshupClient(org.gupshupAppId, org.gupshupApiKey)
}

export type { GupshupClient, SendTemplateParams, SendSessionMessageParams, CreateTemplateParams }
