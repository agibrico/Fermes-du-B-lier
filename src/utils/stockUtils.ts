import { StockItem, StockMovement } from '../types';
import { getTodayDateStr } from './dateUtils';

/**
 * Vérifie et effectue une sortie de stock en empêchant strictement tout stock négatif
 */
export function deductStockItem(
  stocks: StockItem[],
  stockItemId: string,
  quantityToDeduct: number,
  movementDetails: {
    type: StockMovement['type'];
    batchId?: string;
    reason: string;
    operator?: string;
  }
): {
  success: boolean;
  errorMessage?: string;
  updatedStocks?: StockItem[];
  movement?: StockMovement;
} {
  const stockIndex = stocks.findIndex(s => s.id === stockItemId);
  if (stockIndex === -1) {
    return { success: false, errorMessage: 'Article de stock introuvable.' };
  }

  const stock = stocks[stockIndex];
  if (quantityToDeduct <= 0) {
    return { success: false, errorMessage: 'La quantité à déduire doit être strictement positive.' };
  }

  if (stock.quantityOnHand < quantityToDeduct) {
    return { 
      success: false, 
      errorMessage: `Stock insuffisant pour "${stock.name}". En stock : ${stock.quantityOnHand} ${stock.unit}, demandé : ${quantityToDeduct} ${stock.unit}. Opération bloquée.` 
    };
  }

  const updatedStocks = [...stocks];
  const newQty = Math.round((stock.quantityOnHand - quantityToDeduct) * 1000) / 1000;
  
  updatedStocks[stockIndex] = {
    ...stock,
    quantityOnHand: newQty
  };

  const movement: StockMovement = {
    id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    stockItemId: stock.id,
    date: getTodayDateStr(),
    type: movementDetails.type,
    quantity: quantityToDeduct,
    unit: stock.unit,
    unitCostFcfa: stock.unitCostFcfa,
    totalCostFcfa: Math.round(quantityToDeduct * stock.unitCostFcfa),
    batchId: movementDetails.batchId,
    reasonOrNotes: movementDetails.reason,
    operator: movementDetails.operator
  };

  return {
    success: true,
    updatedStocks,
    movement
  };
}

/**
 * Ajoute une entrée en stock (achat, fabrication)
 */
export function addStockItem(
  stocks: StockItem[],
  stockItemId: string,
  quantityToAdd: number,
  movementDetails: {
    type: StockMovement['type'];
    batchId?: string;
    reason: string;
    operator?: string;
    unitCostFcfa?: number;
  }
): {
  success: boolean;
  updatedStocks: StockItem[];
  movement: StockMovement;
} {
  const stockIndex = stocks.findIndex(s => s.id === stockItemId);
  const updatedStocks = [...stocks];

  if (stockIndex >= 0) {
    const stock = stocks[stockIndex];
    const newQty = Math.round((stock.quantityOnHand + quantityToAdd) * 1000) / 1000;
    const cost = movementDetails.unitCostFcfa !== undefined ? movementDetails.unitCostFcfa : stock.unitCostFcfa;
    
    updatedStocks[stockIndex] = {
      ...stock,
      quantityOnHand: newQty,
      unitCostFcfa: cost
    };

    const movement: StockMovement = {
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      stockItemId: stock.id,
      date: getTodayDateStr(),
      type: movementDetails.type,
      quantity: quantityToAdd,
      unit: stock.unit,
      unitCostFcfa: cost,
      totalCostFcfa: Math.round(quantityToAdd * cost),
      batchId: movementDetails.batchId,
      reasonOrNotes: movementDetails.reason,
      operator: movementDetails.operator
    };

    return { success: true, updatedStocks, movement };
  } else {
    // Si nouvel article
    const newItem: StockItem = {
      id: stockItemId,
      name: movementDetails.reason,
      category: 'matiere_premiere',
      quantityOnHand: quantityToAdd,
      unit: 'kg',
      unitCostFcfa: movementDetails.unitCostFcfa || 0,
      reorderAlertLevel: 10
    };
    updatedStocks.push(newItem);

    const movement: StockMovement = {
      id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      stockItemId: newItem.id,
      date: getTodayDateStr(),
      type: movementDetails.type,
      quantity: quantityToAdd,
      unit: newItem.unit,
      unitCostFcfa: newItem.unitCostFcfa,
      totalCostFcfa: Math.round(quantityToAdd * newItem.unitCostFcfa),
      reasonOrNotes: movementDetails.reason
    };

    return { success: true, updatedStocks, movement };
  }
}
