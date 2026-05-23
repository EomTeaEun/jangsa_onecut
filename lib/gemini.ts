import { GoogleGenerativeAI } from '@google/generative-ai'
import { Store, SalesData } from '@/types'

function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey)
}

function formatStoreInfo(store: Partial<Store>): string {
  const parts = []
  if (store.owner_nickname) parts.push(`사장님 닉네임: ${store.owner_nickname}`)
  if (store.name) parts.push(`가게명: ${store.name}`)
  if (store.category) parts.push(`업종: ${store.category}`)
  if (store.location_type) parts.push(`상권 유형: ${store.location_type}`)
  if (store.address) parts.push(`위치: ${store.address}`)
  if (store.target_customer?.length) parts.push(`주요 고객: ${store.target_customer.join(', ')}`)
  if (store.main_menu) parts.push(`대표 메뉴: ${store.main_menu}`)
  if (store.avg_price_range) parts.push(`평균 가격대: ${store.avg_price_range}`)
  if (store.business_hours) parts.push(`영업시간: ${store.business_hours}`)
  if (store.monthly_revenue_range && store.monthly_revenue_range !== '공개 안 함')
    parts.push(`월평균 매출: ${store.monthly_revenue_range}`)
  if (store.unique_selling_point) parts.push(`가게 강점/특징: ${store.unique_selling_point}`)
  if (store.sns_goal?.length) parts.push(`SNS 목표: ${store.sns_goal.join(', ')}`)
  if (store.instagram_handle) parts.push(`인스타그램: @${store.instagram_handle}`)
  return parts.join('\n')
}

export async function generateMarketingStrategy(
  scenario: string,
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `당신은 한국 소상공인 전문 마케팅 컨설턴트입니다.

【가게 정보】
${formatStoreInfo(storeInfo)}

【현재 상황/시나리오】
${scenario}

위 가게 정보를 꼼꼼히 참고하여, 이 상황에 최적화된 마케팅 전략 3가지를 제안해주세요.

전략 제안 시 반드시 고려할 것:
- 상권 유형(${storeInfo.location_type || '일반 상권'})에 맞는 접근법
- 주요 고객(${storeInfo.target_customer?.join(', ') || '일반 고객'})의 특성
- SNS 목표(${storeInfo.sns_goal?.join(', ') || '홍보'})를 달성하는 방향
- 대표 메뉴(${storeInfo.main_menu || '주요 메뉴'})를 활용하는 방법
- 비용이 적고 즉시 실행 가능한 방법

응답 형식 (한국어, 친근하고 실용적인 톤):

전략 1: [제목]
[구체적인 실행 방법 2-3문장]

전략 2: [제목]
[구체적인 실행 방법 2-3문장]

전략 3: [제목]
[구체적인 실행 방법 2-3문장]`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function generateSNSCopy(
  scenario: string,
  strategy: string,
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `당신은 SNS 마케팅 전문가입니다.
가게 정보:
${formatStoreInfo(storeInfo)}

마케팅 전략: ${strategy}
시나리오: ${scenario}

인스타그램에 올릴 홍보 글을 작성해주세요.
- 이모지 적절히 사용
- 해시태그 10개 포함
- 친근하고 매력적인 톤
- 200자 내외
- 고객의 공감을 이끌어내는 첫 문장으로 시작`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function generateImagePrompt(
  scenario: string,
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a food marketing designer. Write a concise Runway AI image generation prompt in English only. Maximum 700 characters.

Store: ${storeInfo.name || '식당'} (${storeInfo.category || '한식'}), speciality: ${storeInfo.unique_selling_point || storeInfo.main_menu || 'delicious food'}
Scenario: ${scenario}
Target: ${storeInfo.target_customer?.join(', ') || 'general customers'}

Write ONE English prompt paragraph for a marketing POSTER design. Include: bold graphic poster layout, eye-catching food hero shot, warm inviting color palette, promotional text area at top/bottom, modern Korean restaurant poster aesthetic, professional graphic design quality, portrait format (9:16). IMPORTANT: any text visible in the image must be in Korean language only, absolutely no Chinese characters. No explanations, just the prompt.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function generateVideoPrompt(
  scenario: string,
  strategy: string,
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `Write a concise Runway AI video generation prompt in English only. Maximum 700 characters.

Store: ${storeInfo.name || '식당'} (${storeInfo.category || '한식'}), speciality: ${storeInfo.unique_selling_point || storeInfo.main_menu || 'delicious food'}
Scenario: ${scenario}

Write ONE English prompt paragraph for a 5-second Instagram Reels video. Include: camera movement (slow zoom, pan, etc.), food visuals (steam, texture, color), lighting (warm, bokeh), overall mood. Portrait format (9:16). Cinematic food video style. No Korean text, no explanations, just the prompt.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function analyzeSalesData(
  salesData: SalesData[],
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const salesSummary = salesData
    .map(
      (d) =>
        `날짜: ${d.sale_date}, 매출: ${d.total_sales.toLocaleString()}원${d.customer_count ? `, 고객수: ${d.customer_count}명` : ''}${d.top_menu ? `, 인기메뉴: ${d.top_menu}` : ''}`
    )
    .join('\n')

  const prompt = `당신은 소상공인 매출 분석 전문가입니다.
가게 정보:
${formatStoreInfo(storeInfo)}

최근 매출 데이터:
${salesSummary}

위 데이터를 분석해서 다음을 제공해주세요:
1. 매출 패턴 요약 (2-3문장)
2. 매출이 높은 요일/시기 분석
3. 매출이 낮은 요일/시기와 개선 방안
4. 구체적인 매출 향상 마케팅 전략 2-3가지

사장님에게 직접 말하는 친근한 톤으로 한국어로 작성해주세요.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function analyzeReviews(
  reviews: string,
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `당신은 소상공인 마케팅 컨설턴트입니다.
가게 정보:
${formatStoreInfo(storeInfo)}

고객 리뷰:
${reviews}

위 리뷰를 분석해서 다음 형식으로 답변해주세요:

【칭찬 포인트】
- (긍정적 리뷰 핵심 키워드 3-5개)

【개선 필요 사항】
- (부정적 리뷰 핵심 내용)

【마케팅 포인트】
리뷰에서 발견된 강점을 활용한 마케팅 방향 제안

【추천 SNS 홍보 문구】
위 분석을 바탕으로 한 인스타그램 홍보 글 (이모지, 해시태그 포함)

친근하고 실용적인 톤으로 한국어로 작성해주세요.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}

export async function generatePosterImage(
  scenario: string,
  strategy: string,
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<{ imageData: string; mimeType: string } | null> {
  const genAI = getGeminiClient(apiKey)

  // 전략에서 핵심 이벤트/메시지 추출 후 포스터 프롬프트 작성
  const posterPrompt = `Create a professional Korean restaurant promotional poster image.

Store Information:
- Store Name: ${storeInfo.name || '맛있는 가게'}
- Category: ${storeInfo.category || '한식'}
- Target Customers: ${storeInfo.target_customer?.join(', ') || '일반 고객'}
- Price Range: ${storeInfo.avg_price_range || '합리적인 가격'}
- Speciality: ${storeInfo.unique_selling_point || '맛있는 음식'}

Marketing Scenario: ${scenario}

Marketing Strategy Summary:
${strategy.slice(0, 400)}

POSTER DESIGN REQUIREMENTS:
- Vertical portrait format (9:16 ratio), optimized for Instagram Stories/Feed
- Warm, appetizing color palette: deep orange (#E85D04), golden yellow (#F7B731), cream white (#FFF8F0), dark brown (#2D1B00)
- Large, bold store name "${storeInfo.name || '가게명'}" at the top in Korean
- Eye-catching food imagery (${storeInfo.category || '한식'} style food, steam rising, beautiful plating)
- Clear event/promotion text in Korean prominently displayed
- Modern, clean layout with visual hierarchy
- Call-to-action area at the bottom
- Professional graphic design quality
- Include Korean text elements naturally integrated into the design
- Bokeh background effect, warm lighting, professional food photography style
- Overall mood: inviting, delicious, trustworthy Korean restaurant`

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-preview-image-generation',
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: posterPrompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      } as never,
    })

    const parts = result.response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      const p = part as { inlineData?: { data: string; mimeType: string } }
      if (p.inlineData?.data) {
        return {
          imageData: p.inlineData.data,
          mimeType: p.inlineData.mimeType || 'image/png',
        }
      }
    }
    return null
  } catch (error) {
    console.error('Poster image generation error:', error)
    throw error
  }
}

export async function generateDailyTip(
  storeInfo: Partial<Store>,
  apiKey: string
): Promise<string> {
  const genAI = getGeminiClient(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const now = new Date()
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const dayOfWeek = days[now.getDay()]
  const hour = now.getHours()
  let timeOfDay = '아침'
  if (hour >= 11 && hour < 14) timeOfDay = '점심'
  else if (hour >= 14 && hour < 17) timeOfDay = '오후'
  else if (hour >= 17 && hour < 21) timeOfDay = '저녁'
  else if (hour >= 21) timeOfDay = '밤'

  const month = now.getMonth() + 1
  let season = '겨울'
  if (month >= 3 && month <= 5) season = '봄'
  else if (month >= 6 && month <= 8) season = '여름'
  else if (month >= 9 && month <= 11) season = '가을'

  const prompt = `당신은 소상공인 마케팅 도우미입니다.
가게 정보:
${formatStoreInfo(storeInfo)}

현재 시간 정보:
- 요일: ${dayOfWeek}
- 시간대: ${timeOfDay}
- 계절: ${season}

오늘 이 시간에 맞는 간단하고 실용적인 마케팅 팁을 2-3문장으로 제안해주세요.
사장님에게 직접 말하는 따뜻하고 친근한 톤으로 작성해주세요.
구체적이고 즉시 실행 가능한 내용으로 부탁드립니다.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
