'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function useAuthForm() {
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

          // 이메일 인증이 불필요한 설정일 경우 가입 즉시 세션 발급 및 자동 로그인됨
          if (data.session) {
            setMessage('회원가입 및 로그인 완료! 이동 중...')
            router.push('/')
            router.refresh()
          } else {
            setMessage('회원가입 완료! 이메일 인증을 진행하거나 로그인해주세요.')
            setMode('login')
            setPassword('') // 가입 성공 후 비밀번호 칸만 초기화
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) throw signInError

          setMessage('로그인 성공! 이동 중...')
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

  return {
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
  }
}
