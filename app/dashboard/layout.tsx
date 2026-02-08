import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { MobileNav } from '@/components/layout/MobileNav'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background-primary">
      <TopNav />
      <div className="flex">
        <Sidebar className="hidden md:flex" />
        <main className="flex-1 p-4 md:ml-64 md:p-8">
          <DashboardShell>{children}</DashboardShell>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
