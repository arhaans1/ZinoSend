import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error("Team fetch error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch team members" } },
      { status: 500 }
    )
  }
}
