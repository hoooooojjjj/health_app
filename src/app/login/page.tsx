'use client'

import { useAuthForm } from '@/hooks/useAuthForm'
import styles from './page.module.css'

export default function LoginPage() {
  const {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    message,
    handleSubmit,
    handleToggleMode,
  } = useAuthForm()

  return (
    <div className={styles.wrapper}>
      <div className={styles.appContainer}>
        <div className={styles.bgGrid} />
        <div className={styles.bgScanlines} />

        <header className={styles.header}>
          <span className={styles.labelSystem}>{'// health_app / auth_system'}</span>
          <h1 className={styles.pageTitle}>
            {mode === 'login' ? '로그인' : '회원가입'}
          </h1>
        </header>

        <main className={styles.main}>
          <div className={styles.card}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">
                  이메일 주소
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="password">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}
              {message && <div className={styles.successBox}>{message}</div>}

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading}
              >
                {loading
                  ? '처리 중...'
                  : mode === 'login'
                  ? '로그인하기'
                  : '가입하기'}
              </button>
            </form>

            <div className={styles.switchModeRow}>
              {mode === 'login'
                ? '아직 계정이 없으신가요?'
                : '이미 계정이 있으신가요?'}
              <button
                type="button"
                className={styles.btnToggle}
                onClick={handleToggleMode}
                disabled={loading}
              >
                {mode === 'login' ? '회원가입' : '로그인'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
