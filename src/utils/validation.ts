import { PoultryBatch, AppBackupData } from '../types';
import { calendarDaysBetween, getTodayDateStr } from './dateUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valide les informations de création ou mise à jour d'un lot
 */
export function validateBatchForm(data: {
  name: string;
  initialSize: number | string;
  startDate: string;
}): ValidationResult {
  const errors: string[] = [];

  const cleanName = (data.name || '').trim();
  if (!cleanName) {
    errors.push('Le nom du lot est obligatoire.');
  } else if (cleanName.length < 2) {
    errors.push('Le nom du lot doit comporter au moins 2 caractères.');
  }

  const size = typeof data.initialSize === 'number' ? data.initialSize : parseInt(data.initialSize, 10);
  if (isNaN(size) || !Number.isInteger(size) || size <= 0) {
    errors.push("L'effectif initial doit être un nombre entier strictement positif (ex: 150, 200).");
  } else if (size > 50000) {
    errors.push("L'effectif dépasse la capacité maximale autorisée (50 000 sujets).");
  }

  if (!data.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate)) {
    errors.push('La date de mise en place est invalide (format requis : AAAA-MM-JJ).');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valide la saisie d'une mortalité
 */
export function validateMortality(
  count: number | string,
  currentLiveSubjects: number,
  logDateStr: string,
  batchStartDateStr: string
): ValidationResult {
  const errors: string[] = [];

  const parsedCount = typeof count === 'number' ? count : parseInt(count, 10);
  if (isNaN(parsedCount) || !Number.isInteger(parsedCount) || parsedCount <= 0) {
    errors.push('Le nombre de sujets morts doit être un entier positif (minimum 1).');
  } else if (parsedCount > currentLiveSubjects) {
    errors.push(`Impossible de déclarer ${parsedCount} pertes : il ne reste que ${currentLiveSubjects} sujet(s) vivant(s) dans ce lot.`);
  }

  if (logDateStr && batchStartDateStr) {
    if (calendarDaysBetween(batchStartDateStr, logDateStr) < 0) {
      errors.push('La date de mortalité ne peut pas être antérieure à la date de mise en place du lot.');
    }
    const today = getTodayDateStr();
    if (calendarDaysBetween(today, logDateStr) > 0) {
      errors.push('La date de déclaration ne peut pas être située dans le futur.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valide la pesée
 */
export function validateWeight(
  weightGrams: number | string,
  day: number,
  batchStartDateStr: string,
  logDateStr?: string
): ValidationResult {
  const errors: string[] = [];

  const parsedWeight = typeof weightGrams === 'number' ? weightGrams : parseFloat(weightGrams);
  if (isNaN(parsedWeight) || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
    errors.push('Le poids moyen doit être un nombre fini strictement positif (ex: 560 g).');
  } else if (parsedWeight > 7000) {
    errors.push('Le poids saisi semble anormalement élevé (> 7 000 g). Veuillez vérifier la valeur.');
  }

  if (day < 1) {
    errors.push('Le jour de pesée doit être au moins le Jour 1 (J1).');
  }

  if (logDateStr && batchStartDateStr) {
    if (calendarDaysBetween(batchStartDateStr, logDateStr) < 0) {
      errors.push('La date de pesée ne peut pas être antérieure à la mise en place du lot.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valide la préparation d'aliment
 */
export function validateFeedPreparation(
  quantityKg: number | string,
  costFcfa: number | string
): ValidationResult {
  const errors: string[] = [];

  const qty = typeof quantityKg === 'number' ? quantityKg : parseFloat(quantityKg);
  if (isNaN(qty) || !Number.isFinite(qty) || qty <= 0) {
    errors.push("La quantité d'aliment doit être un nombre strictement supérieur à zéro (ex: 45 kg).");
  }

  const cost = typeof costFcfa === 'number' ? costFcfa : parseFloat(costFcfa);
  if (isNaN(cost) || !Number.isFinite(cost) || cost < 0) {
    errors.push('Le coût de fabrication doit être un montant positif ou nul.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valide une dépense annexe
 */
export function validateExtraExpense(
  description: string,
  amountFcfa: number | string
): ValidationResult {
  const errors: string[] = [];

  if (!description || !description.trim()) {
    errors.push('La description de la dépense est requise.');
  }

  const amount = typeof amountFcfa === 'number' ? amountFcfa : parseFloat(amountFcfa);
  if (isNaN(amount) || !Number.isFinite(amount) || amount <= 0) {
    errors.push('Le montant de la dépense doit être un nombre positif non nul.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valide une vente de sujets ou carcasses
 */
export function validateSaleRecord(
  quantity: number | string,
  unitPriceFcfa: number | string,
  activeSubjects: number,
  type: string
): ValidationResult {
  const errors: string[] = [];

  const qty = typeof quantity === 'number' ? quantity : parseFloat(quantity);
  if (isNaN(qty) || !Number.isFinite(qty) || qty <= 0) {
    errors.push('La quantité vendue doit être un nombre strictement positif.');
  } else if (type === 'live_bird' && qty > activeSubjects) {
    errors.push(`Vous ne pouvez pas vendre ${qty} poulets vivants : seulement ${activeSubjects} sujet(s) sont disponibles.`);
  }

  const price = typeof unitPriceFcfa === 'number' ? unitPriceFcfa : parseFloat(unitPriceFcfa);
  if (isNaN(price) || !Number.isFinite(price) || price < 0) {
    errors.push('Le prix unitaire doit être un montant positif.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valide un fichier de sauvegarde JSON importé
 */
export function validateImportedData(data: any): {
  isValid: boolean;
  errors: string[];
  parsedBatches?: PoultryBatch[];
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Le fichier importé n’est pas un objet JSON valide.'] };
  }

  const batches = Array.isArray(data) ? data : (Array.isArray(data.batches) ? data.batches : null);

  if (!batches) {
    return { isValid: false, errors: ['Aucune liste de lots ("batches") trouvée dans le fichier JSON.'] };
  }

  const validatedBatches: PoultryBatch[] = [];

  for (let i = 0; i < batches.length; i++) {
    const b = batches[i];
    if (!b.id || typeof b.id !== 'string') {
      errors.push(`Lot index ${i} : identifiant ("id") manquant ou invalide.`);
      continue;
    }
    if (!b.name || typeof b.name !== 'string' || !b.name.trim()) {
      errors.push(`Lot "${b.id}" : le nom est manquant.`);
      continue;
    }
    const size = Number(b.initialSize);
    if (isNaN(size) || size <= 0) {
      errors.push(`Lot "${b.name}" : effectif initial invalide (${b.initialSize}).`);
      continue;
    }
    if (!b.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(b.startDate)) {
      errors.push(`Lot "${b.name}" : date de démarrage invalide (${b.startDate}).`);
      continue;
    }

    validatedBatches.push({
      id: b.id,
      name: b.name.trim(),
      initialSize: Math.round(size),
      startDate: b.startDate,
      mortalities: Array.isArray(b.mortalities) ? b.mortalities.map((m: any) => ({
        id: m.id || 'm_' + Math.random(),
        date: m.date || b.startDate,
        count: Math.max(0, parseInt(m.count, 10) || 0),
        cause: m.cause || ''
      })) : [],
      weights: Array.isArray(b.weights) ? b.weights.map((w: any) => ({
        id: w.id || 'w_' + Math.random(),
        day: Math.max(1, parseInt(w.day, 10) || 1),
        weight: Math.max(1, parseFloat(w.weight) || 40),
        date: w.date || b.startDate,
        notes: w.notes || ''
      })) : [],
      feedPreparations: Array.isArray(b.feedPreparations) ? b.feedPreparations.map((f: any) => ({
        id: f.id || 'f_' + Math.random(),
        date: f.date || b.startDate,
        phase: f.phase || 'Croissance',
        quantityKg: Math.max(0, parseFloat(f.quantityKg) || 0),
        costFcfa: Math.max(0, parseFloat(f.costFcfa) || 0),
        notes: f.notes || ''
      })) : [],
      extraExpenses: Array.isArray(b.extraExpenses) ? b.extraExpenses.map((e: any) => ({
        id: e.id || 'e_' + Math.random(),
        date: e.date || b.startDate,
        category: e.category || 'Autre',
        description: e.description || '',
        amountFcfa: Math.max(0, parseFloat(e.amountFcfa) || 0)
      })) : [],
      sales: Array.isArray(b.sales) ? b.sales.map((s: any) => ({
        id: s.id || 's_' + Math.random(),
        date: s.date || b.startDate,
        type: s.type || 'cutting',
        label: s.label || 'Vente',
        quantity: Math.max(0, parseFloat(s.quantity) || 0),
        unitPriceFcfa: Math.max(0, parseFloat(s.unitPriceFcfa) || 0),
        totalRevenueFcfa: Math.max(0, parseFloat(s.totalRevenueFcfa) || 0),
        client: s.client || ''
      })) : [],
      completedSanitaryTasks: Array.isArray(b.completedSanitaryTasks) ? b.completedSanitaryTasks : [],
      status: b.status === 'completed' ? 'completed' : (b.status === 'planned' ? 'planned' : 'active'),
      completionDate: b.completionDate,
      soldRevenue: b.soldRevenue ? Number(b.soldRevenue) : undefined,
      notes: b.notes,
      deletedAt: b.deletedAt
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsedBatches: validatedBatches
  };
}
