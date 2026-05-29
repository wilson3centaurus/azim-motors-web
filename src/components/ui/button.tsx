import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#1754af] text-white hover:bg-[#0d3d8c] focus:ring-[#1754af]',
  secondary: 'bg-[var(--surface-raised)] text-[var(--text-strong)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-soft)] focus:ring-[#1754af]',
  ghost: 'bg-transparent text-[var(--text-base)] hover:bg-[var(--surface-soft)] focus:ring-[#1754af]',
  danger: 'bg-[#cf222e] text-white hover:bg-[#a6191f] focus:ring-[#cf222e]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        'shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
      {children}
    </button>
  )
}