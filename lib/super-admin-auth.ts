import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const SUPER_ADMIN_SECRET = new TextEncoder().encode(
  process.env.SUPER_ADMIN_SECRET || process.env.NEXTAUTH_SECRET || 'super-admin-secret-key'
)

const COOKIE_NAME = 'super-admin-token'

export interface SuperAdminPayload {
  id: string
  email: string
  name: string
}

export async function createSuperAdminToken(payload: SuperAdminPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SUPER_ADMIN_SECRET)
}

export async function verifySuperAdminToken(token: string): Promise<SuperAdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SUPER_ADMIN_SECRET)
    return payload as unknown as SuperAdminPayload
  } catch {
    return null
  }
}

export async function getSuperAdminFromCookies(): Promise<SuperAdminPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  return verifySuperAdminToken(token)
}

export async function setSuperAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

export async function clearSuperAdminCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function authenticateSuperAdmin(email: string, password: string) {
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email },
  })

  if (!superAdmin || !superAdmin.isActive) {
    return null
  }

  const isValid = await bcrypt.compare(password, superAdmin.passwordHash)
  if (!isValid) {
    return null
  }

  // Update last login
  await prisma.superAdmin.update({
    where: { id: superAdmin.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
  }
}

// Helper to create first super admin (run once)
export async function createFirstSuperAdmin(email: string, password: string, name: string) {
  const existing = await prisma.superAdmin.findFirst()
  if (existing) {
    throw new Error('Super admin already exists')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  return prisma.superAdmin.create({
    data: {
      email,
      passwordHash,
      name,
    },
  })
}
