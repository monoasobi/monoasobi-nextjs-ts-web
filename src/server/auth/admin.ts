import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "monoasobi_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 8;

const getAdminPassword = () => process.env.ADMIN_PASSWORD;
const getAdminSecret = () =>
  process.env.ADMIN_SESSION_SECRET ?? getAdminPassword();

const sign = (payload: string) => {
  const secret = getAdminSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is required");

  return createHmac("sha256", secret).update(payload).digest("hex");
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

export const verifyAdminPassword = (password: string) => {
  const expected = getAdminPassword();
  if (!expected) throw new Error("ADMIN_PASSWORD is required");

  return safeEqual(password, expected);
};

export const createAdminSession = () => {
  const expiresAt = Date.now() + ADMIN_MAX_AGE * 1000;
  const payload = String(expiresAt);

  return `${payload}.${sign(payload)}`;
};

export const verifyAdminSession = (session?: string | null) => {
  if (!session) return false;

  const [expiresAt, signature] = session.split(".");
  if (!expiresAt || !signature) return false;

  const expiresAtNumber = Number(expiresAt);
  if (!Number.isFinite(expiresAtNumber) || expiresAtNumber < Date.now()) {
    return false;
  }

  try {
    return safeEqual(signature, sign(expiresAt));
  } catch {
    return false;
  }
};

export const getAdminCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_MAX_AGE,
});
