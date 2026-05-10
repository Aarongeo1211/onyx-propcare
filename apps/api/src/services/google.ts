import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";

const client = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export interface GoogleProfile {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
  googleId: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  if (!client) return null;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID!,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) return null;

  return {
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || payload.email,
    picture: payload.picture,
    googleId: payload.sub,
  };
}

export const isGoogleConfigured = Boolean(env.GOOGLE_CLIENT_ID);
