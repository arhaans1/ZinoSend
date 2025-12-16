import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// This endpoint creates the first super admin
// It only works if no super admin exists yet
// For security, you can also require a setup secret in production

export async function POST(request: NextRequest) {
  try {
    // Check if setup is allowed (no super admin exists)
    const existingSuperAdmin = await prisma.superAdmin.findFirst()

    if (existingSuperAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Super admin already exists. Setup is disabled.' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name, setupSecret } = body

    // Optional: Check setup secret for additional security
    const expectedSecret = process.env.SUPER_ADMIN_SETUP_SECRET
    if (expectedSecret && setupSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid setup secret' } },
        { status: 403 }
      )
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: { message: 'Email, password, and name are required' } },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'Password must be at least 8 characters' } },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const superAdmin = await prisma.superAdmin.create({
      data: {
        email,
        passwordHash,
        name,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        message: 'Super admin created successfully. You can now login at /super-admin/login',
      },
    })
  } catch (error) {
    console.error('Super admin setup error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Setup failed' } },
      { status: 500 }
    )
  }
}

// GET to check if setup is needed
export async function GET() {
  try {
    const existingSuperAdmin = await prisma.superAdmin.findFirst()

    return NextResponse.json({
      success: true,
      data: {
        setupRequired: !existingSuperAdmin,
        message: existingSuperAdmin
          ? 'Super admin already exists'
          : 'No super admin found. Setup is available.',
      },
    })
  } catch (error) {
    console.error('Super admin setup check error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to check setup status' } },
      { status: 500 }
    )
  }
}
