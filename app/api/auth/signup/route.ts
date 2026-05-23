import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { checkRateLimit, incrementAttempt } from '@/lib/security/rate-limiter'
import { getClientIp } from '@/lib/security/get-client-ip'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(20),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rlIdentifier = `${ip}:signup`

  const rl = await checkRateLimit(rlIdentifier, 'signup', 5, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '회원가입 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }
  await incrementAttempt(rlIdentifier, 'signup', 5, 60)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || '입력값 오류' },
      { status: 400 }
    )
  }

  const { email, password, nickname } = validation.data
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { nickname },
      emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    // 이메일 enumeration 방지: 'already exists' 류는 일반화된 응답
    if (
      error.message.toLowerCase().includes('already') ||
      error.message.toLowerCase().includes('exists') ||
      error.message.toLowerCase().includes('registered')
    ) {
      return NextResponse.json({
        success: true,
        needsEmailConfirmation: true,
      })
    }
    console.error('Signup error:', error.message)
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 400 })
  }

  if (!data.user) {
    return NextResponse.json({ error: '유저 생성에 실패했습니다.' }, { status: 500 })
  }

  // Confirm email 켜진 경우 data.session === null (메일 발송됨)
  // 꺼진 경우 data.session 존재 (즉시 사용 가능)
  return NextResponse.json({
    success: true,
    needsEmailConfirmation: !data.session,
  })
}
