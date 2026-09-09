import styles from './loading.module.css'

export default function RoutineLoading() {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.indicator} aria-hidden="true" />
      루틴을 불러오는 중입니다.
    </div>
  )
}
