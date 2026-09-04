import { useMemo, useState, useSyncExternalStore } from 'react'
import type { CalendarDate, CalendarMonth } from '../types'
import {
  createCalendarDate,
  createCalendarDays,
  moveCalendarMonth,
} from '../utils/calendar'

const subscribeToHydration = () => () => undefined

export function useWorkoutCalendar() {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  )
  const [today] = useState(() => createCalendarDate(new Date()))
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonth>(() => ({
    year: today.year,
    monthIndex: today.monthIndex,
  }))
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(today)

  const calendarDays = useMemo(
    () => createCalendarDays(visibleMonth),
    [visibleMonth]
  )

  const changeMonth = (offset: number) => {
    setVisibleMonth((currentMonth) => moveCalendarMonth(currentMonth, offset))
    setSelectedDate(null)
  }

  return {
    calendarDays,
    changeMonth,
    isHydrated,
    selectedDate,
    selectDate: setSelectedDate,
    today,
    visibleMonth,
  }
}
