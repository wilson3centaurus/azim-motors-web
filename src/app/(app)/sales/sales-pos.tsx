'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { Package, Search, ShoppingCart, Trash2 } from 'lucide-react'

import { createSaleAction } from '@/lib/actions'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Part, Sale, UserProfile } from '@/lib/supabase/types'
import { cn, formatCurrency, timeAgo } from '@/lib/utils'

type SalesPosProps = {
  currentUser: UserProfile
  salesToday: number
  salesCount: number
  lowStockCount: number
  availableParts: Part[]
  recentSales: Sale[]
}

type CartItem = {
  part_id: string
  quantity: number
}

const PAYMENT_METHODS = ['Cash', 'Card', 'Transfer', 'EcoCash'] as const

export function SalesPos({
  currentUser,
  salesToday,
  salesCount,
  lowStockCount,
  availableParts,
  recentSales,
}: SalesPosProps) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>('Cash')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredParts = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    if (!query) return availableParts

    return availableParts.filter(part =>
      part.name.toLowerCase().includes(query)
      || (part.part_number ?? '').toLowerCase().includes(query)
      || (part.location ?? '').toLowerCase().includes(query),
    )
  }, [availableParts, deferredSearch])

  const cartItems = useMemo(() => {
    return cart.map(item => {
      const part = availableParts.find(entry => entry.id === item.part_id)
      if (!part) return null
      const unitPrice = part.selling_price ?? part.unit_cost
      return {
        ...item,
        part,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      }
    }).filter(Boolean) as Array<CartItem & { part: Part; unitPrice: number; lineTotal: number }>
  }, [availableParts, cart])

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.lineTotal, 0), [cartItems])
  const discount = Math.max(0, Number(discountAmount) || 0)
  const total = Math.max(0, subtotal - discount)

  function addToCart(partId: string) {
    setCart(current => {
      const existing = current.find(item => item.part_id === partId)
      if (existing) {
        return current.map(item => item.part_id === partId ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...current, { part_id: partId, quantity: 1 }]
    })
  }

  function updateQuantity(partId: string, nextQuantity: number) {
    if (nextQuantity <= 0) {
      setCart(current => current.filter(item => item.part_id !== partId))
      return
    }

    const part = availableParts.find(entry => entry.id === partId)
    const boundedQuantity = part ? Math.min(nextQuantity, part.quantity) : nextQuantity
    setCart(current => current.map(item => item.part_id === partId ? { ...item, quantity: boundedQuantity } : item))
  }

  function removeItem(partId: string) {
    setCart(current => current.filter(item => item.part_id !== partId))
  }

  function resetForm() {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setPaymentMethod('Cash')
    setDiscountAmount('0')
    setNotes('')
  }

  function submitSale() {
    setMessage(null)
    startTransition(async () => {
      const result = await createSaleAction({
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        payment_method: paymentMethod,
        notes: notes || undefined,
        discount_amount: discount,
        items: cart.map(item => ({ part_id: item.part_id, quantity: item.quantity })),
      })

      if (!result.ok) {
        setMessage({ type: 'error', text: result.message })
        return
      }

      setMessage({ type: 'success', text: result.message })
      resetForm()
    })
  }

  return (
    <div className="space-y-4 p-2.5 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#eef5f2] sm:text-3xl">Sales Desk</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9eb5af]">
            Signed in as {currentUser.full_name}. Search stock, build a cart, and record walk-in sales.
          </p>
        </div>
        <div className="inline-flex w-fit max-w-full items-center rounded-full border border-[#d7e5df] bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-[#27433e] dark:bg-[#102623] dark:text-[#c7d8d2]">
          {salesCount} sales today
        </div>
      </div>

      {message ? (
        <Alert variant={message.type}>
          {message.text}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Sales Today" value={formatCurrency(salesToday)} subtitle="Recorded turnover" />
        <MetricCard title="Transactions" value={salesCount.toString()} subtitle="Completed checkouts" />
        <MetricCard title="Low Stock" value={lowStockCount.toString()} subtitle="Needs restock" tone={lowStockCount > 0 ? 'warn' : 'ok'} />
        <MetricCard title="Available Parts" value={availableParts.length.toString()} subtitle="Ready to sell" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-[#dfe9e4] bg-white/92 p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-[#eef5f2]">Parts catalogue</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#9eb5af]">Tap a part to add it to the cart.</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="sales-search"
                placeholder="Search part name, number, or shelf"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="pl-10"
                containerClassName="w-full"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
            {filteredParts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#c9dbd7] px-4 py-10 text-center text-sm text-slate-500 dark:border-[#27433e] dark:text-[#8ea59f] sm:col-span-2">
                No parts match that search.
              </div>
            ) : filteredParts.map(part => {
              const inCart = cart.find(item => item.part_id === part.id)
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => addToCart(part.id)}
                  className={cn(
                    'rounded-[24px] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-36px_rgba(19,40,37,0.55)]',
                    'border-[#dfe9e4] bg-[#f8fcfa] dark:border-[#27433e] dark:bg-[#122c27]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{part.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{part.part_number ?? 'No part number'}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:bg-[#102623] dark:text-[#c7d8d2]">
                      {part.quantity} left
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-end min-[360px]:justify-between">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(part.selling_price ?? part.unit_cost)}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{part.location ?? 'Workshop shelf'}</p>
                    </div>
                    <div className="inline-flex w-fit rounded-full bg-[#1f5f59] px-3 py-1.5 text-xs font-semibold text-white">
                      {inCart ? `In cart: ${inCart.quantity}` : 'Add'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-[#dfe9e4] bg-white/92 p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-[#eef5f2]">Checkout</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-[#9eb5af]">Customer details are optional for quick counter sales.</p>
              </div>
              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-[#edf8f1] dark:bg-[#17342f] sm:flex">
                <ShoppingCart className="h-5 w-5 text-[#22714d] dark:text-[#9ad0c1]" />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Input id="sales-customer-name" label="Customer name" value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="Walk-in customer" />
              <Input id="sales-customer-phone" label="Phone number" value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} placeholder="0770 000 000" />
              <Select id="sales-payment-method" label="Payment method" value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as (typeof PAYMENT_METHODS)[number])}>
                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </Select>
              <Input id="sales-discount" label="Discount" type="number" min="0" step="0.01" value={discountAmount} onChange={event => setDiscountAmount(event.target.value)} />
              <Textarea id="sales-notes" label="Notes" rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Optional note for this sale" />
            </div>

            <div className="mt-4 space-y-3 rounded-[24px] bg-[#f5faf8] p-3 dark:bg-[#122c27]">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-[#8ea59f]">Add parts from the catalogue to start a sale.</div>
              ) : cartItems.map(item => (
                <div key={item.part_id} className="rounded-[20px] bg-white px-3 py-3 shadow-sm dark:bg-[#102623]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{item.part.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <button type="button" title="Remove item" aria-label="Remove item" onClick={() => removeItem(item.part_id)} className="rounded-full p-1.5 text-slate-400 transition hover:bg-[#fff1eb] hover:text-[#b6452d] dark:hover:bg-[#2f1915]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
                    <div className="inline-flex w-fit items-center rounded-full border border-[#d7e5df] bg-[#f8fcfa] dark:border-[#27433e] dark:bg-[#122c27]">
                      <button type="button" onClick={() => updateQuantity(item.part_id, item.quantity - 1)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-[#c7d8d2]">-</button>
                      <span className="min-w-10 px-2 text-center text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.part_id, item.quantity + 1)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-[#c7d8d2]">+</button>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 rounded-[24px] border border-[#dfe9e4] bg-white p-4 dark:border-[#27433e] dark:bg-[#102623]">
              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow label="Discount" value={formatCurrency(discount)} />
              <SummaryRow label="Total" value={formatCurrency(total)} strong />
            </div>

            <Button className="mt-4 w-full" size="lg" loading={isPending} disabled={cartItems.length === 0} onClick={submitSale}>
              Record sale
            </Button>
          </Card>

          <Card className="border-[#dfe9e4] bg-white/92 p-4 dark:border-[#27433e] dark:bg-[#102623]/92 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf8f1] dark:bg-[#17342f]">
                <Package className="h-5 w-5 text-[#22714d] dark:text-[#9ad0c1]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-[#eef5f2]">Recent sales</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-[#9eb5af]">Latest transactions for this desk.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {recentSales.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#c9dbd7] px-4 py-8 text-center text-sm text-slate-500 dark:border-[#27433e] dark:text-[#8ea59f]">
                  No sales recorded yet.
                </div>
              ) : recentSales.map(sale => (
                <div key={sale.id} className="rounded-[22px] bg-[#f8fcfa] px-4 py-3 dark:bg-[#122c27]">
                  <div className="flex flex-col gap-3 min-[360px]:flex-row min-[360px]:items-start min-[360px]:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{sale.sale_number}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{sale.customer_name ?? 'Counter sale'} · {sale.payment_method}</p>
                    </div>
                    <div className="text-left min-[360px]:text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-[#eef5f2]">{formatCurrency(sale.total_amount)}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-[#8ea59f]">{timeAgo(sale.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle, tone = 'base' }: { title: string; value: string; subtitle: string; tone?: 'base' | 'ok' | 'warn' }) {
  const toneClasses = tone === 'warn'
    ? 'border-[#efc4b9] bg-[#fff1eb] dark:border-[#5c3127] dark:bg-[#2c1713]'
    : tone === 'ok'
      ? 'border-[#c9dbd7] bg-[#edf8f1] dark:border-[#27433e] dark:bg-[#17342f]'
      : 'border-[#dfe9e4] bg-white/92 dark:border-[#27433e] dark:bg-[#102623]/92'

  return (
    <div className={cn('rounded-[24px] border p-4 shadow-[0_24px_60px_-40px_rgba(19,40,37,0.45)]', toneClasses)}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#9eb5af]">{title}</p>
      <p className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-[#eef5f2] min-[360px]:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-[#9eb5af]">{subtitle}</p>
    </div>
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn('text-sm text-slate-500 dark:text-[#9eb5af]', strong && 'font-semibold text-slate-900 dark:text-[#eef5f2]')}>{label}</span>
      <span className={cn('text-sm font-medium text-slate-900 dark:text-[#eef5f2]', strong && 'text-base font-bold')}>{value}</span>
    </div>
  )
}