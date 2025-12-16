import { z } from 'zod'

// Phone number validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Please enter a valid Indian phone number (+91XXXXXXXXXX)')

// Email validation
export const emailSchema = z.string().email('Please enter a valid email address')

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Contact schemas
export const contactSchema = z.object({
  phone: phoneSchema,
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  optedIn: z.boolean().optional(),
})

export const contactImportSchema = z.object({
  file: z.any(),
  columnMapping: z.object({
    phone: z.string(),
    name: z.string().optional(),
    email: z.string().optional(),
  }),
  tags: z.array(z.string()).default([]),
})

// Template schemas
export const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  templateName: z.string()
    .min(1, 'Template name for Meta is required')
    .regex(/^[a-z][a-z0-9_]*$/, 'Must be lowercase with underscores, starting with a letter'),
  category: z.enum(['MARKETING', 'UTILITY', 'AUTHENTICATION']),
  language: z.string().optional(),
  headerType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  headerContent: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  footer: z.string().optional(),
  buttons: z.array(z.object({
    type: z.enum(['QUICK_REPLY', 'URL', 'PHONE_NUMBER']),
    text: z.string(),
    url: z.string().optional(),
    phoneNumber: z.string().optional(),
  })).optional(),
})

// Broadcast schemas
export const broadcastSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  templateId: z.string().min(1, 'Please select a template'),
  recipientType: z.enum(['all', 'tags', 'selected', 'csv']),
  selectedContacts: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  variableMapping: z.record(z.string(), z.string()).optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  scheduledAt: z.date().optional(),
})

// Message schemas
export const sendMessageSchema = z.object({
  contactId: z.string(),
  type: z.enum(['text', 'image', 'video', 'document', 'template']),
  content: z.union([
    z.string(),
    z.object({
      url: z.string().url(),
      caption: z.string().optional(),
    }),
    z.object({
      templateId: z.string(),
      variables: z.array(z.string()),
    }),
  ]),
})

// Team schemas
export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMIN', 'AGENT']),
  permissions: z.object({
    viewContacts: z.boolean().optional(),
    manageContacts: z.boolean().optional(),
    viewTemplates: z.boolean().optional(),
    manageTemplates: z.boolean().optional(),
    createBroadcasts: z.boolean().optional(),
    viewAnalytics: z.boolean().optional(),
    manageTeam: z.boolean().optional(),
    manageBilling: z.boolean().optional(),
  }).optional(),
})

// Billing schemas
export const topUpSchema = z.object({
  amount: z.number().min(100, 'Minimum top-up amount is ₹100').max(100000, 'Maximum top-up amount is ₹1,00,000'),
})

// Settings schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: phoneSchema.optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type TemplateInput = z.infer<typeof templateSchema>
export type BroadcastInput = z.infer<typeof broadcastSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>
export type TopUpInput = z.infer<typeof topUpSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
