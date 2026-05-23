'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Content {
  id: string
  type: 'strategy' | 'sns_post' | 'poster' | 'reels'
  title: string
  scenario: string
  strategy_text?: string
  sns_copy?: string
  image_url?: string
  created_at: string
}

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  strategy:  { label: '마케팅 전략', emoji: '💡', color: 'bg-amber-100 text-amber-700' },
  sns_post:  { label: 'SNS 글',      emoji: '📱', color: 'bg-blue-100 text-blue-700' },
  poster:    { label: '포스터',       emoji: '🖼️', color: 'bg-purple-100 text-purple-700' },
  reels:     { label: '릴스 영상',    emoji: '🎬', color: 'bg-pink-100 text-pink-700' },
}

export default function HistoryPage() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchContents = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from('contents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') {
      query = query.eq('type', filter)
    }

    const { data } = await query
    setContents(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchContents()
  }, [fetchContents])

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-2">📂 콘텐츠 히스토리</h1>
        <p className="text-stone-500">이전에 생성한 콘텐츠를 다시 확인하고 복사할 수 있어요</p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'strategy', 'sns_post', 'poster', 'reels'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-stone-200 text-stone-500 hover:border-orange-300'
            }`}
          >
            {f === 'all' ? '전체' : `${TYPE_LABELS[f]?.emoji} ${TYPE_LABELS[f]?.label}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-stone-400">
          <div className="w-6 h-6 spinner mr-3" />
          불러오는 중...
        </div>
      ) : contents.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-stone-100 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-stone-500 font-medium">아직 생성한 콘텐츠가 없어요</p>
          <a
            href="/create"
            className="inline-block mt-4 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-all"
          >
            첫 콘텐츠 만들기 →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((item) => {
            const meta = TYPE_LABELS[item.type] || TYPE_LABELS.strategy
            const isOpen = expanded === item.id

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                {/* 헤더 */}
                <button
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-stone-50 transition-colors"
                >
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}>
                    {meta.emoji} {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{item.scenario}</p>
                  </div>
                  <span className="text-xs text-stone-400 flex-shrink-0">{formatDate(item.created_at)}</span>
                  <span className="text-stone-300 flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* 펼침 내용 */}
                {isOpen && (
                  <div className="border-t border-stone-100 p-5 space-y-4">
                    {item.strategy_text && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">💡 마케팅 전략</p>
                          <button
                            onClick={() => copyText(item.strategy_text!, `${item.id}-strategy`)}
                            className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                          >
                            {copied === `${item.id}-strategy` ? '✓ 복사됨' : '복사'}
                          </button>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4">
                          <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">
                            {item.strategy_text}
                          </p>
                        </div>
                      </div>
                    )}

                    {item.sns_copy && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">📱 SNS 글</p>
                          <button
                            onClick={() => copyText(item.sns_copy!, `${item.id}-sns`)}
                            className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                          >
                            {copied === `${item.id}-sns` ? '✓ 복사됨' : '복사'}
                          </button>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">
                            {item.sns_copy}
                          </p>
                        </div>
                      </div>
                    )}

                    {item.image_url && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-wide">
                            {item.type === 'reels' ? '🎬 릴스 영상' : '🖼️ 이미지'}
                          </p>
                          <a
                            href={item.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-xs bg-purple-100 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                          >
                            다운로드
                          </a>
                        </div>
                        {item.type === 'reels' ? (
                          <video
                            src={item.image_url}
                            controls
                            loop
                            muted
                            className="rounded-xl max-h-80 w-auto border border-stone-100"
                            style={{ maxWidth: '240px' }}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt="생성된 이미지"
                            className="rounded-xl max-h-80 w-auto border border-stone-100"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
