import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type StatColor = 'blue' | 'orange' | 'amber' | 'violet' | 'red' | 'green'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  color: StatColor
}

const colorMap: Record<StatColor, { bar: string; iconBg: string; iconColor: string }> = {
  blue:   { bar: 'bg-gradient-to-b from-[#2e6f68] to-[#1f5f59]',       iconBg: 'bg-[#e8f6f3]',    iconColor: 'text-[#1f5f59]' },
  orange: { bar: 'bg-gradient-to-b from-[#ef9259] to-[#d86f45]',       iconBg: 'bg-[#fff1eb]',    iconColor: 'text-[#d86f45]' },
  amber:  { bar: 'bg-gradient-to-b from-[#d9af57] to-[#b98d2c]',       iconBg: 'bg-[#fff7e3]',    iconColor: 'text-[#a67819]' },
  violet: { bar: 'bg-gradient-to-b from-[#8b87bb] to-[#6e6b9b]',       iconBg: 'bg-[#f2f1fb]',    iconColor: 'text-[#6e6b9b]' },
  red:    { bar: 'bg-gradient-to-b from-[#df8b74] to-[#b6452d]',       iconBg: 'bg-[#fff1eb]',    iconColor: 'text-[#b6452d]' },
  green:  { bar: 'bg-gradient-to-b from-[#53a27b] to-[#22714d]',       iconBg: 'bg-[#edf8f1]',    iconColor: 'text-[#22714d]' },
}

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white/88 shadow-[0_4px_24px_-8px_rgba(19,40,37,0.18)] dark:border-[#27433e] dark:bg-[#102623]/92">
      <div className={cn('absolute inset-x-0 top-0 h-1', c.bar)} />
      <div className="flex-1 p-3.5 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-[#eef5f2] min-[360px]:text-3xl sm:text-4xl">{value}</p>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11', c.iconBg)}>
            <Icon className={cn('h-5 w-5', c.iconColor)} />
          </div>
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-[#a7bbb5] sm:text-xs sm:tracking-[0.2em]">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-[#a7bbb5]">{subtitle}</p>}
      </div>
    </div>
  )
}
