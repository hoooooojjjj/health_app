import Link from 'next/link'
import { RoutineForm } from '../_components/RoutineForm/RoutineForm'
import { getExercises } from '../_data/routines'
import { EXERCISE_SEARCH_LIMIT } from '../constants'
import styles from './page.module.css'

export default async function NewRoutinePage() {
  const initialExercises = await getExercises({ limit: EXERCISE_SEARCH_LIMIT })

  return (
    <>
      <header className={styles.header}>
        <Link href="/routine" className={styles.backButton} aria-label="루틴 목록으로 돌아가기">
          <span aria-hidden="true">‹</span>
        </Link>
        <div>
          <p className={styles.eyebrow}>NEW ROUTINE</p>
          <h1 className={styles.title}>새 루틴 만들기</h1>
        </div>
      </header>

      <main className={styles.main}>
        <RoutineForm initialExercises={initialExercises} />
      </main>
    </>
  )
}
