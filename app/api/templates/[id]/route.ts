import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { templateSchema } from "@/lib/validators"

// GET /api/templates/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const template = await prisma.template.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { success: false, error: { message: "Template not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    console.error("Template get error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch template" } },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.template.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: "Template not found" } },
        { status: 404 }
      )
    }

    const parsed = templateSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const {
      name,
      category,
      headerType,
      headerContent,
      body: templateBody,
      footer,
      buttons,
    } = parsed.data

    // Only allow certain updates if template is already approved
    const updateData: any = {}

    if (name !== undefined) updateData.name = name

    // Only update content fields if template is still in DRAFT
    if (existing.status === "DRAFT") {
      if (category !== undefined) updateData.category = category
      if (headerType !== undefined) updateData.headerType = headerType
      if (headerContent !== undefined) updateData.headerContent = headerContent
      if (templateBody !== undefined) updateData.body = templateBody
      if (footer !== undefined) updateData.footer = footer
      if (buttons !== undefined) updateData.buttons = buttons
    }

    const template = await prisma.template.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    console.error("Template update error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to update template" } },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existing = await prisma.template.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { message: "Template not found" } },
        { status: 404 }
      )
    }

    await prisma.template.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Template delete error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete template" } },
      { status: 500 }
    )
  }
}
