import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSuperAdminFromCookies } from '@/lib/super-admin-auth'

export async function POST(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromCookies()

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationId, amount, description } = body

    if (!organizationId || !amount) {
      return NextResponse.json(
        { success: false, error: { message: 'Organization and amount are required' } },
        { status: 400 }
      )
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid amount' } },
        { status: 400 }
      )
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, error: { message: 'Organization not found' } },
        { status: 404 }
      )
    }

    const currentBalance = Number(organization.walletBalance)
    const newBalance = currentBalance + amountNum

    // Update wallet balance and create transaction in a single transaction
    const [updatedOrg, transaction] = await prisma.$transaction([
      prisma.organization.update({
        where: { id: organizationId },
        data: { walletBalance: newBalance },
      }),
      prisma.transaction.create({
        data: {
          organizationId,
          type: 'TOPUP',
          amount: amountNum,
          balanceAfter: newBalance,
          description: description || 'Manual top-up by admin',
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          balanceAfter: Number(transaction.balanceAfter),
          description: transaction.description,
        },
        newBalance,
      },
    })
  } catch (error) {
    console.error('Super admin wallet topup error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to add top-up' } },
      { status: 500 }
    )
  }
}
