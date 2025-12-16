import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSuperAdminFromCookies } from '@/lib/super-admin-auth'
import bcrypt from 'bcryptjs'

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

    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
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
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Super admin users error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch users' } },
      { status: 500 }
    )
  }
}

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
    const { name, email, password, role, organizationId } = body

    if (!name || !email || !password || !organizationId) {
      return NextResponse.json(
        { success: false, error: { message: 'All fields are required' } },
        { status: 400 }
      )
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, error: { message: 'Organization not found' } },
        { status: 404 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'Email already in use' } },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'AGENT',
        organizationId,
      },
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
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    })
  } catch (error) {
    console.error('Super admin create user error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create user' } },
      { status: 500 }
    )
  }
}
