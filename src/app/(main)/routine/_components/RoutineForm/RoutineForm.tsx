'use client'

import { useActionState } from 'react'
import { createRoutine } from '../../_actions/createRoutine'
import { ROUTINE_NAME_MAX_LENGTH } from '../../constants'
import type { ExerciseSummary } from '../../types'
import { ExercisePicker } from '../ExercisePicker/ExercisePicker'
import { useExercisePicker } from '../ExercisePicker/hooks/useExercisePicker'
import { ExerciseRow } from '../ExerciseRow/ExerciseRow'
import styles from './RoutineForm.module.css'

type RoutineFormProps = {
  initialExercises: ExerciseSummary[]
}

const INITIAL_CREATE_ROUTINE_STATE = {
  status: 'idle',
  message: '',
} as const

export function RoutineForm({ initialExercises }: RoutineFormProps) {
  const [state, formAction, isPending] = useActionState(
    createRoutine,
    INITIAL_CREATE_ROUTINE_STATE
  )
  const picker = useExercisePicker(initialExercises)
  const exerciseIds = picker.selectedExercises.map(({ id }) => id)
  const canSubmit = exerciseIds.length > 0 && !isPending

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="exerciseIds" value={JSON.stringify(exerciseIds)} />

      <section aria-labelledby="routine-name-title">
        <p className={styles.step}>STEP 1</p>
        <h2 id="routine-name-title" className={styles.sectionTitle}>루틴 이름</h2>
        <label className={styles.nameField}>
          <span className={styles.visuallyHidden}>루틴 이름</span>
          <input
            name="name"
            type="text"
            maxLength={ROUTINE_NAME_MAX_LENGTH}
            placeholder="예: 월요일 상체"
            className={styles.nameInput}
            aria-describedby={state.fieldErrors?.name ? 'routine-name-error' : undefined}
          />
        </label>
        {state.fieldErrors?.name ? (
          <p id="routine-name-error" className={styles.fieldError}>{state.fieldErrors.name}</p>
        ) : null}
      </section>

      <section className={styles.selectedSection} aria-labelledby="selected-exercises-title">
        <div className={styles.selectedHeader}>
          <h2 id="selected-exercises-title" className={styles.sectionTitle}>선택한 운동</h2>
          <span className={styles.count}>{picker.selectedExercises.length}개</span>
        </div>

        {picker.selectedExercises.length > 0 ? (
          <div className={styles.selectedList}>
            {picker.selectedExercises.map((exercise, index) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                index={index}
                action={
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => picker.removeExercise(exercise.id)}
                    aria-label={`${exercise.name} 제거`}
                  >
                    제거
                  </button>
                }
              />
            ))}
          </div>
        ) : (
          <p className={styles.selectedEmpty}>아래 목록에서 운동을 하나씩 추가해 주세요.</p>
        )}

        {state.fieldErrors?.exercises ? (
          <p className={styles.fieldError}>{state.fieldErrors.exercises}</p>
        ) : null}
      </section>

      <ExercisePicker
        query={picker.query}
        onQueryChange={picker.setQuery}
        targetMuscle={picker.targetMuscle}
        onTargetMuscleChange={picker.setTargetMuscle}
        results={picker.results}
        selectedIds={picker.selectedIds}
        onAdd={picker.addExercise}
        isSearching={picker.isSearching}
        error={picker.searchError}
      />

      {state.message ? (
        <p className={styles.formError} role="alert">{state.message}</p>
      ) : null}

      <div className={styles.submitArea}>
        <button type="submit" className={styles.submitButton} disabled={!canSubmit}>
          {isPending ? '저장 중…' : '루틴 저장'}
        </button>
      </div>
    </form>
  )
}
