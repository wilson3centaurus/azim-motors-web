'use client'

import { Button } from '@/components/ui/button'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#102422]/45 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/70 bg-white p-4 shadow-2xl dark:border-[#27433e] dark:bg-[#102623] sm:p-6">
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-[#eef5f2] sm:text-xl">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-[#a7bbb5]">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
          <Button className="w-full sm:w-auto" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}