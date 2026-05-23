import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, incrementAttempt } from '@/lib/security/rate-limiter'
import { getClientIp } from '@/lib/security/get-client-ip'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = schema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ allowed: false, error: '이메일이 필요합니다' }, { status: 400 })
    }

    const { email } = validation.data
    const ip = getClientIp(request)
    const identifier = `${ip}:${email.toLowerCase()}`

    // Check current rate limit status
    const rateLimitResult = await checkRateLimit(identifier, 'login', 5, 15)

    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: rateLimitResult.blockedUntil,
      })
    }

    // Increment attempt count
    await incrementAttempt(identifier, 'login', 5, 15)

    // Re-check after increment
    const updatedResult = await checkRateLimit(identifier, 'login', 5, 15)

    return NextResponse.json({
      allowed: true,
      remainingAttempts: updatedResult.remainingAttempts,
    })
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Fail open - allow the request if rate limiting fails
    return NextResponse.json({ allowed: true, remainingAttempts: 5 })
  }
}
