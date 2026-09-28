import React, { useState } from 'react';
import { 
  FeedFormula, 
  StockItem, 
  FeedManufacturingLog,
  PoultryBatch,
  IngredientDefinition
} from '../types';
import { FEED_FORMULAS_PDF, INGREDIENTS_LIBRARY_DEFAULT } from '../data';
import { deductStockItem, addStockItem } from '../utils/stockUtils';
import { formatDateFr, formatFcfa, getTodayDateStr } from '../utils/dateUtils';
import { calculateFormulaDetails } from '../utils/formulaUtils';
import { printManufacturingLog } from '../utils/exportUtils';
import RecipeEditorModal from './RecipeEditorModal';
import IngredientsLibraryModal from './IngredientsLibraryModal';
import { 
  ChefHat, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Scale, 
  BookOpen, 
  Copy, 
  History,
  Send,
  AlertTriangle,
  Info
} from 'lucide-react';

interface FeedingViewProps {
  formulas: FeedFormula[];
  onUpdateFormulas: (formulas: FeedFormula[]) => void;
  stockItems: StockItem[];
  onUpdateStockItems: (stocks: StockItem[]) => void;
  manufacturingLogs: FeedManufacturingLog[];
  onAddManufacturingLog: (log: FeedManufacturingLog) => void;
  currentDateStr: string;
  batches?: PoultryBatch[];
  onUpdateBatch?: (batch: PoultryBatch) => void;
  ingredientsLibrary?: IngredientDefinition[];
  onUpdateIngredientsLibrary?: (defs: IngredientDefinition[]) => void;
}

export default function FeedingView({
  formulas,
  onUpdateFormulas,
  stockItems,
  onUpdateStockItems,
  manufacturingLogs,
  onAddManufacturingLog,
  currentDateStr,
  batches = [],
  onUpdateBatch = () => {},
  ingredientsLibrary = INGREDIENTS_LIBRARY_DEFAULT,
  onUpdateIngredientsLibrary = () => {}
}: FeedingViewProps) {
  // Selected formula ID (defaults to Croissance or first available)
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(() => {
    const croissance = formulas.find(f => f.phase === 'Croissance');
    return croissance ? croissance.id : (formulas[0]?.id || 'form_croissance_pdf_v1');
  });

  const [targetVolumeKg, setTargetVolumeKg] = useState<number>(100);
  const [showFabricationModal, setShowFabricationModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Fabrication form states
  const [actualVolumeKg, setActualVolumeKg] = useState<number>(100);
  const [grindingCost, setGrindingCost] = useState<number>(1500);
  const [mixingCost, setMixingCost] = useState<number>(1000);
  const [transportCost, setTransportCost] = useState<number>(1000);
  const [operator, setOperator] = useState<string>('Meunier');
  const [fabError, setFabError] = useState<string | null>(null);
  const [fabSuccess, setFabSuccess] = useState<string | null>(null);

  // Active formula resolution
  const activeFormula = formulas.find(f => f.id === selectedFormulaId) || formulas[0] || FEED_FORMULAS_PDF[0];

  // Calculation details of active formula
  const activeCalc = calculateFormulaDetails(activeFormula.ingredients, targetVolumeKg);

  // Save single formula (strictly updates only this formula in state)
  const handleSaveFormula = (updatedFormula: FeedFormula) => {
    onUpdateFormulas(formulas.map(f => f.id === updatedFormula.id ? updatedFormula : f));
  };

  // Create new formula (e.g. variant)
  const handleCreateNewFormula = (newFormula: FeedFormula) => {
    onUpdateFormulas([newFormula, ...formulas]);
    setSelectedFormulaId(newFormula.id);
  };

  // Execute feed fabrication with real stock deductions
  const handleLaunchFabrication = (e: React.FormEvent) => {
    e.preventDefault();
    setFabError(null);
    setFabSuccess(null);

    if (actualVolumeKg <= 0) {
      setFabError('La quantité produite doit être supérieure à zéro.');
      return;
    }

    if (!activeCalc.is100KgExact) {
      setFabError(`Fabrication bloquée : la recette n'est pas équilibrée à 100 kg (actuellement ${activeCalc.totalWeightKg} kg). Veuillez corriger la formule avant de fabriquer.`);
      return;
    }

    // 1. Calculate required weights
    const ingredientsUsed = activeFormula.ingredients.map(ing => {
      const requiredKg = (ing.quantityKg100 * actualVolumeKg) / 100;
      return {
        ingredientName: ing.name,
        plannedKg: requiredKg,
        actualWeighedKg: requiredKg
      };
    });

    // 2. Verify and deduct all ingredients from stock
    let currentStocks = [...stockItems];
    let totalRawCost = 0;

    for (const item of ingredientsUsed) {
      const matchStock = currentStocks.find(s => s.name.toLowerCase().includes(item.ingredientName.toLowerCase()));
      if (matchStock) {
        const deductResult = deductStockItem(currentStocks, matchStock.id, item.actualWeighedKg, {
          type: 'fabrication_sortie',
          reason: `Fabrication ${actualVolumeKg}kg Aliment ${activeFormula.name || activeFormula.phase}`,
          operator
        });

        if (!deductResult.success) {
          setFabError(deductResult.errorMessage || `Stock insuffisant pour ${item.ingredientName}`);
          return;
        }

        currentStocks = deductResult.updatedStocks!;
        totalRawCost += Math.round(item.actualWeighedKg * matchStock.unitCostFcfa);
      } else {
        // If not in stock, calculate using formula ref price if available
        const refIng = activeFormula.ingredients.find(i => i.name === item.ingredientName);
        totalRawCost += Math.round(item.actualWeighedKg * (refIng?.refPriceFcfaKg || 250));
      }
    }

    // 3. Add produced feed into stock
    const targetStockId = `stk_fab_${activeFormula.phase.toLowerCase().replace(/\s+/g, '_')}`;
    const addResult = addStockItem(currentStocks, targetStockId, actualVolumeKg, {
      type: 'fabrication_entree',
      reason: `Aliment ${activeFormula.name || activeFormula.phase} fabriqué maison`,
      operator,
      unitCostFcfa: Math.round((totalRawCost + grindingCost + mixingCost + transportCost) / actualVolumeKg)
    });
    currentStocks = addResult.updatedStocks;

    // 4. Save manufacturing log (preserves past logs immutably)
    const totalCost = totalRawCost + grindingCost + mixingCost + transportCost;
    const costPerKg = totalCost / actualVolumeKg;

    const newLog: FeedManufacturingLog = {
      id: 'mfg_' + Date.now(),
      formulaId: activeFormula.id,
      formulaVersion: activeFormula.version,
      date: currentDateStr || getTodayDateStr(),
      plannedQuantityKg: targetVolumeKg,
      actualProducedQuantityKg: actualVolumeKg,
      operator,
      ingredientsUsed,
      grindingCostFcfa: grindingCost,
      mixingCostFcfa: mixingCost,
      transportCostFcfa: transportCost,
      rawMaterialsCostFcfa: totalRawCost,
      totalManufacturingCostFcfa: totalCost,
      costPerKgFcfa: costPerKg
    };

    onUpdateStockItems(currentStocks);
    onAddManufacturingLog(newLog);

    setFabSuccess(`Fabrication de ${actualVolumeKg} kg d'aliment ${activeFormula.name || activeFormula.phase} validée ! Stocks mis à jour.`);
    setShowFabricationModal(false);
    setTimeout(() => setFabSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Alimentation & Fabrication des Aliments</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Éditeur de composition 100 kg • Traçabilité des versions • Échelle de fabrication & Fiches meunerie
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowLibraryModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer min-h-[44px]"
            title="Consulter le catalogue des matières premières et valeurs nutritives"
          >
            <BookOpen className="h-4 w-4 text-emerald-600" /> Bibliothèque Ingrédients
          </button>

          <button
            onClick={() => {
              if (activeFormula.isIndustrialProduct) {
                setShowEditorModal(true);
              } else {
                setActualVolumeKg(targetVolumeKg);
                setFabError(null);
                setShowFabricationModal(true);
              }
            }}
            disabled={activeFormula.isIndustrialProduct}
            className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all min-h-[44px] ${
              activeFormula.isIndustrialProduct 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
            }`}
          >
            <ChefHat className="h-4 w-4" /> Lancer une Fabrication Réelle
          </button>
        </div>
      </div>

      {fabSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{fabSuccess}</span>
        </div>
      )}

      {/* Program Summary & Formula Selection Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" /> Sélectionner une formule alimentaire ({formulas.length} disponibles)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {formulas.map(f => {
            const isSelected = f.id === selectedFormulaId;
            const fCalc = calculateFormulaDetails(f.ingredients);

            return (
              <div
                key={f.id}
                onClick={() => setSelectedFormulaId(f.id)}
                className={`border rounded-2xl p-4 space-y-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    f.phase === 'Démarrage Industriel' ? 'bg-blue-100 text-blue-800' :
                    f.phase === 'Croissance' ? 'bg-emerald-100 text-emerald-800' :
                    f.phase === 'Finition' ? 'bg-purple-100 text-purple-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {f.phase}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {fCalc.costPerKg !== undefined ? `${fCalc.costPerKg.toFixed(2)} F/kg` : 'Coût incomplet'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{f.name || f.code}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>v{f.version}</span>
                    <span>•</span>
                    <span className={`font-bold ${f.status === 'validée' ? 'text-emerald-600' : (f.status === 'à valider' ? 'text-amber-600' : 'text-slate-500')}`}>
                      {f.status}
                    </span>
                    {f.isIndustrialProduct && (
                      <span className="bg-blue-50 text-blue-700 px-1 rounded font-bold">Produit Fini</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {f.notes || `Recette 100 kg : ${fCalc.totalCost100Kg ? formatFcfa(fCalc.totalCost100Kg) : 'Incomplet'} (${f.ingredients.length} ingrédients).`}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className={`font-mono font-bold ${fCalc.is100KgExact ? 'text-emerald-700' : 'text-rose-600'}`}>
                    Masse : {fCalc.totalWeightKg.toFixed(1)} / 100 kg
                  </span>
                  <span className="text-emerald-700 font-bold hover:underline">
                    {isSelected ? 'Sélectionnée' : 'Sélectionner'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Recipe Detail Viewport & Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-base md:text-lg text-slate-900">
                {activeFormula.name || activeFormula.code}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                activeFormula.status === 'validée' ? 'bg-emerald-100 text-emerald-800' :
                activeFormula.status === 'à valider' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                Statut : {activeFormula.status} • Version {activeFormula.version}
              </span>
              {activeFormula.validatorName && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Validé par {activeFormula.validatorName} ({formatDateFr(activeFormula.validationDate || '')})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Code : <strong>{activeFormula.code}</strong> • Source : {activeFormula.source} • Coût ref : <strong>{activeCalc.costPerKg ? `${activeCalc.costPerKg.toFixed(2)} FCFA / kg` : 'Incomplet'}</strong>
            </p>
          </div>

          {/* Action buttons on active formula */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEditorModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer min-h-[40px]"
            >
              <Edit3 className="h-4 w-4" /> Modifier la composition
            </button>

            {/* Volume scale presets */}
            <div className="flex items-center gap-1 font-mono text-xs border-l border-slate-200 pl-2">
              <span className="text-slate-400 font-bold hidden sm:inline">Échelle :</span>
              {[25, 50, 100, 250, 500].map(vol => (
                <button
                  key={vol}
                  onClick={() => setTargetVolumeKg(vol)}
                  className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition-colors ${
                    targetVolumeKg === vol ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {vol}kg
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 100 kg balance banner */}
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          activeCalc.is100KgExact ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 shrink-0 text-emerald-700" />
            <span className="font-bold">Contrôle des 100 kg :</span>
            <span>{activeCalc.status100KgMessage}</span>
          </div>
          <span className="font-mono font-bold">
            Total actuel : {activeCalc.totalWeightKg.toFixed(2)} kg
          </span>
        </div>

        {/* Nutritional Information to confirm warning */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1 text-amber-900">
          <span className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-700" /> Informations nutritionnelles & vérifications :
          </span>
          <p className="text-[11px] text-amber-800">
            {activeCalc.isNutritionalCalculable 
              ? `Profil calculé : Énergie ${activeCalc.nutritionTotals?.energyKcalKg || '—'} kcal/kg • Protéines ${activeCalc.nutritionTotals?.crudeProteinPercent || '—'}% • Lysine dig. ${activeCalc.nutritionTotals?.digestibleLysinePercent || '—'}%`
              : activeCalc.unverifiableReason
            }
          </p>
          <p className="text-[10px] text-slate-500 italic mt-1">
            {activeCalc.disclaimer}
          </p>
        </div>

        {/* Ingredients proportions table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
              <tr>
                <th className="p-3 font-sans">Ingrédient</th>
                <th className="p-3 text-center">Pour 100 kg</th>
                <th className="p-3 text-center font-bold text-emerald-800 font-sans">
                  Poids Requis pour {targetVolumeKg} kg
                </th>
                <th className="p-3 text-right">Prix Ref. / kg</th>
                <th className="p-3 text-right">Montant pour {targetVolumeKg} kg</th>
                <th className="p-3">Rôle & Remarques</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeFormula.ingredients.map((ing, idx) => {
                const scaledWeight = (ing.quantityKg100 * targetVolumeKg) / 100;
                const scaledCost = typeof ing.refPriceFcfaKg === 'number' 
                  ? Math.round(scaledWeight * ing.refPriceFcfaKg)
                  : undefined;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-sans font-bold text-slate-900">
                      {ing.name}
                      {ing.typeOrForm && <span className="text-[10px] text-slate-400 font-normal ml-1">({ing.typeOrForm})</span>}
                    </td>
                    <td className="p-3 text-center text-slate-500">{ing.quantityKg100.toFixed(2)} kg ({ing.quantityKg100}%)</td>
                    <td className="p-3 text-center font-extrabold text-emerald-700 text-sm">
                      {scaledWeight >= 1 ? `${scaledWeight.toFixed(2)} kg` : `${Math.round(scaledWeight * 1000)} g`}
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      {ing.refPriceFcfaKg !== undefined ? `${ing.refPriceFcfaKg.toLocaleString()} F` : <span className="text-amber-600">Non chiffré</span>}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      {scaledCost !== undefined ? formatFcfa(scaledCost) : '—'}
                    </td>
                    <td className="p-3 font-sans text-slate-400 text-[11px]">{ing.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td className="p-3 font-sans">TOTAL RECETTE</td>
                <td className="p-3 text-center">{activeCalc.totalWeightKg.toFixed(2)} kg</td>
                <td className="p-3 text-center text-emerald-700 font-extrabold">{targetVolumeKg.toFixed(2)} kg</td>
                <td className="p-3 text-right">-</td>
                <td className="p-3 text-right text-emerald-700 font-extrabold">
                  {activeCalc.getCustomVolumeCost(targetVolumeKg) !== undefined 
                    ? formatFcfa(activeCalc.getCustomVolumeCost(targetVolumeKg)!) 
                    : 'Coût incomplet'}
                </td>
                <td className="p-3 text-[11px] text-slate-500 font-normal font-sans">
                  ({activeCalc.costPerKg ? `${activeCalc.costPerKg.toFixed(2)} FCFA/kg` : 'Incomplet'})
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* History of Past Manufacturing Batches (Strictly Preserved) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900">
            Historique des Fabrications d'Aliments Réalisées ({manufacturingLogs.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Les fabrications passées conservent leur composition et coûts d'origine sans modification.
          </span>
        </div>

        {manufacturingLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Aucune fabrication enregistrée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Version Recette</th>
                  <th className="p-3 text-center">Volume Produit</th>
                  <th className="p-3 text-right">Matières</th>
                  <th className="p-3 text-right">Broyage/Mélange</th>
                  <th className="p-3 text-right">Coût Total</th>
                  <th className="p-3 text-center">Coût Réel / kg</th>
                  <th className="p-3">Opérateur</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manufacturingLogs.slice().reverse().map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{formatDateFr(log.date)}</td>
                    <td className="p-3 font-bold text-emerald-700">{log.formulaVersion}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{log.actualProducedQuantityKg} kg</td>
                    <td className="p-3 text-right">{formatFcfa(log.rawMaterialsCostFcfa)}</td>
                    <td className="p-3 text-right">{formatFcfa(log.grindingCostFcfa + log.mixingCostFcfa + log.transportCostFcfa)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatFcfa(log.totalManufacturingCostFcfa)}</td>
                    <td className="p-3 text-center font-bold text-emerald-700">{log.costPerKgFcfa.toFixed(2)} F</td>
                    <td className="p-3 font-sans text-slate-500">{log.operator}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => printManufacturingLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Imprimer Fiche
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Recipe Editor */}
      {showEditorModal && (
        <RecipeEditorModal
          formula={activeFormula}
          allFormulas={formulas}
          ingredientsLibrary={ingredientsLibrary}
          batches={batches}
          onSaveFormula={handleSaveFormula}
          onCreateNewFormula={handleCreateNewFormula}
          onUpdateBatch={onUpdateBatch}
          onClose={() => setShowEditorModal(false)}
          currentDateStr={currentDateStr}
        />
      )}

      {/* Modal Ingredients Library */}
      {showLibraryModal && (
        <IngredientsLibraryModal
          ingredients={ingredientsLibrary}
          onUpdateIngredients={onUpdateIngredientsLibrary}
          onClose={() => setShowLibraryModal(false)}
        />
      )}

      {/* Modal Fabrication */}
      {showFabricationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                Enregistrer une Fabrication : {activeFormula.name || activeFormula.phase}
              </h3>
              <button onClick={() => setShowFabricationModal(false)} className="text-slate-400 hover:text-slate-600">
                Fermer
              </button>
            </div>

            {fabError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{fabError}</span>
              </div>
            )}

            <form onSubmit={handleLaunchFabrication} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Quantité totale à fabriquer (kg) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={actualVolumeKg}
                  onChange={(e) => setActualVolumeKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Frais broyage (F)</label>
                  <input
                    type="number"
                    value={grindingCost}
                    onChange={(e) => setGrindingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Frais mélange (F)</label>
                  <input
                    type="number"
                    value={mixingCost}
                    onChange={(e) => setMixingCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Transport (F)</label>
                  <input
                    type="number"
                    value={transportCost}
                    onChange={(e) => setTransportCost(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Opérateur / Meunier *</label>
                <input
                  type="text"
                  required
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                />
              </div>

              <p className="text-[11px] text-slate-500 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200">
                ℹ️ Les quantités pesées de maïs, soja, blé et additifs seront automatiquement déduites du stock d'ingrédients. Tout stock insuffisant bloque la fabrication pour éviter les stocks négatifs.
              </p>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Confirmer la Fabrication et Déduire les Stocks
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
