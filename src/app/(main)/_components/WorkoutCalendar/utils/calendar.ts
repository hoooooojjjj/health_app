import { CALENDAR_CELL_COUNT } from '../constants'
import type { CalendarDate, CalendarMonth } from '../types'

export function createCalendarDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
    day: date.getDate(),
  }
}

export function createCalendarDays({
  year,
  monthIndex,
}: CalendarMonth): Array<number | null> {
  const sundayBasedWeekday = new Date(year, monthIndex, 1).getDay()
  const mondayBasedWeekday = (sundayBasedWeekday + 6) % 7
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()

  return Array.from({ length: CALENDAR_CELL_COUNT }, (_, index) => {
    const day = index - mondayBasedWeekday + 1
    return day >= 1 && day <= lastDay ? day : null
  })
}

export function moveCalendarMonth(
  { year, monthIndex }: CalendarMonth,
  offset: number
): CalendarMonth {
  const movedDate = new Date(year, monthIndex + offset, 1)

  return {
    year: movedDate.getFullYear(),
    monthIndex: movedDate.getMonth(),
  }
}

export function isSameCalendarDate(
  left: CalendarDate | null,
  right: CalendarDate
): boolean {
  return (
    left?.year === right.year &&
    left.monthIndex === right.monthIndex &&
    left.day === right.day
  )
}
