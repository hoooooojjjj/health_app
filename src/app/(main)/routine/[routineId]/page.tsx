import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExerciseRow } from '../_components/ExerciseRow/ExerciseRow'
import { getRoutineById } from '../_data/routines'
import { isUuid } from '../_utils/validation'
import styles from './page.module.css'

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ routineId: string }>
}) {
  const { routineId } = await params

  if (!isUuid(routineId)) {
    notFound()
  }

  const routine = await getRoutineById(routineId)

  if (!routine) {
    notFound()
  }

  return (
    <>
      <header className={styles.header}>
        <Link href="/routine" className={styles.backButton} aria-label="루틴 목록으로 돌아가기">
          <span aria-hidden="true">‹</span>
        </Link>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>MY ROUTINE</p>
          <h1 className={styles.title}>{routine.name}</h1>
          <p className={styles.summary}>운동 {routine.exercises.length}개</p>
        </div>
      </header>

      <main className={styles.main}>
        <section aria-labelledby="routine-exercises-title">
          <h2 id="routine-exercises-title" className={styles.sectionTitle}>운동 목록</h2>
          <div className={styles.exerciseList}>
            {routine.exercises.map((exercise, index) => (
              <ExerciseRow key={exercise.id} exercise={exercise} index={index} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
