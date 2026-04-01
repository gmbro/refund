# 환불원정대 (Refund Expedition)

> 억울한 위약금, 법으로 바로잡으세요

소비자가 부당한 위약금을 방어하고 합법적인 환불을 받을 수 있도록 돕는 **AI 법률 분석 서비스**입니다.

## 🎯 주요 기능

- **🏋️ 헬스장/PT** — 방문판매법·소비자분쟁해결기준 기반 환불액 계산
- **💒 예식장** — 공정거래위원회 표준약관 기반 위약금 분석  
- **✈️ 숙박/항공권** — 소비자분쟁해결기준 기반 취소 환불 분석

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js (App Router), Tailwind CSS |
| AI | Google Gemini API |
| 법률 데이터 | korean-law-mcp (법제처 Open API) |
| Database | Supabase (PostgreSQL) |
| 배포 | Vercel |

## 🚀 빠른 시작

```bash
# 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build
```

## 📋 환경변수

`.env.local` 파일에 다음 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
MCP_REMOTE_URL=https://korean-law-mcp.fly.dev/mcp
```

## ⚖️ 법적 고지

이 서비스는 법률 자문을 제공하지 않으며, 참고 정보 제공 목적의 서비스입니다.
최종 법적 판단은 법률 전문가와 상담하시기 바랍니다.
