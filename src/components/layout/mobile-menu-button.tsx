'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'

export function MobileMenuButton() {
  const { toggle } = useSidebar()
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open menu"
      className="rounded-xl p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-card)] hover:text-[var(--text-strong)] focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-1 focus:ring-offset-transparent lg:hidden"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
