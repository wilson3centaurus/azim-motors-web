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
        'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors duration-300',
        'focus:outline-none focus:ring-2 focus:ring-[#1f5f59] focus:ring-offset-2 focus:ring-offset-transparent',
        theme === 'dark' ? 'border-[#27433e] bg-[#17342f]' : 'border-[#d7ddd8] bg-[#edf1ee]',
      )}
    >
      <span
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm',
          'transition-transform duration-300',
          theme === 'dark' ? 'translate-x-[24px] bg-[#9ad0c1]' : 'translate-x-[3px]',
        )}
      >
        {theme === 'dark'
          ? <Moon className="w-2.5 h-2.5 text-[#17342f]" />
          : <Sun className="w-2.5 h-2.5 text-amber-500" />
        }
      </span>
    </button>
  )
}
