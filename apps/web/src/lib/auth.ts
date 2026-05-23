import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_ROLE_COOKIE = "onyx-auth-role";

function getRequestedGoogleRole() {
  return cookies().then((cookieStore) => {
    const value = cookieStore.get(GOOGLE_ROLE_COOKIE)?.value;

    if (value === "SELLER" || value === "AGENT") {
      return value;
    }

    return "BUYER";
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
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
          image: data.data.user.avatar,
          accessToken: data.data.token,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && account.id_token) {
        try {
          const role = await getRequestedGoogleRole();
          const res = await fetch(`${API_URL}/api/v1/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token, role }),
          });
          const data = await res.json();
          if (data.success && data.data) {
            user.id = data.data.user.id;
            user.role = data.data.user.role;
            user.accessToken = data.data.token;
          } else {
            return false;
          }
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "BUYER";
        token.avatar = user.image ?? null;
        token.accessToken = user.accessToken;
      }

      if (trigger === "update" && session) {
        if (session.name) {
          token.name = session.name;
        }
        if ((session as { role?: string }).role) {
          token.role = (session as { role: string }).role;
        }
        if ((session as { avatar?: string | null }).avatar !== undefined) {
          token.avatar = (session as { avatar?: string | null }).avatar ?? null;
        }
        if ((session as { accessToken?: string }).accessToken) {
          token.accessToken = (session as { accessToken: string }).accessToken;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
