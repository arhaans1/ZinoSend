import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { templateSchema } from "@/lib/validators"

// GET /api/templates - List templates
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {
      organizationId: user.organizationId,
    }

    if (status) {
      where.status = status
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error("Templates list error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch templates" } },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create template
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = templateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const {
      name,
      templateName,
      category,
      language,
      headerType,
      headerContent,
      body: templateBody,
      footer,
      buttons,
    } = parsed.data

    // Check if template name already exists
    const existing = await prisma.template.findUnique({
      where: {
        organizationId_templateName_language: {
          organizationId: user.organizationId,
          templateName,
          language,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "A template with this name and language already exists" },
        },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        organizationId: user.organizationId,
        name,
        templateName,
        category,
        language,
        headerType,
        headerContent,
        body: templateBody,
        footer,
        buttons: buttons || undefined,
        status: "DRAFT",
      },
    })

    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    console.error("Template create error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to create template" } },
      { status: 500 }
    )
  }
}
