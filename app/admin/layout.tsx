import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ADMIN_COOKIE, validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const pathname = headers().get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login";
  const isAuthenticated = validateAdminSession(
    cookieStore.get(ADMIN_COOKIE)?.value
  );

  if (isLoginPage) {
    if (isAuthenticated) redirect("/admin");
    return <>{children}</>;
  }

  if (!isAuthenticated) redirect("/admin/login");

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
