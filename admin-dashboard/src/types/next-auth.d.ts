import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    profileImage: string | null;
    accessToken: string;
    refreshToken: string | null;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      profileImage: string | null;
      accessToken: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    profileImage: string | null;
    accessToken: string;
    refreshToken: string | null;
  }
}
