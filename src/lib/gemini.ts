import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * AI 법리 분석을 수행합니다. 
 * MCP에서 가져온 법 조문과 사용자 상황을 기반으로 분석합니다.
 */
export async function analyzeLegalCase(
  category: string,
  inputData: Record<string, unknown>,
  legalReferences: string[],
  calculation: Record<string, unknown>
): Promise<{ analysis: string; protestText: string; reportMarkdown: string }> {
  const categoryNames: Record<string, string> = {
    gym: "헬스장/PT",
    wedding: "예식장",
    travel: "숙박/항공권",
  };

  const legalContext = legalReferences.length > 0
    ? legalReferences.join("\n\n---\n\n")
    : "법 조문 직접 검색 결과 없음 (내장 기준 사용)";

  // 1. 법리 분석
  const analysisPrompt = `당신은 대한민국 소비자 권리 전문 법률 어시스턴트입니다.

## 분쟁 카테고리
${categoryNames[category] || category}

## 사용자 입력 정보
${JSON.stringify(inputData, null, 2)}

## 관련 법령/판례 (법제처 검색 결과)
${legalContext}

## 환불 계산 결과
${JSON.stringify(calculation, null, 2)}

## 요청사항
위 정보를 바탕으로 다음을 분석해주세요:

1. **법적 근거 요약**: 이 사안에 적용되는 핵심 법 조문을 명확히 제시
2. **업체 위약금의 부당성 판단**: 업체가 요구하는 위약금이 법적 기준 대비 얼마나 과다한지 분석
3. **소비자의 권리**: 소비자가 행사할 수 있는 법적 권리
4. **권장 대응 방안**: 단계별 실천 가능한 대응 방법

한국어로 작성하고, 비법률 전문가도 이해할 수 있게 쉽게 설명해주세요.
각 섹션은 ## 헤딩으로 구분해주세요.`;

  const analysisResult = await model.generateContent(analysisPrompt);
  const analysis = analysisResult.response.text();

  // 2. 항의 문자 초안
  const protestPrompt = `당신은 대한민국 소비자 권리 전문가입니다.

다음 분쟁 상황에 대해 업체 사장님에게 보낼 수 있는 **정중하지만 법적 근거가 명확한** 항의 카톡/문자 메시지 초안을 작성해주세요.

## 분쟁 정보
- 카테고리: ${categoryNames[category]}
- 사용자 상황: ${JSON.stringify(inputData)}
- 합법적 최소 환불액: ${(calculation as Record<string, number>).legalMinRefund?.toLocaleString()}원
- 업체 요구 위약금: ${(calculation as Record<string, number>).demandedPenalty?.toLocaleString()}원
- 법적 최대 위약금: ${(calculation as Record<string, number>).legalMaxPenalty?.toLocaleString()}원

## 작성 규칙
- 존댓말 사용
- 핵심 법 조문 번호를 반드시 포함 (예: 방문판매법 제29조)
- 환불 금액을 구체적으로 명시
- 한국소비자원 피해구제 접수 가능성 언급
- 300자 내외로 간결하게
- 바로 복사해서 사용할 수 있게

문자 내용만 작성해주세요 (설명이나 주석 없이).`;

  const protestResult = await model.generateContent(protestPrompt);
  const protestText = protestResult.response.text();

  // 3. 사건 개요서
  const reportPrompt = `당신은 한국소비자원 피해구제 접수용 사건 개요서를 작성하는 전문가입니다.

다음 정보를 기반으로 마크다운 형식의 사건 개요서를 작성해주세요.

## 분쟁 정보
- 카테고리: ${categoryNames[category]}
- 입력 데이터: ${JSON.stringify(inputData, null, 2)}
- 환불 계산: ${JSON.stringify(calculation, null, 2)}
- 관련 법령: ${legalContext}

## 개요서 구조
# 소비자 피해구제 신청 사건 개요서

## 1. 신청인 정보
(신청인이 직접 작성하도록 빈 칸으로 남김)

## 2. 피신청인(업체) 정보
(업체명, 주소, 연락처 — 빈 칸)

## 3. 계약 내용
(입력 데이터 기반으로 작성)

## 4. 분쟁 경위
(상황 설명 기반으로 상세 작성)

## 5. 법적 근거
(관련 법 조문 인용)

## 6. 환불 계산 근거
(계산 내역 상세)

## 7. 요구 사항
(구체적 환불 금액 명시)

## 8. 첨부 서류 목록
(계약서 사본, 결제 내역 등 — 체크리스트)

전문적이고 깔끔한 마크다운으로 작성해주세요.`;

  const reportResult = await model.generateContent(reportPrompt);
  const reportMarkdown = reportResult.response.text();

  return { analysis, protestText, reportMarkdown };
}
