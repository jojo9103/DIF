import crypto from "crypto";

const SESSION_COOKIE = "dif_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const getSecret = () => process.env.AUTH_SECRET || "dif-pattern-detector-secret";

export type SessionUser = {
  id: string;
  email: string;
  affiliation: string;
};

export const sessionCookieName = SESSION_COOKIE;
export const sessionMaxAge = SESSION_TTL_SECONDS;

export function hashPassword(password: string, salt?: string) {
  const resolvedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, resolvedSalt, 120000, 32, "sha256")
    .toString("hex");
  return { salt: resolvedSalt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const next = hashPassword(password, salt).hash;
  return crypto.timingSafeEqual(Buffer.from(next, "hex"), Buffer.from(hash, "hex"));
}

export function signSession(payload: SessionUser) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifySession(token?: string | null): SessionUser | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser;
    return data?.id ? data : null;
  } catch {
    return null;
  }
}
