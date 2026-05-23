'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rateLimitBlocked, setRateLimitBlocked] = useState(false)
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null)

  // 이메일 인증 콜백 실패 시 안내
  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'auth_callback_failed') {
      setErrors({
        general: '인증 링크 처리에 실패했어요. 메일이 만료됐을 수 있어요. 다시 회원가입을 시도해주세요.',
      })
    } else if (err) {
      setErrors({ general: `인증 실패: ${decodeURIComponent(err)}` })
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {}
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message
        if (err.path[0] === 'password') fieldErrors.password = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      // 1. 브루트포스 체크
      const rateLimitRes = await fetch('/api/auth/check-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (rateLimitRes.ok) {
        const rateLimitData = await rateLimitRes.json()
        if (!rateLimitData.allowed) {
          const until = rateLimitData.blockedUntil
            ? new Date(rateLimitData.blockedUntil).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : null
          setRateLimitBlocked(true)
          setBlockedUntil(until)
          setIsLoading(false)
          return
        }
      }

      // 2. 서버사이드 로그인 (쿠키 직접 설정)
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginRes.json()

      if (!loginRes.ok) {
        setErrors({ general: loginData.error || '로그인에 실패했습니다.' })
        setIsLoading(false)
        return
      }

      // 3. 성공 → 서버가 알려준 경로로 하드 이동
      window.location.href = loginData.redirectTo || '/dashboard'
    } catch {
      setErrors({ general: '서버 연결 오류가 발생했습니다. 다시 시도해주세요.' })
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">사장님, 다시 오셨군요! 👋</h1>
        <p className="text-stone-500 text-sm">로그인하고 오늘의 마케팅을 시작하세요</p>
      </div>

      {rateLimitBlocked && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
          <p className="font-semibold text-red-700 mb-1">🔒 로그인 시도 횟수 초과</p>
          <p className="text-red-600">
            보안을 위해 일시적으로 로그인이 제한되었습니다.
            {blockedUntil && ` ${blockedUntil} 이후에 다시 시도해주세요.`}
          </p>
        </div>
      )}

      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-2">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className={`w-full px-4 py-3 rounded-xl border text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-50'
            }`}
            disabled={isLoading || rateLimitBlocked}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-2">
            비밀번호
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요"
              className={`w-full px-4 py-3 rounded-xl border text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all pr-12 ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-50'
              }`}
              disabled={isLoading || rateLimitBlocked}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || rateLimitBlocked}
          className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 spinner" />
              <span>로그인 중...</span>
            </>
          ) : (
            '로그인'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-stone-500">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-orange-500 font-semibold hover:text-orange-600">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
