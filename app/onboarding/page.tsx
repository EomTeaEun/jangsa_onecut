'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sanitizeInput } from '@/lib/utils'
import type { StoreCategory } from '@/types'

const CATEGORIES: StoreCategory[] = ['한식', '중식', '일식', '카페', '치킨', '피자', '분식', '기타']
const TARGET_CUSTOMERS = ['대학생', '직장인', '가족', '관광객', '시니어', '10대']
const PRICE_RANGES = ['5,000원 미만', '5,000~10,000원', '10,000~20,000원', '20,000~30,000원', '30,000원 이상']
const LOCATION_TYPES = [
  { value: '대학가', emoji: '🎓', desc: '대학교 주변' },
  { value: '직장가/오피스', emoji: '🏢', desc: '회사/오피스 밀집 지역' },
  { value: '주택가', emoji: '🏘️', desc: '아파트·주거 지역' },
  { value: '관광지', emoji: '📸', desc: '관광명소 인근' },
  { value: '먹자골목', emoji: '🍜', desc: '음식점 밀집 상권' },
  { value: '번화가', emoji: '✨', desc: '유동인구 많은 번화가' },
]
const MONTHLY_REVENUE = [
  '500만원 미만', '500~1,000만원', '1,000~2,000만원',
  '2,000~3,000만원', '3,000만원 이상', '공개 안 함',
]
const SNS_GOALS = [
  { value: '신규 고객 유치', emoji: '🆕' },
  { value: '단골 고객 유지', emoji: '❤️' },
  { value: '배달 주문 증가', emoji: '🛵' },
  { value: '브랜드 인지도 향상', emoji: '📣' },
  { value: '이벤트/할인 홍보', emoji: '🎉' },
  { value: 'SNS 팔로워 늘리기', emoji: '📱' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const totalSteps = 4

  // Step 1: 사장님 & 가게 기본 정보
  const [ownerNickname, setOwnerNickname] = useState('')
  const [storeName, setStoreName] = useState('')
  const [category, setCategory] = useState<StoreCategory | ''>('')
  const [phone, setPhone] = useState('')

  // Step 2: 위치 & 상권 & 타겟
  const [address, setAddress] = useState('')
  const [locationType, setLocationType] = useState('')
  const [targetCustomers, setTargetCustomers] = useState<string[]>([])

  // Step 3: 메뉴 & 운영 정보
  const [mainMenu, setMainMenu] = useState('')
  const [avgPriceRange, setAvgPriceRange] = useState('')
  const [businessHours, setBusinessHours] = useState('')
  const [monthlyRevenue, setMonthlyRevenue] = useState('')

  // Step 4: 가게 특징 & SNS 목표
  const [uniqueSellingPoint, setUniqueSellingPoint] = useState('')
  const [snsGoals, setSnsGoals] = useState<string[]>([])
  const [instagramHandle, setInstagramHandle] = useState('')

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
  }

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!ownerNickname.trim()) return '사장님 닉네임을 입력해주세요'
      if (!storeName.trim()) return '가게 이름을 입력해주세요'
      if (!category) return '가게 종류를 선택해주세요'
    }
    if (step === 2) {
      if (!locationType) return '상권 유형을 선택해주세요'
      if (targetCustomers.length === 0) return '주요 고객을 최소 1개 선택해주세요'
    }
    if (step === 3) {
      if (!mainMenu.trim()) return '대표 메뉴를 입력해주세요'
      if (!avgPriceRange) return '평균 가격대를 선택해주세요'
    }
    if (step === 4) {
      if (!uniqueSellingPoint.trim()) return '가게 강점을 입력해주세요'
      if (snsGoals.length === 0) return 'SNS 목표를 최소 1개 선택해주세요'
    }
    return null
  }

  function handleNext() {
    const err = validateStep(currentStep)
    if (err) { setError(err); return }
    setError('')
    setCurrentStep((s) => s + 1)
  }

  async function handleComplete() {
    const err = validateStep(4)
    if (err) { setError(err); return }
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { error: insertError } = await supabase.from('stores').insert({
        user_id: user.id,
        name: sanitizeInput(storeName),
        category: category as StoreCategory,
        address: sanitizeInput(address),
        phone: sanitizeInput(phone),
        target_customer: targetCustomers,
        avg_price_range: avgPriceRange,
        unique_selling_point: sanitizeInput(uniqueSellingPoint),
        instagram_handle: sanitizeInput(instagramHandle.replace('@', '')),
        owner_nickname: sanitizeInput(ownerNickname),
        location_type: locationType,
        main_menu: sanitizeInput(mainMenu),
        business_hours: sanitizeInput(businessHours),
        monthly_revenue_range: monthlyRevenue,
        sns_goal: snsGoals,
        is_onboarded: true,
      })

      if (insertError) {
        setError('저장 중 오류가 발생했습니다: ' + insertError.message)
        setIsLoading(false)
        return
      }

      window.location.href = '/dashboard'
    } catch {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setIsLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400'
  const chipCls = (active: boolean) =>
    `px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border-2 ${
      active ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300'
    }`

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col">
      <header className="p-5 border-b border-orange-100 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍳</span>
            <span className="text-lg font-bold text-orange-500">장사한컷</span>
          </div>
          <span className="text-sm text-stone-400 font-medium">{currentStep}/{totalSteps} 단계</span>
        </div>
      </header>

      {/* 진행바 */}
      <div className="h-1.5 bg-orange-100">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* ─── STEP 1: 사장님 & 가게 기본 정보 ─── */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-orange-100">
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4">STEP 1 / 4</span>
              <h2 className="text-2xl font-bold text-stone-900 mb-1">사장님 & 가게 기본 정보</h2>
              <p className="text-stone-500 text-sm mb-7">AI가 사장님과 가게를 이해할 수 있도록 알려주세요</p>

              {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    사장님 닉네임 <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={ownerNickname}
                    onChange={(e) => setOwnerNickname(e.target.value)}
                    placeholder="예: 홍사장, 김대표, 맛집언니"
                    className={inputCls}
                    maxLength={20}
                  />
                  <p className="text-xs text-stone-400 mt-1">AI가 마케팅 글을 쓸 때 활용해요</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    가게 이름 <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="예: 홍길동 순대국밥"
                    className={inputCls}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    가게 종류 <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat} type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                          category === cat
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-stone-50 text-stone-600 border border-stone-200 hover:border-orange-300'
                        }`}
                      >{cat}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">전화번호</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예: 02-1234-5678"
                    className={inputCls}
                    maxLength={20}
                    type="tel"
                  />
                </div>
              </div>

              <button onClick={handleNext} className="w-full mt-8 bg-orange-500 text-white py-4 rounded-xl font-bold text-base hover:bg-orange-600 transition-all shadow-md">
                다음 →
              </button>
            </div>
          )}

          {/* ─── STEP 2: 위치 & 상권 ─── */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-orange-100">
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4">STEP 2 / 4</span>
              <h2 className="text-2xl font-bold text-stone-900 mb-1">위치 & 상권 & 주요 고객</h2>
              <p className="text-stone-500 text-sm mb-7">상권에 맞는 마케팅 전략이 완전히 달라요</p>

              {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">주소</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="예: 서울시 마포구 홍대로 123"
                    className={inputCls}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    상권 유형 <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {LOCATION_TYPES.map((loc) => (
                      <button
                        key={loc.value} type="button"
                        onClick={() => setLocationType(loc.value)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          locationType === loc.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-stone-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{loc.emoji}</div>
                        <div className="font-semibold text-stone-900 text-sm">{loc.value}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{loc.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    주요 고객 <span className="text-red-400">*</span>
                    <span className="text-stone-400 font-normal ml-1">(복수 선택)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_CUSTOMERS.map((c) => (
                      <button key={c} type="button" onClick={() => setTargetCustomers(toggleArr(targetCustomers, c))}
                        className={chipCls(targetCustomers.includes(c))}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setCurrentStep(1); setError('') }} className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-xl font-bold hover:bg-stone-200 transition-all">← 이전</button>
                <button onClick={handleNext} className="flex-[2] bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md">다음 →</button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: 메뉴 & 운영 정보 ─── */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-orange-100">
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4">STEP 3 / 4</span>
              <h2 className="text-2xl font-bold text-stone-900 mb-1">메뉴 & 운영 정보</h2>
              <p className="text-stone-500 text-sm mb-7">구체적일수록 AI 추천이 정확해져요</p>

              {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    대표 메뉴 <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={mainMenu}
                    onChange={(e) => setMainMenu(e.target.value)}
                    placeholder="예: 육개장, 비빔밥, 된장찌개 (2~3가지)"
                    className={inputCls}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    평균 가격대 <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    {PRICE_RANGES.map((r) => (
                      <button key={r} type="button" onClick={() => setAvgPriceRange(r)}
                        className={`w-full text-left px-5 py-3.5 rounded-xl font-medium text-sm transition-all border-2 ${
                          avgPriceRange === r ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300'
                        }`}>{r}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">영업시간</label>
                  <input
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    placeholder="예: 평일 11:00~22:00, 주말 12:00~21:00, 월요일 휴무"
                    className={inputCls}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">월평균 매출 규모 (선택)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MONTHLY_REVENUE.map((r) => (
                      <button key={r} type="button" onClick={() => setMonthlyRevenue(r)}
                        className={chipCls(monthlyRevenue === r)}>{r}</button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400 mt-1.5">AI 마케팅 전략 수준을 맞추는 데 사용해요. 비공개로 안전하게 저장됩니다.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setCurrentStep(2); setError('') }} className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-xl font-bold hover:bg-stone-200 transition-all">← 이전</button>
                <button onClick={handleNext} className="flex-[2] bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md">다음 →</button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: 가게 특징 & SNS 목표 ─── */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-orange-100">
              <span className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-4">STEP 4 / 4</span>
              <h2 className="text-2xl font-bold text-stone-900 mb-1">가게 강점 & SNS 목표</h2>
              <p className="text-stone-500 text-sm mb-7">마지막 단계예요! 거의 다 왔어요 🎉</p>

              {error && <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    가게 강점 / 차별점 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={uniqueSellingPoint}
                    onChange={(e) => setUniqueSellingPoint(e.target.value)}
                    placeholder="예: 30년 전통 손맛, 국내산 재료만 사용, 반찬 무제한 리필, 주차 가능, 배달 빠름"
                    rows={3}
                    className={inputCls + ' resize-none'}
                    maxLength={300}
                  />
                  <p className="text-right text-xs text-stone-400 mt-1">{uniqueSellingPoint.length}/300</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-3">
                    SNS 목표 <span className="text-red-400">*</span>
                    <span className="text-stone-400 font-normal ml-1">(복수 선택)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SNS_GOALS.map((g) => (
                      <button key={g.value} type="button"
                        onClick={() => setSnsGoals(toggleArr(snsGoals, g.value))}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                          snsGoals.includes(g.value)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300'
                        }`}
                      >
                        <span>{g.emoji}</span><span>{g.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">인스타그램 계정 (선택)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-medium text-lg">@</span>
                    <input
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                      placeholder="instagram_id"
                      className={inputCls}
                      maxLength={30}
                    />
                  </div>
                </div>

                {/* 요약 카드 */}
                <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                  <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                    <span>📋</span> 입력 정보 최종 확인
                  </h3>
                  <div className="space-y-1 text-sm text-stone-600">
                    <p><span className="font-medium text-stone-700">사장님:</span> {ownerNickname}</p>
                    <p><span className="font-medium text-stone-700">가게명:</span> {storeName} ({category})</p>
                    <p><span className="font-medium text-stone-700">상권:</span> {locationType}</p>
                    <p><span className="font-medium text-stone-700">대표메뉴:</span> {mainMenu}</p>
                    <p><span className="font-medium text-stone-700">타겟:</span> {targetCustomers.join(', ')}</p>
                    <p><span className="font-medium text-stone-700">SNS 목표:</span> {snsGoals.join(', ')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setCurrentStep(3); setError('') }} className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-xl font-bold hover:bg-stone-200 transition-all">← 이전</button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-[2] bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <><div className="w-5 h-5 spinner" /><span>저장 중...</span></> : '🚀 장사한컷 시작하기!'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
