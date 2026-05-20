'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200',
      )}
    >
      <span
        className={cn(
          'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-sm',
          'transition-transform duration-300',
          theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-[3px]',
        )}
      >
        {theme === 'dark'
          ? <Moon className="w-2.5 h-2.5 text-blue-600" />
          : <Sun className="w-2.5 h-2.5 text-amber-500" />
        }
      </span>
    </button>
  )
}
