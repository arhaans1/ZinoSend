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
    const limit = parseInt(searchParams.get('limit') || '100')

    const messages = await prisma.message.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((msg) => ({
          id: msg.id,
          direction: msg.direction,
          type: msg.type,
          status: msg.status,
          cost: Number(msg.cost),
          organization: msg.organization,
          contact: msg.contact,
          createdAt: msg.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Super admin messages error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch messages' } },
      { status: 500 }
    )
  }
}
