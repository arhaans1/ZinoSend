import { NextResponse } from 'next/server'
import { clearSuperAdminCookie } from '@/lib/super-admin-auth'

export async function POST() {
  try {
    await clearSuperAdminCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Super admin logout error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Logout failed' } },
      { status: 500 }
    )
  }
}
