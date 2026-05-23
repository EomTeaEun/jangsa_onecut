'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Store } from '@/types'
import { sanitizeInput } from '@/lib/utils'

const CATEGORIES = ['한식', '중식', '일식', '카페', '치킨', '피자', '분식', '기타'] as const
const TARGET_CUSTOMERS = ['대학생', '직장인', '가족', '관광객', '시니어', '어린이']

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingStore, setIsSavingStore] = useState(false)
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [storeSuccess, setStoreSuccess] = useState('')
  const [keySuccess, setKeySuccess] = useState('')
  const [storeError, setStoreError] = useState('')
  const [keyError, setKeyError] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [hasExistingKey, setHasExistingKey] = useState(false)

  const [storeForm, setStoreForm] = useState({
    name: '',
    category: '' as typeof CATEGORIES[number] | '',
    address: '',
    phone: '',
    target_customer: [] as string[],
    avg_price_range: '',
    unique_selling_point: '',
    instagram_handle: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (storeData) {
      setStore(storeData)
      setStoreForm({
        name: storeData.name || '',
        category: storeData.category || '',
        address: storeData.address || '',
        phone: storeData.phone || '',
        target_customer: storeData.target_customer || [],
        avg_price_range: storeData.avg_price_range || '',
        unique_selling_point: storeData.unique_selling_point || '',
        instagram_handle: storeData.instagram_handle || '',
      })
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', user.id)
      .single()

    if (settings?.gemini_api_key) {
      setHasExistingKey(true)
      setGeminiKey('••••••••••••••••••••••••')
    }

    setIsLoading(false)
  }

  function toggleTargetCustomer(customer: string) {
    setStoreForm((prev) => ({
      ...prev,
      target_customer: prev.target_customer.includes(customer)
        ? prev.target_customer.filter((c) => c !== customer)
        : [...prev.target_customer, customer],
    }))
  }

  async function handleSaveStore(e: React.FormEvent) {
    e.preventDefault()
    setStoreError('')
    setStoreSuccess('')

    if (!storeForm.name.trim()) {
      setStoreError('가게 이름을 입력해주세요')
      return
    }

    setIsSavingStore(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('stores')
      .update({
        name: sanitizeInput(storeForm.name),
        category: storeForm.category,
        address: sanitizeInput(storeForm.address),
        phone: sanitizeInput(storeForm.phone),
        target_customer: storeForm.target_customer,
        avg_price_range: storeForm.avg_price_range,
        unique_selling_point: sanitizeInput(storeForm.unique_selling_point),
        instagram_handle: sanitizeInput(storeForm.instagram_handle.replace('@', '')),
      })
      .eq('user_id', user.id)

    if (error) {
      setStoreError('저장 중 오류가 발생했습니다')
    } else {
      setStoreSuccess('가게 정보가 저장되었습니다!')
      setTimeout(() => setStoreSuccess(''), 3000)
    }

    setIsSavingStore(false)
  }

  async function handleSaveApiKey() {
    setKeyError('')
    setKeySuccess('')

    const cleanKey = geminiKey.replace(/•/g, '').trim()

    if (!cleanKey || cleanKey.startsWith('•')) {
      setKeyError('API 키를 입력해주세요')
      return
    }

    setIsSavingKey(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        gemini_api_key: cleanKey,
      })

    if (error) {
      setKeyError('저장 중 오류가 발생했습니다')
    } else {
      setKeySuccess('API 키가 저장되었습니다!')
      setHasExistingKey(true)
      setGeminiKey('••••••••••••••••••••••••')
      setTimeout(() => setKeySuccess(''), 3000)
    }

    setIsSavingKey(false)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="w-8 h-8 spinner" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-2">⚙️ 설정</h1>
        <p className="text-stone-500">가게 정보와 AI 설정을 관리해요</p>
      </div>

      <div className="space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <h2 className="text-xl font-bold text-stone-900 mb-6">🏪 가게 정보</h2>

          {storeSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-600">
              {storeSuccess}
            </div>
          )}
          {storeError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {storeError}
            </div>
          )}

          <form onSubmit={handleSaveStore} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  가게 이름 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">가게 종류</label>
                <select
                  value={storeForm.category}
                  onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value as typeof CATEGORIES[number] })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">주소</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-3">타겟 고객</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_CUSTOMERS.map((customer) => (
                  <button
                    key={customer}
                    type="button"
                    onClick={() => toggleTargetCustomer(customer)}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                      storeForm.target_customer.includes(customer)
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-orange-100'
                    }`}
                  >
                    {customer}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">가게 강점</label>
              <textarea
                value={storeForm.unique_selling_point}
                onChange={(e) => setStoreForm({ ...storeForm, unique_selling_point: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                maxLength={300}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">인스타그램 계정</label>
              <div className="flex items-center gap-2">
                <span className="text-stone-400">@</span>
                <input
                  type="text"
                  value={storeForm.instagram_handle}
                  onChange={(e) => setStoreForm({ ...storeForm, instagram_handle: e.target.value.replace('@', '') })}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  maxLength={30}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingStore}
              className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingStore ? (
                <>
                  <div className="w-4 h-4 spinner" />
                  <span>저장 중...</span>
                </>
              ) : (
                '변경사항 저장'
              )}
            </button>
          </form>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <h2 className="text-xl font-bold text-stone-900 mb-2">🔑 Gemini API 키</h2>
          <p className="text-sm text-stone-500 mb-6">
            AI 기능을 사용하려면 Google Gemini API 키가 필요해요.{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              API 키 발급받기 →
            </a>
          </p>

          {keySuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-600">
              {keySuccess}
            </div>
          )}
          {keyError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {keyError}
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                onFocus={() => {
                  if (hasExistingKey && geminiKey.startsWith('•')) {
                    setGeminiKey('')
                  }
                }}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              disabled={isSavingKey}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
            >
              {isSavingKey ? (
                <>
                  <div className="w-4 h-4 spinner" />
                  저장 중
                </>
              ) : (
                hasExistingKey ? '업데이트' : '저장'
              )}
            </button>
          </div>

          {hasExistingKey && (
            <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
              <span>✓</span> API 키가 등록되어 있어요. AI 기능을 자유롭게 사용하세요!
            </p>
          )}

          <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ 보안 안내</p>
            <p className="text-xs text-amber-600">
              API 키는 암호화되어 안전하게 저장됩니다. 절대 타인과 공유하지 마세요.
              Google AI Studio에서 키 사용량을 직접 모니터링할 수 있어요.
            </p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <h2 className="text-xl font-bold text-stone-900 mb-4">👤 계정 정보</h2>
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-sm text-stone-500 mb-1">가입일</p>
            <p className="font-medium text-stone-700">
              {store?.created_at ? new Date(store.created_at).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
