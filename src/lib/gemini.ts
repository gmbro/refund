import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * AI 기초 진단 (변호사 주도 모델용)
 */
export async function analyzeLegalCase(
  category: string,
  inputData: Record<string, unknown>,
  legalReferences: string[],
  calculation: Record<string, unknown>
): Promise<{ clientSummary: string; lawyerReport: string }> {
  const categoryNames: Record<string, string> = {
    gym: "헬스장/PT",
    wedding: "예식장",
    travel: "숙박/항공권",
  };

  const legalContext = legalReferences.length > 0
    ? legalReferences.join("\n\n---\n\n")
    : "법 조문 검색 결과 없음 (소비자분쟁해결기준 폴백 활용)";

  // 1. 고객용 기초 진단 요약 (Client Summary)
  // 법적 자문이 아님을 명시하며, 위약금 산정 결과를 안내함.
  const summaryPrompt = `당신은 '석지운 변호사'를 보조하는 AI 리걸 어시스턴트입니다.
고객이 상담을 위해 입력한 정보를 바탕으로, 다음 내용을 담아 고객에게 보여줄 **단순 가이드라인(기초 진단서)**를 마크다운으로 작성해주세요.

[입력 정보]
카테고리: ${categoryNames[category]}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산 결과: ${JSON.stringify(calculation, null, 2)}
관련 규정/판례: ${legalContext}

[작성 규칙]
1. 인사말 (예: 안녕하세요. 입력해주신 내용을 바탕으로 기초 진단을 수행했습니다.)
2. 사건 요약 (입력 데이터를 2문장 내외로 요약)
3. 쟁점 분석 (소비자분쟁해결기준 등에 비추어 볼 때 업체의 위약금 요구가 적절한지 분석. 단, 단정적인 법적 판단은 피하고 "~수 있습니다"체를 사용)
4. 환불액 안내 (합법적/권장 환불액과 업체 요구액의 차이를 명시)
5. 마지막 멘트를 "자세한 법적 대응 방향과 내용증명 작성 등은 석지운 변호사가 직접 내용을 검토한 후 상세히 안내해 드리겠습니다." 로 맺음.
6. 절대 변호사를 사칭하거나 확정적인 판결을 내리지 말 것.
7. 읽기 편하도록 적절한 이모지와 불릿 포인트 사용.

마크다운 형식으로 작성해주세요.`;

  const summaryResult = await model.generateContent(summaryPrompt);
  const clientSummary = summaryResult.response.text();

  // 2. 변호사용 리포트 (Lawyer Report)
  // 변호사가 즉시 검토하고 팔로업할 수 있도록 전문적인 분석 제공
  const reportPrompt = `당신은 '석지운 변호사'의 초기 사건 검토를 돕는 AI입니다.
변호사가 고객과 연락하기 전에 빠르게 사건을 파악할 수 있도록 리포트를 작성해주세요.

[입력 정보]
카테고리: ${categoryNames[category]}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산 결과: ${JSON.stringify(calculation, null, 2)}
관련 규정/판례: ${legalContext}

[작성 구조]
## 사건 개요
(계약액, 지불액, 취소시점 등 수치 중심)

## 업체 측 입장 (예상)
(업체가 왜 그렇게 많은 위약금을 요구하는지)

## 고객의 권리 및 주요 쟁점
(관련 규정 적용 시 결과와 방어 논리)

## 권장 대응 전략 (변호사님께 제안)
(내용증명, 소비자원 신고, 소액심판 등 단계별 권장 전략)

전문적이고 간결한 마크다운으로 작성해주세요.`;

  const reportResult = await model.generateContent(reportPrompt);
  const lawyerReport = reportResult.response.text();

  return { clientSummary, lawyerReport };
}
