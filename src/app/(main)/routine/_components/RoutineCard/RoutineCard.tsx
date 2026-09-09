import Link from 'next/link'
import type { RoutineSummary } from '../../types'
import { formatRoutineDate, getMuscleLabel } from '../../_utils/format'
import styles from './RoutineCard.module.css'

type RoutineCardProps = {
  routine: RoutineSummary
}

export function RoutineCard({ routine }: RoutineCardProps) {
  const muscleSummary = routine.targetMuscles
    .slice(0, 3)
    .map(getMuscleLabel)
    .join(', ')

  return (
    <li>
      <Link href={`/routine/${routine.id}`} className={styles.card}>
        <span className={styles.icon} aria-hidden="true">R</span>
        <span className={styles.content}>
          <strong className={styles.name}>{routine.name}</strong>
          <span className={styles.muscles}>
            {muscleSummary || '운동 부위 미지정'}
          </span>
          <span className={styles.meta}>
            운동 {routine.exerciseCount}개 · {formatRoutineDate(routine.createdAt)}
          </span>
        </span>
        <span className={styles.chevron} aria-hidden="true">›</span>
      </Link>
    </li>
  )
}
