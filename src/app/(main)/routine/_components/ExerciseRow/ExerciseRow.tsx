import Image from 'next/image'
import type { ReactNode } from 'react'
import type { ExerciseSummary } from '../../types'
import { getEquipmentLabel, getMuscleLabel } from '../../_utils/format'
import styles from './ExerciseRow.module.css'

type ExerciseRowProps = {
  exercise: ExerciseSummary
  action?: ReactNode
  index?: number
}

export function ExerciseRow({ exercise, action, index }: ExerciseRowProps) {
  return (
    <article className={styles.row}>
      <div className={styles.thumbnail}>
        {exercise.imageUrl ? (
          <Image
            src={exercise.imageUrl}
            alt=""
            width={72}
            height={72}
            className={styles.image}
          />
        ) : (
          <span className={styles.fallback} aria-hidden="true">
            {typeof index === 'number' ? index + 1 : '·'}
          </span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{exercise.name}</h3>
        <p className={styles.meta}>
          {getMuscleLabel(exercise.targetMuscle)} · {getEquipmentLabel(exercise.equipmentType)}
        </p>
      </div>

      {action ? <div className={styles.action}>{action}</div> : null}
    </article>
  )
}
