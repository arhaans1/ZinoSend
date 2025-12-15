import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { changePasswordSchema } from "@/lib/validators"

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed.data

    // Get user with password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 }
      )
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: { message: "Current password is incorrect" } },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to change password" } },
      { status: 500 }
    )
  }
}
