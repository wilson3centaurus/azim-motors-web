'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, isPast, addMonths, subMonths,
  getDay
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: string
  status: string
  jobNumber: string
}

export function ReturnCalendar({ events }: { events: CalendarEvent[] }) {
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const eventsOnDay = (day: Date) =>
    events.filter(e => isSameDay(new Date(e.date + 'T00:00:00'), day))

  const selectedEvents = selected
    ? events.filter(e => e.date === selected)
    : []

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button onClick={() => setCurrent(d => subMonths(d, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </button>
        <h2 className="font-semibold text-slate-900">{format(current, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrent(d => addMonths(d, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const dayEvents = eventsOnDay(day)
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasOverdue = dayEvents.some(e => isPast(new Date(e.date + 'T23:59:59')) && !isToday(day) && !['Completed', 'Cancelled'].includes(e.status))
            const hasToday = isToday(day) && dayEvents.length > 0
            const isSelected = selected === dateStr

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(isSelected ? null : dateStr)}
                className={cn(
                  'aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-sm transition-colors relative',
                  !isSameMonth(day, current) && 'opacity-30',
                  isToday(day) && 'ring-2 ring-blue-500',
                  isSelected && 'bg-blue-600 text-white',
                  !isSelected && hasOverdue && 'bg-red-50',
                  !isSelected && hasToday && 'bg-orange-50',
                  !isSelected && !hasOverdue && !hasToday && 'hover:bg-slate-50',
                )}
              >
                <span className={cn('text-xs font-medium', isSelected ? 'text-white' : isToday(day) ? 'text-blue-600' : 'text-slate-700')}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold mt-0.5 w-4 h-4 rounded-full flex items-center justify-center',
                    isSelected ? 'bg-white text-blue-600' :
                    hasOverdue ? 'bg-red-500 text-white' :
                    hasToday ? 'bg-orange-500 text-white' :
                    'bg-blue-500 text-white'
                  )}>
                    {dayEvents.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selected && selectedEvents.length > 0 && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <p className="text-xs font-medium text-slate-500 mb-2 pt-3">
            {format(new Date(selected + 'T00:00:00'), 'EEEE, dd MMM yyyy')}
          </p>
          <div className="space-y-2">
            {selectedEvents.map(e => (
              <Link key={e.id} href={`/job-cards/${e.id}`} className="flex items-center justify-between bg-slate-50 hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{e.jobNumber}</p>
                  <p className="text-xs text-slate-500 truncate">{e.title}</p>
                </div>
                <span className="text-xs text-blue-600 font-medium">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 pb-4 pt-1 border-t border-slate-50 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Overdue</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Today</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Upcoming</span>
      </div>
    </div>
  )
}
