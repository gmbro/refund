export type DisputeInput = {
  category: string;
  totalAmount: number;
  demandedPenalty: number;
  description: string;
  // 기존 필드들 보존
  totalMonths?: number;
  usedMonths?: number;
  totalSessions?: number;
  usedSessions?: number;
  weddingDate?: string;
  serviceDate?: string;
  cancelDate?: string;
  serviceType?: string;
  // 공통 폼 필드
  contractDate?: string;
};
