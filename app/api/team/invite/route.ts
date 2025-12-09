import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { inviteTeamMemberSchema } from "@/lib/validators"
// import { sendTeamInviteEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = inviteTeamMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { email, role, permissions } = parsed.data

    // Check if user can invite (must be OWNER or ADMIN)
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (currentUser?.role !== "OWNER" && currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "You don't have permission to invite members" } },
        { status: 403 }
      )
    }

    // Check if user already exists in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: "User already exists in this organization" } },
        { status: 400 }
      )
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex")

    // TODO: Store invite in database and send email
    // For now, just log the invite
    console.log(`Invite ${email} as ${role} with token ${inviteToken}`)

    // In production:
    // await sendTeamInviteEmail({
    //   email,
    //   inviterName: user.name,
    //   organizationName: user.organizationName,
    //   role,
    //   inviteUrl: `${process.env.NEXTAUTH_URL}/invite?token=${inviteToken}`,
    // })

    return NextResponse.json({
      success: true,
      data: { message: "Invitation sent" },
    })
  } catch (error) {
    console.error("Team invite error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to send invitation" } },
      { status: 500 }
    )
  }
}
