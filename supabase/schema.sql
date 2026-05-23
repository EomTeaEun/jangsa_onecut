-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('한식', '중식', '일식', '카페', '치킨', '피자', '분식', '기타')),
  description TEXT,
  address TEXT,
  phone TEXT,
  instagram_handle TEXT,
  target_customer TEXT[],
  avg_price_range TEXT,
  unique_selling_point TEXT,
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contents table
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('poster', 'sns_post', 'reels', 'strategy')),
  title TEXT NOT NULL,
  scenario TEXT NOT NULL,
  strategy_text TEXT,
  sns_copy TEXT,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales data table
CREATE TABLE sales_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sale_date DATE NOT NULL,
  total_sales INTEGER NOT NULL CHECK (total_sales >= 0),
  customer_count INTEGER CHECK (customer_count >= 0),
  top_menu TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, sale_date)
);

-- User settings (API keys)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  UNIQUE(identifier, action)
);

-- RLS Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Users can view own store" ON stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own store" ON stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own store" ON stores FOR UPDATE USING (auth.uid() = user_id);

-- Contents policies
CREATE POLICY "Users can view own contents" ON contents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contents" ON contents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contents" ON contents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contents" ON contents FOR DELETE USING (auth.uid() = user_id);

-- Sales data policies
CREATE POLICY "Users can view own sales" ON sales_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales" ON sales_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales" ON sales_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales" ON sales_data FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_store_id ON contents(store_id);
CREATE INDEX idx_sales_data_store_id ON sales_data(store_id);
CREATE INDEX idx_sales_data_date ON sales_data(sale_date);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, action);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for poster images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'poster-images',
  'poster-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read poster images" ON storage.objects
  FOR SELECT USING (bucket_id = 'poster-images');

CREATE POLICY "Auth users upload poster images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'poster-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth users delete own poster images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'poster-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
