import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export interface CreateOrderParams {
  amount: number // Amount in INR (will be converted to paise)
  organizationId: string
  description?: string
}

export interface RazorpayOrderResponse {
  orderId: string
  amount: number
  currency: string
  key: string
}

export async function createTopUpOrder(params: CreateOrderParams): Promise<RazorpayOrderResponse> {
  const { amount, organizationId, description } = params

  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    receipt: `topup_${organizationId}_${Date.now()}`,
    notes: {
      organizationId,
      type: 'wallet_topup',
      description: description || 'Wallet top-up',
    },
  })

  return {
    orderId: order.id,
    amount: order.amount / 100,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID!,
  }
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return expectedSignature === signature
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

export async function fetchPayment(paymentId: string) {
  return razorpay.payments.fetch(paymentId)
}

export async function fetchOrder(orderId: string) {
  return razorpay.orders.fetch(orderId)
}

// Create subscription for recurring billing
export async function createSubscription(params: {
  planId: string
  customerId: string
  totalCount?: number
}) {
  return razorpay.subscriptions.create({
    plan_id: params.planId,
    customer_id: params.customerId,
    total_count: params.totalCount || 12,
    customer_notify: 1,
  })
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return razorpay.subscriptions.cancel(subscriptionId)
}

// Create or get customer
export async function createCustomer(params: {
  name: string
  email: string
  contact?: string
}) {
  return razorpay.customers.create({
    name: params.name,
    email: params.email,
    contact: params.contact,
  })
}

export { razorpay }
