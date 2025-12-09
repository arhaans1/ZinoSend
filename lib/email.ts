import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'ZinoSend <noreply@zinosend.com>'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail(params: SendEmailParams) {
  const { to, subject, html, text } = params

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

// Email templates
export async function sendWelcomeEmail(params: { email: string; name: string; businessName: string }) {
  const { email, name, businessName } = params

  return sendEmail({
    to: email,
    subject: 'Welcome to ZinoSend!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">ZinoSend</h1>
            </div>
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for signing up for ZinoSend. Your account for <strong>${businessName}</strong> is now ready.</p>
            <p>With ZinoSend, you can:</p>
            <ul>
              <li>Send WhatsApp broadcasts to your customers</li>
              <li>Manage message templates</li>
              <li>Track delivery and engagement</li>
              <li>Integrate with GoHighLevel</li>
            </ul>
            <p>Get started by setting up your WhatsApp Business Account in Settings.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 8px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you have any questions, reply to this email and we'll help you out.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ZinoSend - WhatsApp Business Messaging Platform
            </p>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendPasswordResetEmail(params: { email: string; name: string; resetUrl: string }) {
  const { email, name, resetUrl } = params

  return sendEmail({
    to: email,
    subject: 'Reset your ZinoSend password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">ZinoSend</h1>
            </div>
            <h2>Reset Your Password</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 8px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request a password reset,
              you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ZinoSend - WhatsApp Business Messaging Platform
            </p>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendTeamInviteEmail(params: {
  email: string
  inviterName: string
  organizationName: string
  role: string
  inviteUrl: string
}) {
  const { email, inviterName, organizationName, role, inviteUrl } = params

  return sendEmail({
    to: email,
    subject: `You're invited to join ${organizationName} on ZinoSend`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">ZinoSend</h1>
            </div>
            <h2>You're Invited!</h2>
            <p>${inviterName} has invited you to join <strong>${organizationName}</strong> as a${role === 'ADMIN' ? 'n' : ''} <strong>${role}</strong> on ZinoSend.</p>
            <p>ZinoSend is a WhatsApp Business messaging platform that helps businesses communicate with their customers.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 8px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This invitation will expire in 7 days.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ZinoSend - WhatsApp Business Messaging Platform
            </p>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendLowBalanceAlert(params: {
  email: string
  name: string
  balance: number
  organizationName: string
}) {
  const { email, name, balance, organizationName } = params

  return sendEmail({
    to: email,
    subject: `Low wallet balance alert - ${organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4F46E5; margin: 0;">ZinoSend</h1>
            </div>
            <h2 style="color: #F59E0B;">⚠️ Low Balance Alert</h2>
            <p>Hi ${name},</p>
            <p>Your ZinoSend wallet balance for <strong>${organizationName}</strong> is running low.</p>
            <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px;">Current Balance</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #92400E;">₹${balance.toFixed(2)}</p>
            </div>
            <p>Top up your wallet to continue sending WhatsApp messages without interruption.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/billing"
                 style="background-color: #4F46E5; color: white; padding: 12px 30px;
                        text-decoration: none; border-radius: 8px; display: inline-block;">
                Top Up Now
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ZinoSend - WhatsApp Business Messaging Platform
            </p>
          </div>
        </body>
      </html>
    `,
  })
}

export { resend }
