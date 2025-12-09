import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { contactSchema } from "@/lib/validators"

// GET /api/contacts - List contacts with pagination and search
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

    const skip = (page - 1) * limit

    const where: any = {
      organizationId: user.organizationId,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Contacts list error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch contacts" } },
      { status: 500 }
    )
  }
}

// POST /api/contacts - Create a contact
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.errors[0].message } },
        { status: 400 }
      )
    }

    const { phone, name, email, tags, optedIn } = parsed.data

    // Check if contact already exists
    const existing = await prisma.contact.findUnique({
      where: {
        organizationId_phone: {
          organizationId: user.organizationId,
          phone,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: "A contact with this phone number already exists" } },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.create({
      data: {
        organizationId: user.organizationId,
        phone,
        name,
        email,
        tags: tags || [],
        optedIn,
        optedInAt: optedIn ? new Date() : null,
        source: "MANUAL",
      },
    })

    return NextResponse.json({ success: true, data: contact })
  } catch (error) {
    console.error("Contact create error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to create contact" } },
      { status: 500 }
    )
  }
}
