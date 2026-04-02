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
    medical: "의료/성형외과",
    education: "학원/온라인 강의",
    usedcar: "중고차 매매",
    autorepair: "자동차 수리",
    moving: "이사 화물",
    delivery: "택배/배송",
    beauty: "미용실/네일샵",
    interior: "인테리어 시공",
    game: "모바일 게임 결제",
    ecommerce: "전자상거래/직구",
    postpartum: "산후조리원",
    funeral: "상조 서비스",
  };

  const legalContext = legalReferences.length > 0
    ? legalReferences.join("\n\n---\n\n")
    : "법 조문 검색 결과 없음 (소비자분쟁해결기준 폴백 활용)";

  // 1. 고객용 기초 진단 요약 (Client Summary)
  // 소비자분쟁해결기준을 우선적으로 적용하며, 고객의 법적 권리를 명확히 안내
  const summaryPrompt = `당신은 '석지운 변호사'를 보조하는 AI 리걸 어시스턴트입니다.
고객이 상담을 위해 입력한 정보를 바탕으로, 다음 내용을 담아 고객에게 보여줄 **단순 가이드라인(기초 진단서)**를 마크다운으로 작성해주세요.

[핵심 원칙 — 반드시 준수]
- **소비자분쟁해결기준을 절대적인 법적 기준**으로 적용하여 분석할 것
- 고객의 **법적 권리를 우선적으로 안내**하고, 업체의 위약금 요구가 기준을 초과하는지 명확히 판단할 것
- 관련 소비자분쟁해결기준 **조항을 반드시 인용**하고, 해당 기준에 따른 적정 환불액을 명시할 것
- 업체의 요구가 기준을 초과하는 경우 그 **초과분과 부당성을 명시적으로 강조**할 것

[입력 정보]
카테고리: ${categoryNames[category] || category}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산 결과: ${JSON.stringify(calculation, null, 2)}
관련 규정/판례: ${legalContext}

[작성 규칙]
1. 인사말 (예: 안녕하세요. 입력해주신 내용을 바탕으로 기초 진단을 수행했습니다.)
2. 사건 요약 (입력 데이터를 2문장 내외로 요약)
3. **적용 법적 기준** (소비자분쟁해결기준 해당 조항을 구체적으로 인용)
4. **고객의 법적 권리** (소비자분쟁해결기준에 따라 고객이 행사할 수 있는 구체적인 권리 나열)
5. **주요 쟁점 분석** (업체 요구 위약금과 법적 기준의 차이를 구체적 금액으로 비교. 초과분이 있으면 "법적 기준 초과"로 명시)
6. 환불액 안내 (합법적/권장 환불액과 업체 요구액의 차이를 명시)
7. 마지막 멘트를 "자세한 법적 대응 방향과 내용증명 작성 등은 석지운 변호사가 직접 내용을 검토한 후 상세히 안내해 드리겠습니다." 로 맺음.
8. 절대 변호사를 사칭하거나 확정적인 판결을 내리지 말 것. "~수 있습니다" 체를 사용.
9. 읽기 편하도록 적절한 이모지와 불릿 포인트 사용.

마크다운 형식으로 작성해주세요.`;

  const summaryResult = await model.generateContent(summaryPrompt);
  const clientSummary = summaryResult.response.text();

  // 2. 변호사용 리포트 (Lawyer Report)
  // 변호사가 즉시 검토하고 팔로업할 수 있도록 전문적인 분석 제공
  const reportPrompt = `당신은 '석지운 변호사'의 초기 사건 검토를 돕는 AI입니다.
변호사가 고객과 연락하기 전에 빠르게 사건을 파악할 수 있도록 리포트를 작성해주세요.

[핵심 원칙]
- 소비자분쟁해결기준을 절대적인 법적 기준으로 적용하여 분석할 것
- 해당 카테고리에 적용되는 구체적인 소비자분쟁해결기준 조항을 명시할 것

[입력 정보]
카테고리: ${categoryNames[category] || category}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산 결과: ${JSON.stringify(calculation, null, 2)}
관련 규정/판례: ${legalContext}

[작성 구조]
## 사건 개요
(계약액, 지불액, 취소시점 등 수치 중심)

## 적용 법적 기준
(소비자분쟁해결기준 해당 조항 명시, 적용 근거 설명)

## 업체 측 입장 (예상)
(업체가 왜 그렇게 많은 위약금을 요구하는지)

## 고객의 권리 및 주요 쟁점
(소비자분쟁해결기준 적용 시 결과와 방어 논리, 업체 요구 초과분 분석)

## 권장 대응 전략 (변호사님께 제안)
(내용증명, 소비자원 신고, 소액심판 등 단계별 권장 전략)

전문적이고 간결한 마크다운으로 작성해주세요.`;

  const reportResult = await model.generateContent(reportPrompt);
  const lawyerReport = reportResult.response.text();

  return { clientSummary, lawyerReport };
}
