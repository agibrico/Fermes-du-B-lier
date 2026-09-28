/**
 * Modèle de données complet pour « Fermes du Bélier — Plan 35 jours »
 * Respect des exigences technico-économiques avicoles et traçabilité rigoureuse.
 */

export type FeedPhase = 'Démarrage Industriel' | 'Croissance' | 'Finition' | 'Prédémarrage Historique' | 'Prédémarrage' | 'Démarrage';

export type FormulaStatus = 'brouillon' | 'à valider' | 'validée' | 'archivée';

export type BatchStatus = 'planned' | 'active' | 'completed';

export type HealthProductCategory = 'vaccin' | 'vitamine_supplement' | 'medicament' | 'desinfectant';

export type SanitaryTaskStatus = 'À valider' | 'Planifié' | 'Réalisé' | 'Reporté' | 'Annulé' | 'Incident';

export type StockCategory = 'aliment_industriel' | 'matiere_premiere' | 'aliment_fabrique' | 'produit_sante' | 'fourniture';

export interface FeedProgramConfig {
  id: string;
  name: string;
  isNewStandard: boolean; // true pour le standard J1-J10, J11-J24, J25-J35
  phaseStarter: { startDay: number; endDay: number; feedType: string; packagingKg: number; bagPriceFcfa: number; calculatedPricePerKg: number; };
  phaseGrower: { startDay: number; endDay: number; formulaId: string; };
  phaseFinisher: { startDay: number; endDay: number; formulaId: string; };
  notes: string;
}

export interface WeightTargetConfig {
  targetAgeDays: number; // 35
  minWeightGrams: number; // 2100 g
  maxWeightGrams: number; // 2200 g
  description: string;
}

export interface NutritionalProfile {
  energyKcalKg?: number; // Énergie métabolisable (EM kcal/kg)
  crudeProteinPercent?: number; // Protéine Brute (PB %)
  digestibleLysinePercent?: number; // Lysine digestible (%) - non totale
  digestibleMethioninePercent?: number; // Méthionine digestible (%) - non totale
  calciumPercent?: number; // Calcium (Ca %)
  availablePhosphorusPercent?: number; // Phosphore disponible (P disp. %) - non total
  crudeFiberPercent?: number; // Cellulose brute (%)
}

export interface IngredientDefinition {
  id: string;
  name: string;
  typeOrForm: string; // Ex: 'Grain broyé', 'Tourteau déshuilé', 'Son de blé', 'Poudre minérale'
  unit: string; // 'kg'
  refPriceFcfaKg?: number; // Prix par kg (optionnel, peut être non renseigné)
  supplier?: string;
  nutrition?: NutritionalProfile;
  dataSource?: string; // Ex: 'INRAE Avicole', 'Table PDF Bélier', 'Analyse Lanada'
  maxIncorporationPercent?: number; // Limite d'incorporation maximale (%)
  incorporationJustification?: string; // Justification nutritionnelle / digestive
  isAdditiveOrMineral?: boolean; // Indicateur pour prémix, minéraux, acides aminés
}

export interface IngredientProportion {
  ingredientId?: string;
  name: string;
  typeOrForm?: string;
  quantityKg100: number; // Quantité pour 100 kg
  refPriceFcfaKg?: number; // Prix de référence (optionnel si non renseigné !)
  nutrition?: NutritionalProfile;
  notes?: string;
  stockItemId?: string;
  maxIncorporationPercent?: number;
}

export interface FormulaHistoryEntry {
  id: string;
  version: string;
  date: string;
  author?: string;
  changeReason?: string;
  status: FormulaStatus;
  validatorName?: string;
  validationDate?: string;
  ingredients: IngredientProportion[];
  calculatedCostPer100Kg?: number;
  calculatedCostPerKg?: number;
  isCostComplete: boolean;
  totalWeightKg: number;
}

export interface FeedFormula {
  id: string;
  code: string;
  name?: string;
  version: string;
  phase: 'Croissance' | 'Finition' | 'Démarrage Industriel' | 'Personnalisée';
  isIndustrialProduct?: boolean; // Pour l'aliment industriel : produit fini non modifiable directement
  parentFormulaId?: string; // Si variante d'une recette d'origine
  parentVersion?: string;
  source: string; // Ex: 'Formules_Alimentaires_Poulet_de_Chair.pdf'
  ingredients: IngredientProportion[];
  calculatedCostPer100Kg?: number; // 29009 ou 30160 (undefined si incomplet)
  calculatedCostPerKg?: number; // 290.09 ou 301.60
  isCostComplete?: boolean; // false si au moins 1 ingrédient n'a pas de prix
  missingPriceIngredients?: string[];
  status: FormulaStatus;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  changeReason?: string;
  validatorName?: string;
  validationDate?: string;
  missingNutritionalDataNotes: string[];
  notes?: string;
  history?: FormulaHistoryEntry[];
  appliedBatches?: {
    batchId: string;
    batchName?: string;
    effectiveDate: string;
    appliedAt: string;
  }[];
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  quantityOnHand: number;
  unit: 'kg' | 'sac_25kg' | 'litre' | 'dose' | 'flacon' | 'unite';
  brand?: string;
  supplier?: string;
  lotNumber?: string;
  unitCostFcfa: number;
  reorderAlertLevel: number;
  storageConditions?: string;
  purchaseDate?: string;
  expiryDate?: string;
  openedDate?: string;
  isExpired?: boolean;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  date: string;
  type: 'achat' | 'consommation' | 'fabrication_entree' | 'fabrication_sortie' | 'perte_ajustement' | 'retour';
  quantity: number;
  unit: string;
  unitCostFcfa: number;
  totalCostFcfa: number;
  batchId?: string;
  referenceLot?: string;
  reasonOrNotes: string;
  operator?: string;
}

export interface FeedManufacturingLog {
  id: string;
  formulaId: string;
  formulaVersion: string;
  date: string;
  plannedQuantityKg: number;
  actualProducedQuantityKg: number;
  operator: string;
  ingredientsUsed: {
    ingredientName: string;
    plannedKg: number;
    actualWeighedKg: number;
    stockLotNumber?: string;
  }[];
  grindingCostFcfa: number;
  mixingCostFcfa: number;
  transportCostFcfa: number;
  rawMaterialsCostFcfa: number;
  totalManufacturingCostFcfa: number;
  costPerKgFcfa: number;
  batchId?: string;
  notes?: string;
}

export interface WeightLog {
  id: string;
  day: number;
  date: string; // YYYY-MM-DD
  birdsWeighedCount?: number;
  totalWeightGrams?: number;
  weight: number; // Poids moyen en grammes
  notes?: string;
  ageDaysCalculated?: number;
}

export interface MortalityLog {
  id: string;
  date: string; // YYYY-MM-DD
  count: number;
  cause?: string;
  notes?: string;
}

export interface FlockMovement {
  id: string;
  date: string;
  type: 'entree' | 'mortalite' | 'vente_vif' | 'sortie_abattage' | 'autre_sortie';
  quantity: number;
  reason: string;
  operator?: string;
}

export interface HealthProtocolItem {
  id: string;
  targetDisease: string;
  productName: string;
  category: HealthProductCategory;
  plannedDayStart: number;
  plannedDayEnd: number;
  routeOfAdministration: 'eau_de_boisson' | 'goutte_oculaire' | 'nebulisation' | 'injection' | 'aliment' | 'autre';
  standardDose: string;
  instructionsNotice: string;
  withdrawalPeriodDays: number;
  boissonChecklist?: {
    waterQualityVerified: boolean;
    disinfectantNeutralized: boolean;
    thirstDurationHours: number;
    consumptionTimeLimitHours: number;
  };
  sourceNoticeRef: string;
  validatingVetName?: string;
  validatingVetDate?: string;
}

export interface HealthAdministrationLog {
  id: string;
  protocolItemId?: string;
  batchId: string;
  category: HealthProductCategory;
  productName: string;
  lotManufacturer: string;
  expiryDate?: string;
  date: string;
  time?: string;
  effectiveAgeDays: number;
  birdsTreatedCount: number;
  dosesOrQuantityUsed: number;
  unit: 'doses' | 'ml' | 'g' | 'litres' | 'flacons';
  operator: string;
  conservationConditionsChecked: boolean;
  withdrawalPeriodDays: number;
  withdrawalEndDate: string;
  isWithdrawalActive: boolean;
  status: SanitaryTaskStatus;
  observationsIncidents?: string;
}

export interface SalePayment {
  id: string;
  date: string;
  amountFcfa: number;
  paymentMethod: 'especes' | 'virement' | 'mobile_money' | 'cheque';
  reference?: string;
}

export interface BatchSaleRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'live_bird' | 'live_weight' | 'cutting' | 'carcass_whole';
  label: string;
  birdsCountExited: number;
  quantitySold: number;
  unitPriceFcfa: number;
  totalSalePriceFcfa: number;
  payments: SalePayment[];
  amountPaidFcfa: number;
  amountDueFcfa: number;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  // Aliases for backward compatibility
  client?: string;
  totalRevenueFcfa?: number;
  quantity?: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Poussins' | 'Aliment Industriel' | 'Matières Premières' | 'Santé & Vaccins' | 'Litière' | 'Chauffage & Gaz' | 'Transport' | 'Main d\'œuvre' | 'Autre';
  description: string;
  amountFcfa: number;
  supplier?: string;
  invoiceOrReceiptRef?: string;
  batchId?: string;
}

export interface DailyLogEntry {
  id: string;
  batchId: string;
  date: string;
  ageDays: number;
  mortalityCount: number;
  mortalityCause?: string;
  feedDistributedKg: number;
  feedDistributedType: string;
  waterLiters?: number;
  birdsWeighedCount?: number;
  averageWeightGrams?: number;
  healthTreatmentsGiven?: string;
  generalObservations?: string;
  temperatureCelsius?: number;
  operator?: string;
}

export interface FeedPreparationLog {
  id: string;
  date: string;
  phase: string;
  quantityKg: number;
  costFcfa: number;
  notes?: string;
}

export interface ExtraExpenseLog {
  id: string;
  date: string;
  category: string;
  description: string;
  amountFcfa: number;
}

export interface PoultryBatch {
  id: string;
  name: string;
  initialSize: number; // Entier strictement positif
  startDate: string; // YYYY-MM-DD
  receptionAgeDays?: number;
  strain?: string;
  hatcheryName?: string;
  hatchingDate?: string;
  hatcheryVaccinationsDone?: string[];
  
  feedProgramId?: string;
  hasAdoptedNewProgram?: boolean;

  targetWeightMinGrams?: number;
  targetWeightMaxGrams?: number;
  targetAgeDays?: number;

  mortalities: MortalityLog[];
  weights: WeightLog[];
  flockMovements?: FlockMovement[];
  dailyLogs?: DailyLogEntry[];
  sales?: BatchSaleRecord[];
  expenses?: ExpenseRecord[];
  healthLogs?: HealthAdministrationLog[];
  
  // Backward compatibility
  feedPreparations?: FeedPreparationLog[];
  extraExpenses?: ExtraExpenseLog[];
  completedSanitaryTasks?: any[];

  status: BatchStatus;
  completionDate?: string;
  soldRevenue?: number;
  soldRevenueHistorical?: number;
  notes?: string;
  deletedAt?: string;
}

export interface CuttingYield {
  pieceName: string;
  percentageLiveWeight: number; // %
  weightPerSubjectKg: number; // pour un sujet moyen
  unitPriceFcfaKg: number;
  isPerUnit?: boolean;
}

export interface TechnicalParams {
  chickUnitPriceFcfa: number; // 630
  healthUnitPriceFcfa: number; // 150
  feedIndustrial25kgBagFcfa: number; // 15000 FCFA
  feedIndustrialPerKgFcfa: number; // 600 FCFA/kg
  feedCostPerKg: {
    'Démarrage Industriel'?: number;
    'Croissance': number;
    'Finition': number;
    'Prédémarrage Historique'?: number;
    Prédémarrage?: number;
    Démarrage?: number;
    [key: string]: number | undefined;
  };
}

export interface AppBackupData {
  version: string;
  exportDate: string;
  appTitle?: string;
  batches: PoultryBatch[];
  formulas?: FeedFormula[];
  stockItems?: StockItem[];
  stockMovements?: StockMovement[];
  healthProtocols?: HealthProtocolItem[];
  technicalParams?: TechnicalParams;
  cuttingYields?: CuttingYield[];
}
