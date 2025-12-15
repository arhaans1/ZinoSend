import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { contactSchema } from "@/lib/validators"

// GET /api/contacts/[id] - Get a single contact
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, error: { message: "Contact not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: contact })
  } catch (error) {
    console.error("Contact get error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch contact" } },
      { status: 500 }
    )
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Check if contact exists and belongs to organization
    const existing = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: "Contact not found" } },
        { status: 404 }
      )
    }

    const parsed = contactSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const { name, email, tags, optedIn, attributes } = parsed.data

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (tags !== undefined) updateData.tags = tags
    if (attributes !== undefined) updateData.attributes = attributes
    if (optedIn !== undefined) {
      updateData.optedIn = optedIn
      if (optedIn && !existing.optedIn) {
        updateData.optedInAt = new Date()
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: contact })
  } catch (error) {
    console.error("Contact update error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to update contact" } },
      { status: 500 }
    )
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Check if contact exists and belongs to organization
    const existing = await prisma.contact.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: "Contact not found" } },
        { status: 404 }
      )
    }

    await prisma.contact.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact delete error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete contact" } },
      { status: 500 }
    )
  }
}
