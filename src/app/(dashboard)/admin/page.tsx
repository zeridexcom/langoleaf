export const dynamic = "force-dynamic";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminRedirect } from "@/components/auth/role-redirect";

export default function AdminPage() {
  return (
    <AdminRedirect>
      <AdminDashboard />
    </AdminRedirect>
  );
}
