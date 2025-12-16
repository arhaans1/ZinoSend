import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSuperAdminFromCookies } from '@/lib/super-admin-auth'

export async function GET(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromCookies()

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const transactions = await prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          balanceAfter: Number(tx.balanceAfter),
          description: tx.description,
          organization: tx.organization,
          createdAt: tx.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Super admin transactions error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch transactions' } },
      { status: 500 }
    )
  }
}
