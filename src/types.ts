export type FeedPhase = 'Prédémarrage' | 'Démarrage' | 'Croissance' | 'Finition';

export interface MortalityLog {
  date: string;
  count: number;
}

export interface WeightLog {
  day: number;
  weight: number; // in grams
  date: string;
}

export interface FeedPreparationLog {
  id: string;
  date: string;
  phase: FeedPhase;
  quantityKg: number;
  costFcfa: number;
}

export interface SanitaryTaskStatus {
  day: number;
  completed: boolean;
  completedAt?: string;
}

export interface PoultryBatch {
  id: string;
  name: string;
  initialSize: number; // 150, 200, 250, etc.
  startDate: string; // ISO date string YYYY-MM-DD
  mortalities: MortalityLog[];
  weights: WeightLog[];
  feedPreparations: FeedPreparationLog[];
  completedSanitaryTasks: SanitaryTaskStatus[];
  status: 'active' | 'completed';
  completionDate?: string;
  soldRevenue?: number; // Final selling price achieved
}

export interface FeedIngredient {
  name: string;
  demarrageKg: number; // For 100kg
  croissanceKg: number; // For 100kg
  finitionKg: number; // For 100kg
  roleAndAdjustment: string;
}

export interface CuttingYield {
  pieceName: string;
  percentageLiveWeight: number; // e.g. 24.0 for 24%
  weightPerSubjectKg: number; // e.g. 0.576 for 2.4kg subject
  unitPriceFcfaKg: number; // e.g. 3000
  isPerUnit?: boolean; // If true, price is per unit (e.g., pattes, gésier)
}

export interface TechnicalParams {
  chickUnitPriceFcfa: number; // default: 630 (includes 5% mortality amortization)
  healthUnitPriceFcfa: number; // default: 150 (vaccines, shavings, water)
  feedCostPerKg: {
    Prédémarrage: number; // default: 400
    Démarrage: number; // default: 285
    Croissance: number; // default: 285
    Finition: number; // default: 285
  };
}
