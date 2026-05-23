import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSalesData } from '@/lib/gemini'

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 서버에 설정되지 않았습니다.' }, { status: 500 })
    }

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: '가게 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: salesData } = await supabase
      .from('sales_data')
      .select('*')
      .eq('user_id', user.id)
      .gte('sale_date', dateStr)
      .order('sale_date', { ascending: true })

    if (!salesData || salesData.length === 0) {
      return NextResponse.json(
        { error: '분석할 매출 데이터가 없습니다. 매출 데이터를 먼저 입력해주세요.' },
        { status: 400 }
      )
    }

    const analysis = await analyzeSalesData(salesData, store, apiKey)
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Analytics analysis error:', error)
    return NextResponse.json({ error: '분석 중 오류가 발생했습니다' }, { status: 500 })
  }
}
