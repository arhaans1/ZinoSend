import { NextRequest, NextResponse } from 'next/server'
import { authenticateSuperAdmin, createSuperAdminToken, setSuperAdminCookie } from '@/lib/super-admin-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      )
    }

    const superAdmin = await authenticateSuperAdmin(email, password)

    if (!superAdmin) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid credentials' } },
        { status: 401 }
      )
    }

    const token = await createSuperAdminToken(superAdmin)
    await setSuperAdminCookie(token)

    return NextResponse.json({
      success: true,
      data: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    })
  } catch (error) {
    console.error('Super admin login error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Login failed' } },
      { status: 500 }
    )
  }
}
