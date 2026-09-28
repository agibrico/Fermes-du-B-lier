import React, { useState } from 'react';
import { StockItem, StockMovement } from '../types';
import { formatDateFr, formatFcfa, getTodayDateStr } from '../utils/dateUtils';
import { addStockItem, deductStockItem } from '../utils/stockUtils';
import { Package, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, Check, X, ShieldAlert } from 'lucide-react';

interface StocksViewProps {
  stockItems: StockItem[];
  onUpdateStockItems: (stocks: StockItem[]) => void;
  stockMovements: StockMovement[];
  onAddStockMovement: (mov: StockMovement) => void;
  currentDateStr: string;
}

export default function StocksView({
  stockItems,
  onUpdateStockItems,
  stockMovements,
  onAddStockMovement,
  currentDateStr
}: StocksViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'aliment_industriel' | 'matiere_premiere' | 'produit_sante'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedStockForAdjust, setSelectedStockForAdjust] = useState<StockItem | null>(null);

  // New stock item form
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockItem['category']>('aliment_industriel');
  const [qty, setQty] = useState<number>(10);
  const [unit, setUnit] = useState<StockItem['unit']>('sac_25kg');
  const [cost, setCost] = useState<number>(15000);
  const [supplier, setSupplier] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [alertLevel, setAlertLevel] = useState<number>(4);
  const [expiryDate, setExpiryDate] = useState('');

  // Adjustment state
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('Pertes / avarie constatée');
  const [adjustType, setAdjustType] = useState<'perte_ajustement' | 'achat'>('perte_ajustement');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const filteredItems = activeTab === 'all' 
    ? stockItems 
    : stockItems.filter(s => s.category === activeTab);

  // FEFO sorting: items with earliest expiry first
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });

  const handleCreateStock = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StockItem = {
      id: 'stk_' + Date.now(),
      name: name.trim(),
      category,
      quantityOnHand: Number(qty),
      unit,
      unitCostFcfa: Number(cost),
      brand: brand.trim() || undefined,
      supplier: supplier.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined,
      reorderAlertLevel: Number(alertLevel) || 5,
      purchaseDate: currentDateStr || getTodayDateStr(),
      expiryDate: expiryDate || undefined
    };

    const mov: StockMovement = {
      id: 'mov_' + Date.now(),
      stockItemId: newItem.id,
      date: currentDateStr || getTodayDateStr(),
      type: 'achat',
      quantity: Number(qty),
      unit,
      unitCostFcfa: Number(cost),
      totalCostFcfa: Math.round(Number(qty) * Number(cost)),
      reasonOrNotes: 'Entrée en stock initiale / Achat'
    };

    onUpdateStockItems([...stockItems, newItem]);
    onAddStockMovement(mov);
    setShowAddModal(false);
    setName('');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockForAdjust) return;
    setAdjustError(null);

    if (adjustType === 'perte_ajustement') {
      const res = deductStockItem(stockItems, selectedStockForAdjust.id, adjustQty, {
        type: 'perte_ajustement',
        reason: adjustReason,
        operator: 'Responsable Stock'
      });
      if (!res.success) {
        setAdjustError(res.errorMessage || 'Erreur lors de l\'ajustement');
        return;
      }
      onUpdateStockItems(res.updatedStocks!);
      onAddStockMovement(res.movement!);
    } else {
      const res = addStockItem(stockItems, selectedStockForAdjust.id, adjustQty, {
        type: 'achat',
        reason: adjustReason,
        operator: 'Responsable Stock'
      });
      onUpdateStockItems(res.updatedStocks);
      onAddStockMovement(res.movement);
    }

    setShowAdjustModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Gestion des Stocks & Pharmacie</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Sacs démarrage 25kg (15 000 F = 600 F/kg) • Matières premières • Pharmacie • Règle FEFO
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
        >
          <Plus className="h-4 w-4" /> Entrée d'un Nouvel Article
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'all' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tous les Articles ({stockItems.length})
        </button>
        <button
          onClick={() => setActiveTab('aliment_industriel')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'aliment_industriel' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Aliment Industriel (Sacs 25 kg)
        </button>
        <button
          onClick={() => setActiveTab('matiere_premiere')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'matiere_premiere' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Matières Premières
        </button>
        <button
          onClick={() => setActiveTab('produit_sante')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'produit_sante' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pharmacie & Vaccins
        </button>
      </div>

      {/* Industrial Bag Specific Banner if viewing industrial */}
      {(activeTab === 'aliment_industriel' || activeTab === 'all') && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div>
            <span className="font-bold block text-sm">Paramètres Confirmés — Démarrage Industriel (J1-J10)</span>
            <p className="text-emerald-700 mt-0.5">
              Conditionnement : <strong>Sac de 25 kg</strong> • Prix du sac : <strong>15 000 FCFA</strong> • Prix au kg calculé : <strong>600 FCFA/kg</strong>.
            </p>
          </div>
          <div className="text-right font-mono text-[11px] bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            Formule achat en sacs entiers : <em>Arrondi sup. (Besoin net kg / 25)</em>
          </div>
        </div>
      )}

      {/* Stock Cards / Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
              <tr>
                <th className="p-3 font-sans">Article</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3 text-center">Stock Actuel</th>
                <th className="p-3 text-center">Seuil Alerte</th>
                <th className="p-3 text-right">Coût Unitaire</th>
                <th className="p-3">Péremption (FEFO)</th>
                <th className="p-3">Fournisseur / Lot</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.map(item => {
                const isLow = item.quantityOnHand <= item.reorderAlertLevel;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-sans font-bold text-slate-900">
                      {item.name}
                      {item.brand && <span className="block text-[10px] text-slate-400 font-mono font-normal">{item.brand}</span>}
                    </td>
                    <td className="p-3 text-slate-500 font-sans">{item.category}</td>
                    <td className="p-3 text-center">
                      <span className={`font-extrabold text-sm px-2 py-0.5 rounded-lg ${
                        isLow ? 'bg-rose-100 text-rose-700 font-bold' : 'text-slate-800'
                      }`}>
                        {item.quantityOnHand} {item.unit}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-400">{item.reorderAlertLevel} {item.unit}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{formatFcfa(item.unitCostFcfa)}</td>
                    <td className="p-3 text-slate-500">
                      {item.expiryDate ? (
                        <span className={item.expiryDate <= currentDateStr ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {formatDateFr(item.expiryDate)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 font-sans text-slate-500 text-[11px]">
                      {item.supplier || '-'} {item.lotNumber ? `(Lot ${item.lotNumber})` : ''}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedStockForAdjust(item);
                          setShowAdjustModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Ajuster / Mouvement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900">
          Historique des Mouvements de Stock ({stockMovements.length})
        </h3>
        {stockMovements.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">Aucun mouvement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Quantité</th>
                  <th className="p-3 text-right">Montant Total</th>
                  <th className="p-3">Motif / Justification</th>
                  <th className="p-3">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.slice().reverse().map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{formatDateFr(mov.date)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mov.type === 'achat' || mov.type === 'fabrication_entree'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {mov.type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">{mov.quantity} {mov.unit}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{formatFcfa(mov.totalCostFcfa)}</td>
                    <td className="p-3 font-sans text-slate-700 text-[11px]">{mov.reasonOrNotes}</td>
                    <td className="p-3 font-sans text-slate-400 text-[11px]">{mov.operator || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Stock Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enregistrer un Nouvel Article de Stock</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                Fermer
              </button>
            </div>

            <form onSubmit={handleCreateStock} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Désignation de l'article *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aliment Démarrage Industriel (Sac 25kg)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <option value="aliment_industriel">Aliment Industriel</option>
                    <option value="matiere_premiere">Matière Première</option>
                    <option value="produit_sante">Pharmacie & Santé</option>
                    <option value="fourniture">Fourniture / Litière</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Unité de mesure</label>
                  <select
                    value={unit}
                    onChange={(e: any) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <option value="sac_25kg">Sac de 25 kg</option>
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="dose">Doses</option>
                    <option value="flacon">Flacon</option>
                    <option value="unite">Unité</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Quantité reçue *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Coût unitaire (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Numéro de Lot Fabricant</label>
                  <input
                    type="text"
                    placeholder="Ex: DEM-2026-B1"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date de Péremption</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Fournisseur</label>
                  <input
                    type="text"
                    placeholder="Ex: AgroFournitures SA"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Seuil d'Alerte Réappro.</label>
                  <input
                    type="number"
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Enregistrer l'Entrée en Stock
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adjust Stock */}
      {showAdjustModal && selectedStockForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Ajuster le Stock : {selectedStockForAdjust.name}
              </h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600">
                Fermer
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Type de mouvement</label>
                <select
                  value={adjustType}
                  onChange={(e: any) => setAdjustType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                >
                  <option value="perte_ajustement">Sortie / Perte / Ajustement d'inventaire</option>
                  <option value="achat">Entrée / Réception complémentaire</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Quantité ({selectedStockForAdjust.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
                <span className="text-[10px] text-slate-400">
                  Stock actuel : {selectedStockForAdjust.quantityOnHand} {selectedStockForAdjust.unit}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Motif / Justification *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Valider le Mouvement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
