import { DisputeInput, GymInput, WeddingInput, TravelInput, RefundCalculation } from './types';

/**
 * 카테고리별 환불액을 계산합니다.
 * 소비자분쟁해결기준에 따른 법적 최대 위약금과 합법적 최소 환불액을 산출합니다.
 */
export function calculateRefund(input: DisputeInput): RefundCalculation {
  switch (input.category) {
    case 'gym':
      return calculateGymRefund(input);
    case 'wedding':
      return calculateWeddingRefund(input);
    case 'travel':
      return calculateTravelRefund(input);
    default:
      return calculateGenericRefund(input);
  }
}

/**
 * 헬스장/PT 환불 계산
 * 근거: 방문판매법 제29조 (계속거래 해지), 소비자분쟁해결기준
 * 공식: 환불금액 = 총 계약대금 - 이용료 - 위약금(최대 10%)
 */
function calculateGymRefund(input: GymInput): RefundCalculation {
  const { totalAmount, totalMonths, usedMonths, totalSessions, usedSessions, demandedPenalty } = input;

  let usageFee: number;
  let formula: string;

  // PT 횟수 기반 계산
  if (totalSessions && usedSessions) {
    const perSession = totalAmount / Number(totalSessions);
    usageFee = Math.round(perSession * Number(usedSessions));
    formula = `이용료 = (${totalAmount.toLocaleString()}원 ÷ ${totalSessions}회) × ${usedSessions}회 = ${usageFee.toLocaleString()}원`;
  } else {
    // 기간 기반 계산
    const tMonths = Number(totalMonths) || 1;
    const uMonths = Number(usedMonths) || 0;
    const monthlyRate = totalAmount / tMonths;
    usageFee = Math.round(monthlyRate * uMonths);
    formula = `이용료 = (${totalAmount.toLocaleString()}원 ÷ ${tMonths}개월) × ${uMonths}개월 = ${usageFee.toLocaleString()}원`;
  }

  // 법적 최대 위약금 = 총 계약대금의 10%
  const legalMaxPenalty = Math.round(totalAmount * 0.1);
  const legalMinRefund = Math.max(0, totalAmount - usageFee - legalMaxPenalty);
  const excessPenalty = Math.max(0, demandedPenalty - legalMaxPenalty);

  return {
    legalMinRefund,
    legalMaxPenalty,
    demandedPenalty,
    excessPenalty,
    usageFee,
    formula: `환불금액 = ${totalAmount.toLocaleString()}원 - ${usageFee.toLocaleString()}원(이용료) - ${legalMaxPenalty.toLocaleString()}원(위약금 10%) = ${legalMinRefund.toLocaleString()}원\n${formula}`,
    legalBasis: '방문판매 등에 관한 법률 제29조 (계속거래의 해지), 소비자분쟁해결기준 (체육시설업) — 위약금 상한: 총 계약금액의 10%',
  };
}

/**
 * 예식장 환불 계산
 * 근거: 공정거래위원회 소비자분쟁해결기준 (예식서비스업)
 */
function calculateWeddingRefund(input: WeddingInput): RefundCalculation {
  const { totalAmount, weddingDate, cancelDate, demandedPenalty } = input;

  const wedding = new Date(String(weddingDate || ''));
  const cancel = new Date(String(cancelDate || ''));
  const diffTime = wedding.getTime() - cancel.getTime();
  const daysBeforeWedding = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let penaltyRate: number;
  let periodDesc: string;

  if (daysBeforeWedding >= 150) {
    penaltyRate = 0;
    periodDesc = '예식 예정일 5개월 이상 전';
  } else if (daysBeforeWedding >= 90) {
    penaltyRate = 0.1;
    periodDesc = '예식 예정일 90일~150일 전';
  } else if (daysBeforeWedding >= 60) {
    penaltyRate = 0.15;
    periodDesc = '예식 예정일 60일~89일 전';
  } else if (daysBeforeWedding >= 30) {
    penaltyRate = 0.2;
    periodDesc = '예식 예정일 30일~59일 전';
  } else if (daysBeforeWedding >= 10) {
    penaltyRate = 0.4;
    periodDesc = '예식 예정일 10일~29일 전';
  } else if (daysBeforeWedding >= 1) {
    penaltyRate = 0.5;
    periodDesc = '예식 예정일 1일~9일 전';
  } else {
    penaltyRate = 0.7;
    periodDesc = '예식 당일';
  }

  const legalMaxPenalty = Math.round(totalAmount * penaltyRate);
  const legalMinRefund = Math.max(0, totalAmount - legalMaxPenalty);
  const excessPenalty = Math.max(0, demandedPenalty - legalMaxPenalty);
  const usageFee = 0;

  return {
    legalMinRefund,
    legalMaxPenalty,
    demandedPenalty,
    excessPenalty,
    usageFee,
    formula: `예식일까지 ${daysBeforeWedding}일 남음 (${periodDesc})\n위약금 = ${totalAmount.toLocaleString()}원 × ${(penaltyRate * 100)}% = ${legalMaxPenalty.toLocaleString()}원\n환불금액 = ${totalAmount.toLocaleString()}원 - ${legalMaxPenalty.toLocaleString()}원 = ${legalMinRefund.toLocaleString()}원`,
    legalBasis: `소비자분쟁해결기준 (예식서비스업) — ${periodDesc}: 총 이용금액의 ${(penaltyRate * 100)}% 위약금`,
  };
}

/**
 * 숙박/항공권 환불 계산
 * 근거: 소비자분쟁해결기준 (숙박업/항공)
 */
function calculateTravelRefund(input: TravelInput): RefundCalculation {
  const { totalAmount, serviceDate, cancelDate, serviceType, demandedPenalty } = input;

  const service = new Date(String(serviceDate || ''));
  const cancel = new Date(String(cancelDate || ''));
  const diffTime = service.getTime() - cancel.getTime();
  const daysBeforeService = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let penaltyRate: number;
  let periodDesc: string;

  if (serviceType === 'accommodation') {
    // 숙박업 기준 (비수기 기준)
    if (daysBeforeService >= 10) {
      penaltyRate = 0;
      periodDesc = '이용 예정일 10일 이상 전';
    } else if (daysBeforeService >= 8) {
      penaltyRate = 0.1;
      periodDesc = '이용 예정일 8~9일 전';
    } else if (daysBeforeService >= 5) {
      penaltyRate = 0.2;
      periodDesc = '이용 예정일 5~7일 전';
    } else if (daysBeforeService >= 3) {
      penaltyRate = 0.3;
      periodDesc = '이용 예정일 3~4일 전';
    } else if (daysBeforeService >= 1) {
      penaltyRate = 0.5;
      periodDesc = '이용 예정일 1~2일 전';
    } else {
      penaltyRate = 0.8;
      periodDesc = '이용 당일 또는 No-show';
    }
  } else {
    // 항공권 기준
    if (daysBeforeService >= 61) {
      penaltyRate = 0;
      periodDesc = '출발일 61일 이상 전';
    } else if (daysBeforeService >= 31) {
      penaltyRate = 0.05;
      periodDesc = '출발일 31~60일 전';
    } else if (daysBeforeService >= 10) {
      penaltyRate = 0.1;
      periodDesc = '출발일 10~30일 전';
    } else if (daysBeforeService >= 3) {
      penaltyRate = 0.2;
      periodDesc = '출발일 3~9일 전';
    } else if (daysBeforeService >= 1) {
      penaltyRate = 0.3;
      periodDesc = '출발일 1~2일 전';
    } else {
      penaltyRate = 0.5;
      periodDesc = '출발 당일';
    }
  }

  const legalMaxPenalty = Math.round(totalAmount * penaltyRate);
  const legalMinRefund = Math.max(0, totalAmount - legalMaxPenalty);
  const excessPenalty = Math.max(0, demandedPenalty - legalMaxPenalty);
  const usageFee = 0;
  const typeLabel = serviceType === 'accommodation' ? '숙박업' : '항공';

  return {
    legalMinRefund,
    legalMaxPenalty,
    demandedPenalty,
    excessPenalty,
    usageFee,
    formula: `이용 예정일까지 ${daysBeforeService}일 남음 (${periodDesc})\n위약금 = ${totalAmount.toLocaleString()}원 × ${(penaltyRate * 100)}% = ${legalMaxPenalty.toLocaleString()}원\n환불금액 = ${totalAmount.toLocaleString()}원 - ${legalMaxPenalty.toLocaleString()}원 = ${legalMinRefund.toLocaleString()}원`,
    legalBasis: `소비자분쟁해결기준 (${typeLabel}) — ${periodDesc}: 총 금액의 ${(penaltyRate * 100)}% 위약금`,
  };
}

/**
 * 범용 카테고리 환불 계산
 * 근거: 소비자분쟁해결기준 일반 원칙 — 위약금은 총 계약금액의 10~20% 이내
 * 보수적으로 10%를 적용합니다.
 */
function calculateGenericRefund(input: DisputeInput): RefundCalculation {
  const { totalAmount, demandedPenalty } = input;

  // 범용 기준: 위약금 상한 10%
  const legalMaxPenalty = Math.round(totalAmount * 0.1);
  const usageFee = 0; // 범용 카테고리는 이용료 별도 미산정
  const legalMinRefund = Math.max(0, totalAmount - usageFee - legalMaxPenalty);
  const excessPenalty = Math.max(0, demandedPenalty - legalMaxPenalty);

  return {
    legalMinRefund,
    legalMaxPenalty,
    demandedPenalty,
    excessPenalty,
    usageFee,
    formula: `환불금액 = ${totalAmount.toLocaleString()}원 - ${legalMaxPenalty.toLocaleString()}원(위약금 최대 10%) = ${legalMinRefund.toLocaleString()}원`,
    legalBasis: '소비자분쟁해결기준 일반 원칙 — 위약금은 총 계약금액의 10% 이내 (카테고리별 세부 기준은 변호사 검토 필요)',
  };
}
