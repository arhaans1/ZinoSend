import type {
  Organization,
  User,
  Contact,
  Template,
  Broadcast,
  Message,
  Conversation,
  Transaction,
  SubscriptionPlan,
  UserRole,
  ContactSource,
  TemplateCategory,
  TemplateStatus,
  HeaderType,
  BroadcastStatus,
  MessageDirection,
  MessageType,
  MessageStatus,
  ConversationStatus,
  TransactionType,
} from '@prisma/client'

// Re-export Prisma types
export type {
  Organization,
  User,
  Contact,
  Template,
  Broadcast,
  Message,
  Conversation,
  Transaction,
  SubscriptionPlan,
  UserRole,
  ContactSource,
  TemplateCategory,
  TemplateStatus,
  HeaderType,
  BroadcastStatus,
  MessageDirection,
  MessageType,
  MessageStatus,
  ConversationStatus,
  TransactionType,
}

// Extended session user type
export interface SessionUser {
  id: string
  email: string
  name: string
  image?: string | null
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: string
}

// Contact with relations
export interface ContactWithRelations extends Contact {
  organization?: Organization
  messages?: Message[]
  conversations?: Conversation[]
}

// Template with relations
export interface TemplateWithRelations extends Template {
  organization?: Organization
  broadcasts?: Broadcast[]
}

// Broadcast with relations
export interface BroadcastWithRelations extends Broadcast {
  organization?: Organization
  template?: Template
  createdBy?: User
  recipients?: BroadcastRecipientWithContact[]
}

// Broadcast recipient with contact
export interface BroadcastRecipientWithContact {
  id: string
  broadcastId: string
  contactId: string
  status: MessageStatus
  contact?: Contact
}

// Conversation with relations
export interface ConversationWithRelations extends Conversation {
  contact?: Contact
  assignedTo?: User
  messages?: Message[]
}

// Message with relations
export interface MessageWithRelations extends Message {
  contact?: Contact
  conversation?: Conversation
  template?: Template
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Analytics
export interface AnalyticsOverview {
  totalContacts: number
  totalMessages: number
  totalBroadcasts: number
  walletBalance: number
  messagesThisMonth: number
  deliveryRate: number
}

export interface MessageStats {
  date: string
  sent: number
  delivered: number
  read: number
  failed: number
}

export interface BroadcastStats {
  id: string
  name: string
  sentAt: Date
  totalRecipients: number
  deliveredCount: number
  readCount: number
  failedCount: number
}

// Gupshup types
export interface GupshupWebhookPayload {
  type: string
  payload: {
    id: string
    source: string
    destination: string
    type: string
    payload?: any
    context?: any
    timestamp?: number
  }
}

export interface GupshupMessageEvent {
  type: 'message-event'
  payload: {
    id: string
    type: 'sent' | 'delivered' | 'read' | 'failed'
    destination: string
    timestamp: number
    errorCode?: string
    errorMessage?: string
  }
}

// Razorpay types
export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  created_at: number
}

export interface RazorpayPayment {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string
  method: string
  captured: boolean
}

// GoHighLevel types
export interface GHLContact {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  tags?: string[]
  customField?: Record<string, any>
}

export interface GHLTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  locationId: string
}
