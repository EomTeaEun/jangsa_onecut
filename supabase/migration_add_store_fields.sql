-- 기존 stores 테이블에 새 컬럼 추가
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_nickname TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_type TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS main_menu TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_revenue_range TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sns_goal TEXT[];
