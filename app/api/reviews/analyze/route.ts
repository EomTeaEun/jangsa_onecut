import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeReviews } from '@/lib/gemini'
import { sanitizeInput } from '@/lib/utils'
import { z } from 'zod'

const reviewSchema = z.object({
  reviews: z.string().min(10, '리뷰 내용이 너무 짧습니다').max(5000, '리뷰 내용이 너무 깁니다'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const validation = reviewSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 서버에 설정되지 않았습니다.' }, { status: 500 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: '가게 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    const sanitizedReviews = sanitizeInput(validation.data.reviews)
    const analysis = await analyzeReviews(sanitizedReviews, store, apiKey)
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Review analysis error:', error)
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다' }, { status: 500 })
  }
}
