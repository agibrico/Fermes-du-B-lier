import { PoultryBatch, TechnicalParams, CuttingYield } from '../types';
import { getBatchAgeDays, calendarDaysBetween, getTodayDateStr } from './dateUtils';
import { WEIGHT_TARGET_DEFAULT } from '../data';

export interface BatchCalculations {
  status: 'planned' | 'active' | 'completed';
  ageDays: number;
  daysToStart: number;
  isOverdue: boolean;
  overdueDays: number;
  
  // Effectifs
  initialSize: number;
  totalMortalities: number;
  totalLiveSalesBirds: number;
  totalSlaughterExits: number;
  totalOtherExits: number;
  activeLiveSubjects: number; // effectif initial + entrees - mortalites - ventes_vif - sorties_abattage - autres
  mortalityRatePercent: number;

  // Pesées et Performances
  latestWeightGrams: number;
  latestWeightDate?: string;
  latestWeightAgeDays: number;
  daysSinceLastWeight: number;
  targetWeightMinGrams: number; // 2100
  targetWeightMaxGrams: number; // 2200
  weightVsTargetGrams: number; // écart par rapport à la moyenne cible interpolée
  gmqGramsPerDay: number; // Gain Moyen Quotidien

  // Alimentation et IC
  totalFeedDistributedKg: number;
  feedIndexIC: number | null; // null si données insuffisantes
  icDocumentation: string;

  // Santé et Sécurité Sanitaire
  activeWithdrawalRestrictionsCount: number;
  activeWithdrawalDetails: string[];
  isSafeForSlaughter: boolean;

  // Finances Distinctes
  expensesRealTotalFcfa: number;
  salesRealTotalFcfa: number;
  paymentsReceivedTotalFcfa: number; // Encaissements réels
  receivablesUnpaidFcfa: number; // Créances clients (ventes - paiements reçus)
  estimatedPotentialCuttingRevenueFcfa: number; // Prévision valorisation découpe sujets vivants restants
  netMarginRealizedFcfa: number; // Encaissements - Dépenses
  roiRealizedPercent: number;
}

/**
 * Calcule tous les indicateurs technico-économiques conformes aux règles de gestion
 */
export function calculateBatchMetrics(
  batch: PoultryBatch,
  technicalParams: TechnicalParams,
  cuttingYields: CuttingYield[],
  referenceDateStr?: string
): BatchCalculations {
  const todayStr = referenceDateStr || getTodayDateStr();
  const ageInfo = getBatchAgeDays(batch.startDate, batch.completionDate, todayStr);

  // 1. Calcul rigoureux des effectifs vivants présents
  const totalMortalities = (batch.mortalities || []).reduce((s, m) => s + (Number(m.count) || 0), 0);
  
  const totalLiveSalesBirds = (batch.sales || [])
    .filter(s => s.type === 'live_bird')
    .reduce((s, sale) => s + (Number(sale.birdsCountExited) || Number(sale.quantitySold) || 0), 0);

  const totalSlaughterExits = (batch.sales || [])
    .filter(s => s.type === 'cutting' || s.type === 'carcass_whole')
    .reduce((s, sale) => s + (Number(sale.birdsCountExited) || 0), 0);

  const totalOtherExits = (batch.flockMovements || [])
    .filter(m => m.type === 'autre_sortie')
    .reduce((s, m) => s + (Number(m.quantity) || 0), 0);

  const totalFlockEntries = (batch.flockMovements || [])
    .filter(m => m.type === 'entree')
    .reduce((s, m) => s + (Number(m.quantity) || 0), 0);

  const activeLiveSubjects = Math.max(
    0,
    batch.initialSize + totalFlockEntries - totalMortalities - totalLiveSalesBirds - totalSlaughterExits - totalOtherExits
  );

  const mortalityRatePercent = batch.initialSize > 0 
    ? (totalMortalities / batch.initialSize) * 100 
    : 0;

  // 2. Pesées et performances (Objectif 2 100 g - 2 200 g à J35)
  const targetMin = batch.targetWeightMinGrams || WEIGHT_TARGET_DEFAULT.minWeightGrams;
  const targetMax = batch.targetWeightMaxGrams || WEIGHT_TARGET_DEFAULT.maxWeightGrams;
  const targetAvgAt35 = (targetMin + targetMax) / 2; // 2150 g

  const sortedWeights = [...(batch.weights || [])].sort((a, b) => a.day - b.day);
  const latestWeightLog = sortedWeights.length > 0 ? sortedWeights[sortedWeights.length - 1] : null;
  const latestWeightGrams = latestWeightLog ? latestWeightLog.weight : 0;
  const latestWeightAgeDays = latestWeightLog ? latestWeightLog.day : 1;
  const latestWeightDate = latestWeightLog ? latestWeightLog.date : undefined;

  const daysSinceLastWeight = latestWeightDate 
    ? Math.max(0, calendarDaysBetween(latestWeightDate, todayStr))
    : 0;

  // Gain Moyen Quotidien (GMQ en g/j)
  let gmqGramsPerDay = 0;
  if (sortedWeights.length >= 2) {
    const firstW = sortedWeights[0];
    const lastW = sortedWeights[sortedWeights.length - 1];
    const daysBetween = Math.max(1, lastW.day - firstW.day);
    gmqGramsPerDay = (lastW.weight - firstW.weight) / daysBetween;
  } else if (sortedWeights.length === 1 && sortedWeights[0].day > 1) {
    // Si une seule pesée après J1, comparaison avec poids départ ~42g
    gmqGramsPerDay = (sortedWeights[0].weight - 42) / (sortedWeights[0].day - 1);
  }

  // Écart par rapport à la cible interpolée au jour de la pesée
  // Courbe de croissance indicative adaptée pour 2 150g à J35
  const interpolatedTargetGrams = latestWeightAgeDays >= 35 
    ? targetAvgAt35 
    : 42 + (targetAvgAt35 - 42) * Math.pow(latestWeightAgeDays / 35, 1.3);
  
  const weightVsTargetGrams = latestWeightGrams > 0 
    ? latestWeightGrams - interpolatedTargetGrams 
    : 0;

  // 3. Alimentation et Indice de Consommation (IC)
  // Total aliment distribué selon les journaux quotidiens ou préparations enregistrées
  const feedFromDailyLogs = (batch.dailyLogs || []).reduce((s, l) => s + (Number(l.feedDistributedKg) || 0), 0);
  const totalFeedDistributedKg = feedFromDailyLogs;

  // Formule documentée de l'IC :
  // Numérateur : Kg total d'aliment distribué
  // Dénominateur : Gain total de biomasse vive (Kg) des oiseaux vivants + sortis
  let feedIndexIC: number | null = null;
  let icDocumentation = '';

  if (totalFeedDistributedKg > 0 && latestWeightGrams > 42 && activeLiveSubjects > 0) {
    const liveBiomassGainKg = (activeLiveSubjects * (latestWeightGrams - 42)) / 1000;
    // Ajout du gain estimé des oiseaux vendus vivants
    const soldBirdsGainKg = (totalLiveSalesBirds * (latestWeightGrams - 42)) / 1000;
    const totalGainKg = liveBiomassGainKg + soldBirdsGainKg;

    if (totalGainKg > 0) {
      feedIndexIC = totalFeedDistributedKg / totalGainKg;
      icDocumentation = `IC = ${totalFeedDistributedKg.toFixed(1)} kg aliment / ${totalGainKg.toFixed(1)} kg gain vif cumulé.`;
    } else {
      icDocumentation = 'Données de gain de poids insuffisantes pour un IC fiable.';
    }
  } else {
    icDocumentation = 'Aliment distribué ou pesée manquante pour le calcul de l\'IC.';
  }

  // 4. Santé et Délais d'Attente (Withdrawal Periods)
  const activeWithdrawalDetails: string[] = [];
  (batch.healthLogs || []).forEach(log => {
    if (log.withdrawalPeriodDays > 0 && log.withdrawalEndDate) {
      if (calendarDaysBetween(todayStr, log.withdrawalEndDate) >= 0) {
        activeWithdrawalDetails.push(
          `${log.productName} (Fin du délai d'attente : ${log.withdrawalEndDate})`
        );
      }
    }
  });
  const isSafeForSlaughter = activeWithdrawalDetails.length === 0;

  // 5. Finances Distinctes
  const expensesRealTotalFcfa = (batch.expenses || []).reduce((s, e) => s + (Number(e.amountFcfa) || 0), 0);
  
  // Ventes totales facturées
  const salesRealTotalFcfa = (batch.sales || []).reduce((s, sale) => s + (Number(sale.totalSalePriceFcfa) || 0), 0);
  
  // Encaissements réels (somme des paiements perçus)
  const paymentsReceivedTotalFcfa = (batch.sales || []).reduce((s, sale) => {
    const paymentsSum = (sale.payments || []).reduce((pSum, p) => pSum + (Number(p.amountFcfa) || 0), 0);
    return s + (sale.amountPaidFcfa ? Number(sale.amountPaidFcfa) : paymentsSum);
  }, 0);

  // Créances clients (somme des soldes dus impayés)
  const receivablesUnpaidFcfa = Math.max(0, salesRealTotalFcfa - paymentsReceivedTotalFcfa);

  // Estimation de valorisation à la découpe des sujets restants
  const avgBirdWeightKg = latestWeightGrams > 0 ? (latestWeightGrams / 1000) : (targetAvgAt35 / 1000);
  let cuttingValuePerBird = 0;
  (cuttingYields || []).forEach(piece => {
    if (piece.isPerUnit) {
      if (piece.pieceName.toLowerCase().includes('patte')) {
        cuttingValuePerBird += piece.unitPriceFcfaKg * 2;
      } else {
        cuttingValuePerBird += piece.unitPriceFcfaKg;
      }
    } else {
      const pieceWeightKg = avgBirdWeightKg * ((piece.percentageLiveWeight || 0) / 100);
      cuttingValuePerBird += pieceWeightKg * piece.unitPriceFcfaKg;
    }
  });

  const estimatedPotentialCuttingRevenueFcfa = Math.round(cuttingValuePerBird * activeLiveSubjects);

  // Marge nette réalisée (Encaissements réels reçus - Dépenses réelles)
  const netMarginRealizedFcfa = paymentsReceivedTotalFcfa - expensesRealTotalFcfa;
  const roiRealizedPercent = expensesRealTotalFcfa > 0 
    ? (netMarginRealizedFcfa / expensesRealTotalFcfa) * 100 
    : 0;

  return {
    status: ageInfo.status,
    ageDays: ageInfo.ageDays,
    daysToStart: ageInfo.daysToStart,
    isOverdue: ageInfo.isOverdue,
    overdueDays: ageInfo.overdueDays,
    initialSize: batch.initialSize,
    totalMortalities,
    totalLiveSalesBirds,
    totalSlaughterExits,
    totalOtherExits,
    activeLiveSubjects,
    mortalityRatePercent,
    latestWeightGrams,
    latestWeightDate,
    latestWeightAgeDays,
    daysSinceLastWeight,
    targetWeightMinGrams: targetMin,
    targetWeightMaxGrams: targetMax,
    weightVsTargetGrams,
    gmqGramsPerDay,
    totalFeedDistributedKg,
    feedIndexIC,
    icDocumentation,
    activeWithdrawalRestrictionsCount: activeWithdrawalDetails.length,
    activeWithdrawalDetails,
    isSafeForSlaughter,
    expensesRealTotalFcfa,
    salesRealTotalFcfa,
    paymentsReceivedTotalFcfa,
    receivablesUnpaidFcfa,
    estimatedPotentialCuttingRevenueFcfa,
    netMarginRealizedFcfa,
    roiRealizedPercent
  };
}
