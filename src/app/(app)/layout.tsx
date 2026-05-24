import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { SidebarProvider } from '@/lib/sidebar-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-full bg-transparent">
        <Sidebar />
        <div className="flex min-h-0 flex-1 flex-col lg:ml-[var(--sidebar-width)]">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-3 pb-4 pt-3 sm:px-4 sm:pb-5 sm:pt-4 lg:px-5 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
