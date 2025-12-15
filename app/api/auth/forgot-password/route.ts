import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validators"
// import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    // Store token in Redis or database with expiry
    // For now, we'll just log it (in production, store it properly)
    console.log(`Password reset token for ${email}: ${resetToken}`)

    // TODO: Implement proper token storage
    // await redis.set(`password_reset:${resetTokenHash}`, user.id, { ex: 3600 })

    // Build reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // TODO: Send email
    // await sendPasswordResetEmail({ email, name: user.name, resetUrl })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
