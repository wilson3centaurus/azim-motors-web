import type { HTMLAttributes, ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const styles = {
  error: {
    wrapper: 'border-[#efc4b9] bg-[#fff1eb] text-[#8a3822] dark:border-[#694036] dark:bg-[#2d1915] dark:text-[#f2b6a6]',
    icon: AlertCircle,
  },
  success: {
    wrapper: 'border-[#b7d4c8] bg-[#eef8f2] text-[#1f5f59] dark:border-[#335549] dark:bg-[#163129] dark:text-[#9ad0c1]',
    icon: CheckCircle2,
  },
  info: {
    wrapper: 'border-[#c9dbd7] bg-[#eff7f5] text-[#184944] dark:border-[#32564f] dark:bg-[#142d29] dark:text-[#a3d1c5]',
    icon: Info,
  },
  warning: {
    wrapper: 'border-[#ead7b9] bg-[#fff8e9] text-[#915b19] dark:border-[#615036] dark:bg-[#2a2114] dark:text-[#f0cb8a]',
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