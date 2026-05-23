'use client'

import { useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const signupSchema = z
  .object({
    nickname: z.string().min(1, '닉네임을 입력해주세요').max(20, '닉네임은 20자 이하여야 합니다'),
    email: z.string().email('올바른 이메일 형식을 입력해주세요'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, '특수문자를 최소 1개 포함해야 합니다'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

type FormErrors = {
  nickname?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export default function SignupPage() {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function getPasswordStrength(pw: string): { strength: number; label: string; color: string } {
    let strength = 0
    if (pw.length >= 8) strength++
    if (/[A-Z]/.test(pw)) strength++
    if (/[0-9]/.test(pw)) strength++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) strength++

    if (strength <= 1) return { strength, label: '약함', color: 'bg-red-400' }
    if (strength <= 2) return { strength, label: '보통', color: 'bg-yellow-400' }
    if (strength <= 3) return { strength, label: '강함', color: 'bg-blue-400' }
    return { strength, label: '매우 강함', color: 'bg-green-400' }
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const validation = signupSchema.safeParse({ nickname, email, password, confirmPassword })
    if (!validation.success) {
      const fieldErrors: FormErrors = {}
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors
        if (field) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, nickname: nickname.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || '회원가입에 실패했습니다.' })
        setIsLoading(false)
        return
      }

      // 유저 생성 완료 → 클라이언트에서 바로 로그인
      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInErr) {
        // 가입은 됐으니 로그인 페이지로
        window.location.href = '/login'
        return
      }

      window.location.href = '/onboarding'
    } catch (err) {
      setErrors({ general: '오류: ' + (err instanceof Error ? err.message : String(err)) })
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">사장님, 어서 오세요! 🎉</h1>
        <p className="text-stone-500 text-sm">무료로 시작하고 AI 마케팅을 경험해보세요</p>
      </div>

      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="nickname" className="block text-sm font-semibold text-stone-700 mb-2">
            사장님 닉네임 <span className="text-red-400">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예: 홍길동 사장님, 맛집 김씨"
            className={`w-full px-4 py-3 rounded-xl border text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${
              errors.nickname ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-50'
            }`}
            disabled={isLoading}
            maxLength={20}
            autoComplete="nickname"
          />
          {errors.nickname && <p className="mt-1.5 text-xs text-red-500">{errors.nickname}</p>}
        </div>

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
            disabled={isLoading}
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
              placeholder="8자 이상, 특수문자 포함"
              className={`w-full px-4 py-3 rounded-xl border text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all pr-12 ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-50'
              }`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {password && passwordStrength && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      level <= passwordStrength.strength ? passwordStrength.color : 'bg-stone-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-stone-500">비밀번호 강도: {passwordStrength.label}</p>
            </div>
          )}
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-stone-700 mb-2">
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력해주세요"
              className={`w-full px-4 py-3 rounded-xl border text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all pr-12 ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-stone-50'
              }`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
            <p className="mt-1.5 text-xs text-green-500">✓ 비밀번호가 일치합니다</p>
          )}
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 spinner" />
              <span>가입 중...</span>
            </>
          ) : (
            '🎉 무료로 시작하기'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-stone-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">
            로그인
          </Link>
        </p>
      </div>

      <p className="mt-4 text-xs text-stone-400 text-center">
        가입 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
      </p>
    </div>
  )
}
