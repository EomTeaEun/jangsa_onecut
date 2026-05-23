import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  generateMarketingStrategy,
  generateSNSCopy,
  generatePosterImage,
  generateDailyTip,
} from '@/lib/gemini'
import { sanitizeInput } from '@/lib/utils'

async function uploadImageToStorage(
  imageData: string,
  mimeType: string,
  userId: string,
  fileName: string
): Promise<string | null> {
  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const buffer = Buffer.from(imageData, 'base64')
    const ext = mimeType.split('/')[1] || 'png'
    const path = `${userId}/${fileName}.${ext}`

    const { error } = await serviceClient.storage
      .from('poster-images')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return null
    }

    const { data } = serviceClient.storage
      .from('poster-images')
      .getPublicUrl(path)

    return data.publicUrl
  } catch (e) {
    console.error('Upload failed:', e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { type, scenario, storeId } = body

    if (!type || !scenario) {
      return NextResponse.json({ error: '타입과 시나리오는 필수입니다' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 서버에 설정되지 않았습니다.' }, { status: 500 })
    }

    // Get store info
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: '가게 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    const sanitizedScenario = sanitizeInput(scenario)

    let result: {
      strategy_text?: string
      sns_copy?: string
      image_prompt?: string
      image_url?: string
      image_data?: string
    } = {}

    // Generate content based on type
    if (type === 'daily_tip') {
      const tip = await generateDailyTip(store, apiKey)
      return NextResponse.json({ strategy_text: tip, result: tip })
    }

    if (type === 'strategy') {
      const strategy = await generateMarketingStrategy(sanitizedScenario, store, apiKey)
      result.strategy_text = strategy

      // Save to DB
      const { data: content } = await supabase
        .from('contents')
        .insert({
          store_id: store.id,
          user_id: user.id,
          type: 'strategy',
          title: `${sanitizedScenario} 마케팅 전략`,
          scenario: sanitizedScenario,
          strategy_text: strategy,
        })
        .select()
        .single()

      return NextResponse.json({ ...result, contentId: content?.id })
    }

    if (type === 'sns_post') {
      // First generate strategy, then SNS copy
      const strategy = await generateMarketingStrategy(sanitizedScenario, store, apiKey)
      const snsCopy = await generateSNSCopy(sanitizedScenario, strategy, store, apiKey)

      result.strategy_text = strategy
      result.sns_copy = snsCopy

      const { data: content } = await supabase
        .from('contents')
        .insert({
          store_id: store.id,
          user_id: user.id,
          type: 'sns_post',
          title: `${sanitizedScenario} SNS 글`,
          scenario: sanitizedScenario,
          strategy_text: strategy,
          sns_copy: snsCopy,
        })
        .select()
        .single()

      return NextResponse.json({ ...result, contentId: content?.id })
    }

    if (type === 'poster') {
      // 1단계: 전략 생성
      const strategy = await generateMarketingStrategy(sanitizedScenario, store, apiKey)
      // 2단계: SNS 글 생성
      const snsCopy = await generateSNSCopy(sanitizedScenario, strategy, store, apiKey)

      result.strategy_text = strategy
      result.sns_copy = snsCopy

      // 3단계: 전략 기반 포스터 이미지 실제 생성 (Gemini 2.0)
      let imageUrl: string | null = null
      let imageDataBase64: string | null = null

      try {
        const imageResult = await generatePosterImage(sanitizedScenario, strategy, store, apiKey)

        if (imageResult) {
          // Supabase Storage 업로드 시도
          const fileName = `poster_${Date.now()}`
          const uploadedUrl = await uploadImageToStorage(
            imageResult.imageData,
            imageResult.mimeType,
            user.id,
            fileName
          )

          if (uploadedUrl) {
            imageUrl = uploadedUrl
          } else {
            // Storage 실패 시 base64로 직접 반환
            imageDataBase64 = `data:${imageResult.mimeType};base64,${imageResult.imageData}`
          }
        }
      } catch (imgError) {
        // 이미지 생성 실패해도 전략/SNS 글은 반환
        console.error('Image generation failed, continuing without image:', imgError)
        result.image_prompt = `이미지 생성 실패: ${imgError instanceof Error ? imgError.message : '알 수 없는 오류'}`
      }

      if (imageUrl) result.image_url = imageUrl
      if (imageDataBase64) result.image_data = imageDataBase64

      const { data: content } = await supabase
        .from('contents')
        .insert({
          store_id: store.id,
          user_id: user.id,
          type: 'poster',
          title: `${sanitizedScenario} 포스터`,
          scenario: sanitizedScenario,
          strategy_text: strategy,
          sns_copy: snsCopy,
          image_url: imageUrl,
        })
        .select()
        .single()

      return NextResponse.json({ ...result, contentId: content?.id })
    }

    return NextResponse.json({ error: '지원하지 않는 콘텐츠 타입입니다' }, { status: 400 })
  } catch (error) {
    console.error('Content generation error:', error)

    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid api key')) {
        return NextResponse.json(
          { error: 'API 키가 유효하지 않습니다. 설정에서 올바른 API 키를 입력해주세요.' },
          { status: 402 }
        )
      }
      if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 429 }
        )
      }
      if (error.message.includes('image') || error.message.includes('IMAGE')) {
        return NextResponse.json(
          { error: '이미지 생성 중 오류가 발생했습니다. Gemini API Tier 1 이상이 필요합니다.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'AI 생성 중 오류가 발생했습니다. 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}
