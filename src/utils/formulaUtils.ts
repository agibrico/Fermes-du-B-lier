/**
 * Utilitaires de formulation, de calcul des coûts, de contrôle des 100 kg
 * et de gestion des versions pour « Fermes du Bélier — Plan 35 jours »
 */

import { FeedFormula, IngredientProportion, FormulaHistoryEntry, NutritionalProfile } from '../types';

export interface FormulaCalculationResult {
  totalWeightKg: number;
  deltaTo100Kg: number; // 100 - totalWeightKg
  is100KgExact: boolean; // Math.abs(deltaTo100Kg) <= 0.01
  status100KgMessage: string;
  status100KgSeverity: 'ok' | 'missing' | 'surplus';
  
  // Coûts
  isCostComplete: boolean;
  missingPriceIngredients: string[];
  totalCost100Kg?: number; // undefined si au moins un prix manque !
  costPerKg?: number; // undefined si au moins un prix manque !
  cost25Kg?: number;
  cost50Kg?: number;
  getCustomVolumeCost: (volumeKg: number) => number | undefined;
  ingredientsCosts: {
    name: string;
    quantityKg: number;
    percentage: number;
    unitPrice?: number;
    totalCost?: number;
    hasPrice: boolean;
  }[];

  // Nutrition
  isNutritionalCalculable: boolean;
  unverifiableReason?: string;
  nutritionTotals?: NutritionalProfile;
  disclaimer: string;
}

/**
 * Calcule l'intégralité des coûts, pourcentages et bilans de masse d'une formule
 */
export function calculateFormulaDetails(
  ingredients: IngredientProportion[],
  customVolumeKg: number = 100
): FormulaCalculationResult {
  let totalWeight = 0;
  let totalCost = 0;
  let hasMissingPrice = false;
  const missingPrices: string[] = [];

  // Nutrition accumulators
  let hasAnyNutrient = false;
  let missingNutritionCount = 0;
  let sumEM = 0;
  let sumPB = 0;
  let sumLysDig = 0;
  let sumMetDig = 0;
  let sumCa = 0;
  let sumPDisp = 0;
  let sumCellulose = 0;

  const ingredientsCosts = ingredients.map(ing => {
    const qty = ing.quantityKg100 || 0;
    totalWeight += qty;

    const hasPrice = typeof ing.refPriceFcfaKg === 'number' && !isNaN(ing.refPriceFcfaKg) && ing.refPriceFcfaKg >= 0;
    let lineCost: number | undefined = undefined;

    if (hasPrice) {
      lineCost = Math.round(qty * (ing.refPriceFcfaKg as number));
      totalCost += lineCost;
    } else {
      hasMissingPrice = true;
      missingPrices.push(ing.name);
    }

    // Nutrition
    if (ing.nutrition) {
      hasAnyNutrient = true;
      if (ing.nutrition.energyKcalKg) sumEM += (qty / 100) * ing.nutrition.energyKcalKg;
      if (ing.nutrition.crudeProteinPercent) sumPB += (qty / 100) * ing.nutrition.crudeProteinPercent;
      if (ing.nutrition.digestibleLysinePercent) sumLysDig += (qty / 100) * ing.nutrition.digestibleLysinePercent;
      if (ing.nutrition.digestibleMethioninePercent) sumMetDig += (qty / 100) * ing.nutrition.digestibleMethioninePercent;
      if (ing.nutrition.calciumPercent) sumCa += (qty / 100) * ing.nutrition.calciumPercent;
      if (ing.nutrition.availablePhosphorusPercent) sumPDisp += (qty / 100) * ing.nutrition.availablePhosphorusPercent;
      if (ing.nutrition.crudeFiberPercent) sumCellulose += (qty / 100) * ing.nutrition.crudeFiberPercent;
    } else {
      missingNutritionCount++;
    }

    return {
      name: ing.name,
      quantityKg: qty,
      percentage: qty, // car la base est 100 kg
      unitPrice: ing.refPriceFcfaKg,
      totalCost: lineCost,
      hasPrice
    };
  });

  const roundedTotalWeight = Math.round(totalWeight * 100) / 100;
  const delta = Math.round((100 - roundedTotalWeight) * 100) / 100;
  const is100Kg = Math.abs(delta) <= 0.01;

  let statusMsg = 'Masse totale équilibrée à exactement 100,00 kg.';
  let severity: 'ok' | 'missing' | 'surplus' = 'ok';

  if (delta > 0.01) {
    statusMsg = `Il manque ${delta.toFixed(2)} kg pour atteindre les 100,00 kg réglementaires.`;
    severity = 'missing';
  } else if (delta < -0.01) {
    statusMsg = `Excédent de ${Math.abs(delta).toFixed(2)} kg au-dessus des 100,00 kg réglementaires.`;
    severity = 'surplus';
  }

  const isCostComplete = !hasMissingPrice && ingredients.length > 0;
  const totalCost100Kg = isCostComplete ? Math.round(totalCost) : undefined;
  const costPerKg = isCostComplete && totalCost100Kg !== undefined ? Math.round((totalCost100Kg / 100) * 100) / 100 : undefined;

  // Nutrition evaluation
  // Only calculable if major ingredients have nutrition and we have at least PB and EM
  const isNutritionalCalculable = hasAnyNutrient && missingNutritionCount <= 2 && sumEM > 1000 && sumPB > 10;
  const unverifiableReason = isNutritionalCalculable 
    ? undefined 
    : 'Composition nutritionnelle non vérifiable avec les données disponibles (profils d\'ingrédients incomplets).';

  const nutritionTotals: NutritionalProfile | undefined = isNutritionalCalculable ? {
    energyKcalKg: Math.round(sumEM),
    crudeProteinPercent: Math.round(sumPB * 10) / 10,
    digestibleLysinePercent: Math.round(sumLysDig * 100) / 100,
    digestibleMethioninePercent: Math.round(sumMetDig * 100) / 100,
    calciumPercent: Math.round(sumCa * 100) / 100,
    availablePhosphorusPercent: Math.round(sumPDisp * 100) / 100,
    crudeFiberPercent: Math.round(sumCellulose * 10) / 10
  } : undefined;

  return {
    totalWeightKg: roundedTotalWeight,
    deltaTo100Kg: delta,
    is100KgExact: is100Kg,
    status100KgMessage: statusMsg,
    status100KgSeverity: severity,
    isCostComplete,
    missingPriceIngredients: missingPrices,
    totalCost100Kg,
    costPerKg,
    cost25Kg: costPerKg !== undefined ? Math.round(costPerKg * 25) : undefined,
    cost50Kg: costPerKg !== undefined ? Math.round(costPerKg * 50) : undefined,
    getCustomVolumeCost: (vol: number) => costPerKg !== undefined ? Math.round(costPerKg * vol) : undefined,
    ingredientsCosts,
    isNutritionalCalculable,
    unverifiableReason,
    nutritionTotals,
    disclaimer: 'Cible indicative non garantie : Une recette conforme est une exigence technique indispensable mais ne garantit pas automatiquement l’atteinte de 2,1 à 2,2 kg à J35.'
  };
}

/**
 * Comparateur Avant / Après entre deux formules
 */
export interface FormulaComparisonResult {
  addedIngredients: IngredientProportion[];
  removedIngredients: IngredientProportion[];
  modifiedIngredients: {
    name: string;
    oldQty: number;
    newQty: number;
    diffQty: number;
    oldPrice?: number;
    newPrice?: number;
  }[];
  costDiff100Kg?: number; // new - old
  costDiffPerKg?: number;
  isCostComparable: boolean;
  weightDiffKg: number;
  nutritionComparison?: {
    metric: string;
    unit: string;
    oldValue?: number;
    newValue?: number;
    diff?: number;
  }[];
  warnings: string[];
}

export function compareFormulas(
  oldFormula: FeedFormula,
  newIngredients: IngredientProportion[]
): FormulaComparisonResult {
  const oldCalc = calculateFormulaDetails(oldFormula.ingredients);
  const newCalc = calculateFormulaDetails(newIngredients);

  const oldMap = new Map<string, IngredientProportion>();
  oldFormula.ingredients.forEach(i => oldMap.set(i.name.toLowerCase().trim(), i));

  const newMap = new Map<string, IngredientProportion>();
  newIngredients.forEach(i => newMap.set(i.name.toLowerCase().trim(), i));

  const added: IngredientProportion[] = [];
  const removed: IngredientProportion[] = [];
  const modified: FormulaComparisonResult['modifiedIngredients'] = [];
  const warnings: string[] = [];

  // Check new ingredients against old
  newIngredients.forEach(nIng => {
    const key = nIng.name.toLowerCase().trim();
    if (!oldMap.has(key)) {
      added.push(nIng);
    } else {
      const oIng = oldMap.get(key)!;
      if (Math.abs(oIng.quantityKg100 - nIng.quantityKg100) > 0.001 || oIng.refPriceFcfaKg !== nIng.refPriceFcfaKg) {
        modified.push({
          name: nIng.name,
          oldQty: oIng.quantityKg100,
          newQty: nIng.quantityKg100,
          diffQty: Math.round((nIng.quantityKg100 - oIng.quantityKg100) * 100) / 100,
          oldPrice: oIng.refPriceFcfaKg,
          newPrice: nIng.refPriceFcfaKg
        });
      }
    }
  });

  // Check removed
  oldFormula.ingredients.forEach(oIng => {
    const key = oIng.name.toLowerCase().trim();
    if (!newMap.has(key)) {
      removed.push(oIng);
    }
  });

  // Warnings check for sensitive additives or premix
  const sensitiveKeywords = ['prémix', 'lysine', 'méthionine', 'sel', 'phosphate', 'carbonate'];
  removed.forEach(r => {
    if (sensitiveKeywords.some(kw => r.name.toLowerCase().includes(kw))) {
      warnings.push(`Attention : Le retrait de l'additif/minéral « ${r.name} » impacte directement l'équilibre métabolique de la volaille.`);
    }
  });

  const isCostComparable = oldCalc.isCostComplete && newCalc.isCostComplete && oldCalc.totalCost100Kg !== undefined && newCalc.totalCost100Kg !== undefined;
  const costDiff100Kg = isCostComparable ? (newCalc.totalCost100Kg! - oldCalc.totalCost100Kg!) : undefined;
  const costDiffPerKg = isCostComparable ? (newCalc.costPerKg! - oldCalc.costPerKg!) : undefined;

  const nutritionComparison: FormulaComparisonResult['nutritionComparison'] = [];
  if (oldCalc.isNutritionalCalculable && newCalc.isNutritionalCalculable && oldCalc.nutritionTotals && newCalc.nutritionTotals) {
    const oN = oldCalc.nutritionTotals;
    const nN = newCalc.nutritionTotals;

    nutritionComparison.push(
      { metric: 'Énergie Métabolisable (EM)', unit: 'kcal/kg', oldValue: oN.energyKcalKg, newValue: nN.energyKcalKg, diff: (nN.energyKcalKg || 0) - (oN.energyKcalKg || 0) },
      { metric: 'Protéines Brutes (PB)', unit: '%', oldValue: oN.crudeProteinPercent, newValue: nN.crudeProteinPercent, diff: Math.round(((nN.crudeProteinPercent || 0) - (oN.crudeProteinPercent || 0)) * 10) / 10 },
      { metric: 'Lysine digestible', unit: '%', oldValue: oN.digestibleLysinePercent, newValue: nN.digestibleLysinePercent, diff: Math.round(((nN.digestibleLysinePercent || 0) - (oN.digestibleLysinePercent || 0)) * 100) / 100 },
      { metric: 'Méthionine digestible', unit: '%', oldValue: oN.digestibleMethioninePercent, newValue: nN.digestibleMethioninePercent, diff: Math.round(((nN.digestibleMethioninePercent || 0) - (oN.digestibleMethioninePercent || 0)) * 100) / 100 },
      { metric: 'Calcium (Ca)', unit: '%', oldValue: oN.calciumPercent, newValue: nN.calciumPercent, diff: Math.round(((nN.calciumPercent || 0) - (oN.calciumPercent || 0)) * 100) / 100 },
      { metric: 'Phosphore disponible (P disp.)', unit: '%', oldValue: oN.availablePhosphorusPercent, newValue: nN.availablePhosphorusPercent, diff: Math.round(((nN.availablePhosphorusPercent || 0) - (oN.availablePhosphorusPercent || 0)) * 100) / 100 }
    );
  }

  return {
    addedIngredients: added,
    removedIngredients: removed,
    modifiedIngredients: modified,
    costDiff100Kg,
    costDiffPerKg,
    isCostComparable,
    weightDiffKg: Math.round((newCalc.totalWeightKg - oldCalc.totalWeightKg) * 100) / 100,
    nutritionComparison,
    warnings
  };
}

/**
 * Calculateur de compensation pour atteindre exactement 100 kg
 * Modifie un seul ingrédient choisi par l'éleveur avec aperçu explicite
 */
export function calculateTargetAdjustment(
  currentIngredients: IngredientProportion[],
  targetIngredientName: string
): {
  success: boolean;
  ingredientName: string;
  oldQuantityKg: number;
  newQuantityKg: number;
  deltaKg: number;
  resultingWeightKg: number;
  errorMessage?: string;
  notice: string;
} {
  const index = currentIngredients.findIndex(i => i.name.toLowerCase() === targetIngredientName.toLowerCase());
  if (index === -1) {
    return {
      success: false,
      ingredientName: targetIngredientName,
      oldQuantityKg: 0,
      newQuantityKg: 0,
      deltaKg: 0,
      resultingWeightKg: 0,
      errorMessage: `Ingrédient « ${targetIngredientName} » non trouvé dans la recette.`,
      notice: 'Ajustement impossible.'
    };
  }

  const currentTotal = currentIngredients.reduce((sum, i) => sum + i.quantityKg100, 0);
  const deltaTo100 = 100 - currentTotal;
  const oldQty = currentIngredients[index].quantityKg100;
  const newQty = Math.round((oldQty + deltaTo100) * 100) / 100;

  if (newQty < 0) {
    return {
      success: false,
      ingredientName: targetIngredientName,
      oldQuantityKg: oldQty,
      newQuantityKg: newQty,
      deltaKg: deltaTo100,
      resultingWeightKg: currentTotal,
      errorMessage: `L'ajustement amènerait la quantité de « ${targetIngredientName} » à une valeur négative (${newQty} kg). Veuillez ajuster un ingrédient plus lourd ou réduire d'autres composants.`,
      notice: 'Ajustement refusé pour éviter quantité négative.'
    };
  }

  return {
    success: true,
    ingredientName: targetIngredientName,
    oldQuantityKg: oldQty,
    newQuantityKg: newQty,
    deltaKg: Math.round(deltaTo100 * 100) / 100,
    resultingWeightKg: 100,
    notice: 'Cet ajustement compense la masse totale pour atteindre exactement 100,00 kg. Il ne constitue pas une validation nutritionnelle.'
  };
}

/**
 * Crée une nouvelle version brouillon lors de l'édition d'une formule validée
 */
export function createDraftFormulaVersion(
  baseFormula: FeedFormula,
  newIngredients: IngredientProportion[],
  author?: string,
  changeReason?: string
): FeedFormula {
  const calc = calculateFormulaDetails(newIngredients);

  // Parse version e.g. "1.0" -> "1.1"
  const currentVer = baseFormula.version || '1.0';
  const parts = currentVer.split('.');
  let nextVer = '1.1';
  if (parts.length === 2) {
    const major = parseInt(parts[0], 10) || 1;
    const minor = (parseInt(parts[1], 10) || 0) + 1;
    nextVer = `${major}.${minor}`;
  }

  const historyEntry: FormulaHistoryEntry = {
    id: 'hist_' + Date.now(),
    version: baseFormula.version,
    date: baseFormula.updatedAt || baseFormula.createdAt || new Date().toISOString().slice(0, 10),
    author: baseFormula.author,
    changeReason: baseFormula.changeReason || 'Version d\'origine',
    status: baseFormula.status,
    validatorName: baseFormula.validatorName,
    validationDate: baseFormula.validationDate,
    ingredients: baseFormula.ingredients,
    calculatedCostPer100Kg: baseFormula.calculatedCostPer100Kg,
    calculatedCostPerKg: baseFormula.calculatedCostPerKg,
    isCostComplete: baseFormula.isCostComplete ?? true,
    totalWeightKg: baseFormula.ingredients.reduce((s, i) => s + i.quantityKg100, 0)
  };

  const updatedHistory = [historyEntry, ...(baseFormula.history || [])];

  return {
    ...baseFormula,
    id: baseFormula.id,
    version: nextVer,
    status: 'brouillon', // TOUJOURS repasser en brouillon
    author: author || 'Éleveur / Technicien',
    changeReason: changeReason || 'Modification de la composition',
    validatorName: undefined, // L'ancienne validation ne se transmet pas automatiquement !
    validationDate: undefined,
    ingredients: newIngredients,
    calculatedCostPer100Kg: calc.totalCost100Kg,
    calculatedCostPerKg: calc.costPerKg,
    isCostComplete: calc.isCostComplete,
    missingPriceIngredients: calc.missingPriceIngredients,
    updatedAt: new Date().toISOString(),
    history: updatedHistory
  };
}

/**
 * Crée une variante distincte à partir d'une recette
 */
export function createFormulaVariant(
  baseFormula: FeedFormula,
  variantName: string,
  author?: string
): FeedFormula {
  const newId = 'form_var_' + Date.now();
  const code = `VAR-${baseFormula.code}-${Math.floor(100 + Math.random() * 900)}`;

  return {
    ...baseFormula,
    id: newId,
    code,
    name: variantName,
    version: '1.0-brouillon',
    parentFormulaId: baseFormula.id,
    parentVersion: baseFormula.version,
    status: 'brouillon',
    author: author || 'Éleveur',
    changeReason: `Variante créée à partir de ${baseFormula.name || baseFormula.code} (v${baseFormula.version})`,
    validatorName: undefined,
    validationDate: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: []
  };
}
