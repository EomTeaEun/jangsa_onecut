# 장사한컷 프로젝트 컨텍스트

## 서비스 개요
한국 소상공인(음식점·카페 등)을 위한 AI 마케팅 자동화 웹서비스.
가게 정보 + 상황 입력 → 마케팅 전략 / SNS 글 / 포스터 이미지 / 릴스 영상 자동 생성.

## 배포 정보
- **Production URL:** https://jangsa-onecut.vercel.app
- **GitHub:** https://github.com/EomTeaEun/jangsa_onecut
- **Vercel 프로젝트:** eomteaeuns-projects/jangsa-onecut
- GitHub main 브랜치에 push하면 Vercel 자동 재배포

## 기술 스택
- **Framework:** Next.js 14 App Router (TypeScript)
- **DB·인증:** Supabase (PostgreSQL + RLS)
- **AI 텍스트:** Google Gemini 2.5 Flash (`gemini-2.5-flash`)
- **AI 이미지:** Runway Gen4 Image (`gen4_image`, 720:1280)
- **AI 영상:** Runway Gen4.5 (`gen4.5`, 720:1280, 5초)
- **배포:** Vercel

## 환경변수 (.env.local — gitignore됨)
```
NEXT_PUBLIC_SUPABASE_URL=https://cczesuyfvbidfkkppbcu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...       # 서버 전용, 브라우저 미노출
RUNWAY_API_KEY=...       # 서버 전용, 브라우저 미노출
```
Vercel 환경변수에도 동일하게 설정 완료.

## 프로젝트 구조
```
app/
  (auth)/login, signup       # 로그인·회원가입 (Supabase 이메일 인증 사용)
  (auth)/signup/verify       # 가입 후 인증 메일 대기 안내 페이지 (?email=...)
  auth/callback              # Supabase 이메일 링크 콜백 (exchangeCodeForSession)
  (app)/
    dashboard/               # 홈 (오늘의 팁, 최근 콘텐츠, 매출 요약)
    create/                  # 콘텐츠 생성 (시나리오 → 타입 → 결과)
    history/                 # 과거 생성 콘텐츠 목록·재열람
    analytics/               # 매출 데이터 입력·분석
    reviews/                 # 리뷰 붙여넣기 → 분석
    settings/                # 가게 정보 수정
  onboarding/                # 최초 가입 후 가게 정보 입력 (4단계)
  api/
    auth/signup              # supabase.auth.signUp() + emailRedirectTo, rate limit 적용
    auth/login               # 서버사이드 로그인 (쿠키 설정) + rate limit 적용
    auth/check-rate-limit    # 클라이언트 사전 체크 (서버 라우트가 본 방어)
    content/generate         # Gemini: 전략·SNS글 생성 + DB 저장
    runway/start             # Gemini 프롬프트 생성 → Runway 태스크 시작 → DB 저장
    runway/status/[taskId]   # Runway 태스크 폴링 + 완료 시 image_url DB 업데이트
    analytics/analyze        # Gemini: 매출 데이터 분석
    reviews/analyze          # Gemini: 리뷰 분석
    sales/                   # 매출 데이터 CRUD
lib/
  gemini.ts                  # Gemini API 함수 모음
  runway.ts                  # Runway API 함수 모음 (이미지·영상)
  supabase/client.ts         # 브라우저용 Supabase 클라이언트
  supabase/server.ts         # 서버용 Supabase 클라이언트 (쿠키 기반)
  supabase/middleware.ts     # 세션 갱신 미들웨어
  utils.ts                   # sanitizeInput, 날짜·금액 포맷 등
  security/rate-limiter.ts   # Supabase 기반 레이트 리밋
  security/get-client-ip.ts  # x-vercel-forwarded-for 우선 (위조 방지)
middleware.ts                # /api/* + /auth/* bypass, 인증 체크, 온보딩 리다이렉트
```

## Supabase DB 테이블
```sql
stores        -- 가게 정보 (user_id, name, category, location_type, main_menu 등)
contents      -- 생성된 콘텐츠 (type: strategy|sns_post|poster|reels, strategy_text, sns_copy, image_url)
sales_data    -- 매출 데이터 (sale_date, total_sales, customer_count, top_menu)
user_settings -- 유저 설정
rate_limits   -- 레이트 리밋 추적
```
RLS 전 테이블에 적용. `image_url` 컬럼에 포스터 이미지·릴스 영상 URL 모두 저장 (type으로 구분).

### 실행 필요한 마이그레이션
`supabase/migration_add_store_fields.sql` — stores 테이블에 아래 컬럼 추가 (아직 안 했으면 Supabase SQL Editor에서 실행):
```sql
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_nickname TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_type TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS main_menu TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_revenue_range TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sns_goal TEXT[];
```

## 콘텐츠 생성 플로우
### 텍스트 (전략·SNS글)
```
create 페이지 → POST /api/content/generate → Gemini → DB 저장 → 결과 표시
```

### 이미지·영상 (포스터·릴스) — 비동기 폴링
```
create 페이지
  → POST /api/runway/start
      1. Gemini로 전략 생성
      2. Gemini로 Runway용 프롬프트 생성 (영어, 950자 이내)
      3. Runway 태스크 시작 (gen4_image 또는 gen4.5)
      4. contents DB에 즉시 저장 (image_url 없이)
      5. taskId + contentId 반환
  → 클라이언트가 4초마다 GET /api/runway/status/[taskId]?contentId=... 폴링
      - SUCCEEDED → image_url DB 업데이트 → 결과 표시
      - 최대 3분 대기
```

## 주요 구현 결정사항
- **이메일 인증 활성화:** `supabase.auth.signUp({ options: { emailRedirectTo: '/auth/callback' } })`. Supabase 대시보드 "Confirm email" ON 상태 필수.
  - **회원가입 흐름:** signup 폼 제출 → `/signup/verify?email=...`로 리다이렉트 (대기 안내) → 메일 인증 링크 클릭 → `/auth/callback`에서 `exchangeCodeForSession` → `/onboarding`
  - signup API는 Supabase가 enumeration 방지로 `data.user`를 null 반환해도 항상 `needsEmailConfirmation: true`로 응답 (메일은 발송됐을 수 있으므로)
- **Rate Limit (Brute Force 방어):**
  - 로그인 라우트 자체에 `checkRateLimit` 직접 적용 (15분 5회). 성공 시 `resetAttempts`, 실패 시 `incrementAttempt`. 클라이언트 우회 차단.
  - 회원가입 라우트도 IP 기반 rate limit (60분 5회) — 스팸 가입 방어
  - IP 추출은 `getClientIp()` 헬퍼로 `x-vercel-forwarded-for`(Vercel 서명 헤더) 우선 → spoofing 차단
- **이메일 enumeration 방지:** signup 라우트에서 "already exists" 류 에러는 정상 응답처럼 반환
- **API 키 서버 내장:** 사용자가 키 입력 불필요, `process.env.GEMINI_API_KEY` / `process.env.RUNWAY_API_KEY` 직접 사용
- **미들웨어:** `/api/*`와 `/auth/*` 경로는 인증 체크 bypass (서버 라우트가 자체 인증, 콜백은 public 필요)
- **Runway 프롬프트:** 한국어 텍스트만 허용, 중국어 금지 명시 (`Korean language text only in image, no Chinese characters.` 프롬프트 앞에 강제 삽입)
- **모델:** gemini-1.5-flash deprecated → gemini-2.5-flash로 전환 완료
- **이미지 생성:** gemini-2.0-flash-preview-image-generation 접근 불가 → Runway gen4_image로 전환

## 알려진 제한사항
- Runway 영상(릴스) URL은 `image_url` 컬럼에 저장 (video_url 컬럼 별도 없음), `type='reels'`로 구분 렌더링
- Runway 생성 소요 시간 30~90초, Vercel 서버리스 타임아웃 주의 (폴링은 클라이언트에서 처리하므로 문제없음)
- Supabase Storage `poster-images` 버킷 미생성 시 포스터 이미지 업로드 실패 (현재는 Runway URL 직접 사용)
