import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const PRIVATE_READER_COOKIE_NAME = "monoasobi_private_reader";
export const PRIVATE_READER_MAX_AGE = 60 * 60 * 24 * 30;

const getPrivateReaderPassword = () =>
  process.env.PRIVATE_READER_PASSWORD ?? process.env.PRIVATE_READER_TOKEN;

const getPrivateReaderSecret = () =>
  process.env.PRIVATE_READER_SESSION_SECRET ?? getPrivateReaderPassword();

const sign = (payload: string) => {
  const secret = getPrivateReaderSecret();
  if (!secret) throw new Error("PRIVATE_READER_PASSWORD is required");

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

export const verifyPrivateReaderPassword = (password: string) => {
  const expected = getPrivateReaderPassword();
  if (!expected) throw new Error("PRIVATE_READER_PASSWORD is required");

  return safeEqual(password, expected);
};

export const createPrivateReaderSession = () => {
  const expiresAt = Date.now() + PRIVATE_READER_MAX_AGE * 1000;
  const payload = String(expiresAt);

  return `${payload}.${sign(payload)}`;
};

export const verifyPrivateReaderSession = (session?: string | null) => {
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

export const getPrivateReaderCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: PRIVATE_READER_MAX_AGE,
});
