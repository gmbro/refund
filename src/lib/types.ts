// 분쟁 카테고리 타입
export type DisputeCategory = 'gym' | 'wedding' | 'travel';

// 카테고리 정보
export interface CategoryInfo {
  id: DisputeCategory;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  tags: string[];
  gradient: string;
}

// 헬스장/PT 입력 데이터
export interface GymInput {
  category: 'gym';
  totalAmount: number;        // 총 결제 금액
  totalMonths: number;        // 총 계약 기간 (개월)
  usedMonths: number;         // 이용한 기간 (개월)
  usedSessions?: number;      // PT 이용 횟수 (선택)
  totalSessions?: number;     // PT 총 횟수 (선택)
  demandedPenalty: number;    // 업체 요구 위약금
  description: string;        // 상황 설명
}

// 예식장 입력 데이터
export interface WeddingInput {
  category: 'wedding';
  totalAmount: number;        // 총 예식 비용
  weddingDate: string;        // 예식 예정일
  cancelDate: string;         // 취소 통보일
  demandedPenalty: number;    // 업체 요구 위약금
  description: string;        // 상황 설명
}

// 숙박/항공권 입력 데이터
export interface TravelInput {
  category: 'travel';
  totalAmount: number;        // 총 결제 금액
  serviceDate: string;        // 이용 예정일
  cancelDate: string;         // 취소 요청일
  serviceType: 'accommodation' | 'flight';  // 서비스 유형
  demandedPenalty: number;    // 업체 요구 위약금
  description: string;        // 상황 설명
}

// 통합 입력 타입
export type DisputeInput = GymInput | WeddingInput | TravelInput;

// 환불 계산 결과
export interface RefundCalculation {
  legalMinRefund: number;         // 합법적 최소 환불액
  legalMaxPenalty: number;        // 법적 최대 위약금
  demandedPenalty: number;        // 업체 요구 위약금
  excessPenalty: number;          // 초과 청구 금액
  usageFee: number;               // 이용료 공제
  formula: string;                // 계산 공식
  legalBasis: string;             // 법적 근거 요약
}

// 분석 결과
export interface AnalysisResult {
  id: string;
  category: DisputeCategory;
  inputData: DisputeInput;
  calculation: RefundCalculation;
  legalReferences: string[];      // MCP에서 가져온 법 조문
  aiAnalysis: string;             // AI 법리 분석
  protestText: string;            // 항의 문자 초안
  reportMarkdown: string;         // 사건 개요서
  createdAt: string;
}
