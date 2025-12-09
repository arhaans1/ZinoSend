// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
}

// Auth API
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  businessName: string
  name: string
  email: string
  phone: string
  password: string
}

// Contacts API
export interface CreateContactRequest {
  phone: string
  name?: string
  email?: string
  tags?: string[]
  attributes?: Record<string, string>
  optedIn?: boolean
}

export interface UpdateContactRequest {
  name?: string
  email?: string
  tags?: string[]
  attributes?: Record<string, string>
  optedIn?: boolean
}

export interface ImportContactsRequest {
  contacts: Array<{
    phone: string
    name?: string
    email?: string
  }>
  tags?: string[]
}

// Templates API
export interface CreateTemplateRequest {
  name: string
  templateName: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerContent?: string
  body: string
  footer?: string
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'
    text: string
    url?: string
    phoneNumber?: string
  }>
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

// Broadcasts API
export interface CreateBroadcastRequest {
  name: string
  templateId: string
  recipientType: 'all' | 'tags' | 'selected' | 'csv'
  selectedContacts?: string[]
  tags?: string[]
  variableMapping: Record<string, string>
  mediaUrl?: string
  scheduledAt?: string
}

// Messages API
export interface SendMessageRequest {
  contactId: string
  type: 'text' | 'image' | 'video' | 'document' | 'template'
  content: string | {
    url: string
    caption?: string
  } | {
    templateId: string
    variables: string[]
  }
}

// Team API
export interface InviteTeamMemberRequest {
  email: string
  role: 'ADMIN' | 'AGENT'
  permissions?: {
    viewContacts?: boolean
    manageContacts?: boolean
    viewTemplates?: boolean
    manageTemplates?: boolean
    createBroadcasts?: boolean
    viewAnalytics?: boolean
    manageTeam?: boolean
    manageBilling?: boolean
  }
}

export interface UpdateTeamMemberRequest {
  role?: 'ADMIN' | 'AGENT'
  permissions?: Record<string, boolean>
}

// Billing API
export interface CreateTopUpRequest {
  amount: number
}

export interface TopUpResponse {
  orderId: string
  amount: number
  currency: string
  key: string
}

// Analytics API
export interface AnalyticsQuery {
  startDate?: string
  endDate?: string
  period?: 'day' | 'week' | 'month'
}

// Webhook payloads
export interface GupshupWebhookRequest {
  type: string
  payload: {
    id: string
    source: string
    destination: string
    type: string
    payload?: {
      text?: string
      url?: string
      caption?: string
    }
    context?: {
      gsId?: string
    }
  }
}

export interface RazorpayWebhookRequest {
  event: string
  payload: {
    payment: {
      entity: {
        id: string
        amount: number
        currency: string
        status: string
        order_id: string
        notes?: Record<string, string>
      }
    }
    order?: {
      entity: {
        id: string
        amount: number
        status: string
        receipt: string
      }
    }
  }
}
