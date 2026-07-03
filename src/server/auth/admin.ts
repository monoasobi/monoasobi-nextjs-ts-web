import "server-only";

import type { AdminRole, AdminSession } from "@appTypes/admin";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "monoasobi_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 8;

type AdminSessionPayload = {
  role: AdminRole;
  expiresAt: number;
};

const getAdminPassword = () => process.env.ADMIN_PASSWORD?.trim();
const getViewerPasswords = () =>
  process.env.ADMIN_VIEWER_PASSWORDS?.split(",")
    .map((password) => password.trim())
    .filter(Boolean) ?? [];
const getAdminSecret = () => process.env.ADMIN_SESSION_SECRET;

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

const encodePayload = (payload: AdminSessionPayload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

const decodePayload = (payload: string): AdminSessionPayload | null => {
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload> | null;

    if (
      !parsed ||
      (parsed.role !== "admin" && parsed.role !== "viewer") ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return { role: parsed.role, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
};

export const verifyAdminCredentials = (inputPassword: string) => {
  const adminPassword = getAdminPassword();
  if (!adminPassword) throw new Error("ADMIN_PASSWORD is required");

  if (safeEqual(inputPassword, adminPassword)) return "admin" as const;

  if (
    getViewerPasswords().some((viewerPassword) =>
      safeEqual(inputPassword, viewerPassword),
    )
  ) {
    return "viewer" as const;
  }

  return null;
};

export const createAdminSession = (role: AdminRole) => {
  const expiresAt = Date.now() + ADMIN_MAX_AGE * 1000;
  const payload = encodePayload({ role, expiresAt });

  return `${payload}.${sign(payload)}`;
};

export const verifyAdminSession = (session?: string | null): AdminSession => {
  if (!session) return { authenticated: false };

  const [payload, signature] = session.split(".");
  if (!payload || !signature) return { authenticated: false };

  const decodedPayload = decodePayload(payload);
  if (!decodedPayload || decodedPayload.expiresAt < Date.now()) {
    return { authenticated: false };
  }

  try {
    if (!safeEqual(signature, sign(payload))) {
      return { authenticated: false };
    }
  } catch {
    return { authenticated: false };
  }

  return { authenticated: true, role: decodedPayload.role };
};

export const getAdminCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_MAX_AGE,
});
