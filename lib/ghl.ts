const GHL_API_URL = 'https://services.leadconnectorhq.com'
const GHL_AUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation'

interface GHLConfig {
  accessToken: string
  locationId: string
}

interface GHLContact {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  tags?: string[]
  customFields?: Array<{ id: string; key: string; value: string }>
}

interface GHLTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  locationId: string
}

class GHLClient {
  private accessToken: string
  private locationId: string

  constructor(config: GHLConfig) {
    this.accessToken = config.accessToken
    this.locationId = config.locationId
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${GHL_API_URL}${endpoint}`

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GHL API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Contacts
  async getContacts(params?: {
    limit?: number
    startAfterId?: string
    query?: string
  }): Promise<{ contacts: GHLContact[]; meta: { nextPageUrl?: string } }> {
    const searchParams = new URLSearchParams()
    searchParams.set('locationId', this.locationId)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.startAfterId) searchParams.set('startAfterId', params.startAfterId)
    if (params?.query) searchParams.set('query', params.query)

    return this.makeRequest(`/contacts/?${searchParams.toString()}`)
  }

  async getContact(contactId: string): Promise<{ contact: GHLContact }> {
    return this.makeRequest(`/contacts/${contactId}`)
  }

  async createContact(data: {
    firstName?: string
    lastName?: string
    email?: string
    phone: string
    tags?: string[]
    customFields?: Array<{ id: string; value: string }>
  }): Promise<{ contact: GHLContact }> {
    return this.makeRequest(`/contacts/`, 'POST', {
      ...data,
      locationId: this.locationId,
    })
  }

  async updateContact(
    contactId: string,
    data: Partial<{
      firstName: string
      lastName: string
      email: string
      phone: string
      tags: string[]
    }>
  ): Promise<{ contact: GHLContact }> {
    return this.makeRequest(`/contacts/${contactId}`, 'PUT', data)
  }

  async deleteContact(contactId: string): Promise<void> {
    await this.makeRequest(`/contacts/${contactId}`, 'DELETE')
  }

  // Tags
  async addTagToContact(contactId: string, tags: string[]): Promise<void> {
    await this.makeRequest(`/contacts/${contactId}/tags`, 'POST', { tags })
  }

  async removeTagFromContact(contactId: string, tags: string[]): Promise<void> {
    await this.makeRequest(`/contacts/${contactId}/tags`, 'DELETE', { tags })
  }

  // Custom Fields
  async getCustomFields(): Promise<{ customFields: Array<{ id: string; name: string; fieldKey: string }> }> {
    return this.makeRequest(`/locations/${this.locationId}/customFields`)
  }
}

// OAuth helpers
export function getGHLAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GHL_CLIENT_ID!,
    redirect_uri: process.env.GHL_REDIRECT_URI!,
    scope: 'contacts.readonly contacts.write locations.readonly',
    state,
  })

  return `${GHL_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<GHLTokenResponse> {
  const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID!,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.GHL_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code: ${error}`)
  }

  return response.json()
}

export async function refreshGHLTokens(refreshToken: string): Promise<GHLTokenResponse> {
  const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID!,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  return response.json()
}

// Factory function
export function createGHLClient(accessToken: string, locationId: string): GHLClient {
  return new GHLClient({ accessToken, locationId })
}

// Helper to get client from organization with token refresh
export async function getGHLClientForOrg(organizationId: string): Promise<GHLClient> {
  const { prisma } = await import('./prisma')

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      ghlAccessToken: true,
      ghlRefreshToken: true,
      ghlLocationId: true,
      ghlTokenExpiresAt: true,
    },
  })

  if (!org?.ghlAccessToken || !org?.ghlLocationId) {
    throw new Error('GoHighLevel not connected for this organization')
  }

  // Check if token needs refresh (5 minutes buffer)
  if (org.ghlTokenExpiresAt && org.ghlRefreshToken) {
    const expiresAt = new Date(org.ghlTokenExpiresAt)
    const now = new Date()
    const fiveMinutes = 5 * 60 * 1000

    if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
      const tokens = await refreshGHLTokens(org.ghlRefreshToken)

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ghlAccessToken: tokens.access_token,
          ghlRefreshToken: tokens.refresh_token,
          ghlTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })

      return createGHLClient(tokens.access_token, org.ghlLocationId)
    }
  }

  return createGHLClient(org.ghlAccessToken, org.ghlLocationId)
}

export type { GHLClient, GHLContact, GHLTokenResponse }
