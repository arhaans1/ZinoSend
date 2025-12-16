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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              users: true,
              contacts: true,
              messages: true,
              broadcasts: true,
            },
          },
          users: {
            where: { role: 'OWNER' },
            take: 1,
            select: {
              name: true,
              email: true,
            },
          },
          transactions: {
            where: { type: 'TOPUP' },
            select: { amount: true },
          },
        },
      }),
      prisma.organization.count({ where }),
    ])

    const formattedOrgs = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      subscriptionPlan: org.subscriptionPlan,
      walletBalance: Number(org.walletBalance),
      owner: org.users[0] || null,
      stats: {
        users: org._count.users,
        contacts: org._count.contacts,
        messages: org._count.messages,
        broadcasts: org._count.broadcasts,
      },
      totalTopUps: org.transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      data: {
        organizations: formattedOrgs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Super admin organizations error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch organizations' } },
      { status: 500 }
    )
  }
}
