'use client'

import { useState } from 'react'
import { Store } from '@/types'

interface DailyTipCardProps {
  store: Store
  hasApiKey: boolean
}

export default function DailyTipCard({ store, hasApiKey }: DailyTipCardProps) {
  const [tip, setTip] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateTip() {
    if (!hasApiKey) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_tip',
          scenario: '오늘의 마케팅 팁',
          storeId: store.id,
        }),
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setTip(data.strategy_text || data.result)
      }
    } catch {
      setError('팁 생성 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mb-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤖</span>
            <h2 className="font-bold text-stone-900">오늘의 AI 추천</h2>
            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              Gemini AI
            </span>
          </div>

          {!hasApiKey && (
            <p className="text-stone-500 text-sm">
              Gemini API 키를 등록하면 오늘의 맞춤 마케팅 팁을 받을 수 있어요 ✨
            </p>
          )}

          {hasApiKey && !tip && !isLoading && (
            <p className="text-stone-500 text-sm">
              오늘 하루 어떻게 마케팅할지 AI에게 물어보세요!
            </p>
          )}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 spinner" />
              <p className="text-orange-500 text-sm font-medium">AI가 오늘의 팁을 생성하고 있어요...</p>
            </div>
          )}

          {tip && !isLoading && (
            <p className="text-stone-700 leading-relaxed text-sm whitespace-pre-line">{tip}</p>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>

        {hasApiKey && (
          <button
            onClick={generateTip}
            disabled={isLoading}
            className="flex-shrink-0 ml-4 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {tip ? '다시 생성' : '팁 받기'}
          </button>
        )}
      </div>
    </div>
  )
}
