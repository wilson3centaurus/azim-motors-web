import { cn, JOB_STATUS_COLORS } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: keyof typeof JOB_STATUS_COLORS; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', JOB_STATUS_COLORS[status], className)}>
      {status}
    </span>
  )
}