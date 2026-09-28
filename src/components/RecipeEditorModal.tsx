import React, { useState, useMemo } from 'react';
import { 
  FeedFormula, 
  IngredientProportion, 
  IngredientDefinition, 
  PoultryBatch 
} from '../types';
import { 
  calculateFormulaDetails, 
  compareFormulas, 
  calculateTargetAdjustment, 
  createDraftFormulaVersion, 
  createFormulaVariant 
} from '../utils/formulaUtils';
import { formatDateFr, formatFcfa, getTodayDateStr } from '../utils/dateUtils';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  Plus, 
  ArrowRightLeft, 
  Trash2, 
  Copy, 
  History, 
  Layers, 
  Send, 
  ShieldCheck, 
  Info, 
  Calculator, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface RecipeEditorModalProps {
  formula: FeedFormula;
  allFormulas: FeedFormula[];
  ingredientsLibrary: IngredientDefinition[];
  batches: PoultryBatch[];
  onSaveFormula: (updated: FeedFormula) => void;
  onCreateNewFormula: (newFormula: FeedFormula) => void;
  onUpdateBatch: (batch: PoultryBatch) => void;
  onClose: () => void;
  currentDateStr: string;
}

export default function RecipeEditorModal({
  formula,
  allFormulas,
  ingredientsLibrary,
  batches,
  onSaveFormula,
  onCreateNewFormula,
  onUpdateBatch,
  onClose,
  currentDateStr
}: RecipeEditorModalProps) {
  // Local working copy of ingredients
  const [workingIngredients, setWorkingIngredients] = useState<IngredientProportion[]>(() => 
    formula.ingredients.map(i => ({ ...i }))
  );

  const [formulaName, setFormulaName] = useState<string>(formula.name || formula.code);
  const [formulaPhase, setFormulaPhase] = useState<FeedFormula['phase']>(formula.phase);
  const [changeReason, setChangeReason] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>(formula.author || 'Éleveur / Technicien');
  const [validatorName, setValidatorName] = useState<string>('');

  // Sub-modals
  const [showReplaceModal, setShowReplaceModal] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showVariantModal, setShowVariantModal] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);

  // Replace form state
  const [replaceTargetIngId, setReplaceTargetIngId] = useState<string>('');
  const [replaceProposedQty, setReplaceProposedQty] = useState<number>(0);

  // Add form state
  const [addSelectedLibId, setAddSelectedLibId] = useState<string>('');
  const [addCustomName, setAddCustomName] = useState<string>('');
  const [addCustomType, setAddCustomType] = useState<string>('');
  const [addCustomPrice, setAddCustomPrice] = useState<string>('');
  const [addQuantityKg, setAddQuantityKg] = useState<number>(5);

  // Adjustment helper state
  const [adjustmentTargetName, setAdjustmentTargetName] = useState<string>('');
  const [adjustmentPreview, setAdjustmentPreview] = useState<ReturnType<typeof calculateTargetAdjustment> | null>(null);

  // Variant form state
  const [variantName, setVariantName] = useState<string>(`${formula.name || formula.code} - Variante`);

  // Apply to batches state
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [applyEffectiveDate, setApplyEffectiveDate] = useState<string>(currentDateStr || getTodayDateStr());
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  // Custom volume simulator
  const [simVolumeKg, setSimVolumeKg] = useState<number>(100);

  // UI feedback
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Live calculations
  const calc = useMemo(() => {
    return calculateFormulaDetails(workingIngredients, simVolumeKg);
  }, [workingIngredients, simVolumeKg]);

  // Comparison with original formula
  const comparison = useMemo(() => {
    return compareFormulas(formula, workingIngredients);
  }, [formula, workingIngredients]);

  // Industrial product restriction
  if (formula.isIndustrialProduct) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Aliment Industriel de Démarrage
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-2 text-blue-900">
            <p className="font-bold">
              ℹ️ Produit fini industriel certifié (Sac 25 kg • 15 000 FCFA) :
            </p>
            <p className="leading-relaxed text-slate-700">
              Cet aliment est un aliment complet manufacturé sous emballage étanche. Modifier directement sa fiche de fabrication prétendraient modifier une composition industrielle fermée non maîtrisée par la ferme.
            </p>
            <p className="leading-relaxed text-slate-700">
              Pour réaliser une transformation, un complément ou un prémélange, vous devez <strong>créer une recette personnalisée distincte</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                const variant = createFormulaVariant(formula, 'Aliment Démarrage Personnalisé / Transformé', authorName);
                variant.isIndustrialProduct = false;
                variant.phase = 'Personnalisée';
                onCreateNewFormula(variant);
                onClose();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="h-4 w-4" /> Créer une Recette Personnalisée à partir de cette base
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle quantity change for an ingredient
  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = [...workingIngredients];
    updated[index] = {
      ...updated[index],
      quantityKg100: Math.max(0, Math.round(newQty * 100) / 100)
    };
    setWorkingIngredients(updated);
    setUiError(null);
  };

  // Handle price change for an ingredient
  const handlePriceChange = (index: number, newPriceStr: string) => {
    const updated = [...workingIngredients];
    const val = newPriceStr.trim() === '' ? undefined : parseFloat(newPriceStr);
    updated[index] = {
      ...updated[index],
      refPriceFcfaKg: val !== undefined && !isNaN(val) && val >= 0 ? val : undefined
    };
    setWorkingIngredients(updated);
  };

  // Remove an ingredient
  const handleRemoveIngredient = (index: number) => {
    const target = workingIngredients[index];
    if (confirm(`Confirmez-vous le retrait de « ${target.name} » de cette recette ?`)) {
      setWorkingIngredients(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Open replace modal
  const handleOpenReplace = (index: number) => {
    setShowReplaceModal(index);
    setReplaceProposedQty(workingIngredients[index].quantityKg100);
    setReplaceTargetIngId('');
    setUiError(null);
  };

  // Execute replace
  const handleConfirmReplace = () => {
    if (showReplaceModal === null) return;
    const target = workingIngredients[showReplaceModal];
    const newLibItem = ingredientsLibrary.find(i => i.id === replaceTargetIngId);

    if (!newLibItem) {
      setUiError('Veuillez sélectionner le nouvel ingrédient de remplacement.');
      return;
    }

    if (replaceProposedQty <= 0) {
      setUiError('La quantité de remplacement doit être strictement supérieure à zéro.');
      return;
    }

    const updated = [...workingIngredients];
    updated[showReplaceModal] = {
      ingredientId: newLibItem.id,
      name: newLibItem.name,
      typeOrForm: newLibItem.typeOrForm,
      quantityKg100: Math.round(replaceProposedQty * 100) / 100,
      refPriceFcfaKg: newLibItem.refPriceFcfaKg,
      nutrition: newLibItem.nutrition,
      maxIncorporationPercent: newLibItem.maxIncorporationPercent,
      notes: `Remplacement de ${target.name} (${target.quantityKg100} kg)`
    };

    setWorkingIngredients(updated);
    setShowReplaceModal(null);
    setUiSuccess(`« ${target.name} » remplacé par « ${newLibItem.name} » (${replaceProposedQty} kg).`);
    setTimeout(() => setUiSuccess(null), 3500);
  };

  // Execute add ingredient
  const handleConfirmAdd = () => {
    let newIng: IngredientProportion;

    if (addSelectedLibId) {
      const lib = ingredientsLibrary.find(i => i.id === addSelectedLibId);
      if (!lib) return;
      newIng = {
        ingredientId: lib.id,
        name: lib.name,
        typeOrForm: lib.typeOrForm,
        quantityKg100: Math.round(addQuantityKg * 100) / 100,
        refPriceFcfaKg: lib.refPriceFcfaKg,
        nutrition: lib.nutrition,
        maxIncorporationPercent: lib.maxIncorporationPercent,
        notes: lib.incorporationJustification
      };
    } else {
      if (!addCustomName.trim()) {
        setUiError('Le nom de l\'ingrédient est obligatoire.');
        return;
      }
      const price = addCustomPrice.trim() !== '' ? parseFloat(addCustomPrice) : undefined;
      newIng = {
        name: addCustomName.trim(),
        typeOrForm: addCustomType.trim() || 'Ingrédient personnalisé',
        quantityKg100: Math.round(addQuantityKg * 100) / 100,
        refPriceFcfaKg: price !== undefined && !isNaN(price) && price >= 0 ? price : undefined,
        notes: 'Ajout personnalisé'
      };
    }

    setWorkingIngredients(prev => [...prev, newIng]);
    setShowAddModal(false);
    setAddCustomName('');
    setAddCustomType('');
    setAddCustomPrice('');
    setAddSelectedLibId('');
    setUiSuccess(`Ingrédient « ${newIng.name} » ajouté (${addQuantityKg} kg).`);
    setTimeout(() => setUiSuccess(null), 3500);
  };

  // Preview 100 kg adjustment
  const handlePreviewAdjustment = (ingName: string) => {
    setAdjustmentTargetName(ingName);
    const result = calculateTargetAdjustment(workingIngredients, ingName);
    setAdjustmentPreview(result);
  };

  // Confirm 100 kg adjustment
  const handleConfirmAdjustment = () => {
    if (!adjustmentPreview || !adjustmentPreview.success) return;
    const targetIdx = workingIngredients.findIndex(i => i.name.toLowerCase() === adjustmentPreview.ingredientName.toLowerCase());
    if (targetIdx === -1) return;

    const updated = [...workingIngredients];
    updated[targetIdx] = {
      ...updated[targetIdx],
      quantityKg100: adjustmentPreview.newQuantityKg
    };
    setWorkingIngredients(updated);
    setAdjustmentPreview(null);
    setAdjustmentTargetName('');
    setUiSuccess(`Ajustement validé : « ${updated[targetIdx].name} » porté à ${updated[targetIdx].quantityKg100} kg pour atteindre 100 kg pile.`);
    setTimeout(() => setUiSuccess(null), 4000);
  };

  // Save as Draft
  const handleSaveDraft = () => {
    const updated = createDraftFormulaVersion(
      formula,
      workingIngredients,
      authorName,
      changeReason || 'Mise à jour de la composition (Brouillon)'
    );
    updated.name = formulaName;
    updated.phase = formulaPhase;
    updated.status = 'brouillon';
    onSaveFormula(updated);
    setUiSuccess('Brouillon enregistré avec succès. La version précédente est archivée dans l\'historique.');
    setTimeout(() => {
      setUiSuccess(null);
      onClose();
    }, 1500);
  };

  // Submit to Validation
  const handleSubmitValidation = () => {
    if (!calc.is100KgExact) {
      setUiError(`Validation impossible : la masse totale est de ${calc.totalWeightKg} kg. Elle doit être égale à exactement 100,00 kg (actuellement : ${calc.status100KgMessage}).`);
      return;
    }

    if (!changeReason.trim()) {
      setUiError('Veuillez indiquer le motif du changement avant de soumettre la recette à validation.');
      return;
    }

    const updated = createDraftFormulaVersion(
      formula,
      workingIngredients,
      authorName,
      changeReason
    );
    updated.name = formulaName;
    updated.phase = formulaPhase;
    updated.status = 'à valider';
    onSaveFormula(updated);
    setUiSuccess('Recette soumise à validation technique avec succès !');
    setTimeout(() => {
      setUiSuccess(null);
      onClose();
    }, 1500);
  };

  // Official Approval
  const handleValidateOfficial = () => {
    if (!calc.is100KgExact) {
      setUiError(`Validation impossible : la masse totale est de ${calc.totalWeightKg} kg (doit être exactement 100,00 kg).`);
      return;
    }
    if (!validatorName.trim()) {
      setUiError('Le nom du validateur / responsable d\'élevage est obligatoire.');
      return;
    }

    const updated = createDraftFormulaVersion(
      formula,
      workingIngredients,
      authorName,
      changeReason || 'Validation officielle'
    );
    updated.name = formulaName;
    updated.phase = formulaPhase;
    updated.status = 'validée';
    updated.validatorName = validatorName.trim();
    updated.validationDate = currentDateStr || getTodayDateStr();
    onSaveFormula(updated);
    setUiSuccess(`Recette validée officiellement par ${updated.validatorName} le ${formatDateFr(updated.validationDate)} !`);
    setTimeout(() => {
      setUiSuccess(null);
      onClose();
    }, 1500);
  };

  // Create Variant
  const handleCreateVariant = () => {
    if (!variantName.trim()) {
      setUiError('Veuillez nommer la nouvelle variante.');
      return;
    }
    const variant = createFormulaVariant(formula, variantName.trim(), authorName);
    variant.ingredients = workingIngredients.map(i => ({ ...i }));
    onCreateNewFormula(variant);
    setShowVariantModal(false);
    setUiSuccess(`Nouvelle variante « ${variant.name} » créée avec succès ! La recette d'origine « ${formula.name || formula.code} » reste inchangée.`);
    setTimeout(() => setUiSuccess(null), 3000);
  };

  // Apply to batches
  const handleApplyToBatches = () => {
    if (selectedBatchIds.length === 0) {
      setUiError('Veuillez cocher au moins un lot de volailles.');
      return;
    }

    selectedBatchIds.forEach(batchId => {
      const b = batches.find(item => item.id === batchId);
      if (b) {
        onUpdateBatch({
          ...b,
          feedProgramId: formula.id,
          notes: (b.notes ? b.notes + '\n' : '') + `[${applyEffectiveDate}] Application formule ${formula.name || formula.code} (v${formula.version})`
        });
      }
    });

    const updatedFormula = {
      ...formula,
      appliedBatches: [
        ...(formula.appliedBatches || []),
        ...selectedBatchIds.map(id => ({
          batchId: id,
          batchName: batches.find(b => b.id === id)?.name,
          effectiveDate: applyEffectiveDate,
          appliedAt: new Date().toISOString()
        }))
      ]
    };
    onSaveFormula(updatedFormula);

    setApplySuccessMsg(`Nouvelle recette appliquée à ${selectedBatchIds.length} lot(s) à compter du ${formatDateFr(applyEffectiveDate)} ! Les stocks déjà produits conservent leur composition d'origine.`);
    setTimeout(() => {
      setApplySuccessMsg(null);
      setShowApplyModal(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg sm:text-xl text-slate-900">
                Éditeur de Recette Alimentaire
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                formula.status === 'validée' ? 'bg-emerald-100 text-emerald-800' :
                formula.status === 'à valider' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                Statut actuel : {formula.status} • v{formula.version}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Code : <strong>{formula.code}</strong> • Base de calcul stricte : <strong>100 kg</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px]"
              title="Comparer avec l'ancienne version"
            >
              <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
              <span>Avant / Après</span>
            </button>

            {formula.history && formula.history.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px]"
                title="Historique des versions"
              >
                <History className="h-4 w-4 text-blue-600" />
                <span>Versions ({formula.history.length})</span>
              </button>
            )}

            <button
              onClick={() => setShowVariantModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px]"
              title="Créer une variante"
            >
              <Copy className="h-4 w-4 text-purple-600" />
              <span>Créer Variante</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {uiError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{uiError}</span>
          </div>
        )}

        {uiSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{uiSuccess}</span>
          </div>
        )}

        {/* Formula Metas: Name, Phase, Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nom de la formule *</label>
            <input
              type="text"
              value={formulaName}
              onChange={e => setFormulaName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Phase alimentaire ciblée *</label>
            <select
              value={formulaPhase}
              onChange={e => setFormulaPhase(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
            >
              <option value="Croissance">Croissance (J11 à J24)</option>
              <option value="Finition">Finition (J25 à J35+)</option>
              <option value="Personnalisée">Recette Personnalisée</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Auteur de la modification *</label>
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
              placeholder="Ex: Éleveur / Technicien"
            />
          </div>
        </div>

        {/* 100 KG CONTROL BAR */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          calc.is100KgExact 
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
            : calc.status100KgSeverity === 'missing'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              calc.is100KgExact ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base">
                  Masse Totale : {calc.totalWeightKg.toFixed(2)} kg / 100,00 kg
                </span>
                {calc.is100KgExact ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conforme
                  </span>
                ) : (
                  <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Bloquant pour fabrication
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5 font-medium">
                {calc.status100KgMessage}
              </p>
            </div>
          </div>

          {/* Adjustment Helper */}
          {!calc.is100KgExact && (
            <div className="bg-white/90 p-3 rounded-xl border border-slate-200 text-xs space-y-2 w-full md:w-auto shadow-xs">
              <span className="font-bold text-slate-800 block text-[11px]">
                Aide à l'équilibrage des 100 kg :
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={adjustmentTargetName}
                  onChange={e => handlePreviewAdjustment(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
                >
                  <option value="">Sélectionner un ingrédient à ajuster...</option>
                  {workingIngredients.map(i => (
                    <option key={i.name} value={i.name}>
                      {i.name} ({i.quantityKg100} kg)
                    </option>
                  ))}
                </select>

                {adjustmentPreview && adjustmentPreview.success && (
                  <button
                    onClick={handleConfirmAdjustment}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Ajuster à {adjustmentPreview.newQuantityKg} kg
                  </button>
                )}
              </div>

              {adjustmentPreview && (
                <p className="text-[10px] text-slate-500 italic max-w-xs">
                  ℹ️ {adjustmentPreview.notice}
                </p>
              )}
            </div>
          )}
        </div>

        {/* FINANCIAL SUMMARY & VOLUME SIMULATION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Coût 100 kg</span>
            <div className="text-lg font-black text-slate-900 mt-1">
              {calc.isCostComplete && calc.totalCost100Kg !== undefined 
                ? formatFcfa(calc.totalCost100Kg)
                : <span className="text-amber-600 text-xs font-bold">Incomplet (prix manquants)</span>
              }
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {calc.costPerKg ? `${calc.costPerKg.toFixed(2)} FCFA / kg` : 'Calcul incomplet'}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Sacs 25 kg & 50 kg</span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {calc.cost25Kg ? `25 kg : ${formatFcfa(calc.cost25Kg)}` : '—'}
            </div>
            <span className="text-xs font-bold text-slate-700 block mt-0.5">
              {calc.cost50Kg ? `50 kg : ${formatFcfa(calc.cost50Kg)}` : '—'}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Écart vs Origine</span>
            <div className="text-sm font-black mt-1">
              {comparison.isCostComparable && comparison.costDiff100Kg !== undefined ? (
                <span className={comparison.costDiff100Kg <= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {comparison.costDiff100Kg > 0 ? '+' : ''}{formatFcfa(comparison.costDiff100Kg)} / 100kg
                </span>
              ) : (
                <span className="text-slate-400 text-xs">Non comparable</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {comparison.costDiffPerKg !== undefined 
                ? `${comparison.costDiffPerKg > 0 ? '+' : ''}${comparison.costDiffPerKg.toFixed(2)} F/kg`
                : '—'}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Simulateur personnalisé</span>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                min="1"
                value={simVolumeKg}
                onChange={e => setSimVolumeKg(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
              />
              <span className="text-xs text-slate-500 font-bold">kg =</span>
              <span className="text-xs font-black text-emerald-700">
                {calc.getCustomVolumeCost(simVolumeKg) !== undefined 
                  ? formatFcfa(calc.getCustomVolumeCost(simVolumeKg)!) 
                  : '—'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Hors frais de broyage/mélange</span>
          </div>
        </div>

        {/* Warning if price missing */}
        {!calc.isCostComplete && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Prix non renseigné(s) :</strong> Le coût de fabrication est incomplet pour les ingrédients : 
              <span className="font-mono font-bold ml-1">{calc.missingPriceIngredients.join(', ')}</span>.
              Le logiciel ne suppose jamais un coût nul par défaut.
            </div>
          </div>
        )}

        {/* INGREDIENTS COMPOSITION TABLE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" /> Formule de composition ({workingIngredients.length} ingrédients)
            </h4>
            <button
              onClick={() => { setShowAddModal(true); setUiError(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200 cursor-pointer min-h-[36px]"
            >
              <Plus className="h-4 w-4" /> Ajouter un ingrédient
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="p-3 font-sans">Ingrédient & Forme</th>
                  <th className="p-3 text-center">Quantité (kg / 100 kg)</th>
                  <th className="p-3 text-center">% Masse</th>
                  <th className="p-3 text-right">Prix Ref. / kg</th>
                  <th className="p-3 text-right">Coût Ligne</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {workingIngredients.map((ing, idx) => {
                  const lineCost = typeof ing.refPriceFcfaKg === 'number' 
                    ? Math.round(ing.quantityKg100 * ing.refPriceFcfaKg)
                    : undefined;

                  const isOverLimit = ing.maxIncorporationPercent && ing.quantityKg100 > ing.maxIncorporationPercent;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 font-sans">
                        <div className="font-bold text-slate-900">{ing.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {ing.typeOrForm || 'Matière première'}
                          {ing.maxIncorporationPercent && (
                            <span className={`ml-2 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isOverLimit ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              Max conseillé : {ing.maxIncorporationPercent} %
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={ing.quantityKg100}
                          onChange={e => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-center font-bold font-mono text-slate-900"
                        />
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {ing.quantityKg100.toFixed(2)} %
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          placeholder="Non renseigné"
                          value={ing.refPriceFcfaKg !== undefined ? ing.refPriceFcfaKg : ''}
                          onChange={e => handlePriceChange(idx, e.target.value)}
                          className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-right font-mono text-slate-800"
                        />
                      </td>
                      <td className="p-3 text-right font-bold">
                        {lineCost !== undefined 
                          ? formatFcfa(lineCost)
                          : <span className="text-amber-600 text-[10px]">Incomplet</span>
                        }
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenReplace(idx)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Remplacer cet ingrédient par un autre"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Retirer cet ingrédient"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td className="p-3 font-sans">TOTAL RECETTE</td>
                  <td className={`p-3 text-center font-mono font-extrabold ${calc.is100KgExact ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {calc.totalWeightKg.toFixed(2)} kg
                  </td>
                  <td className="p-3 text-center text-slate-600">{calc.totalWeightKg.toFixed(2)} %</td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right font-extrabold text-emerald-700">
                    {calc.totalCost100Kg !== undefined ? formatFcfa(calc.totalCost100Kg) : 'Coût incomplet'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Change Reason for Audit & Versioning */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <label className="block font-bold text-slate-700">
            Motif de la modification (Requis pour soumission ou validation) *
          </label>
          <input
            type="text"
            value={changeReason}
            onChange={e => setChangeReason(e.target.value)}
            placeholder="Ex : Remplacement partiel du blé par le son de blé pour réduction de coût..."
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
          />
          <p className="text-[11px] text-slate-500">
            ℹ️ Toute modification d'une formule validée génère une nouvelle révision en statut « brouillon ». L'ancienne formule et les fabrications passées demeurent strictement archivées et intactes.
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all border border-purple-200 cursor-pointer min-h-[40px]"
            >
              <Send className="h-4 w-4" /> Appliquer aux lots de volailles
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer min-h-[40px]"
            >
              Annuler
            </button>

            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px]"
            >
              Enregistrer le brouillon
            </button>

            <button
              onClick={handleSubmitValidation}
              disabled={!calc.is100KgExact}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                calc.is100KgExact 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              title={!calc.is100KgExact ? 'Le total doit être égal à 100 kg pour soumettre' : 'Soumettre à validation'}
            >
              <Send className="h-4 w-4" /> Soumettre à validation
            </button>

            <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
              <input
                type="text"
                value={validatorName}
                onChange={e => setValidatorName(e.target.value)}
                placeholder="Nom du validateur"
                className="w-36 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
              />
              <button
                onClick={handleValidateOfficial}
                disabled={!calc.is100KgExact}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                  calc.is100KgExact 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Valider officiellement
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SUB-MODAL 1: REPLACE INGREDIENT */}
      {showReplaceModal !== null && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" /> Remplacer un Ingrédient
              </h3>
              <button onClick={() => setShowReplaceModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Item Overview */}
            {(() => {
              const currentItem = workingIngredients[showReplaceModal];
              const selectedLib = ingredientsLibrary.find(i => i.id === replaceTargetIngId);
              const weightDiff = replaceProposedQty - currentItem.quantityKg100;
              const costBefore = (currentItem.refPriceFcfaKg || 0) * currentItem.quantityKg100;
              const costAfter = selectedLib && selectedLib.refPriceFcfaKg ? selectedLib.refPriceFcfaKg * replaceProposedQty : undefined;
              const costDiff = costAfter !== undefined ? costAfter - costBefore : undefined;

              const isSensitive = ['prémix', 'lysine', 'méthionine', 'sel', 'phosphate', 'carbonate'].some(k => 
                currentItem.name.toLowerCase().includes(k)
              );

              return (
                <div className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ingrédient à remplacer :</span>
                    <div className="text-sm font-black text-slate-900">
                      {currentItem.name} — {currentItem.quantityKg100} kg
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Prix actuel : {currentItem.refPriceFcfaKg ? `${currentItem.refPriceFcfaKg} F/kg` : 'Inconnu'} • Rôle : {currentItem.notes || 'Matière première'}
                    </div>
                  </div>

                  {isSensitive && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        <strong>Avertissement minéraux et additifs :</strong> Cet ingrédient joue un rôle physiologique ou métabolique précis. Ne jamais substituer un minéral, prémix ou acide aminé sur la seule base de son poids ou de son prix.
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nouvel ingrédient de remplacement *</label>
                    <select
                      value={replaceTargetIngId}
                      onChange={e => setReplaceTargetIngId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      <option value="">Sélectionner dans la bibliothèque certifiée...</option>
                      {ingredientsLibrary.map(lib => (
                        <option key={lib.id} value={lib.id}>
                          {lib.name} ({lib.typeOrForm}) — {lib.refPriceFcfaKg ? `${lib.refPriceFcfaKg} F/kg` : 'Prix inconnu'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantité proposée (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.05"
                      value={replaceProposedQty}
                      onChange={e => setReplaceProposedQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      (Valeur initiale égale à {currentItem.quantityKg100} kg comme point de départ de calcul).
                    </p>
                  </div>

                  {/* Impact preview */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px]">Conséquences prévisionnelles :</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Impact Masse Totale :</span>
                        <span className={`font-bold ${weightDiff === 0 ? 'text-slate-800' : (weightDiff > 0 ? 'text-amber-600' : 'text-blue-600')}`}>
                          {weightDiff > 0 ? `+${weightDiff.toFixed(2)} kg` : (weightDiff < 0 ? `${weightDiff.toFixed(2)} kg` : 'Masse inchangée')}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Impact Coût de la ligne :</span>
                        <span className={`font-bold ${costDiff !== undefined ? (costDiff <= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-400'}`}>
                          {costDiff !== undefined 
                            ? `${costDiff > 0 ? '+' : ''}${formatFcfa(costDiff)}`
                            : 'Incomplet'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[10px] space-y-1">
                      <p className="font-bold">⚠️ Règle de formulation avicole :</p>
                      <p>
                        Un remplacement à poids égal sert uniquement de base arithmétique et ne doit <strong>jamais être considéré comme une équivalence nutritionnelle</strong> (teneur en protéines, énergie et acides aminés diffèrent).
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReplaceModal(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReplace}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                    >
                      Confirmer le remplacement
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: ADD INGREDIENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" /> Ajouter un Ingrédient à la Recette
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Option 1 : Choisir dans la bibliothèque certifiée
                </label>
                <select
                  value={addSelectedLibId}
                  onChange={e => {
                    setAddSelectedLibId(e.target.value);
                    if (e.target.value) {
                      setAddCustomName('');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="">Sélectionner un ingrédient certifié...</option>
                  {ingredientsLibrary.map(lib => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name} ({lib.typeOrForm}) — {lib.refPriceFcfaKg ? `${lib.refPriceFcfaKg} F/kg` : 'Prix inconnu'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block font-bold text-slate-700 mb-1">
                  Option 2 : Ou créer un nouvel ingrédient personnalisé
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nom précis (ex : Farine de graines de courge broyées)"
                    value={addCustomName}
                    onChange={e => {
                      setAddCustomName(e.target.value);
                      if (e.target.value) setAddSelectedLibId('');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Type ou forme (ex : Tourteau / Farine)"
                      value={addCustomType}
                      onChange={e => setAddCustomType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Prix / kg en FCFA"
                      value={addCustomPrice}
                      onChange={e => setAddCustomPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantité à incorporer (kg pour 100 kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.05"
                  value={addQuantityKg}
                  onChange={e => setAddQuantityKg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Ajouter à la composition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: BEFORE / AFTER COMPARISON */}
      {showCompareModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-emerald-600" /> Comparaison Avant / Après
              </h3>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Added / Removed / Modified */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800">Modifications des composants :</h5>
                {comparison.addedIngredients.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-900">Ingrédient(s) ajouté(s) :</span>
                    <ul className="list-disc list-inside text-emerald-800">
                      {comparison.addedIngredients.map(i => (
                        <li key={i.name}>{i.name} : +{i.quantityKg100} kg</li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.removedIngredients.length > 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <span className="font-bold text-rose-900">Ingrédient(s) retiré(s) :</span>
                    <ul className="list-disc list-inside text-rose-800">
                      {comparison.removedIngredients.map(i => (
                        <li key={i.name}>{i.name} ({i.quantityKg100} kg dans la formule d'origine)</li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.modifiedIngredients.length > 0 && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <span className="font-bold text-blue-900">Quantités modifiées :</span>
                    <ul className="list-disc list-inside text-blue-800">
                      {comparison.modifiedIngredients.map(i => (
                        <li key={i.name}>
                          {i.name} : {i.oldQty} kg → {i.newQty} kg ({i.diffQty > 0 ? `+${i.diffQty}` : i.diffQty} kg)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.addedIngredients.length === 0 && comparison.removedIngredients.length === 0 && comparison.modifiedIngredients.length === 0 && (
                  <p className="text-slate-500 italic">Aucune différence détectée avec la version précédente.</p>
                )}
              </div>

              {/* Cost diff */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-slate-700 block">Différence financière prévisionnelle :</span>
                {comparison.isCostComparable ? (
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-extrabold ${comparison.costDiff100Kg! <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {comparison.costDiff100Kg! > 0 ? '+' : ''}{formatFcfa(comparison.costDiff100Kg!)} pour 100 kg
                    </span>
                    <span className="text-slate-500">
                      ({comparison.costDiffPerKg! > 0 ? '+' : ''}{comparison.costDiffPerKg!.toFixed(2)} FCFA / kg)
                    </span>
                  </div>
                ) : (
                  <p className="text-amber-700 font-semibold">
                    Comparaison financière incomplète : certains prix ne sont pas renseignés dans l'une des versions.
                  </p>
                )}
              </div>

              {/* Nutritional comparison or missing data banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-slate-700 block">Valeurs nutritionnelles calculables :</span>
                {comparison.nutritionComparison && comparison.nutritionComparison.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {comparison.nutritionComparison.map(n => (
                      <div key={n.metric} className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">{n.metric}</span>
                        <div className="font-bold text-slate-800">
                          {n.newValue} {n.unit}
                        </div>
                        {n.diff !== undefined && n.diff !== 0 && (
                          <span className={`text-[10px] font-bold ${n.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {n.diff > 0 ? `+${n.diff}` : n.diff} {n.unit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-800 text-[11px] bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    ℹ️ Composition nutritionnelle non vérifiable avec les données disponibles (profils d'ingrédients incomplets).
                  </p>
                )}
              </div>

              {/* Mandatory Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <strong>Mention obligatoire :</strong> L'objectif de poids vif moyen de 2,1 à 2,2 kg à J35 constitue une cible de suivi et ne représente en aucun cas une garantie automatique de résultat. La réussite zootechnique dépend également des conditions d'ambiance, de température, de biosécurité et de conduite d'élevage.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fermer la comparaison
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: VERSION HISTORY */}
      {showHistoryModal && formula.history && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" /> Historique des Révisions de la Recette
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {formula.history.map(hist => (
                <div key={hist.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-800">Version {hist.version}</span>
                    <span className="text-[10px] text-slate-400">{formatDateFr(hist.date)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Statut : <strong>{hist.status}</strong> • Auteur : {hist.author || 'Non renseigné'}
                  </div>
                  {hist.changeReason && (
                    <div className="text-[11px] text-slate-500 italic">
                      Motif : {hist.changeReason}
                    </div>
                  )}
                  {hist.validatorName && (
                    <div className="text-[11px] text-emerald-700 font-bold">
                      Validé par {hist.validatorName} le {formatDateFr(hist.validationDate || hist.date)}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    {hist.ingredients.length} ingrédients • Coût 100 kg : {hist.calculatedCostPer100Kg ? formatFcfa(hist.calculatedCostPer100Kg) : 'Incomplet'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 5: CREATE VARIANT */}
      {showVariantModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Copy className="h-5 w-5 text-purple-600" /> Créer une Variante de Recette
              </h3>
              <button onClick={() => setShowVariantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Une variante crée une nouvelle formule distincte indépendante. La recette d'origine « {formula.name || formula.code} » reste totalement préservée.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de la variante *</label>
                <input
                  type="text"
                  value={variantName}
                  onChange={e => setVariantName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateVariant}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                >
                  Créer la variante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 6: APPLY TO BATCHES */}
      {showApplyModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" /> Appliquer la Recette aux Lots de Volailles
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {applySuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{applySuccessMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl space-y-1 text-purple-950">
                <span className="font-bold">Formule à déployer :</span>
                <div className="text-sm font-black">{formulaName} (v{formula.version})</div>
                <div className="text-[11px] text-purple-800">
                  Phase : {formulaPhase} • Coût ref : {calc.costPerKg ? `${calc.costPerKg} F/kg` : 'Incomplet'}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date d'effet pour les prochaines fabrications *</label>
                <input
                  type="date"
                  value={applyEffectiveDate}
                  onChange={e => setApplyEffectiveDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Sélectionner les lots concernés :</label>
                {batches.filter(b => !b.deletedAt && b.status !== 'completed').length === 0 ? (
                  <p className="text-slate-400 italic">Aucun lot actif ou planifié disponible.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 p-2 rounded-xl">
                    {batches.filter(b => !b.deletedAt && b.status !== 'completed').map(b => (
                      <label key={b.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBatchIds.includes(b.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedBatchIds(prev => [...prev, b.id]);
                            else setSelectedBatchIds(prev => prev.filter(id => id !== b.id));
                          }}
                          className="rounded text-purple-600"
                        />
                        <div>
                          <span className="font-bold text-slate-800">{b.name}</span>
                          <span className="text-[10px] text-slate-500 ml-2">({b.initialSize} sujets • Statut : {b.status})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px]">
                ℹ️ Les stocks d'aliments déjà fabriqués conservent leur formulation d'origine jusqu'à épuisement. Cette nouvelle version s'appliquera pour les fabrications et distributions programmées à compter du {formatDateFr(applyEffectiveDate)}.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleApplyToBatches}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirmer le déploiement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
