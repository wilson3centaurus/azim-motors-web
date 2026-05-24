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
      {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>}
      <div className="relative">
        {prefix && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">{prefix}</div>}
        <input
          id={id}
          className={cn(
            'w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
            'border-[#d7ddd8] focus:border-[#1f5f59] focus:ring-4 focus:ring-[#1f5f59]/10',
            prefix && 'pl-10',
            error && 'border-[#d86f45] focus:border-[#d86f45] focus:ring-[#d86f45]/10',
            className,
          )}
          {...props}
        />
      </div>
      {error ? <p className="text-sm text-[#b6452d]">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}