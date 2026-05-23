import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMarketingStrategy, generateImagePrompt, generateVideoPrompt } from '@/lib/gemini'
import { startImageGeneration, startVideoGeneration } from '@/lib/runway'
import { sanitizeInput } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['poster', 'reels']),
  scenario: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const validation = schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 })
    }

    const geminiKey = process.env.GEMINI_API_KEY
    const runwayKey = process.env.RUNWAY_API_KEY
    if (!geminiKey || !runwayKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: '가게 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    const { type, scenario } = validation.data
    const sanitizedScenario = sanitizeInput(scenario)

    // 1. Gemini로 전략 + 프롬프트 생성
    const strategy = await generateMarketingStrategy(sanitizedScenario, store, geminiKey)

    let taskId: string
    let promptText: string

    if (type === 'poster') {
      promptText = await generateImagePrompt(sanitizedScenario, store, geminiKey)
      taskId = await startImageGeneration(promptText, runwayKey)
    } else {
      promptText = await generateVideoPrompt(sanitizedScenario, strategy, store, geminiKey)
      taskId = await startVideoGeneration(promptText, runwayKey)
    }

    // DB에 즉시 저장 (미디어 URL은 폴링 완료 후 업데이트)
    const { data: content } = await supabase
      .from('contents')
      .insert({
        store_id: store.id,
        user_id: user.id,
        type,
        title: `${sanitizedScenario} ${type === 'poster' ? '포스터' : '릴스'}`,
        scenario: sanitizedScenario,
        strategy_text: strategy,
      })
      .select()
      .single()

    return NextResponse.json({ taskId, strategy, promptText, contentId: content?.id })
  } catch (error) {
    console.error('Runway start error:', error)
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    return NextResponse.json({ error: `생성 시작 실패: ${message}` }, { status: 500 })
  }
}
