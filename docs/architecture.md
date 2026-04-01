# 환불원정대 (Refund Expedition) 아키텍처 문서

## 개요
소비자가 부당한 위약금을 방어하고 합법적인 환불을 받을 수 있도록 돕는 AI 법률 분석 서비스입니다.

## 기술 스택
- **Frontend**: Next.js (App Router), Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini API (법리 분석, 항의 문자 생성)
- **법률 데이터**: korean-law-mcp 원격 서버 (법제처 Open API)
- **Database**: Supabase (PostgreSQL)
- **배포**: Vercel (GitHub 연동)

## 핵심 플로우
1. 사용자가 분쟁 카테고리 선택 (헬스장/예식장/숙박항공)
2. 분쟁 상황 입력 (금액, 기간, 상황 설명)
3. API Route에서:
   - MCP로 관련 법령/판례 검색
   - 소비자분쟁해결기준에 따른 환불액 계산
   - Gemini로 법리 분석 + 항의 문자 + 개요서 생성
4. 결과 대시보드 표시

## 환경변수
| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 인증 키 |
| `GEMINI_API_KEY` | Google Gemini API 키 |
| `MCP_REMOTE_URL` | korean-law-mcp 원격 서버 URL |

## Supabase 테이블
`docs/supabase-schema.sql` 파일을 Supabase SQL Editor에서 실행하세요.
