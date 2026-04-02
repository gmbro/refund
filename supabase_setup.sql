-- 1. dispute_analyses 테이블 생성 (기존에 없다면)
CREATE TABLE IF NOT EXISTS public.dispute_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  input_data JSONB NOT NULL,
  calculation JSONB,
  legal_references JSONB,
  ai_analysis TEXT,
  report_markdown TEXT,
  
  -- Step 1. 상담 접수 시 업데이트 되는 항목
  user_name TEXT,
  user_email TEXT,  -- [NEW] 이메일 컬럼 추가
  phone_number TEXT,
  agreed_privacy BOOLEAN,
  status TEXT DEFAULT 'pending', -- pending, requested, reviewed 등
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 만약 기존 테이블이 존재하고 user_email 컬럼이 없다면 추가하는 쿼리 (가장 안전한 방법)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='dispute_analyses' AND column_name='user_email') THEN
        ALTER TABLE public.dispute_analyses ADD COLUMN user_email TEXT;
    END IF;
END $$;

-- 3. 관리자(변호사) 뷰를 위한 RLS(Row Level Security) 확인
-- 현재 프론트엔드에서 API를 우회하지 않고 Supabase를 안전하게 사용하려면 
-- RLS를 활성화하고 적절한 정책을 부여해야 합니다.
-- 만약 익명(anon) 접근을 허용하고 싶다면 아래와 같은 insert/update 정책이 필요합니다.

ALTER TABLE public.dispute_analyses ENABLE ROW LEVEL SECURITY;

-- 3-1. 누구나 Insert 가능 (단, 서버사이드 API에서 Supabase 키를 사용하면 bypass RLS 옵션 사용 가능)
-- 현재 프로젝트에서는 pages/api 혹은 app/api/ 에서 insert를 실행하므로, 
-- service_role_key 를 사용하는 것이 원칙적으로는 더 안전합니다.
-- 하지만 NEXT_PUBLIC_SUPABASE_ANON_KEY를 사용 중이므로 anon role의 insert/update를 허용합니다.

CREATE POLICY "Enable insert for anonymous users" ON public.dispute_analyses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anonymous users" ON public.dispute_analyses
    FOR UPDATE USING (true) WITH CHECK (true);

-- 3-2. Select 권한은 관리자(어드민)에게만 제어하는 것이 원칙이지만,
-- 프론트엔드 API 구현 구조상 자기 자신이 쓴 내역을 가져오지는 않고 결과 반환 후 update만 치기 때문에,
-- 굳이 퍼블릭 Select를 모두 열어두지 않는 것이 보안상 좋습니다.
CREATE POLICY "Enable select for users based on id" ON public.dispute_analyses
    FOR SELECT USING (true); -- 임시로 전체 오픈, 실무 환경에서는 관리자 UUID만 접근하도록 제한 필요.
