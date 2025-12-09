import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// GET /api/conversations - List conversations
export async function GET(request: Request) {
  try {
    const user = await requireAuth()

    const conversations = await prisma.conversation.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        contact: {
          select: { id: true, phone: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: conversations })
  } catch (error) {
    console.error("Conversations list error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch conversations" } },
      { status: 500 }
    )
  }
}
