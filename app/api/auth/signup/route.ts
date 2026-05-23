import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().min(1).max(20),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.errors[0]?.message || '입력값 오류' }, { status: 400 })
  }

  const { email, password, nickname } = validation.data

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: '서버 환경변수 누락 (SUPABASE_URL 또는 SERVICE_ROLE_KEY)' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    user_metadata: { nickname },
    email_confirm: true,
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다. 로그인해주세요.' }, { status: 409 })
    }
    return NextResponse.json({ error: '회원가입 오류: ' + error.message }, { status: 400 })
  }

  if (!data.user) {
    return NextResponse.json({ error: '유저 생성 실패' }, { status: 500 })
  }

  // 유저 생성만 담당 — 세션은 클라이언트에서 signInWithPassword로 처리
  return NextResponse.json({ success: true })
}
