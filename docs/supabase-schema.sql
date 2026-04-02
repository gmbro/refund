-- 환불원정대: 분석 결과 및 변호사 검토 요청 저장 테이블
-- Supabase SQL Editor에서 실행해주세요

-- 만약 이미 테이블을 생성했다면, 아래 컬럼들을 추가(ALTER) 해야 합니다.
-- (위험을 피하기 위해 ALTER TABLE 구문을 준비했습니다)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dispute_analyses' AND column_name='user_name') THEN
        ALTER TABLE dispute_analyses ADD COLUMN user_name TEXT;
        ALTER TABLE dispute_analyses ADD COLUMN phone_number TEXT;
        ALTER TABLE dispute_analyses ADD COLUMN agreed_privacy BOOLEAN DEFAULT FALSE;
        ALTER TABLE dispute_analyses ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'completed'));
    END IF;
END $$;

-- (최초 생성용 스크립트)
CREATE TABLE IF NOT EXISTS dispute_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('gym', 'wedding', 'travel')),
  input_data JSONB NOT NULL,
  calculation JSONB NOT NULL,
  legal_references JSONB,
  ai_analysis TEXT,
  protest_text TEXT,
  report_markdown TEXT,
  
  -- v4: 검토 요청용 컬럼
  user_name TEXT,
  phone_number TEXT,
  agreed_privacy BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'completed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 권한 설정 (기존과 동일)
ALTER TABLE dispute_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert" ON dispute_analyses;
CREATE POLICY "Allow anonymous insert" ON dispute_analyses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select" ON dispute_analyses;
CREATE POLICY "Allow anonymous select" ON dispute_analyses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous update" ON dispute_analyses;
CREATE POLICY "Allow anonymous update" ON dispute_analyses FOR UPDATE TO anon USING (true);
