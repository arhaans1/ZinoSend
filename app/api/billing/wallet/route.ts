import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: {
        walletBalance: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, error: { message: "Organization not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(organization.walletBalance),
        plan: organization.subscriptionPlan,
        subscriptionEndsAt: organization.subscriptionEndsAt,
      },
    })
  } catch (error) {
    console.error("Wallet fetch error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch wallet" } },
      { status: 500 }
    )
  }
}
