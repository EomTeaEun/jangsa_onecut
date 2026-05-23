import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
      }
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json({ error: '이메일 인증이 필요합니다. Supabase에서 Confirm email을 꺼주세요.' }, { status: 401 })
      }
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 401 })
    }

    // 온보딩 여부 확인
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
