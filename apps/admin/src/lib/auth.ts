import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const isProduction = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || "Invalid credentials");
          }

          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            role: data.data.user.role,
            avatar: data.data.user.avatar,
            accessToken: data.data.token,
          };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.admin-session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction },
    },
    csrfToken: {
      name: "next-auth.admin-csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction },
    },
    callbackUrl: {
      name: "next-auth.admin-callback-url",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const role = (user as any).role;
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new Error("Access denied. Admin privileges required.");
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id || user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
