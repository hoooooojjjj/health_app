'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setMessage(null)
      setLoading(true)

      try {
        if (!email || !password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.')
        }

        if (mode === 'signup') {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          })

          if (signUpError) throw signUpError

          // Supabase가 이메일 확인을 필요로 하지 않는 설정인 경우 세션이 바로 생성됨
          if (data.session) {
            setMessage('회원가입 및 로그인 완료!')
            router.push('/')
            router.refresh()
          } else {
            setMessage('회원가입 성공! 설정에 따라 메일 확인이 필요할 수 있습니다. 로그인을 진행해주세요.')
            setMode('login')
            setPassword('') // 비밀번호 초기화
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) throw signInError

          setMessage('로그인 성공! 대시보드로 이동합니다.')
          router.push('/')
          router.refresh()
        }
      } catch (err: any) {
        console.error('[Auth Error]:', err)
        setError(err.message || '인증 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [mode, email, password, router, supabase]
  )

  const handleToggleMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
    setError(null)
    setMessage(null)
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.appContainer}>
        <div className={styles.bgGrid} />
        <div className={styles.bgScanlines} />

        <header className={styles.header}>
          <span className={styles.labelSystem}>// health_app / auth_system</span>
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
