import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTaskStatus } from '@/lib/runway'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const runwayKey = process.env.RUNWAY_API_KEY
    if (!runwayKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 })
    }

    const result = await getTaskStatus(params.taskId, runwayKey)

    // 완료 시 DB에 미디어 URL 업데이트
    if (result.status === 'SUCCEEDED' && result.output?.[0]) {
      const contentId = request.nextUrl.searchParams.get('contentId')
      if (contentId) {
        await supabase
          .from('contents')
          .update({ image_url: result.output[0] })
          .eq('id', contentId)
          .eq('user_id', user.id)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Runway status error:', error)
    return NextResponse.json({ error: '상태 조회 실패' }, { status: 500 })
  }
}
