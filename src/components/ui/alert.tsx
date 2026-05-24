import type { HTMLAttributes, ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const styles = {
  error: {
    wrapper: 'border-[#efc4b9] bg-[#fff1eb] text-[#8a3822]',
    icon: AlertCircle,
  },
  success: {
    wrapper: 'border-[#b7d4c8] bg-[#eef8f2] text-[#1f5f59]',
    icon: CheckCircle2,
  },
  info: {
    wrapper: 'border-[#c9dbd7] bg-[#eff7f5] text-[#184944]',
    icon: Info,
  },
  warning: {
    wrapper: 'border-[#ead7b9] bg-[#fff8e9] text-[#915b19]',
    icon: TriangleAlert,
  },
} as const

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof styles; title?: string; children: ReactNode }) {
  const Icon = styles[variant].icon
  return (
    <div className={cn('flex gap-3 rounded-2xl border px-4 py-3 text-sm', styles[variant].wrapper, className)} {...props}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-1')}>{children}</div>
      </div>
    </div>
  )
}