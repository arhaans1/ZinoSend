import 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      organizationId: string
      organizationName: string
      organizationSlug: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    organizationId: string
    organizationName: string
    organizationSlug: string
    role: string
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    organizationId: string
    organizationName: string
    organizationSlug: string
    role: string
  }
}
