'use client'

import { useState } from 'react'
import Link from 'next/link'

const SCENARIOS = [
  {
    id: 'rain', label: '비 오는 날 홍보', emoji: '🌧️',
    strategy: '전략 1: 따뜻한 국물 메뉴 할인 이벤트\n비 오는 날 고객 심리를 활용해 따뜻한 국물 메뉴를 10~15% 할인합니다. "비 오는 날엔 우리 가게" 해시태그로 방문 인증 이벤트도 함께 진행해보세요.\n\n전략 2: 우산 보관 서비스 + 할인 쿠폰\n우산을 맡기면 디저트 무료 제공! 작은 배려가 단골을 만듭니다.\n\n전략 3: 배달 이벤트 강화\n비 오는 날 배달 수요 급증 타이밍에 배달앱 쿠폰 발행으로 주문을 잡으세요.',
    sns: '☔ 비 오는 날엔 따뜻한 국물 한 그릇이 최고죠!\n\n오늘 하루 비 오는 날 특별 할인 🍲\n따뜻한 육개장·해장국 15% OFF\n\n비 맞고 들어오신 손님께는 따뜻한 보리차도 서비스로 드려요 ☕\n\n📍 예약 없이 바로 방문 가능\n\n#비오는날맛집 #국물맛집 #따뜻한한끼 #소상공인 #맛집 #혼밥 #직장인점심 #오늘뭐먹지 #가성비맛집 #할인이벤트',
    posterBg: 'from-blue-500 via-blue-600 to-indigo-700',
    posterEmoji: '🍲',
    posterTitle: '비 오는 날\n특별 할인',
    posterSub: '따뜻한 국물 메뉴 15% OFF',
    posterTag: '오늘 하루만!',
  },
  {
    id: 'exam', label: '학생/시험기간 이벤트', emoji: '📚',
    strategy: '전략 1: 수험생 응원 할인 패키지\n시험 기간엔 학생증 제시 시 세트 메뉴 20% 할인! "수험생 응원 세트"라는 특별 메뉴를 만들어 SNS에서 바이럴을 노려보세요.\n\n전략 2: 오래 앉아도 OK 공간 강조\n조용하고 오래 있어도 눈치 안 준다는 점을 강조해 카공족을 적극 유치하세요.\n\n전략 3: 단체 스터디 그룹 유치\n스터디 그룹 방문 시 음료 1+1, 4명 이상 테이블 예약 우선 배정으로 단체 방문 유도.',
    sns: '📚 시험 기간, 수험생 여러분을 응원합니다!\n\n학생증 제시하면 세트 메뉴 20% 할인 🎓\n조용한 공간에서 밥도 먹고 충전도 하세요.\n\n열심히 하는 당신, 오늘 한 끼는 우리가 응원할게요 💪\n\n⏰ 시험 기간 내내 진행\n📍 자리 넉넉해요, 예약 가능!\n\n#수험생맛집 #시험기간이벤트 #학생할인 #대학생맛집 #스터디카페 #공부맛집 #수험생응원 #학식대신 #혼밥 #가성비',
    posterBg: 'from-amber-400 via-orange-500 to-red-500',
    posterEmoji: '🎓',
    posterTitle: '수험생\n응원 이벤트',
    posterSub: '학생증 제시 시 20% 할인',
    posterTag: '시험 기간 한정',
  },
  {
    id: 'weekend', label: '주말 특별 메뉴', emoji: '🎉',
    strategy: '전략 1: 주말 한정 스페셜 메뉴 런칭\n평일엔 없는 주말 한정 메뉴를 만들어 "주말에만 먹을 수 있어" 심리를 자극하세요. 한정 수량으로 긴장감 UP!\n\n전략 2: 가족·커플 세트 메뉴 강조\n주말엔 혼자보다 함께 오는 손님이 많아요. 2인·4인 세트 메뉴로 객단가를 높이세요.\n\n전략 3: 주말 예약 시스템 운영\n예약 손님에게 웰컴 디저트 제공. 예약률을 높여 주말 매출을 안정적으로 확보하세요.',
    sns: '🎉 이번 주말만 만날 수 있는 특별 메뉴!\n\n주말 한정 스페셜 세트 🍽️\n평일엔 절대 없는 그 맛, 이번 주말 놓치지 마세요\n\n2인 세트 → 음료 무료 업그레이드 🥤\n예약 시 웰컴 디저트 증정 🍮\n\n📞 예약 문의 환영\n🕐 토·일 11:00~21:00\n\n#주말맛집 #주말특선 #한정메뉴 #데이트맛집 #가족외식 #주말나들이 #맛집추천 #오늘점심 #주말뭐먹지 #소상공인응원',
    posterBg: 'from-orange-400 via-red-500 to-pink-600',
    posterEmoji: '🍽️',
    posterTitle: '주말 한정\n스페셜 메뉴',
    posterSub: '2인 세트 음료 무료 업그레이드',
    posterTag: '토·일 한정',
  },
]

const PAIN_POINTS = [
  {
    emoji: '😔',
    title: 'SNS가 너무 어려워요',
    desc: '인스타그램에 뭘 올려야 할지, 어떻게 써야 할지 매번 막막하죠. 사장님 일도 바쁜데...',
  },
  {
    emoji: '⏰',
    title: '릴스 만들 시간이 없어요',
    desc: '영상 편집은 엄두도 못 내겠고, 그냥 사진 한 장 올리기도 부담스러운 게 현실이에요.',
  },
  {
    emoji: '🎨',
    title: '디자인은 진짜 모르겠어요',
    desc: '포스터 하나 만들려면 몇 시간씩 걸리고, 결과물도 마음에 안 들어 답답하셨죠?',
  },
]

const STEPS = [
  { step: '01', title: '시나리오 선택', desc: '오늘의 상황을 선택해요\n"비 오는 날 홍보"', emoji: '🎯' },
  { step: '02', title: 'AI 전략 추천', desc: 'Gemini AI가 3가지\n맞춤 전략을 제안해요', emoji: '🤖' },
  { step: '03', title: '콘텐츠 생성', desc: 'SNS 글, 포스터 프롬프트를\n1초 만에 완성', emoji: '✨' },
  { step: '04', title: '바로 업로드', desc: '복사해서 인스타에\n바로 올리면 끝!', emoji: '🚀' },
]

export default function LandingPage() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0])
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeTab, setActiveTab] = useState<'strategy' | 'sns' | 'poster'>('strategy')

  function handleScenarioClick(scenario: typeof SCENARIOS[0]) {
    setIsAnimating(true)
    setTimeout(() => {
      setActiveScenario(scenario)
      setActiveTab('strategy')
      setIsAnimating(false)
    }, 150)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-orange-500">장사한컷</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-stone-600 hover:text-orange-500 font-medium transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span>✨</span>
            <span>AI 기반 소상공인 마케팅 솔루션</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-stone-900 mb-6 leading-tight">
            사장님, 오늘도<br />
            <span className="gradient-text">&apos;뭐 올리지?&apos;</span><br />
            고민하셨나요?
          </h1>
          <p className="text-xl text-stone-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            비 오는 날, 시험기간, 주말 이벤트... 상황에 맞는 마케팅 글과 포스터를 AI가 단 10초 만에 만들어 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-orange-500 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              🚀 지금 바로 시작하기 (무료)
            </Link>
            <a
              href="#demo"
              className="bg-white text-orange-500 border-2 border-orange-200 px-8 py-4 rounded-2xl text-lg font-bold hover:border-orange-400 transition-all"
            >
              데모 보기 →
            </a>
          </div>
          <p className="mt-6 text-sm text-stone-400">신용카드 불필요 · 5분 만에 시작</p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              사장님이 SNS를 안 하는 이유
            </h2>
            <p className="text-lg text-stone-500">혼자 다 하기엔 너무 힘드셨죠</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((point, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-stone-100 hover:border-orange-200 transition-all hover:shadow-md"
              >
                <div className="text-4xl mb-4">{point.emoji}</div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{point.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Demo Section */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              상황을 선택하면 AI가 알아서 해결해요
            </h2>
            <p className="text-lg text-stone-500">버튼 하나로 마케팅 전략 · SNS 글 · 포스터까지 완성</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-orange-100 shadow-lg">
            {/* 시나리오 선택 버튼 */}
            <p className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">오늘의 상황 선택</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioClick(scenario)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                    activeScenario.id === scenario.id
                      ? 'bg-orange-500 text-white shadow-md scale-105'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                  }`}
                >
                  <span>{scenario.emoji}</span>
                  <span>{scenario.label}</span>
                </button>
              ))}
            </div>

            {/* 결과 탭 */}
            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              {/* 탭 선택 */}
              <div className="flex gap-2 mb-5">
                {[
                  { key: 'strategy', label: '💡 마케팅 전략', color: 'orange' },
                  { key: 'sns', label: '📱 SNS 글', color: 'blue' },
                  { key: 'poster', label: '🖼️ 포스터 미리보기', color: 'purple' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as 'strategy' | 'sns' | 'poster')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === tab.key
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >{tab.label}</button>
                ))}
              </div>

              {/* 전략 탭 */}
              {activeTab === 'strategy' && (
                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">AI 마케팅 전략 3가지</span>
                  </div>
                  <p className="text-stone-700 text-sm leading-loose whitespace-pre-line">{activeScenario.strategy}</p>
                </div>
              )}

              {/* SNS 탭 */}
              {activeTab === 'sns' && (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">인스타그램 홍보 글</span>
                    </div>
                    <span className="text-xs text-stone-400 bg-white px-2 py-1 rounded-lg border border-stone-200">복사해서 바로 사용 가능</span>
                  </div>
                  <p className="text-stone-700 text-sm leading-loose whitespace-pre-line">{activeScenario.sns}</p>
                </div>
              )}

              {/* 포스터 탭 */}
              {activeTab === 'poster' && (
                <div className="flex gap-6 items-start">
                  {/* 포스터 카드 */}
                  <div className={`w-44 flex-shrink-0 rounded-2xl bg-gradient-to-b ${activeScenario.posterBg} p-5 text-white shadow-xl`} style={{ aspectRatio: '9/16', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div className="text-4xl mb-3">{activeScenario.posterEmoji}</div>
                      <div className="text-lg font-black leading-tight whitespace-pre-line">{activeScenario.posterTitle}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold opacity-90 mb-2">{activeScenario.posterSub}</div>
                      <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold">{activeScenario.posterTag}</div>
                    </div>
                  </div>
                  {/* 설명 */}
                  <div className="flex-1">
                    <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">AI 포스터 생성</span>
                      </div>
                      <p className="text-stone-700 text-sm leading-relaxed mb-4">
                        실제 서비스에서는 <strong>Gemini AI가 이 포스터를 실제 이미지로 생성</strong>해드려요.
                        상황·가게 정보·전략을 분석해 딱 맞는 포스터를 만들어드립니다.
                      </p>
                      <div className="space-y-2 text-xs text-stone-500">
                        <div className="flex items-center gap-2"><span className="text-green-500">✓</span> 9:16 세로형 (인스타 스토리 최적화)</div>
                        <div className="flex items-center gap-2"><span className="text-green-500">✓</span> 가게명·메뉴·이벤트 자동 반영</div>
                        <div className="flex items-center gap-2"><span className="text-green-500">✓</span> 다운로드 후 바로 업로드 가능</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-stone-100 text-center">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-md">
                🚀 무료로 시작하기
              </Link>
              <p className="text-xs text-stone-400 mt-3">내 가게 정보로 직접 만들어보세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              &apos;상황을 이해하는 AI&apos;
            </h2>
            <p className="text-lg text-orange-100">단순 디자인 툴과는 다릅니다</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-bold text-xl mb-4">😕 기존 디자인 툴</h3>
              <ul className="space-y-3 text-orange-100">
                <li className="flex items-start gap-2"><span>✗</span> 템플릿만 제공, 뭘 써야 할지 모름</li>
                <li className="flex items-start gap-2"><span>✗</span> 디자인 실력 필요</li>
                <li className="flex items-start gap-2"><span>✗</span> 상황별 맞춤 전략 없음</li>
                <li className="flex items-start gap-2"><span>✗</span> 우리 가게만의 개성 반영 불가</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-orange-500 font-bold text-xl mb-4">🚀 장사한컷</h3>
              <ul className="space-y-3 text-stone-700">
                <li className="flex items-start gap-2"><span className="text-orange-500">✓</span> 상황에 맞는 마케팅 전략 자동 생성</li>
                <li className="flex items-start gap-2"><span className="text-orange-500">✓</span> 디자인 지식 불필요, 버튼 하나로</li>
                <li className="flex items-start gap-2"><span className="text-orange-500">✓</span> 내 가게 정보 기반 개인화</li>
                <li className="flex items-start gap-2"><span className="text-orange-500">✓</span> 매출 분석 + 리뷰 분석까지</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Real Story Section */}
      <section className="py-20 px-6 bg-[#FFFBF5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              비 오는 날, 이렇게 활용해보세요
            </h2>
            <p className="text-lg text-stone-500">실제 사용 시나리오</p>
          </div>

          <div className="space-y-4">
            {STEPS.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-6 bg-white rounded-2xl p-6 border border-orange-100 hover:border-orange-300 transition-all hover:shadow-md"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">{item.emoji}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                      STEP {item.step}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900">{item.title}</h3>
                  </div>
                  <p className="text-stone-500 text-sm whitespace-pre-line">{item.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-shrink-0 text-orange-300 text-xl self-center">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">믿을 수 있는 기술로 만들었어요</h2>
          <p className="text-stone-500 mb-10">구글, 네이버도 쓰는 검증된 기술 스택</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Next.js 14', desc: '빠른 웹 앱', color: 'bg-black text-white' },
              { name: 'Supabase', desc: '안전한 데이터 저장', color: 'bg-green-600 text-white' },
              { name: 'Gemini AI', desc: '구글 AI 엔진', color: 'bg-blue-600 text-white' },
              { name: 'Vercel', desc: '글로벌 배포', color: 'bg-stone-800 text-white' },
            ].map((tech) => (
              <div
                key={tech.name}
                className={`${tech.color} px-6 py-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-1`}
              >
                <span>{tech.name}</span>
                <span className="text-xs font-normal opacity-75">{tech.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            오늘부터 AI가 도와드릴게요
          </h2>
          <p className="text-xl text-orange-100 mb-10">
            매달 뭘 올릴지 고민하는 시간, 이제 장사에 집중하세요
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-orange-500 px-10 py-5 rounded-2xl text-xl font-black hover:shadow-2xl hover:-translate-y-1 transition-all"
          >
            🍳 무료로 시작하기
          </Link>
          <p className="mt-6 text-orange-200 text-sm">신용카드 없이 바로 시작 · 언제든 해지 가능</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-stone-900 text-stone-400 text-center text-sm">
        <p>© 2024 장사한컷. 소상공인의 성공을 응원합니다 🙏</p>
      </footer>
    </div>
  )
}
