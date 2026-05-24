import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-card)] shadow-[0_30px_80px_-40px_rgba(23,43,40,0.4)] backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}