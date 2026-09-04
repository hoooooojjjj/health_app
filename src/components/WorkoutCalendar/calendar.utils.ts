export interface CalendarMonth {
  year: number
  monthIndex: number
}

export interface CalendarDate extends CalendarMonth {
  day: number
}

const CALENDAR_CELL_COUNT = 42

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
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()

  return Array.from({ length: CALENDAR_CELL_COUNT }, (_, index) => {
    const day = index - firstWeekday + 1
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
