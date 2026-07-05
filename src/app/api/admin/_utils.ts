import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/server/auth/admin";
import { PUBLIC_CATALOG_CACHE_TAG } from "@/server/queries/publicCatalog";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { z } from "zod";

export const getAdminSession = async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  return verifyAdminSession(session);
};

export const requireAdminSession = async () => {
  const session = await getAdminSession();

  if (session.authenticated) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
};

export const requireAdminWriteAccess = async () => {
  const session = await getAdminSession();

  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
};

export const parseAdminPayload = async <TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
  label: string,
) => {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      response: NextResponse.json(
        { error: `Invalid ${label} payload`, issues: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data as z.infer<TSchema>, response: null };
};

export const parsePositiveId = (value: string, label: string) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return {
      id: null,
      response: NextResponse.json(
        { error: `Invalid ${label} id` },
        { status: 400 },
      ),
    };
  }

  return { id, response: null };
};

export const parseNonNegativeId = (value: string, label: string) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 0) {
    return {
      id: null,
      response: NextResponse.json(
        { error: `Invalid ${label} id` },
        { status: 400 },
      ),
    };
  }

  return { id, response: null };
};

export const revalidatePublicCatalog = () => {
  revalidateTag(PUBLIC_CATALOG_CACHE_TAG, "max");
};
