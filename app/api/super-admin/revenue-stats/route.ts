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

    const [topUps, deductions, orgCount] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'TOPUP' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'DEDUCTION' },
        _sum: { amount: true },
      }),
      prisma.organization.count(),
    ])

    const totalTopUps = Number(topUps._sum.amount || 0)
    const totalDeductions = Math.abs(Number(deductions._sum.amount || 0))

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: totalTopUps,
        totalTopUps,
        totalDeductions,
        organizationCount: orgCount,
      },
    })
  } catch (error) {
    console.error('Super admin revenue stats error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch revenue stats' } },
      { status: 500 }
    )
  }
}
