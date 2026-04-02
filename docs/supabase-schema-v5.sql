-- 환불원정대: 카테고리 15종 대응을 위한 제약조건 완화 업데이트
-- Supabase 대시보드 SQL Editor에서 실행해주세요.

-- 1단계: 기존 제약 조건(CHECK constraint) 풀기
-- 기존 테이블의 'category' 컬럼에 걸려있던 IN ('gym', 'wedding', 'travel') 제약을 해제합니다.
ALTER TABLE dispute_analyses 
DROP CONSTRAINT IF EXISTS dispute_analyses_category_check;

-- 이제 어떤 텍스트카테고리(예: 'education', 'medical', 'ecommerce' 등)도 제약 없이 들어갈 수 있습니다!
