import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// DELETE /api/team/[userId] - Remove team member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireAuth()
    const { userId } = await params

    // Check if current user can remove members
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (currentUser?.role !== "OWNER" && currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "You don't have permission to remove members" } },
        { status: 403 }
      )
    }

    // Get the user to be removed
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: user.organizationId,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 }
      )
    }

    // Cannot remove the owner
    if (targetUser.role === "OWNER") {
      return NextResponse.json(
        { success: false, error: { message: "Cannot remove the organization owner" } },
        { status: 400 }
      )
    }

    // Cannot remove yourself
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { success: false, error: { message: "Cannot remove yourself" } },
        { status: 400 }
      )
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Team remove error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to remove team member" } },
      { status: 500 }
    )
  }
}
