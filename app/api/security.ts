import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET =
  process.env.APP_SECRET ||
  process.env.SESSION_SECRET ||
  "xlb-replica-dev-secret-change-me";

export function signPayload(packed: string) {
  return createHmac("sha256", SECRET).update(packed).digest("base64url");
}

export function verifyPayload(packed: string, signature: string) {
  const expected = signPayload(packed);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
