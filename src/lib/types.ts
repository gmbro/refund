export type DisputeInput = {
  category: string;
  totalAmount: number;
  demandedPenalty: number;
  description: string;
  totalMonths?: number;
  usedMonths?: number;
  totalSessions?: number;
  usedSessions?: number;
  weddingDate?: string;
  serviceDate?: string;
  cancelDate?: string;
  serviceType?: string;
  contractDate?: string;
  otherCategoryName?: string;
  contractLink?: string;
  attachedFile?: string;
  cancelReason?: string;
};

export type GymInput = DisputeInput;
export type WeddingInput = DisputeInput;
export type TravelInput = DisputeInput;
export type MedicalInput = DisputeInput;

export type RefundCalculation = {
  legalMinRefund: number;
  legalMaxPenalty: number;
  demandedPenalty: number;
  excessPenalty: number;
  usageFee: number;
  formula: string;
  legalBasis: string;
};

export type CategoryInfo = {
  id: string;
  title: string;
  icon: string;
};
