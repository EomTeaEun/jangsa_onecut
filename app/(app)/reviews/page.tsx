'use client'

import { useState } from 'react'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleAnalyze() {
    if (!reviews.trim()) return
    setIsAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const res = await fetch('/api/reviews/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '분석 중 오류가 발생했습니다')
        return
      }

      setAnalysis(data.analysis)
    } catch {
      setError('서버 오류가 발생했습니다')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function copyAnalysis() {
    if (!analysis) return
    try {
      await navigator.clipboard.writeText(analysis)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const EXAMPLE_REVIEWS = `- 양이 정말 많아요! 혼자 가면 배터져요 ㅎㅎ
- 친절하시고 맛도 있어요. 자주 올게요
- 국물이 진해서 좋아요. 속이 따뜻해지는 느낌
- 주차가 좀 불편하지만 맛으로 커버돼요
- 점심 피크타임엔 좀 기다려야 해요
- 재방문 의사 100% 입니다!`

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-2">⭐ 리뷰 분석</h1>
        <p className="text-stone-500">고객 리뷰를 붙여넣으면 마케팅 포인트를 찾아드려요</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <h2 className="text-lg font-bold text-stone-900 mb-2">리뷰 입력</h2>
          <p className="text-sm text-stone-400 mb-4">
            네이버, 카카오, 배달앱 등에서 리뷰를 복사해 붙여넣어 주세요
          </p>

          <textarea
            value={reviews}
            onChange={(e) => setReviews(e.target.value)}
            placeholder="고객 리뷰를 여기에 붙여넣어 주세요..."
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm"
            maxLength={3000}
          />
          <div className="flex items-center justify-between mt-2 mb-4">
            <p className="text-xs text-stone-400">{reviews.length}/3000자</p>
            <button
              onClick={() => setReviews(EXAMPLE_REVIEWS)}
              className="text-xs text-orange-400 hover:text-orange-500 font-medium"
            >
              예시 리뷰 불러오기
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!reviews.trim() || isAnalyzing}
            className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 spinner" />
                <span>AI 분석 중...</span>
              </>
            ) : (
              '🤖 AI 분석하기'
            )}
          </button>
        </div>

        {/* Analysis Result */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">분석 결과</h2>
            {analysis && (
              <button
                onClick={copyAnalysis}
                className="text-xs bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium"
              >
                {copied ? '✓ 복사됨' : '전체 복사'}
              </button>
            )}
          </div>

          {!analysis && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <p className="text-stone-400 text-sm">
                리뷰를 입력하고 분석하기 버튼을 누르면<br />
                AI가 마케팅 포인트를 찾아드려요
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-10 h-10 spinner mb-4" />
              <p className="text-orange-500 font-medium">리뷰를 분석하고 있어요...</p>
              <p className="text-stone-400 text-sm mt-2">잠시만 기다려주세요</p>
            </div>
          )}

          {analysis && (
            <div className="overflow-auto max-h-[500px]">
              <div className="bg-orange-50 rounded-xl p-5">
                <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">
                  {analysis}
                </p>
              </div>

              <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
                  <span>💡</span> 활용 팁
                </p>
                <p className="text-xs text-stone-600">
                  위 분석 결과에서 추천 SNS 홍보 문구를 복사해서 &apos;콘텐츠 만들기&apos;에서 활용해보세요!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
          <span>📌</span> 효과적인 리뷰 분석을 위한 팁
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-amber-700">
          <div className="flex items-start gap-2">
            <span>1️⃣</span>
            <p>최소 5개 이상의 리뷰를 입력하면 더 정확한 분석이 가능해요</p>
          </div>
          <div className="flex items-start gap-2">
            <span>2️⃣</span>
            <p>긍정적인 리뷰와 부정적인 리뷰를 모두 포함하면 좋아요</p>
          </div>
          <div className="flex items-start gap-2">
            <span>3️⃣</span>
            <p>분석된 칭찬 포인트를 SNS 홍보 문구에 적극 활용하세요</p>
          </div>
        </div>
      </div>
    </div>
  )
}
