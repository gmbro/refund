-- =============================================
-- 환불원정대 Supabase 테이블 & 보안 설정
-- =============================================

-- 1. dispute_analyses 테이블 생성
CREATE TABLE IF NOT EXISTS public.dispute_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  input_data JSONB NOT NULL,
  calculation JSONB,
  legal_references JSONB,
  ai_analysis TEXT,
  report_markdown TEXT,
  
  -- 상담 접수 시 업데이트 되는 항목
  user_name TEXT,
  user_email TEXT,
  phone_number TEXT,
  agreed_privacy BOOLEAN,
  status TEXT DEFAULT 'pending', -- pending, requested, reviewed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 컬럼 추가 (기존 테이블 호환)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='dispute_analyses' AND column_name='user_email') THEN
        ALTER TABLE public.dispute_analyses ADD COLUMN user_email TEXT;
    END IF;
END $$;

-- =============================================
-- 3. RLS (Row Level Security) 설정
-- =============================================

ALTER TABLE public.dispute_analyses ENABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.dispute_analyses;
DROP POLICY IF EXISTS "Enable update for anonymous users" ON public.dispute_analyses;
DROP POLICY IF EXISTS "Enable select for users based on id" ON public.dispute_analyses;
DROP POLICY IF EXISTS "anon_insert_only" ON public.dispute_analyses;
DROP POLICY IF EXISTS "anon_update_own_pending" ON public.dispute_analyses;
DROP POLICY IF EXISTS "anon_no_select" ON public.dispute_analyses;
DROP POLICY IF EXISTS "anon_select_limited" ON public.dispute_analyses;
DROP POLICY IF EXISTS "service_role_full_access" ON public.dispute_analyses;

-- =============================================
-- 핵심 RLS 정책
-- =============================================

-- 3-1. INSERT: 새 레코드 생성만 가능
-- 서버 API(/api/analyze)에서 분석 결과를 저장할 때 사용
CREATE POLICY "anon_insert_only" ON public.dispute_analyses
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 3-2. UPDATE: pending 상태의 레코드만 업데이트 가능
-- 서버 API(/api/request-review)에서 상담 접수 정보를 추가할 때 사용
-- → requested나 reviewed 상태의 레코드는 수정 불가
CREATE POLICY "anon_update_pending_only" ON public.dispute_analyses
    FOR UPDATE
    TO anon
    USING (status = 'pending')
    WITH CHECK (status IN ('pending', 'requested'));

-- 3-3. SELECT: anon 키로는 민감하지 않은 필드만 조회 가능
-- ⚠️ 중요: 이 정책은 anon key로의 직접 DB 조회를 차단하지 않지만,
--    개인정보(이름, 전화번호, 이메일)는 별도 뷰를 통해 관리하는 것이 이상적.
--    현재 서버 API가 anon key를 사용하므로 SELECT를 완전 차단할 수 없음.
--    → 향후 service_role key로 마이그레이션 필요
CREATE POLICY "anon_select_own" ON public.dispute_analyses
    FOR SELECT
    TO anon
    USING (true);

-- =============================================
-- 4. 개인정보 보호를 위한 보안 뷰 (향후 사용)
-- =============================================

-- 개인정보를 마스킹한 공개 뷰 (anon key 직접 접근 대응)
CREATE OR REPLACE VIEW public.dispute_analyses_safe AS
SELECT 
  id,
  category,
  status,
  calculation,
  ai_analysis,
  created_at,
  -- 개인정보 마스킹
  CASE WHEN user_name IS NOT NULL 
    THEN LEFT(user_name, 1) || '**' 
    ELSE NULL 
  END AS user_name_masked,
  CASE WHEN phone_number IS NOT NULL 
    THEN LEFT(phone_number, 3) || '-****-' || RIGHT(phone_number, 4) 
    ELSE NULL 
  END AS phone_masked
FROM public.dispute_analyses;

-- =============================================
-- 5. 인덱스 (성능)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_dispute_status ON public.dispute_analyses (status);
CREATE INDEX IF NOT EXISTS idx_dispute_created_at ON public.dispute_analyses (created_at DESC);
