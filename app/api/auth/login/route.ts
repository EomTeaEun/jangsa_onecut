import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, incrementAttempt, resetAttempts } from '@/lib/security/rate-limiter'
import { getClientIp } from '@/lib/security/get-client-ip'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = schema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: '이메일과 비밀번호를 확인해주세요.' }, { status: 400 })
    }

    const { email, password } = validation.data
    const normalizedEmail = email.trim().toLowerCase()

    // 서버 측 rate limit (클라이언트 우회 차단)
    const ip = getClientIp(request)
    const identifier = `${ip}:${normalizedEmail}`
    const rl = await checkRateLimit(identifier, 'login', 5, 15)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: '로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
          blockedUntil: rl.blockedUntil?.toISOString(),
        },
        { status: 429 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      await incrementAttempt(identifier, 'login', 5, 15)

      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
      }
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: '가입 시 발송된 인증 메일의 링크를 먼저 클릭해주세요.' },
          { status: 401 }
        )
      }
      return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 401 })
    }

    if (!data.user) {
      await incrementAttempt(identifier, 'login', 5, 15)
      return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 401 })
    }

    // 성공 시 시도 횟수 리셋
    await resetAttempts(identifier, 'login')

    const { data: store } = await supabase
      .from('stores')
      .select('is_onboarded')
      .eq('user_id', data.user.id)
      .single()

    const redirectTo = store?.is_onboarded ? '/dashboard' : '/onboarding'
    return NextResponse.json({ success: true, redirectTo })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
