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
  blue:   { bar: 'bg-gradient-to-b from-blue-400 to-blue-600',       iconBg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  orange: { bar: 'bg-gradient-to-b from-orange-400 to-orange-600',   iconBg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  amber:  { bar: 'bg-gradient-to-b from-amber-400 to-amber-600',     iconBg: 'bg-amber-50',   iconColor: 'text-amber-500' },
  violet: { bar: 'bg-gradient-to-b from-violet-400 to-violet-600',   iconBg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  red:    { bar: 'bg-gradient-to-b from-red-400 to-red-600',         iconBg: 'bg-red-50',     iconColor: 'text-red-500' },
  green:  { bar: 'bg-gradient-to-b from-emerald-400 to-emerald-600', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
}

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex hover:shadow-md hover:-translate-y-px transition-all duration-200">
      <div className={cn('w-1 flex-shrink-0', c.bar)} />
      <div className="flex-1 p-3 sm:p-5">
        <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center', c.iconBg)}>
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', c.iconColor)} />
        </div>
        <p className="mt-2 sm:mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-none">{value}</p>
        <p className="text-[11px] sm:text-sm font-medium text-slate-600 mt-1 sm:mt-2 leading-tight">{title}</p>
        {subtitle && <p className="hidden sm:block text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
