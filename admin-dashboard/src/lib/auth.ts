import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
      profileImage?: string;
      refreshToken?: string;
    };
    accessToken?: string;
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token-larsfalck-admin",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Please enter your email and password");
        }

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
        if (!baseUrl) throw new Error("Backend API URL is not configured");

        const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email.trim(),
            password: credentials.password,
          }),
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as LoginResponse | null;
        if (!response.ok || payload?.success !== true) {
          throw new Error(payload?.message || "Login failed");
        }

        const user = payload.data?.user;
        const accessToken = payload.data?.accessToken;
        if (!user) throw new Error("User data was not returned by the server");
        if (!accessToken) throw new Error("Access token was not returned by the server");

        if (user.role !== "ADMIN") {
          throw new Error("Only administrators can access this dashboard");
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage || null,
          accessToken,
          refreshToken: user.refreshToken || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.profileImage = user.profileImage;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        profileImage: token.profileImage,
        accessToken: token.accessToken,
      };
      return session;
    },
  },
};
