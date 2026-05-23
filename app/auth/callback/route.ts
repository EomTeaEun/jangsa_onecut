import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

// Supabase 이메일 확인 링크 처리. 두 가지 형식 모두 지원:
//   1. PKCE flow:        ?code=...
//   2. Token hash flow:  ?token_hash=...&type=signup (구식 / 일부 환경)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/onboarding'
  const errorDescription = searchParams.get('error_description')

  // Supabase 자체에서 에러 응답한 경우 (만료된 링크 등)
  if (errorDescription) {
    console.error('[auth/callback] Supabase error:', errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`
    )
  }

  const supabase = createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] verifyOtp failed:', error.message)
  }

  console.error('[auth/callback] No valid params. Query:', Object.fromEntries(searchParams))
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
