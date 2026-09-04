export interface CalendarMonth {
  year: number
  monthIndex: number
}

export interface CalendarDate extends CalendarMonth {
  day: number
}
