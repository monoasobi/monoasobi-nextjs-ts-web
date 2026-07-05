import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/server/auth/admin";
import { getAdminDashboard } from "@/server/queries/admin";
import { cookies } from "next/headers";
import { AdminDashboard } from "./_components/AdminDashboard";
import { AdminLogin } from "./_components/AdminLogin";

import { Suspense } from "react";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPageContent />
    </Suspense>
  );
}

async function AdminPageContent() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const adminSession = verifyAdminSession(session);

  if (!adminSession.authenticated) {
    return <AdminLogin />;
  }

  const data = await getAdminDashboard();

  return <AdminDashboard data={data} role={adminSession.role} />;
}
