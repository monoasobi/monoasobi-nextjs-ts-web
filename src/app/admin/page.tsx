import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/server/auth/admin";
import { getAdminDashboard } from "@/server/queries/admin";
import { cookies } from "next/headers";
import { AdminDashboard } from "./_components/AdminDashboard";
import { AdminLogin } from "./_components/AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!verifyAdminSession(session)) {
    return <AdminLogin />;
  }

  const data = await getAdminDashboard();

  return <AdminDashboard data={data} />;
}
