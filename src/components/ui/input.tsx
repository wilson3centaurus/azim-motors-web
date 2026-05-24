import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  prefix?: ReactNode
  containerClassName?: string
}

export function Input({ label, error, hint, prefix, className, containerClassName, id, ...props }: InputProps) {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-base)]">{label}</label>}
      <div className="relative">
        {prefix && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--text-soft)]">{prefix}</div>}
        <input
          id={id}
          className={cn(
            'w-full rounded-2xl border bg-[var(--surface-input)] px-4 py-3 text-base text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-soft)] sm:text-sm',
            'border-[var(--line)] focus:border-[#1f5f59] focus:ring-4 focus:ring-[#1f5f59]/10',
            prefix && 'pl-10',
            error && 'border-[#d86f45] focus:border-[#d86f45] focus:ring-[#d86f45]/10',
            className,
          )}
          {...props}
        />
      </div>
      {error ? <p className="text-sm text-[#b6452d] dark:text-[#efae9c]">{error}</p> : hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  )
}