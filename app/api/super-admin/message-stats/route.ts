import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSuperAdminFromCookies } from '@/lib/super-admin-auth'

export async function GET() {
  try {
    const superAdmin = await getSuperAdminFromCookies()

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const [totalMessages, inboundMessages, outboundMessages, totalCost] = await Promise.all([
      prisma.message.count(),
      prisma.message.count({ where: { direction: 'INBOUND' } }),
      prisma.message.count({ where: { direction: 'OUTBOUND' } }),
      prisma.message.aggregate({ _sum: { cost: true } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalMessages,
        inboundMessages,
        outboundMessages,
        totalCost: Number(totalCost._sum.cost || 0),
      },
    })
  } catch (error) {
    console.error('Super admin message stats error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch message stats' } },
      { status: 500 }
    )
  }
}
