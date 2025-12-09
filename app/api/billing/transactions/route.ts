import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const transactions = await prisma.transaction.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ success: true, data: transactions })
  } catch (error) {
    console.error("Transactions fetch error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch transactions" } },
      { status: 500 }
    )
  }
}
