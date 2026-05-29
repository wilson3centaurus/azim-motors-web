import { PinSetupGate } from '@/components/auth/pin-setup-gate'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarProvider } from '@/lib/sidebar-context'
import { requireUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <SidebarProvider>
        <div className="flex min-h-full w-full overflow-x-clip bg-transparent lg:pb-4 lg:pr-4">
        <PinSetupGate open={!user.has_pin} fullName={user.full_name} />
        <Sidebar role={user.role} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-[var(--sidebar-width)]">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-clip px-2 pb-3 pt-2 sm:px-4 sm:pb-5 sm:pt-4 lg:px-5 lg:pb-6 lg:pt-5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
