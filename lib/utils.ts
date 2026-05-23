import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getKoreanDayOfWeek(date: Date = new Date()): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  return days[date.getDay()]
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return '아침'
  if (hour >= 11 && hour < 14) return '점심'
  if (hour >= 14 && hour < 17) return '오후'
  if (hour >= 17 && hour < 21) return '저녁'
  return '밤'
}

export function getSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return '봄'
  if (month >= 6 && month <= 8) return '여름'
  if (month >= 9 && month <= 11) return '가을'
  return '겨울'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

export function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    poster: '포스터',
    sns_post: 'SNS 글',
    reels: '릴스',
    strategy: '마케팅 전략',
  }
  return labels[type] || type
}

export function getContentTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    poster: '🖼️',
    sns_post: '📱',
    reels: '🎬',
    strategy: '💡',
  }
  return emojis[type] || '📄'
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}
