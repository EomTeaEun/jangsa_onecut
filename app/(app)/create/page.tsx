'use client'

import { useState, useEffect, useRef } from 'react'

const SCENARIOS = [
  { id: '비 오는 날 홍보', label: '비 오는 날 홍보', emoji: '🌧️', desc: '날씨를 마케팅에 활용해요' },
  { id: '학생/시험기간 이벤트', label: '학생/시험기간 이벤트', emoji: '📚', desc: '수험생 타겟 이벤트' },
  { id: '주말 특별 메뉴', label: '주말 특별 메뉴', emoji: '🎉', desc: '주말 손님을 위한 특별 홍보' },
  { id: '배달 지연 공지', label: '배달 지연 공지', emoji: '🛵', desc: '고객에게 정중히 안내해요' },
  { id: '신메뉴 출시', label: '신메뉴 출시', emoji: '🍽️', desc: '새 메뉴를 매력적으로 소개' },
  { id: 'custom', label: '직접 입력하기', emoji: '✏️', desc: '원하는 상황을 직접 써요' },
]

const CONTENT_TYPES = [
  {
    id: 'strategy',
    label: '마케팅 전략',
    emoji: '💡',
    desc: 'AI가 3가지 전략을 제안해요',
    badge: null,
  },
  {
    id: 'sns_post',
    label: 'SNS 글',
    emoji: '📱',
    desc: '인스타그램 바로 올릴 수 있는 글',
    badge: null,
  },
  {
    id: 'poster',
    label: '포스터 이미지',
    emoji: '🖼️',
    desc: 'Runway AI가 홍보 이미지를 생성해요',
    badge: 'NEW',
  },
  {
    id: 'reels',
    label: '릴스 영상',
    emoji: '🎬',
    desc: 'Runway AI가 5초 홍보 영상을 만들어요',
    badge: 'NEW',
  },
]

type RunwayStatus = 'idle' | 'starting' | 'pending' | 'running' | 'succeeded' | 'failed'

interface GeneratedContent {
  strategy_text?: string
  sns_copy?: string
  image_prompt?: string
  image_url?: string
  image_data?: string
  video_url?: string
  contentId?: string
  // Runway specific
  taskId?: string
  promptText?: string
}

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [selectedScenario, setSelectedScenario] = useState('')
  const [customScenario, setCustomScenario] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState<GeneratedContent | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Runway 폴링 상태
  const [runwayStatus, setRunwayStatus] = useState<RunwayStatus>('idle')
  const [runwayProgress, setRunwayProgress] = useState(0)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const activeScenario = selectedScenario === 'custom' ? customScenario : selectedScenario
  const isRunwayType = selectedType === 'poster' || selectedType === 'reels'

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  async function pollRunwayStatus(taskId: string, contentId?: string) {
    let elapsed = 0
    const maxWait = 180 // 3분

    pollIntervalRef.current = setInterval(async () => {
      elapsed += 4
      // 예상 진행률 (비선형)
      const progress = Math.min(95, Math.round((elapsed / 60) * 80 + 10))
      setRunwayProgress(progress)

      if (elapsed >= maxWait) {
        clearInterval(pollIntervalRef.current!)
        setRunwayStatus('failed')
        setError('생성 시간이 초과되었습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }

      try {
        const url = contentId
          ? `/api/runway/status/${taskId}?contentId=${contentId}`
          : `/api/runway/status/${taskId}`
        const res = await fetch(url)
        const data = await res.json()

        if (data.status === 'SUCCEEDED') {
          clearInterval(pollIntervalRef.current!)
          setRunwayStatus('succeeded')
          setRunwayProgress(100)
          setGenerated((prev) => ({
            ...prev,
            ...(selectedType === 'poster'
              ? { image_url: data.output?.[0] }
              : { video_url: data.output?.[0] }),
          }))
          setIsLoading(false)
          setStep(4)
        } else if (data.status === 'FAILED') {
          clearInterval(pollIntervalRef.current!)
          setRunwayStatus('failed')
          setError(`Runway 생성 실패: ${data.error || '알 수 없는 오류'}`)
          setIsLoading(false)
        } else {
          setRunwayStatus(data.status === 'PENDING' ? 'pending' : 'running')
        }
      } catch {
        // 네트워크 오류 무시하고 계속 폴링
      }
    }, 4000)
  }

  async function handleGenerate() {
    if (!activeScenario || !selectedType) return
    setIsLoading(true)
    setError('')
    setGenerated(null)

    try {
      if (isRunwayType) {
        // Runway 플로우: 먼저 전략 생성 + Runway 태스크 시작
        setRunwayStatus('starting')
        setRunwayProgress(5)

        const res = await fetch('/api/runway/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: selectedType, scenario: activeScenario }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Runway 생성 시작 실패')
          setIsLoading(false)
          setRunwayStatus('idle')
          return
        }

        // 전략 텍스트 즉시 표시, 미디어는 폴링으로 기다림
        setGenerated({ strategy_text: data.strategy, promptText: data.promptText, taskId: data.taskId, contentId: data.contentId })
        setRunwayStatus('pending')
        setRunwayProgress(10)
        setStep(4) // 결과 페이지로 이동해서 진행 상황 보여주기
        pollRunwayStatus(data.taskId, data.contentId)
      } else {
        // 일반 Gemini 플로우
        const res = await fetch('/api/content/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: selectedType, scenario: activeScenario }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'AI 생성 중 오류가 발생했습니다')
          setIsLoading(false)
          return
        }

        setGenerated(data)
        setStep(4)
        setIsLoading(false)
      }
    } catch {
      setError('서버 연결 오류가 발생했습니다. 다시 시도해주세요.')
      setIsLoading(false)
      setRunwayStatus('idle')
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // fallback
    }
  }

  function resetFlow() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    setStep(1)
    setSelectedScenario('')
    setCustomScenario('')
    setSelectedType('')
    setGenerated(null)
    setError('')
    setRunwayStatus('idle')
    setRunwayProgress(0)
    setIsLoading(false)
  }

  const runwayStatusLabel: Record<RunwayStatus, string> = {
    idle: '',
    starting: 'AI 프롬프트 생성 중...',
    pending: 'Runway 대기열 진입 중...',
    running: 'Runway AI 생성 중...',
    succeeded: '생성 완료!',
    failed: '생성 실패',
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-2">✨ 콘텐츠 만들기</h1>
        <p className="text-stone-500">AI가 우리 가게에 맞는 마케팅 콘텐츠를 만들어드려요</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {['시나리오 선택', '타입 선택', '결과 확인'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step > i + 1
                  ? 'bg-green-100 text-green-600'
                  : step === i + 1
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              <span>{step > i + 1 ? '✓' : i + 1}</span>
              <span>{label}</span>
            </div>
            {i < 2 && (
              <div className={`w-6 h-0.5 ${step > i + 1 ? 'bg-green-300' : 'bg-stone-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 시나리오 선택 */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-4">
            <h2 className="text-xl font-bold text-stone-900 mb-5">오늘 어떤 상황인가요?</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedScenario === s.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-stone-200 hover:border-orange-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <div className="font-semibold text-stone-900 text-sm mb-0.5">{s.label}</div>
                  <div className="text-xs text-stone-400">{s.desc}</div>
                </button>
              ))}
            </div>

            {selectedScenario === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  상황을 직접 설명해주세요
                </label>
                <textarea
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  placeholder="예: 오늘 첫 손님 100명 이벤트를 진행합니다. 방문하면 음료 50% 할인!"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-stone-400 text-right mt-1">{customScenario.length}/200</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (!selectedScenario) return
              if (selectedScenario === 'custom' && !customScenario.trim()) return
              setStep(2)
            }}
            disabled={!selectedScenario || (selectedScenario === 'custom' && !customScenario.trim())}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-base hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계 →
          </button>
        </div>
      )}

      {/* Step 2: 콘텐츠 타입 선택 */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm">🎯</div>
              <div>
                <p className="text-xs text-stone-400">선택한 시나리오</p>
                <p className="font-semibold text-stone-900 text-sm">{activeScenario}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-orange-100 mb-4">
            <h2 className="text-xl font-bold text-stone-900 mb-2">어떤 콘텐츠가 필요하세요?</h2>
            <p className="text-xs text-stone-400 mb-5">
              🖼️ 포스터 · 🎬 릴스는 Runway AI로 실제 이미지/영상을 생성합니다 (30~90초 소요)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all relative ${
                    selectedType === type.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-stone-200 hover:border-orange-300'
                  }`}
                >
                  {type.badge && (
                    <span className="absolute top-2 right-2 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {type.badge}
                    </span>
                  )}
                  <div className="text-2xl mb-2">{type.emoji}</div>
                  <div className="font-semibold text-stone-900 text-sm mb-0.5">{type.label}</div>
                  <div className="text-xs text-stone-400">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setError('') }}
              className="flex-1 bg-stone-100 text-stone-600 py-4 rounded-xl font-bold text-base hover:bg-stone-200 transition-all"
            >
              ← 이전
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedType || isLoading}
              className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold text-base hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 spinner" />
                  <span>생성 시작 중...</span>
                </>
              ) : (
                '🤖 AI 생성하기'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 결과 */}
      {step === 4 && generated && (
        <div className="animate-fade-in space-y-5">
          {/* Runway 진행 상태 */}
          {isRunwayType && runwayStatus !== 'succeeded' && runwayStatus !== 'failed' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 spinner border-purple-500" />
                <div>
                  <p className="font-bold text-purple-900">
                    {selectedType === 'poster' ? '🖼️ 포스터 이미지 생성 중' : '🎬 릴스 영상 생성 중'}
                  </p>
                  <p className="text-sm text-purple-600">{runwayStatusLabel[runwayStatus]}</p>
                </div>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2.5">
                <div
                  className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000"
                  style={{ width: `${runwayProgress}%` }}
                />
              </div>
              <p className="text-xs text-purple-400 mt-2">
                Runway AI가 처리 중입니다. 30~90초 정도 소요돼요. 이 페이지를 닫지 마세요.
              </p>
            </div>
          )}

          {runwayStatus === 'succeeded' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-green-800">Runway AI 생성 완료!</p>
                <p className="text-sm text-green-600">
                  {selectedType === 'poster' ? '포스터 이미지가' : '릴스 영상이'} 생성되었습니다.
                </p>
              </div>
            </div>
          )}

          {!isRunwayType && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-green-800">AI 생성 완료!</p>
                <p className="text-sm text-green-600">콘텐츠가 저장되었습니다. 복사해서 바로 사용하세요.</p>
              </div>
            </div>
          )}

          {/* 마케팅 전략 */}
          {generated.strategy_text && (
            <div className="bg-white rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <span>💡</span> 마케팅 전략
                </h3>
                <button
                  onClick={() => copyToClipboard(generated.strategy_text!, 'strategy')}
                  className="text-xs bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                >
                  {copied === 'strategy' ? '✓ 복사됨' : '복사하기'}
                </button>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">
                  {generated.strategy_text}
                </p>
              </div>
            </div>
          )}

          {/* SNS 글 */}
          {generated.sns_copy && (
            <div className="bg-white rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <span>📱</span> SNS 홍보 글
                </h3>
                <button
                  onClick={() => copyToClipboard(generated.sns_copy!, 'sns')}
                  className="text-xs bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                >
                  {copied === 'sns' ? '✓ 복사됨' : '복사하기'}
                </button>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">
                  {generated.sns_copy}
                </p>
              </div>
              <p className="text-xs text-stone-400 mt-2">💡 인스타그램에 바로 붙여넣을 수 있어요</p>
            </div>
          )}

          {/* 포스터 이미지 */}
          {generated.image_url && (
            <div className="bg-white rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <span>🖼️</span> AI 생성 포스터
                </h3>
                <a
                  href={generated.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-xs bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                >
                  다운로드
                </a>
              </div>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generated.image_url}
                  alt="AI 생성 포스터"
                  className="rounded-xl max-h-[600px] w-auto shadow-lg border border-orange-100"
                />
              </div>
            </div>
          )}

          {/* 릴스 영상 */}
          {generated.video_url && (
            <div className="bg-white rounded-2xl p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <span>🎬</span> AI 생성 릴스 영상
                </h3>
                <a
                  href={generated.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-xs bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium"
                >
                  다운로드
                </a>
              </div>
              <div className="flex justify-center">
                <video
                  src={generated.video_url}
                  controls
                  autoPlay
                  loop
                  muted
                  className="rounded-xl max-h-[600px] w-auto shadow-lg border border-orange-100"
                  style={{ maxWidth: '340px' }}
                />
              </div>
              <p className="text-xs text-stone-400 mt-3 text-center">
                💡 영상을 다운로드해서 인스타그램 릴스에 올려보세요
              </p>
            </div>
          )}

          {/* 생성 프롬프트 */}
          {generated.promptText && (
            <div className="bg-white rounded-2xl p-6 border border-stone-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-500 text-sm flex items-center gap-2">
                  <span>🔍</span> 사용된 AI 프롬프트
                </h3>
                <button
                  onClick={() => copyToClipboard(generated.promptText!, 'prompt')}
                  className="text-xs bg-stone-100 text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors font-medium"
                >
                  {copied === 'prompt' ? '✓ 복사됨' : '복사하기'}
                </button>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-stone-500 text-xs whitespace-pre-line leading-relaxed font-mono">
                  {generated.promptText}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={resetFlow}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-base hover:bg-orange-600 transition-all"
          >
            ✨ 새 콘텐츠 만들기
          </button>
        </div>
      )}
    </div>
  )
}
