import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { topUpSchema } from "@/lib/validators"
// import { createTopUpOrder } from "@/lib/razorpay"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const parsed = topUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: parsed.error.issues[0].message } },
        { status: 400 }
      )
    }

    const { amount } = parsed.data

    // In production, create Razorpay order:
    // const order = await createTopUpOrder({
    //   amount,
    //   organizationId: user.organizationId,
    // })

    // For now, simulate order creation
    const order = {
      orderId: `order_${Date.now()}`,
      amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_xxx",
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error("Top-up create error:", error)
    return NextResponse.json(
      { success: false, error: { message: "Failed to create top-up" } },
      { status: 500 }
    )
  }
}
