import styles from './page.module.css'

export default function RoutinePage() {
  return (
    <>
      <header className={styles.header}>
        <p className={styles.eyebrow}>WORKOUT</p>
        <h1 className={styles.title}>루틴</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.placeholder} aria-labelledby="routine-placeholder-title">
          <span className={styles.placeholderIcon} aria-hidden="true">+</span>
          <h2 id="routine-placeholder-title" className={styles.placeholderTitle}>
            아직 등록된 루틴이 없습니다
          </h2>
          <p className={styles.placeholderDescription}>
            루틴 구성 기능은 다음 단계에서 추가합니다.
          </p>
        </section>
      </main>
    </>
  )
}
