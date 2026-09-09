import Link from 'next/link'
import styles from './RoutineEmptyState.module.css'

export function RoutineEmptyState() {
  return (
    <section className={styles.emptyState} aria-labelledby="routine-empty-title">
      <span className={styles.icon} aria-hidden="true">+</span>
      <h2 id="routine-empty-title" className={styles.title}>
        아직 등록된 루틴이 없습니다
      </h2>
      <p className={styles.description}>
        자주 하는 운동을 순서대로 추가해 나만의 루틴을 만들어 보세요.
      </p>
      <Link href="/routine/new" className={styles.button}>
        첫 루틴 만들기
      </Link>
    </section>
  )
}
