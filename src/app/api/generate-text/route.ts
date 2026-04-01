import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { category, inputData, calculation, tone = 'polite' } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const categoryNames: Record<string, string> = {
      gym: '헬스장/PT',
      wedding: '예식장',
      travel: '숙박/항공권',
    };

    const toneDesc = tone === 'firm' 
      ? '단호하고 법적 엄정함이 느껴지는 톤'
      : '정중하지만 법적 근거가 명확한 톤';

    const prompt = `당신은 소비자 권리 전문가입니다.

다음 분쟁 상황에 대해 업체에 보낼 ${toneDesc}의 항의 카톡/문자 메시지를 작성해주세요.

카테고리: ${categoryNames[category]}
상황: ${JSON.stringify(inputData)}
합법적 최소 환불액: ${calculation?.legalMinRefund?.toLocaleString()}원
업체 요구 위약금: ${calculation?.demandedPenalty?.toLocaleString()}원
법적 최대 위약금: ${calculation?.legalMaxPenalty?.toLocaleString()}원
법적 근거: ${calculation?.legalBasis}

규칙:
- 존댓말 사용
- 관련 법 조문 번호 포함
- 구체적 환불 금액 명시
- 한국소비자원 접수 가능성 언급
- 300자 내외
- 바로 복사해서 사용할 수 있게

문자 내용만 작성 (설명 없이):`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Generate text error:', error);
    return NextResponse.json({ error: '문자 생성 실패' }, { status: 500 });
  }
}
