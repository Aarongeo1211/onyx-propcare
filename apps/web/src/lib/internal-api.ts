/**
 * Headers that identify this Next.js server to the API as the site itself
 * rather than one anonymous caller (see apps/api/src/middleware/internalCaller.ts).
 *
 * Every server-side call reaches the API from this container's one egress IP,
 * so without these the API's per-IP rate limits would be shared by every
 * visitor. Pass the visitor's IP when calling on their behalf (login, token
 * refresh); omit it for the server's own public-data renders.
 *
 * Safe to import from client components: INTERNAL_API_SECRET isn't a
 * NEXT_PUBLIC_ variable, so it's undefined in the browser and nothing is added.
 */
export function internalApiHeaders(clientIp?: string | null): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || typeof window !== "undefined") return {};
  const headers: Record<string, string> = { "x-internal-key": secret };
  if (clientIp) headers["x-client-ip"] = clientIp;
  return headers;
}
