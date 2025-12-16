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

    // Get all stats in parallel
    const [
      totalOrganizations,
      totalUsers,
      totalMessages,
      totalContacts,
      totalBroadcasts,
      revenueData,
      recentOrganizations,
      topOrganizations,
    ] = await Promise.all([
      // Total organizations
      prisma.organization.count(),

      // Total users
      prisma.user.count(),

      // Total messages
      prisma.message.count(),

      // Total contacts
      prisma.contact.count(),

      // Total broadcasts
      prisma.broadcast.count(),

      // Total revenue (top-ups)
      prisma.transaction.aggregate({
        where: { type: 'TOPUP' },
        _sum: { amount: true },
      }),

      // Recent organizations (last 10)
      prisma.organization.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              contacts: true,
              messages: true,
            },
          },
        },
      }),

      // Top organizations by messages
      prisma.organization.findMany({
        take: 10,
        orderBy: {
          messages: { _count: 'desc' },
        },
        include: {
          _count: {
            select: {
              users: true,
              contacts: true,
              messages: true,
            },
          },
          transactions: {
            where: { type: 'TOPUP' },
            select: { amount: true },
          },
        },
      }),
    ])

    // Calculate organization-wise stats
    const organizationStats = topOrganizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.subscriptionPlan,
      walletBalance: Number(org.walletBalance),
      usersCount: org._count.users,
      contactsCount: org._count.contacts,
      messagesCount: org._count.messages,
      totalTopUps: org.transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      createdAt: org.createdAt,
    }))

    // Get message cost stats
    const messageCostData = await prisma.message.aggregate({
      _sum: { cost: true },
    })

    // Get monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        type: 'TOPUP',
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: { amount: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalOrganizations,
          totalUsers,
          totalMessages,
          totalContacts,
          totalBroadcasts,
          totalRevenue: Number(revenueData._sum.amount || 0),
          totalMessageCost: Number(messageCostData._sum.cost || 0),
        },
        recentOrganizations: recentOrganizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.subscriptionPlan,
          usersCount: org._count.users,
          contactsCount: org._count.contacts,
          messagesCount: org._count.messages,
          createdAt: org.createdAt,
        })),
        topOrganizations: organizationStats,
        monthlyRevenue,
      },
    })
  } catch (error) {
    console.error('Super admin stats error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch stats' } },
      { status: 500 }
    )
  }
}
