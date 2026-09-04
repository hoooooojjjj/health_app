'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  createCalendarDate,
  createCalendarDays,
  moveCalendarMonth,
  type CalendarDate,
  type CalendarMonth,
} from './calendar.utils'
import styles from './WorkoutCalendar.module.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const subscribeToHydration = () => () => undefined

function isSameDate(left: CalendarDate | null, right: CalendarDate): boolean {
  return (
    left?.year === right.year &&
    left.monthIndex === right.monthIndex &&
    left.day === right.day
  )
}

export function WorkoutCalendar() {
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

  if (!isHydrated) {
    return (
      <section
        className={`${styles.calendar} ${styles.loading}`}
        aria-label="월간 운동 캘린더"
        aria-busy="true"
      >
        캘린더를 불러오는 중입니다.
      </section>
    )
  }

  return (
    <section className={styles.calendar} aria-label="월간 운동 캘린더">
      <div className={styles.monthHeader}>
        <button
          type="button"
          className={styles.navigationButton}
          aria-label="이전 달 보기"
          onClick={() => changeMonth(-1)}
        >
          <span aria-hidden="true">←</span>
        </button>

        <h2 className={styles.monthTitle} aria-live="polite">
          {visibleMonth.year}년 {visibleMonth.monthIndex + 1}월
        </h2>

        <button
          type="button"
          className={styles.navigationButton}
          aria-label="다음 달 보기"
          onClick={() => changeMonth(1)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className={styles.weekdayGrid} aria-hidden="true">
        {WEEKDAYS.map((weekday, index) => (
          <span
            key={weekday}
            className={`${styles.weekday} ${
              index === 0
                ? styles.sunday
                : index === 6
                  ? styles.saturday
                  : ''
            }`}
          >
            {weekday}
          </span>
        ))}
      </div>

      <div className={styles.dayGrid}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} className={styles.emptyDay} />
          }

          const date = {
            year: visibleMonth.year,
            monthIndex: visibleMonth.monthIndex,
            day,
          }
          const isToday = isSameDate(today, date)
          const isSelected = isSameDate(selectedDate, date)
          const weekdayIndex = index % WEEKDAYS.length

          return (
            <button
              key={day}
              type="button"
              className={`${styles.dayButton} ${
                isToday ? styles.today : ''
              } ${isSelected ? styles.selected : ''} ${
                weekdayIndex === 0
                  ? styles.sunday
                  : weekdayIndex === 6
                    ? styles.saturday
                    : ''
              }`}
              aria-label={`${date.year}년 ${date.monthIndex + 1}월 ${day}일`}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              onClick={() => setSelectedDate(date)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}
