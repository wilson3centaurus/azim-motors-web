import type { ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
  footer?: ReactNode
}

export function Textarea({ label, error, hint, footer, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-base)]">{label}</label>}
      <textarea
        id={id}
        className={cn(
          'w-full rounded-2xl border bg-[var(--surface-input)] px-4 py-3 text-base text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-soft)] resize-y sm:text-sm',
          'border-[var(--line)] focus:border-[#1f5f59] focus:ring-4 focus:ring-[#1f5f59]/10',
          error && 'border-[#d86f45] focus:border-[#d86f45] focus:ring-[#d86f45]/10',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-[#b6452d] dark:text-[#efae9c]">{error}</p> : hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
      {footer}
    </div>
  )
}