// import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      // lastName: string
      email: string
      role: string
      profileImage?: string | null
      accessToken: string
      provider: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name: string
    // lastName: string
    email: string
    role: string
    profileImage?: string | null
    accessToken: string
    provider: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    name: string
    // lastName: string
    email: string
    role: string
    profileImage?: string | null
    accessToken: string
    provider: string
  }
}
