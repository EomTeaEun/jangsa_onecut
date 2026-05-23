export interface Store {
  id: string
  user_id: string
  name: string
  category: '한식' | '중식' | '일식' | '카페' | '치킨' | '피자' | '분식' | '기타'
  description?: string
  address?: string
  phone?: string
  instagram_handle?: string
  target_customer?: string[]
  avg_price_range?: string
  unique_selling_point?: string
  // 확장 필드
  owner_nickname?: string
  location_type?: string
  main_menu?: string
  business_hours?: string
  monthly_revenue_range?: string
  sns_goal?: string[]
  is_onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  store_id: string
  user_id: string
  type: 'poster' | 'sns_post' | 'reels' | 'strategy'
  title: string
  scenario: string
  strategy_text?: string
  sns_copy?: string
  image_prompt?: string
  image_url?: string
  status: 'draft' | 'published'
  created_at: string
}

export interface SalesData {
  id: string
  store_id: string
  user_id: string
  sale_date: string
  total_sales: number
  customer_count?: number
  top_menu?: string
  notes?: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  gemini_api_key?: string
  created_at: string
  updated_at: string
}

export interface RateLimit {
  id: string
  identifier: string
  action: string
  attempts: number
  window_start: string
  blocked_until?: string
}

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  blockedUntil?: Date
}

export interface MarketingStrategyResult {
  strategy: string
  tips: string[]
}

export interface ContentGenerationResult {
  strategy_text?: string
  sns_copy?: string
  image_prompt?: string
}

export interface ReviewAnalysisResult {
  strengths: string[]
  concerns: string[]
  marketingAngle: string
  generatedCopy: string
}

export interface SalesAnalysisResult {
  summary: string
  insights: string[]
  recommendations: string[]
  bestDay?: string
  worstDay?: string
}

export type StoreCategory = '한식' | '중식' | '일식' | '카페' | '치킨' | '피자' | '분식' | '기타'
export type TargetCustomer = '대학생' | '직장인' | '가족' | '관광객' | '시니어' | '어린이'
export type ContentType = 'poster' | 'sns_post' | 'reels' | 'strategy'

export interface OnboardingData {
  step1: {
    name: string
    category: StoreCategory
    address: string
    phone: string
  }
  step2: {
    target_customer: string[]
    avg_price_range: string
  }
  step3: {
    unique_selling_point: string
    instagram_handle: string
  }
}

export interface ScenarioOption {
  id: string
  label: string
  emoji: string
  description: string
}
