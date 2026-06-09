import styles from './page.module.css'

export default function Home() {
  return (
    /* CSS Module을 적용한 전체 레이아웃 컨테이너 */
    <main className={styles.mainContainer}>
      <h1 className={styles.title}>
        Health App
      </h1>
      <p className={styles.description}>
        Next.js와 Supabase SSR 인증 유틸리티 초기 설정이 성공적으로 완료되었습니다.
        <br />
        <code className={styles.codeHighlight}>src/app/page.tsx</code> 파일을 수정하여 애플리케이션 개발을 시작하세요.
      </p>
    </main>
  )
}
