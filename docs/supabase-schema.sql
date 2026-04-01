-- 환불원정대: 분석 결과 저장 테이블
-- Supabase SQL Editor에서 실행해주세요

CREATE TABLE IF NOT EXISTS dispute_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('gym', 'wedding', 'travel')),
  input_data JSONB NOT NULL,
  calculation JSONB NOT NULL,
  legal_references JSONB,
  ai_analysis TEXT,
  protest_text TEXT,
  report_markdown TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 (보안)
ALTER TABLE dispute_analyses ENABLE ROW LEVEL SECURITY;

-- anon 사용자가 INSERT/SELECT 가능하도록 정책 추가
CREATE POLICY "Allow anonymous insert" ON dispute_analyses
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON dispute_analyses
  FOR SELECT TO anon
  USING (true);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dispute_analyses_created_at ON dispute_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_analyses_category ON dispute_analyses(category);
