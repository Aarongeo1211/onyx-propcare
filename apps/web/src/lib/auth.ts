import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const GOOGLE_ROLE_COOKIE = "onyx-auth-role";

// Refresh the backend access token once it has less than this much life left.
// The NextAuth cookie rolls indefinitely for active users, but the embedded backend
// JWT expires after 7 days — without renewal, authed API calls start 401ing.
const ACCESS_TOKEN_REFRESH_MARGIN_SEC = 2 * 24 * 60 * 60; // refresh when < 2 days remain

function getJwtExpirySeconds(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * Keep the backend access token alive across the lifetime of a rolling NextAuth session.
 * Returns a fresh token when the current one is expired or near expiry, otherwise the
 * existing token unchanged. Network/refresh failures fall back to the existing token so a
 * transient hiccup doesn't log the user out — it will simply retry on the next session touch.
 */
async function ensureFreshAccessToken(accessToken: string | undefined): Promise<string | undefined> {
  if (!accessToken) return accessToken;

  const exp = getJwtExpirySeconds(accessToken);
  if (exp === null) return accessToken;

  const now = Date.now() / 1000;
  if (exp - now > ACCESS_TOKEN_REFRESH_MARGIN_SEC) return accessToken; // comfortable life left

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.token) return data.data.token as string;
    }
  } catch {
    // keep existing token; retry on next session touch
  }
  return accessToken;
}

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
          phone: data.data.user.phone ?? null,
          phoneVerifiedAt: data.data.user.phoneVerifiedAt ?? null,
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
            user.phone = data.data.user.phone ?? null;
            user.phoneVerifiedAt = data.data.user.phoneVerifiedAt ?? null;
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
        token.phone = user.phone ?? null;
        token.phoneVerifiedAt = user.phoneVerifiedAt ?? null;
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
        if ((session as { phone?: string | null }).phone !== undefined) {
          token.phone = (session as { phone?: string | null }).phone ?? null;
        }
        if ((session as { phoneVerifiedAt?: string | null }).phoneVerifiedAt !== undefined) {
          token.phoneVerifiedAt = (session as { phoneVerifiedAt?: string | null }).phoneVerifiedAt ?? null;
        }
        if ((session as { avatar?: string | null }).avatar !== undefined) {
          token.avatar = (session as { avatar?: string | null }).avatar ?? null;
        }
        if ((session as { accessToken?: string }).accessToken) {
          token.accessToken = (session as { accessToken: string }).accessToken;
        }
      }

      // Keep the embedded backend token from silently expiring under a rolling session.
      const refreshed = await ensureFreshAccessToken(token.accessToken as string | undefined);
      if (refreshed) token.accessToken = refreshed;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.phone = token.phone as string | null;
        session.user.phoneVerifiedAt = token.phoneVerifiedAt as string | null;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
