'use client'

import { MUSCLE_FILTER_OPTIONS } from '../../constants'
import type { ExerciseSummary } from '../../types'
import { ExerciseRow } from '../ExerciseRow/ExerciseRow'
import styles from './ExercisePicker.module.css'

type ExercisePickerProps = {
  query: string
  onQueryChange: (value: string) => void
  targetMuscle: string
  onTargetMuscleChange: (value: string) => void
  results: ExerciseSummary[]
  selectedIds: Set<string>
  onAdd: (exercise: ExerciseSummary) => void
  isSearching: boolean
  error: string
}

export function ExercisePicker({
  query,
  onQueryChange,
  targetMuscle,
  onTargetMuscleChange,
  results,
  selectedIds,
  onAdd,
  isSearching,
  error,
}: ExercisePickerProps) {
  return (
    <section className={styles.section} aria-labelledby="exercise-picker-title">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.step}>STEP 2</p>
          <h2 id="exercise-picker-title" className={styles.title}>운동 추가</h2>
        </div>
        {isSearching ? <span className={styles.status}>검색 중…</span> : null}
      </div>

      <label className={styles.searchField}>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <span className={styles.visuallyHidden}>운동 이름 검색</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="운동 이름 검색"
          className={styles.searchInput}
        />
      </label>

      <label className={styles.filterField}>
        <span className={styles.filterLabel}>운동 부위</span>
        <select
          value={targetMuscle}
          onChange={(event) => onTargetMuscleChange(event.target.value)}
          className={styles.select}
        >
          {MUSCLE_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <div className={styles.results} aria-busy={isSearching}>
        {results.length > 0 ? (
          results.map((exercise) => {
            const isSelected = selectedIds.has(exercise.id)

            return (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                action={
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => onAdd(exercise)}
                    disabled={isSelected}
                    aria-label={`${exercise.name} 추가`}
                  >
                    {isSelected ? '추가됨' : '추가'}
                  </button>
                }
              />
            )
          })
        ) : (
          <p className={styles.empty}>
            {query || targetMuscle
              ? '조건에 맞는 운동이 없습니다.'
              : '등록된 운동 데이터가 없습니다.'}
          </p>
        )}
      </div>
    </section>
  )
}
