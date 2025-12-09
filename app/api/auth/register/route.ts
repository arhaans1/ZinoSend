import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validators"
import { slugify, generateWebhookSecret } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { businessName, name, email, phone, password } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: "An account with this email already exists" } },
        { status: 400 }
      )
    }

    // Generate a unique slug for the organization
    let slug = slugify(businessName)
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    })

    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: businessName,
          slug,
          webhookSecret: generateWebhookSecret(),
        },
      })

      // Create user as owner
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email,
          passwordHash,
          name,
          role: "OWNER",
        },
      })

      return { organization, user }
    })

    // TODO: Send welcome email
    // await sendWelcomeEmail({ email, name, businessName })

    return NextResponse.json({
      success: true,
      data: {
        userId: result.user.id,
        organizationId: result.organization.id,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to create account" } },
      { status: 500 }
    )
  }
}
