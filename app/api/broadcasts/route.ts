import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { broadcastSchema } from "@/lib/validators"

// GET /api/broadcasts - List broadcasts
export async function GET(request: Request) {
  try {
    const user = await requireAuth()

    const broadcasts = await prisma.broadcast.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    })

    return NextResponse.json({ success: true, data: broadcasts })
  } catch (error) {
    console.error("Broadcasts list error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch broadcasts" } },
      { status: 500 }
    )
  }
}

// POST /api/broadcasts - Create broadcast
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = broadcastSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const {
      name,
      templateId,
      recipientType,
      selectedContacts,
      tags,
      variableMapping,
      scheduledAt,
    } = parsed.data

    // Verify template exists and is approved
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        organizationId: user.organizationId,
        status: "APPROVED",
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: { message: "Template not found or not approved" } },
        { status: 400 }
      )
    }

    // Get recipients based on type
    let recipientIds: string[] = []

    if (recipientType === "all") {
      const contacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId, optedIn: true },
        select: { id: true },
      })
      recipientIds = contacts.map((c) => c.id)
    } else if (recipientType === "selected" && selectedContacts) {
      recipientIds = selectedContacts
    } else if (recipientType === "tags" && tags) {
      const contacts = await prisma.contact.findMany({
        where: {
          organizationId: user.organizationId,
          optedIn: true,
          tags: { hasSome: tags },
        },
        select: { id: true },
      })
      recipientIds = contacts.map((c) => c.id)
    }

    if (recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "No recipients selected" } },
        { status: 400 }
      )
    }

    // Create broadcast and recipients in transaction
    const broadcast = await prisma.$transaction(async (tx) => {
      const broadcast = await tx.broadcast.create({
        data: {
          organizationId: user.organizationId,
          templateId,
          createdById: user.id,
          name,
          variableMapping: variableMapping || {},
          status: scheduledAt ? "SCHEDULED" : "PROCESSING",
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          totalRecipients: recipientIds.length,
        },
      })

      // Create recipient records
      await tx.broadcastRecipient.createMany({
        data: recipientIds.map((contactId) => ({
          broadcastId: broadcast.id,
          contactId,
          status: "QUEUED",
        })),
      })

      return broadcast
    })

    // TODO: Add to queue for processing
    // await addBroadcastJob({ broadcastId: broadcast.id, organizationId: user.organizationId })

    return NextResponse.json({ success: true, data: broadcast })
  } catch (error) {
    console.error("Broadcast create error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to create broadcast" } },
      { status: 500 }
    )
  }
}
