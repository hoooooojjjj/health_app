import { WorkoutCalendar } from './_components/WorkoutCalendar/WorkoutCalendar'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.appContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>운동 캘린더</h1>
        </header>

        <main className={styles.main}>
          <WorkoutCalendar />
        </main>
      </div>
    </div>
  )
}
