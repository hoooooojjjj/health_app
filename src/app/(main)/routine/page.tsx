import Link from 'next/link'
import { RoutineCard } from './_components/RoutineCard/RoutineCard'
import { RoutineEmptyState } from './_components/RoutineEmptyState/RoutineEmptyState'
import { getUserRoutines } from './_data/routines'
import styles from './page.module.css'

export default async function RoutinePage() {
  const routines = await getUserRoutines()

  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>WORKOUT</p>
          <h1 className={styles.title}>나의 루틴</h1>
        </div>
        <Link href="/routine/new" className={styles.addButton}>
          <span aria-hidden="true">+</span>
          새 루틴
        </Link>
      </header>

      <main className={styles.main}>
        {routines.length > 0 ? (
          <ul className={styles.routineList}>
            {routines.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} />
            ))}
          </ul>
        ) : (
          <RoutineEmptyState />
        )}
      </main>
    </>
  )
}
