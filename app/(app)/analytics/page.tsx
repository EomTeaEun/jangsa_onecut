'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SalesData } from '@/types'
import { formatKRW, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SalesFormData {
  sale_date: string
  total_sales: string
  customer_count: string
  top_menu: string
  notes: string
}

export default function AnalyticsPage() {
  const [sales, setSales] = useState<SalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<SalesFormData>({
    sale_date: today,
    total_sales: '',
    customer_count: '',
    top_menu: '',
    notes: '',
  })

  useEffect(() => {
    fetchSales()
  }, [])

  async function fetchSales() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/sales')
      const data = await res.json()
      if (data.sales) setSales(data.sales)
    } catch {
      setError('매출 데이터를 불러오는 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    setSuccess('')

    if (!form.sale_date || !form.total_sales) {
      setSubmitError('날짜와 매출액은 필수입니다')
      return
    }

    const totalSales = parseInt(form.total_sales.replace(/,/g, ''))
    if (isNaN(totalSales) || totalSales < 0) {
      setSubmitError('올바른 매출액을 입력해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_date: form.sale_date,
          total_sales: totalSales,
          customer_count: form.customer_count ? parseInt(form.customer_count) : null,
          top_menu: form.top_menu || null,
          notes: form.notes || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || '저장 중 오류가 발생했습니다')
        return
      }

      setSuccess('매출 데이터가 저장되었습니다!')
      setForm({ sale_date: today, total_sales: '', customer_count: '', top_menu: '', notes: '' })
      fetchSales()

      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setSubmitError('서버 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAnalyze() {
    setIsAnalyzing(true)
    setAnalysis(null)

    try {
      const res = await fetch('/api/analytics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const chartData = sales
    .slice(0, 14)
    .reverse()
    .map((s) => ({
      date: s.sale_date.split('-').slice(1).join('/'),
      매출: s.total_sales,
    }))

  const totalSales = sales.reduce((sum, s) => sum + s.total_sales, 0)
  const avgSales = sales.length > 0 ? Math.round(totalSales / sales.length) : 0
  const maxSales = sales.length > 0 ? Math.max(...sales.map((s) => s.total_sales)) : 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-2">📊 매출 분석</h1>
        <p className="text-stone-500">매출 데이터를 입력하고 AI 인사이트를 받아보세요</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: '총 매출', value: formatKRW(totalSales), emoji: '💰' },
          { label: '일 평균 매출', value: formatKRW(avgSales), emoji: '📈' },
          { label: '최고 매출', value: formatKRW(maxSales), emoji: '🏆' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-orange-100">
            <div className="text-2xl mb-2">{stat.emoji}</div>
            <p className="text-xs text-stone-400 font-medium mb-1">{stat.label}</p>
            <p className="text-xl font-black text-stone-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl p-6 border border-orange-100">
          <h2 className="text-lg font-bold text-stone-900 mb-5">📝 매출 입력</h2>

          {submitError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                날짜 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                max={today}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                총 매출액 (원) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.total_sales}
                onChange={(e) => setForm({ ...form, total_sales: e.target.value })}
                placeholder="예: 350000"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                고객 수
              </label>
              <input
                type="number"
                value={form.customer_count}
                onChange={(e) => setForm({ ...form, customer_count: e.target.value })}
                placeholder="예: 45"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                인기 메뉴
              </label>
              <input
                type="text"
                value={form.top_menu}
                onChange={(e) => setForm({ ...form, top_menu: e.target.value })}
                placeholder="예: 된장찌개"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">메모</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="예: 비 오는 날이라 배달이 많았음"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                maxLength={100}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 spinner" />
                  <span>저장 중...</span>
                </>
              ) : (
                '저장하기'
              )}
            </button>
          </form>
        </div>

        {/* Chart & List */}
        <div className="space-y-5">
          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 border border-orange-100">
            <h2 className="text-lg font-bold text-stone-900 mb-4">최근 14일 매출</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fde8c8" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
                  <Tooltip
                    formatter={(value: number) => [formatKRW(value), '매출']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #fde8c8' }}
                  />
                  <Bar dataKey="매출" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-stone-400 text-sm">
                매출 데이터를 입력하면 차트가 표시됩니다
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="bg-white rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-900">🤖 AI 매출 분석</h2>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || sales.length === 0}
                className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 spinner" />
                    <span>분석 중...</span>
                  </>
                ) : (
                  '분석하기'
                )}
              </button>
            </div>

            {sales.length === 0 && (
              <p className="text-stone-400 text-sm">매출 데이터를 먼저 입력해주세요</p>
            )}

            {analysis && (
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-stone-700 text-sm whitespace-pre-line leading-relaxed">
                  {analysis}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales list */}
      {sales.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-6 border border-orange-100">
          <h2 className="text-lg font-bold text-stone-900 mb-4">매출 기록</h2>
          <div className="overflow-hidden rounded-xl border border-stone-100">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">날짜</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500">매출액</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500">고객 수</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">인기 메뉴</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                      불러오는 중...
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 text-stone-700 font-medium">{formatDate(s.sale_date)}</td>
                      <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                        {formatKRW(s.total_sales)}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-600">
                        {s.customer_count ? `${s.customer_count}명` : '-'}
                      </td>
                      <td className="px-4 py-3 text-stone-600">{s.top_menu || '-'}</td>
                      <td className="px-4 py-3 text-stone-400 text-xs">{s.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
