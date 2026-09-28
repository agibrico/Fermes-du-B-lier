import { FeedPhase, FeedIngredient, CuttingYield, TechnicalParams } from './types';

export interface FeedPhaseGuide {
  phase: FeedPhase;
  daysLabel: string;
  startDay: number;
  endDay: number;
  durationDays: number;
  rationPerSubjectGrams: number; // Cumulative ration for the phase
  feedType: string;
  targetWeightGrams: number;
  targetCarcassWeightGrams?: number;
}

export const FEED_PHASE_GUIDES: FeedPhaseGuide[] = [
  {
    phase: 'Prédémarrage',
    daysLabel: 'J1 à J10',
    startDay: 1,
    endDay: 10,
    durationDays: 10,
    rationPerSubjectGrams: 450,
    feedType: 'Industriel (Miettes du commerce)',
    targetWeightGrams: 310,
  },
  {
    phase: 'Démarrage',
    daysLabel: 'J11 à J14',
    startDay: 11,
    endDay: 14,
    durationDays: 4,
    rationPerSubjectGrams: 450,
    feedType: 'Maison (Formule améliorée)',
    targetWeightGrams: 560,
  },
  {
    phase: 'Croissance',
    daysLabel: 'J15 à J28',
    startDay: 15,
    endDay: 28,
    durationDays: 14,
    rationPerSubjectGrams: 1600,
    feedType: 'Maison (Formule améliorée)',
    targetWeightGrams: 1520,
    targetCarcassWeightGrams: 1125,
  },
  {
    phase: 'Finition',
    daysLabel: 'J29 à J35',
    startDay: 29,
    endDay: 35,
    durationDays: 7,
    rationPerSubjectGrams: 1000,
    feedType: 'Maison (Formule améliorée)',
    targetWeightGrams: 2400,
    targetCarcassWeightGrams: 1776,
  },
];

export const FEED_INGREDIENTS_100KG: FeedIngredient[] = [
  { name: 'Maïs jaune', demarrageKg: 53.0, croissanceKg: 56.0, finitionKg: 60.0, roleAndAdjustment: 'Base d\'amidon et d\'énergie métabolisable.' },
  { name: 'Tourteau de Soja (46%)', demarrageKg: 35.5, croissanceKg: 31.0, finitionKg: 25.5, roleAndAdjustment: 'Source principale de protéines digestibles.' },
  { name: 'Son de blé / maïs', demarrageKg: 4.0, croissanceKg: 5.0, finitionKg: 6.0, roleAndAdjustment: 'Fibres pour le transit intestinal.' },
  { name: 'Huile végétale', demarrageKg: 2.0, croissanceKg: 2.5, finitionKg: 3.0, roleAndAdjustment: 'Boosté (+0,5%) pour augmenter la densité énergétique.' },
  { name: 'Coquillage broyé', demarrageKg: 1.5, croissanceKg: 1.6, finitionKg: 1.7, roleAndAdjustment: 'Source principale de calcium digestible.' },
  { name: 'Phosphate Bicalcique (DCP)', demarrageKg: 2.5, croissanceKg: 2.0, finitionKg: 1.5, roleAndAdjustment: 'Phosphore disponible pour la solidité des pattes.' },
  { name: 'Sel fin', demarrageKg: 0.3, croissanceKg: 0.3, finitionKg: 0.3, roleAndAdjustment: 'Électrolytes et stimulation de la boisson.' },
  { name: 'Prémix (0,5%)', demarrageKg: 0.5, croissanceKg: 0.5, finitionKg: 0.5, roleAndAdjustment: 'Vitamines de base et oligo-éléments essentiels.' },
  { name: 'DL-Méthionine (99%)', demarrageKg: 0.30, croissanceKg: 0.25, finitionKg: 0.20, roleAndAdjustment: '+50g : Sécurise un plumage uniforme très rapide.' },
  { name: 'L-Lysine HCl', demarrageKg: 0.25, croissanceKg: 0.20, finitionKg: 0.15, roleAndAdjustment: '+50g : Augmente le rendement en filet de poitrine.' },
  { name: 'Complexe Multi-Enzymatique', demarrageKg: 0.10, croissanceKg: 0.10, finitionKg: 0.10, roleAndAdjustment: 'Maximise la valorisation du soja et du son de blé.' },
  { name: 'Phytase', demarrageKg: 0.05, croissanceKg: 0.05, finitionKg: 0.05, roleAndAdjustment: 'Libère le phosphore végétal bloqué dans les matières.' },
  { name: 'Capteur de Mycotoxines', demarrageKg: 0.10, croissanceKg: 0.10, finitionKg: 0.10, roleAndAdjustment: 'Bloque les aflatoxines et protège le foie des oiseaux.' },
];

export interface SanitaryDayGuide {
  dayStart: number;
  dayEnd: number;
  label: string;
  prophylaxis: string;
  vitamines: string;
}

export const SANITARY_CALENDAR: SanitaryDayGuide[] = [
  { dayStart: 1, dayEnd: 3, label: 'J1 à J3', prophylaxis: 'Arrivée des poussins au poulailler', vitamines: 'Vitamines Démarrage + Antistress non-stop.' },
  { dayStart: 4, dayEnd: 5, label: 'J4 à J5', prophylaxis: 'Prévention bactérienne (infection ombilicale)', vitamines: 'Vitamines + Antibiotique large spectre.' },
  { dayStart: 6, dayEnd: 10, label: 'J6 à J10', prophylaxis: 'Fin de la phase critique initiale', vitamines: 'Vitamines de croissance en continu (totalise 10 jours).' },
  { dayStart: 11, dayEnd: 11, label: 'J11', prophylaxis: 'Vaccin 1 : Peste + Bronchite (H120) (le matin)', vitamines: 'Eau claire le matin. Vitamines de soutien l\'après-midi.' },
  { dayStart: 12, dayEnd: 13, label: 'J12 à J13', prophylaxis: 'Soutien immunitaire post-vaccin 1', vitamines: 'Vitamines d\'accompagnement pendant 48 heures.' },
  { dayStart: 14, dayEnd: 14, label: 'J14', prophylaxis: 'Vaccin 2 : Gumboro Intermédiaire (le matin)', vitamines: 'Eau claire le matin. Vitamines de soutien l\'après-midi.' },
  { dayStart: 15, dayEnd: 16, label: 'J15 à J16', prophylaxis: 'Transition vers la croissance + Post-vaccin 2', vitamines: 'Vitamines d\'accompagnement pendant 48 heures.' },
  { dayStart: 17, dayEnd: 19, label: 'J17 à J19', prophylaxis: 'Prévention médicale anticoccidienne (litière humide)', vitamines: 'Anticoccidien dans l\'eau de boisson (sans vitamines).' },
  { dayStart: 20, dayEnd: 20, label: 'J20', prophylaxis: 'Repos métabolique', vitamines: 'Eau claire uniquement.' },
  { dayStart: 21, dayEnd: 21, label: 'J21', prophylaxis: 'Rappel Vaccin : Gumboro Forte (ou rappel)', vitamines: 'Eau claire le matin. Vitamines de soutien l\'après-midi.' },
  { dayStart: 22, dayEnd: 23, label: 'J22 à J23', prophylaxis: 'Soutien immunitaire post-vaccin 3', vitamines: 'Vitamines d\'accompagnement pendant 48 heures.' },
  { dayStart: 24, dayEnd: 27, label: 'J24 à J27', prophylaxis: 'Explosion de la masse musculaire', vitamines: 'Eau claire alternativement avec un protecteur hépatique.' },
  { dayStart: 28, dayEnd: 28, label: 'J28', prophylaxis: 'Rappel Vaccin : Peste (Lasota)', vitamines: 'Eau claire le matin. Vitamines de soutien l\'après-midi.' },
  { dayStart: 29, dayEnd: 30, label: 'J29 à J30', prophylaxis: 'Soutien post-vaccin + Transition Finition', vitamines: 'Vitamines d\'accompagnement pendant 48 heures.' },
  { dayStart: 31, dayEnd: 35, label: 'J31 à J35', prophylaxis: 'Derniers jours avant commercialisation', vitamines: 'EAU CLAIRE STRICTEMENT UNIQUEMENT (Zéro résidu).' },
];

export const CUTTING_YIELDS_STANDARD: CuttingYield[] = [
  { pieceName: 'Escalopes (Poitrine sans os)', percentageLiveWeight: 24.0, weightPerSubjectKg: 0.576, unitPriceFcfaKg: 3000 },
  { pieceName: 'Cuisses (avec os et peau)', percentageLiveWeight: 25.0, weightPerSubjectKg: 0.600, unitPriceFcfaKg: 2200 },
  { pieceName: 'Ailes', percentageLiveWeight: 8.0, weightPerSubjectKg: 0.192, unitPriceFcfaKg: 2500 },
  { pieceName: 'Ensemble Tête-Cou-Dos', percentageLiveWeight: 18.0, weightPerSubjectKg: 0.432, unitPriceFcfaKg: 1000 },
  { pieceName: 'Foie', percentageLiveWeight: 2.0, weightPerSubjectKg: 0.048, unitPriceFcfaKg: 1000 },
  { pieceName: 'Pattes (Paires)', percentageLiveWeight: 0, weightPerSubjectKg: 0, unitPriceFcfaKg: 50, isPerUnit: true }, // 2 units
  { pieceName: 'Gésier', percentageLiveWeight: 0, weightPerSubjectKg: 0, unitPriceFcfaKg: 100, isPerUnit: true }, // 1 unit
];

export const TECHNICAL_PARAMS_DEFAULT: TechnicalParams = {
  chickUnitPriceFcfa: 630, // 630 FCFA per subject (with 5% mortality amortized)
  healthUnitPriceFcfa: 150, // 150 FCFA per subject
  feedCostPerKg: {
    Prédémarrage: 400, // commercial
    Démarrage: 285, // house improved
    Croissance: 285,
    Finition: 285,
  }
};

export interface RotationScenario {
  name: string;
  subjects: number; // 150, 200, 250
  totalPresentInRotation: number; // 450, 600, 750 (over 3 cohorts simultaneously)
  poussinInvestment10d: number; // chicks bought every 10 days
  workingCapitalRequired: number; // feed & prophylaxis required
  expectedRevenue10d: number; // revenue every 10 days
  netMonthlyProfit: number; // recurrent net monthly profit
}

export const ROTATION_SCENARIOS: RotationScenario[] = [
  {
    name: 'Rotation 150 sujets',
    subjects: 150,
    totalPresentInRotation: 450,
    poussinInvestment10d: 94500,
    workingCapitalRequired: 274388,
    expectedRevenue10d: 631200,
    netMonthlyProfit: 1070436,
  },
  {
    name: 'Rotation 200 sujets',
    subjects: 200,
    totalPresentInRotation: 600,
    poussinInvestment10d: 126000,
    workingCapitalRequired: 365850,
    expectedRevenue10d: 841600,
    netMonthlyProfit: 1427250,
  },
  {
    name: 'Rotation 250 sujets',
    subjects: 250,
    totalPresentInRotation: 750,
    poussinInvestment10d: 157500,
    workingCapitalRequired: 457312,
    expectedRevenue10d: 1052000,
    netMonthlyProfit: 1784064,
  }
];

export const ADVICE_BIOSAFETY = "Avoir 3 âges de volailles dans le même poulailler augmente considérablement le risque sanitaire. Les micro-organismes du plus grand infectent très facilement les nouveau-nés. Règle d'or absolue : Séparez hermétiquement les compartiments de votre poulailler par des bâches de plastique imperméables et respectez toujours l'ordre de distribution : commencez à soigner les plus jeunes (J1 à J10) et terminez par les plus âgés (J29 à J35).";
