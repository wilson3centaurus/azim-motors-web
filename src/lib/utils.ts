import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date | null) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '$0.00'
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export function getReturnDateStatus(date: string | null): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none' {
  if (!date) return 'none'
  const d = new Date(date)
  if (isPast(d) && !isToday(d)) return 'overdue'
  if (isToday(d)) return 'today'
  if (isTomorrow(d)) return 'tomorrow'
  return 'upcoming'
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const JOB_STATUS_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Completed': 'bg-green-100 text-green-800 border-green-200',
  'Cancelled': 'bg-gray-100 text-gray-600 border-gray-200',
} as const

export const ROLE_LABELS = {
  admin: 'Admin',
  mechanic: 'Mechanic',
  receptionist: 'Receptionist',
} as const
