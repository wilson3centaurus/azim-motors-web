import { PinSetupGate } from '@/components/auth/pin-setup-gate'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarProvider } from '@/lib/sidebar-context'
import { requireUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <SidebarProvider>
        <div className="flex min-h-full w-full overflow-x-clip bg-transparent">
        <PinSetupGate open={!user.has_pin} fullName={user.full_name} />
        <Sidebar role={user.role} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-[var(--sidebar-width)]">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-clip px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
