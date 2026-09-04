'use client'

import {
  SATURDAY_INDEX,
  SUNDAY_INDEX,
  WEEKDAYS,
} from './constants'
import { useWorkoutCalendar } from './hooks/useWorkoutCalendar'
import { isSameCalendarDate } from './utils/calendar'
import styles from './WorkoutCalendar.module.css'

export function WorkoutCalendar() {
  const {
    calendarDays,
    changeMonth,
    isHydrated,
    selectedDate,
    selectDate,
    today,
    visibleMonth,
  } = useWorkoutCalendar()

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
              index === SUNDAY_INDEX
                ? styles.sunday
                : index === SATURDAY_INDEX
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
          const isToday = isSameCalendarDate(today, date)
          const isSelected = isSameCalendarDate(selectedDate, date)
          const weekdayIndex = index % WEEKDAYS.length

          return (
            <button
              key={day}
              type="button"
              className={`${styles.dayButton} ${
                isToday ? styles.today : ''
              } ${isSelected ? styles.selected : ''} ${
                weekdayIndex === SUNDAY_INDEX
                  ? styles.sunday
                  : weekdayIndex === SATURDAY_INDEX
                    ? styles.saturday
                    : ''
              }`}
              aria-label={`${date.year}년 ${date.monthIndex + 1}월 ${day}일`}
              aria-current={isToday ? 'date' : undefined}
              aria-pressed={isSelected}
              onClick={() => selectDate(date)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}
