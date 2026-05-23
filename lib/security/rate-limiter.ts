import { createClient } from '@supabase/supabase-js'
import { RateLimitResult } from '@/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<RateLimitResult> {
  const supabase = getServiceClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .single()

  if (!existing) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    }
  }

  // Check if currently blocked
  if (existing.blocked_until && new Date(existing.blocked_until) > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: new Date(existing.blocked_until),
    }
  }

  // Check if window has expired - reset if so
  if (new Date(existing.window_start) < windowStart) {
    await supabase
      .from('rate_limits')
      .update({
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      })
      .eq('identifier', identifier)
      .eq('action', action)

    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
    }
  }

  // Within window, check attempts
  if (existing.attempts >= maxAttempts) {
    const blockedUntil = new Date(now.getTime() + windowMinutes * 60 * 1000)

    await supabase
      .from('rate_limits')
      .update({ blocked_until: blockedUntil.toISOString() })
      .eq('identifier', identifier)
      .eq('action', action)

    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil,
    }
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - existing.attempts - 1,
  }
}

export async function incrementAttempt(
  identifier: string,
  action: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<void> {
  const supabase = getServiceClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .single()

  if (!existing) {
    await supabase.from('rate_limits').insert({
      identifier,
      action,
      attempts: 1,
      window_start: now.toISOString(),
    })
    return
  }

  // Reset if window expired
  if (new Date(existing.window_start) < windowStart) {
    await supabase
      .from('rate_limits')
      .update({
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      })
      .eq('identifier', identifier)
      .eq('action', action)
    return
  }

  const newAttempts = existing.attempts + 1
  const updateData: Record<string, unknown> = { attempts: newAttempts }

  if (newAttempts >= maxAttempts) {
    const blockedUntil = new Date(now.getTime() + windowMinutes * 60 * 1000)
    updateData.blocked_until = blockedUntil.toISOString()
  }

  await supabase
    .from('rate_limits')
    .update(updateData)
    .eq('identifier', identifier)
    .eq('action', action)
}

export async function resetAttempts(
  identifier: string,
  action: string
): Promise<void> {
  const supabase = getServiceClient()

  await supabase
    .from('rate_limits')
    .delete()
    .eq('identifier', identifier)
    .eq('action', action)
}
