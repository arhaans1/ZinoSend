import { redirect } from "next/navigation"
import { getSuperAdminFromCookies } from "@/lib/super-admin-auth"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"
import { SuperAdminHeader } from "@/components/super-admin/header"

export default async function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const superAdmin = await getSuperAdminFromCookies()

  if (!superAdmin) {
    redirect("/super-admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <SuperAdminSidebar />
      <div className="lg:pl-64">
        <SuperAdminHeader superAdmin={superAdmin} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
