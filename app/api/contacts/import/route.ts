import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const importSchema = z.object({
  contacts: z.array(
    z.object({
      phone: z.string().min(1),
      name: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
    })
  ),
  tags: z.array(z.string()).optional(),
})

// POST /api/contacts/import - Import contacts from CSV
export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = importSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid import data" } },
        { status: 400 }
      )
    }

    const { contacts, tags = [] } = parsed.data

    // Normalize phone numbers and filter valid ones
    const normalizedContacts = contacts
      .map((c) => ({
        ...c,
        phone: normalizePhone(c.phone),
        email: c.email || null,
      }))
      .filter((c) => isValidIndianPhone(c.phone))

    // Get existing contacts to avoid duplicates
    const existingPhones = await prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        phone: { in: normalizedContacts.map((c) => c.phone) },
      },
      select: { phone: true },
    })

    const existingPhoneSet = new Set(existingPhones.map((c) => c.phone))

    // Filter out duplicates
    const newContacts = normalizedContacts.filter(
      (c) => !existingPhoneSet.has(c.phone)
    )

    // Batch insert
    if (newContacts.length > 0) {
      await prisma.contact.createMany({
        data: newContacts.map((c) => ({
          organizationId: user.organizationId,
          phone: c.phone,
          name: c.name || null,
          email: c.email,
          tags: JSON.stringify(tags),
          source: "IMPORT",
          optedIn: true,
          optedInAt: new Date(),
        })),
        skipDuplicates: true,
      })
    }

    const imported = newContacts.length
    const failed = contacts.length - normalizedContacts.length
    const duplicates = normalizedContacts.length - newContacts.length

    return NextResponse.json({
      success: true,
      data: {
        imported,
        failed,
        duplicates,
        total: contacts.length,
      },
    })
  } catch (error) {
    console.error("Contact import error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to import contacts" } },
      { status: 500 }
    )
  }
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "")

  // Add +91 if missing country code
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = "+" + cleaned
  } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = "+91" + cleaned
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned
  }

  return cleaned
}

function isValidIndianPhone(phone: string): boolean {
  // Valid Indian mobile: +91 followed by 10 digits starting with 6-9
  return /^\+91[6-9]\d{9}$/.test(phone)
}
