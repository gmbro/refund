import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { category, inputData, calculation, legalReferences } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const categoryNames: Record<string, string> = {
      gym: '헬스장/PT',
      wedding: '예식장',
      travel: '숙박/항공권',
    };

    const prompt = `한국소비자원 피해구제 접수용 사건 개요서를 마크다운으로 작성해주세요.

카테고리: ${categoryNames[category]}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산: ${JSON.stringify(calculation, null, 2)}
관련 법령: ${JSON.stringify(legalReferences)}

구조:
# 소비자 피해구제 신청 사건 개요서

## 1. 신청인 정보
(성명, 연락처, 주소 — 빈 칸)

## 2. 피신청인(업체) 정보
(업체명, 주소, 연락처 — 빈 칸)

## 3. 계약 내용
(입력 데이터 기반)

## 4. 분쟁 경위
(상세 경위)

## 5. 법적 근거
(법 조문 인용)

## 6. 환불 계산 근거
(계산 상세)

## 7. 요구 사항
(환불 금액 명시)

## 8. 첨부 서류
(체크리스트)

전문적 마크다운으로 작성:`;

    const result = await model.generateContent(prompt);
    const markdown = result.response.text();

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ error: '개요서 생성 실패' }, { status: 500 });
  }
}
