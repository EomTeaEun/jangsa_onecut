import { NextRequest } from 'next/server'

// Vercel 플랫폼이 서명·검증해 전달하는 헤더가 위조 불가능한 신뢰 소스.
// 일반 x-forwarded-for는 클라이언트가 임의 값 주입 가능 → fallback 용도로만.
export function getClientIp(request: NextRequest): string {
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  return request.headers.get('x-real-ip') || 'unknown'
}
