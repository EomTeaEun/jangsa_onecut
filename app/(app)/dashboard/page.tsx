import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatKRW, getKoreanDayOfWeek, getTimeOfDay, getSeason, getContentTypeLabel, getContentTypeEmoji, formatDateTime } from '@/lib/utils'
import DailyTipCard from '@/components/DailyTipCard'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!store) redirect('/onboarding')

  // Get recent contents
  const { data: recentContents } = await supabase
    .from('contents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get this month's stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count: monthlyContentCount } = await supabase
    .from('contents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  const { data: monthlySales } = await supabase
    .from('sales_data')
    .select('total_sales')
    .eq('user_id', user.id)
    .gte('sale_date', monthStart.split('T')[0])

  const totalMonthlySales = monthlySales?.reduce((sum, s) => sum + s.total_sales, 0) || 0

  const today = new Date()
  const dayOfWeek = getKoreanDayOfWeek(today)
  const timeOfDay = getTimeOfDay()
  const season = getSeason()

  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('gemini_api_key')
    .eq('user_id', user.id)
    .single()

  const hasApiKey = !!(userSettings?.gemini_api_key)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-1">
          안녕하세요, <span className="text-orange-500">{store.name}</span> 사장님! 👋
        </h1>
        <p className="text-stone-500">
          오늘은 {dayOfWeek} {timeOfDay}이에요 · {season} 맞춤 마케팅을 시작해볼까요?
        </p>
      </div>

      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-2xl flex-shrink-0">🔑</span>
          <div>
            <h3 className="font-bold text-amber-800 mb-1">Gemini API 키를 등록해주세요</h3>
            <p className="text-amber-700 text-sm mb-3">
              AI 마케팅 기능을 사용하려면 Google Gemini API 키가 필요해요.
            </p>
            <Link
              href="/settings"
              className="inline-block bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              API 키 등록하기 →
            </Link>
          </div>
        </div>
      )}

      {/* Daily AI Tip */}
      <DailyTipCard store={store} hasApiKey={hasApiKey} />

      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <Link
          href="/create"
          className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-xl font-bold mb-1.5">새 콘텐츠 만들기</h2>
          <p className="text-orange-100 text-sm">AI로 SNS 글, 포스터 프롬프트를 바로 생성해요</p>
          <div className="mt-4 text-orange-200 text-sm font-medium group-hover:text-white transition-colors">
            시작하기 →
          </div>
        </Link>

        <Link
          href="/analytics"
          className="group bg-white rounded-2xl p-6 border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-xl font-bold text-stone-900 mb-1.5">매출 분석하기</h2>
          <p className="text-stone-500 text-sm">매출 데이터를 입력하고 AI 인사이트를 받아요</p>
          <div className="mt-4 text-orange-500 text-sm font-medium">
            분석 시작 →
          </div>
        </Link>

        <Link
          href="/reviews"
          className="group bg-white rounded-2xl p-6 border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-xl font-bold text-stone-900 mb-1.5">리뷰 분석하기</h2>
          <p className="text-stone-500 text-sm">고객 리뷰로 마케팅 포인트를 찾아드려요</p>
          <div className="mt-4 text-orange-500 text-sm font-medium">
            리뷰 붙여넣기 →
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">📝</div>
            <div>
              <p className="text-xs text-stone-400 font-medium">이번 달 생성 콘텐츠</p>
              <p className="text-2xl font-black text-stone-900">{monthlyContentCount || 0}<span className="text-sm font-normal text-stone-400 ml-1">개</span></p>
            </div>
          </div>
          <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full"
              style={{ width: `${Math.min(((monthlyContentCount || 0) / 30) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1">목표: 30개/월</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-xs text-stone-400 font-medium">이번 달 총 매출</p>
              <p className="text-2xl font-black text-stone-900">
                {totalMonthlySales > 0 ? formatKRW(totalMonthlySales) : '-'}
              </p>
            </div>
          </div>
          {totalMonthlySales === 0 && (
            <Link href="/analytics" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
              매출 데이터 입력하기 →
            </Link>
          )}
        </div>
      </div>

      {/* Recent Contents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900">최근 생성한 콘텐츠</h2>
          <Link href="/create" className="text-sm text-orange-500 font-medium hover:text-orange-600">
            새로 만들기 →
          </Link>
        </div>

        {recentContents && recentContents.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {recentContents.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-2xl p-5 border border-orange-100 hover:border-orange-300 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{getContentTypeEmoji(content.type)}</span>
                  <span className="text-xs bg-orange-50 text-orange-500 px-2 py-1 rounded-lg font-medium">
                    {getContentTypeLabel(content.type)}
                  </span>
                </div>
                <h3 className="font-semibold text-stone-800 text-sm mb-1 line-clamp-2">{content.title}</h3>
                <p className="text-xs text-stone-400 mb-3">{content.scenario}</p>
                {content.sns_copy && (
                  <p className="text-xs text-stone-500 line-clamp-3 bg-stone-50 rounded-lg p-2">
                    {content.sns_copy}
                  </p>
                )}
                <p className="text-xs text-stone-300 mt-3">{formatDateTime(content.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-orange-100 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-lg font-bold text-stone-700 mb-2">아직 생성한 콘텐츠가 없어요</h3>
            <p className="text-stone-400 text-sm mb-6">첫 번째 마케팅 콘텐츠를 만들어볼까요?</p>
            <Link
              href="/create"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
            >
              콘텐츠 만들기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
