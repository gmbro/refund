import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * AI 기초 진단 (변호사 주도 모델용)
 * - contractTermsText: 이용약관 링크에서 추출된 텍스트
 * - attachment: 첨부 파일 Base64 데이터 (이미지/PDF)
 */
export async function analyzeLegalCase(
  category: string,
  inputData: Record<string, unknown>,
  legalReferences: string[],
  calculation: Record<string, unknown>,
  contractTermsText?: string,
  attachment?: { base64: string; mimeType: string }
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

  // 계약서/이용약관 컨텍스트 구성
  let contractContext = '';
  if (contractTermsText) {
    contractContext += `\n\n[업체 이용약관/환불 정책 (링크에서 추출)]\n${contractTermsText}\n\n⚠️ 위 내용이 이용약관·환불정책·계약조건과 무관한 경우 분석에서 제외하고, "제공된 링크는 이용약관/환불정책과 관련이 없는 것으로 판단되어 분석에서 제외했습니다."라고 안내해주세요.\n`;
  }
  if (attachment) {
    contractContext += `\n\n[첨부 파일 분석 지시]\n고객이 파일을 첨부했습니다. 먼저 이 파일이 계약서·결제내역·이용약관 등 분쟁 관련 문서인지 판단해주세요.\n- 관련 문서인 경우: 내용을 꼼꼼히 읽고, 계약 조건·위약금 조항·환불 규정 등을 진단에 반영해주세요. 불공정 조항이 있다면 소비자분쟁해결기준과 비교하여 부당성을 지적해주세요.\n- 관련 없는 파일인 경우(예: 일반 사진, 관련 없는 문서 등): 분석에서 제외하고, "첨부된 파일은 계약서/이용약관과 관련이 없는 것으로 판단되어 분석에서 제외했습니다."라고 안내해주세요.\n`;
  }

  // 1. 고객용 기초 진단 요약 (Client Summary)
  const summaryPrompt = `당신은 '환불원정대'의 AI 리걸 어시스턴트입니다.
고객이 상담을 위해 입력한 정보를 바탕으로, 다음 내용을 담아 고객에게 보여줄 **단순 가이드라인(기초 진단서)**를 마크다운으로 작성해주세요.

[핵심 원칙 — 반드시 준수]
- **소비자분쟁해결기준을 절대적인 법적 기준**으로 적용하여 분석할 것
- 고객의 **법적 권리를 우선적으로 안내**하고, 업체의 위약금 요구가 기준을 초과하는지 명확히 판단할 것
- 관련 소비자분쟁해결기준 **조항을 반드시 인용**하고, 해당 기준에 따른 적정 환불액을 명시할 것
- 업체의 요구가 기준을 초과하는 경우 그 **초과분과 부당성을 명시적으로 강조**할 것
- 고객이 첨부한 계약서나 이용약관이 있다면, 해당 내용을 반드시 읽고 분석에 반영할 것
- 업체 약관 중 소비자분쟁해결기준보다 불리한 조항이 있다면 **해당 조항의 부당성을 구체적으로 지적**할 것

[입력 정보]
카테고리: ${categoryNames[category] || category}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산 결과: ${JSON.stringify(calculation, null, 2)}
관련 규정/판례: ${legalContext}
${contractContext}

[작성 규칙]
1. 인사말 (예: 안녕하세요. 입력해주신 내용을 바탕으로 기초 진단을 수행했습니다.)
2. 사건 요약 (입력 데이터를 2문장 내외로 요약)
3. **적용 법적 기준** (소비자분쟁해결기준 해당 조항을 구체적으로 인용)
4. **고객의 법적 권리** (소비자분쟁해결기준에 따라 고객이 행사할 수 있는 구체적인 권리 나열)
5. **주요 쟁점 분석** (업체 요구 위약금과 법적 기준의 차이를 구체적 금액으로 비교. 초과분이 있으면 "법적 기준 초과"로 명시)
${contractTermsText || attachment ? '6. **업체 약관/계약서 분석** (첨부된 계약서 또는 이용약관의 주요 조항을 분석하고, 소비자분쟁해결기준과 비교하여 불공정한 부분을 지적)' : ''}
${contractTermsText || attachment ? '7.' : '6.'} 환불액 안내 (합법적/권장 환불액과 업체 요구액의 차이를 명시)
${contractTermsText || attachment ? '8.' : '7.'} 마지막 멘트를 "자세한 법적 대응 방향과 내용증명 작성 등은 환불원정대 전문 변호사가 직접 내용을 검토한 후 상세히 안내해 드리겠습니다." 로 맺음.
${contractTermsText || attachment ? '9.' : '8.'} 절대 변호사를 사칭하거나 확정적인 판결을 내리지 말 것. "~수 있습니다" 체를 사용.
${contractTermsText || attachment ? '10.' : '9.'} 읽기 편하도록 적절한 이모지와 불릿 포인트 사용.

마크다운 형식으로 작성해주세요.`;

  // 멀티모달 Parts 구성
  const summaryParts: Part[] = [{ text: summaryPrompt }];
  if (attachment) {
    summaryParts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.base64,
      },
    });
  }

  // 2. 변호사용 리포트 (Lawyer Report)
  const reportPrompt = `당신은 '환불원정대' 담당 변호사의 초기 사건 검토를 돕는 AI입니다.
변호사가 고객과 연락하기 전에 빠르게 사건을 파악할 수 있도록 리포트를 작성해주세요.

[핵심 원칙]
- 소비자분쟁해결기준을 절대적인 법적 기준으로 적용하여 분석할 것
- 해당 카테고리에 적용되는 구체적인 소비자분쟁해결기준 조항을 명시할 것
- 첨부된 계약서/이용약관이 있다면 해당 내용을 상세히 분석하여 리포트에 포함할 것

[입력 정보]
카테고리: ${categoryNames[category] || category}
입력 데이터: ${JSON.stringify(inputData, null, 2)}
환불 계산 결과: ${JSON.stringify(calculation, null, 2)}
관련 규정/판례: ${legalContext}
${contractContext}

[작성 구조]
## 사건 개요
(계약액, 지불액, 취소시점 등 수치 중심)

## 적용 법적 기준
(소비자분쟁해결기준 해당 조항 명시, 적용 근거 설명)

${contractTermsText || attachment ? `## 업체 약관/계약서 분석
(첨부된 계약서 또는 이용약관의 주요 조항 분석, 불공정 조항 식별, 소비자분쟁해결기준 위반 여부 검토)

` : ''}## 업체 측 입장 (예상)
(업체가 왜 그렇게 많은 위약금을 요구하는지)

## 고객의 권리 및 주요 쟁점
(소비자분쟁해결기준 적용 시 결과와 방어 논리, 업체 요구 초과분 분석)

## 권장 대응 전략 (변호사님께 제안)
(내용증명, 소비자원 신고, 소액심판 등 단계별 권장 전략)

전문적이고 간결한 마크다운으로 작성해주세요.`;

  const reportParts: Part[] = [{ text: reportPrompt }];
  if (attachment) {
    reportParts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.base64,
      },
    });
  }

  // 503 High Demand 에러 대비 Fallback 처리 함수
  async function generateWithFallback(parts: Part[]): Promise<string> {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (error: any) {
      if (error?.message?.includes('503') || error?.status === 503) {
        console.warn('Gemini 2.5 Flash 503 Error. Falling back to Gemini 1.5 Flash...');
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await fallbackModel.generateContent(parts);
        return result.response.text();
      }
      throw error;
    }
  }

  const [clientSummary, lawyerReport] = await Promise.all([
    generateWithFallback(summaryParts),
    generateWithFallback(reportParts)
  ]);

  return { clientSummary, lawyerReport };
}
