import type { ReactNode, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
  footer?: ReactNode
}

export function Select({ label, error, hint, footer, className, id, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>}
      <div className="relative">
        <select
          id={id}
          className={cn(
            'w-full appearance-none rounded-2xl border bg-white/90 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition',
            'border-[#d7ddd8] focus:border-[#1f5f59] focus:ring-4 focus:ring-[#1f5f59]/10',
            error && 'border-[#d86f45] focus:border-[#d86f45] focus:ring-[#d86f45]/10',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {error ? <p className="text-sm text-[#b6452d]">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {footer}
    </div>
  )
}