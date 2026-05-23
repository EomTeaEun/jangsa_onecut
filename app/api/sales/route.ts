import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const salesSchema = z.object({
  sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  total_sales: z.number().int().min(0, '매출액은 0 이상이어야 합니다'),
  customer_count: z.number().int().min(0).nullable().optional(),
  top_menu: z.string().max(50).nullable().optional(),
  notes: z.string().max(200).nullable().optional(),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { data: sales, error } = await supabase
      .from('sales_data')
      .select('*')
      .eq('user_id', user.id)
      .order('sale_date', { ascending: false })
      .limit(90)

    if (error) {
      return NextResponse.json({ error: '데이터 조회 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ sales })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()

    const validation = salesSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { sale_date, total_sales, customer_count, top_menu, notes } = validation.data

    // Get store
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!store) {
      return NextResponse.json({ error: '가게 정보를 찾을 수 없습니다' }, { status: 404 })
    }

    // Check if date already exists
    const { data: existing } = await supabase
      .from('sales_data')
      .select('id')
      .eq('store_id', store.id)
      .eq('sale_date', sale_date)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('sales_data')
        .update({
          total_sales,
          customer_count: customer_count ?? null,
          top_menu: top_menu ?? null,
          notes: notes ?? null,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: '업데이트 중 오류가 발생했습니다' }, { status: 500 })
      }

      return NextResponse.json({ sales: data, updated: true })
    }

    const { data, error } = await supabase
      .from('sales_data')
      .insert({
        store_id: store.id,
        user_id: user.id,
        sale_date,
        total_sales,
        customer_count: customer_count ?? null,
        top_menu: top_menu ?? null,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '저장 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({ sales: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
