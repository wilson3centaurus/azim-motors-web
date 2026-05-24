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
  'Pending': 'bg-[#fff6df] text-[#996019] border-[#ead7b9]',
  'In Progress': 'bg-[#e8f6f3] text-[#1f5f59] border-[#bfddd7]',
  'Completed': 'bg-[#edf8f1] text-[#22714d] border-[#c7e2d0]',
  'Cancelled': 'bg-[#f1efeb] text-[#716a61] border-[#ddd7cf]',
} as const

export const ROLE_LABELS = {
  admin: 'Admin',
  mechanic: 'Mechanic',
  salesperson: 'Salesperson',
  receptionist: 'Receptionist',
} as const

export function normalizePhone(value: string | null | undefined) {
  if (!value) return ''
  return value.replace(/[^\d+]/g, '')
}

export function isGeneratedRegistration(value: string | null | undefined) {
  return Boolean(value && value.startsWith('UNREGISTERED-'))
}

export function displayVehicleRegistration(value: string | null | undefined) {
  if (!value || isGeneratedRegistration(value)) return '—'
  return value
}

export function fieldErrorText(error?: string[] | string) {
  if (!error) return undefined
  return Array.isArray(error) ? error[0] : error
}
