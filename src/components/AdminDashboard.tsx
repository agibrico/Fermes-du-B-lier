import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TechnicalParams, 
  CuttingYield, 
  PoultryBatch 
} from '../types';
import { 
  FEED_INGREDIENTS_100KG, 
  CUTTING_YIELDS_STANDARD, 
  ROTATION_SCENARIOS, 
  ADVICE_BIOSAFETY 
} from '../data';
import { formatFcfa } from '../utils/dateUtils';
import { calculateBatchMetrics } from '../utils/calculations';
import { 
  ArrowLeft, 
  Sliders, 
  ChefHat, 
  Layers, 
  Check, 
  Save, 
  ShieldCheck, 
  Coins, 
  Scale, 
  TrendingUp, 
  User,
  Database,
  Trash2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  batches: PoultryBatch[];
  technicalParams: TechnicalParams;
  onUpdateTechnicalParams: (params: TechnicalParams) => void;
  cuttingYields: CuttingYield[];
  onUpdateCuttingYields: (yields: CuttingYield[]) => void;
  onBack: () => void;
  onOpenBackup?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
}

export default function AdminDashboard({
  batches,
  technicalParams,
  onUpdateTechnicalParams,
  cuttingYields,
  onUpdateCuttingYields,
  onBack,
  onOpenBackup,
  onOpenTrash,
  trashCount = 0
}: AdminDashboardProps) {

  // Active sub-tabs in admin dashboard
  const [activeTab, setActiveTab] = useState<'financials' | 'formulas' | 'rotation' | 'lotsOverview'>('financials');

  // Parameters editing states
  const [chickPrice, setChickPrice] = useState(technicalParams.chickUnitPriceFcfa);
  const [healthPrice, setHealthPrice] = useState(technicalParams.healthUnitPriceFcfa);
  
  // Feed costs
  const [feedPre, setFeedPre] = useState(technicalParams.feedCostPerKg.Prédémarrage);
  const [feedDem, setFeedDem] = useState(technicalParams.feedCostPerKg.Démarrage);
  const [feedCro, setFeedCro] = useState(technicalParams.feedCostPerKg.Croissance);
  const [feedFin, setFeedFin] = useState(technicalParams.feedCostPerKg.Finition);

  // Selling prices of cutting pieces states
  const [localCuttingYields, setLocalCuttingYields] = useState<CuttingYield[]>(cuttingYields);

  // Saved notification message state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [paramError, setParamError] = useState<string | null>(null);

  // Formula simulator state
  const [simulatedPhase, setSimulatedPhase] = useState<'Démarrage' | 'Croissance' | 'Finition'>('Croissance');
  const [simulatedVolume, setSimulatedVolume] = useState<number>(500); // desired volume in kg

  // Non-deleted batches
  const nonDeletedBatches = batches.filter(b => !b.deletedAt);

  // Save changes handler with validation
  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();

    if (chickPrice <= 0 || healthPrice < 0 || feedPre <= 0 || feedDem <= 0 || feedCro <= 0 || feedFin <= 0) {
      setParamError("Tous les prix doivent être des valeurs positives non nulles.");
      return;
    }

    setParamError(null);
    
    // update technical params
    onUpdateTechnicalParams({
      ...technicalParams,
      chickUnitPriceFcfa: chickPrice,
      healthUnitPriceFcfa: healthPrice,
      feedCostPerKg: {
        ...technicalParams.feedCostPerKg,
        Prédémarrage: feedPre,
        Démarrage: feedDem,
        Croissance: feedCro,
        Finition: feedFin
      }
    });

    // update cutting yields
    onUpdateCuttingYields(localCuttingYields);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handler to change cutting yield price locally
  const handleYieldPriceChange = (index: number, newPrice: number) => {
    const updated = [...localCuttingYields];
    updated[index] = {
      ...updated[index],
      unitPriceFcfaKg: Math.max(0, newPrice)
    };
    setLocalCuttingYields(updated);
  };

  // Calculations for global KPIs across all batches
  const getGlobalKpis = () => {
    const totalLots = nonDeletedBatches.length;
    const activeLots = nonDeletedBatches.filter(b => b.status === 'active').length;
    const completedLots = nonDeletedBatches.filter(b => b.status === 'completed').length;
    
    let totalInitialBirds = 0;
    let totalMortalities = 0;
    let totalRevenueRecorded = 0;
    let totalProductionCosts = 0;

    nonDeletedBatches.forEach(b => {
      const m = calculateBatchMetrics(b, technicalParams, cuttingYields);
      totalInitialBirds += b.initialSize;
      totalMortalities += m.totalMortalities;
      totalRevenueRecorded += m.salesRealTotalFcfa;
      totalProductionCosts += m.expensesRealTotalFcfa;
    });

    const overallMortalityRate = totalInitialBirds > 0 
      ? ((totalMortalities / totalInitialBirds) * 100).toFixed(1)
      : '0.0';

    const globalNetMargin = totalRevenueRecorded - totalProductionCosts;

    return {
      totalLots,
      activeLots,
      completedLots,
      totalInitialBirds,
      totalMortalities,
      overallMortalityRate,
      totalRevenueRecorded,
      totalProductionCosts,
      globalNetMargin
    };
  };

  const kpis = getGlobalKpis();

  // Reset cutting yields to standard reference
  const handleResetCuttingYields = () => {
    if (window.confirm("Rétablir les prix standards de valorisation à la découpe ?")) {
      setLocalCuttingYields(CUTTING_YIELDS_STANDARD);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              id="back-to-welcome-btn"
              onClick={onBack}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-sans font-bold text-base md:text-lg text-slate-900 leading-tight">
                Espace Décisionnel Administrateur
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Pilotage économique, standards techniques & Formulation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenBackup && (
              <button
                onClick={onOpenBackup}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px]"
                title="Sauvegarde et Restauration"
              >
                <Database className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Sauvegarde / Import</span>
              </button>
            )}

            {onOpenTrash && (
              <button
                onClick={onOpenTrash}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px]"
                title="Corbeille des lots supprimés"
              >
                <Trash2 className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Corbeille</span>
                {trashCount > 0 && (
                  <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-mono">
                    {trashCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-700">
              <User className="h-4 w-4 text-emerald-600" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Compte Directeur</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 space-y-6">
        
        {/* Row 1: Global KPIs Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Lots Enregistrés</span>
            <span className="block text-xl md:text-2xl font-bold text-slate-950 font-mono mt-1">
              {kpis.totalLots} <span className="text-xs font-normal text-slate-500">({kpis.activeLots} actifs)</span>
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Sujets Introduits</span>
            <span className="block text-xl md:text-2xl font-bold text-slate-950 font-mono mt-1">
              {kpis.totalInitialBirds.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">têtes</span>
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Mortalité Globale</span>
            <span className={`block text-xl md:text-2xl font-bold font-mono mt-1 ${parseFloat(kpis.overallMortalityRate) > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {kpis.overallMortalityRate}%
            </span>
            <span className="text-[10px] text-slate-500 block font-semibold">Total : {kpis.totalMortalities} pertes</span>
          </div>

          <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Chiffre d'Affaires Enregistré</span>
            <span className="block text-xl md:text-2xl font-bold text-emerald-600 font-mono mt-1">
              {formatFcfa(kpis.totalRevenueRecorded)}
            </span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs md:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 px-4 md:px-5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'financials' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="h-4 w-4" /> Tarifs & Tarification Découpe
          </button>
          
          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 px-4 md:px-5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'formulas' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ChefHat className="h-4 w-4" /> Simulateur Formules Aliments
          </button>

          <button
            onClick={() => setActiveTab('rotation')}
            className={`py-3 px-4 md:px-5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'rotation' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" /> Plan de Rotation & Trésorerie
          </button>

          <button
            onClick={() => setActiveTab('lotsOverview')}
            className={`py-3 px-4 md:px-5 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'lotsOverview' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> Bilan Analytique des Lots
          </button>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'financials' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <form onSubmit={handleSaveParams} className="lg:col-span-8 space-y-6">
                
                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm rounded-xl flex items-center gap-2.5 font-medium shadow-sm"
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>Standards financiers mis à jour ! Tous les calculs et valorisations de l'espace fermier ont été actualisés.</span>
                  </motion.div>
                )}

                {paramError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{paramError}</span>
                  </div>
                )}

                {/* Sub-section: Costs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                    <Sliders className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-sm uppercase font-mono tracking-wider">Configuration des Coûts de Production</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-600 font-bold flex justify-between">
                        <span>Achat Poussin (amortissement 5% inclus)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Défaut : 630 FCFA</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={chickPrice}
                          onChange={(e) => setChickPrice(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none min-h-[44px]"
                        />
                        <span className="absolute right-3 top-3 text-[10px] font-mono text-slate-400 font-semibold">FCFA / poussin</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-600 font-bold flex justify-between">
                        <span>Frais Sanitaires & Litière par Sujet</span>
                        <span className="text-[10px] text-slate-400 font-mono">Défaut : 150 FCFA</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={healthPrice}
                          onChange={(e) => setHealthPrice(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none min-h-[44px]"
                        />
                        <span className="absolute right-3 top-3 text-[10px] font-mono text-slate-400 font-semibold">FCFA / sujet</span>
                      </div>
                    </div>
                  </div>

                  {/* Feed prices */}
                  <div className="space-y-3 pt-3">
                    <span className="text-xs text-slate-700 font-bold block">Coûts de revient de l'aliment par kg</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Prédémarrage</span>
                        <input
                          type="number"
                          value={feedPre}
                          onChange={(e) => setFeedPre(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-none min-h-[38px]"
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Démarrage</span>
                        <input
                          type="number"
                          value={feedDem}
                          onChange={(e) => setFeedDem(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-none min-h-[38px]"
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Croissance</span>
                        <input
                          type="number"
                          value={feedCro}
                          onChange={(e) => setFeedCro(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-none min-h-[38px]"
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Finition</span>
                        <input
                          type="number"
                          value={feedFin}
                          onChange={(e) => setFeedFin(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-none min-h-[38px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Cutting prices */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Scale className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-bold text-sm uppercase font-mono tracking-wider">Tarification de Valorisation à la Découpe</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCuttingYields}
                      className="text-xs text-slate-400 hover:text-slate-700 font-mono underline cursor-pointer"
                    >
                      Rétablir standards
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Ces prix sont directement appliqués dans l'espace fermier pour valoriser chaque lot de poulets à l'abattage.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {localCuttingYields.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{item.pieceName}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold">
                            {item.isPerUnit ? 'Prix unitaire pièce' : `Rendement : ${item.percentageLiveWeight}% (~${item.weightPerSubjectKg.toFixed(3)} kg)`}
                          </span>
                        </div>
                        <div className="relative w-32">
                          <input
                            type="number"
                            value={item.unitPriceFcfaKg}
                            onChange={(e) => handleYieldPriceChange(idx, parseInt(e.target.value, 10) || 0)}
                            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-right font-mono text-slate-800 focus:outline-none min-h-[38px]"
                          />
                          <span className="absolute left-2.5 top-2.5 text-[9px] font-mono text-slate-400 font-bold">FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer min-h-[44px]"
                  >
                    <Save className="h-4 w-4" /> Enregistrer les Nouveaux Tarifs
                  </button>
                </div>

              </form>

              {/* Side column: theoretical cutting model */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
                    Modélisation d'un Sujet Standard (2,4 kg)
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Résultat de valorisation théorique calculé avec vos tarifs actuels :
                  </p>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-600 pr-1">
                    {localCuttingYields.map((item, idx) => {
                      const rev = item.isPerUnit 
                        ? (item.pieceName.toLowerCase().includes('patte') ? item.unitPriceFcfaKg * 2 : item.unitPriceFcfaKg)
                        : Math.round(item.weightPerSubjectKg * item.unitPriceFcfaKg);

                      return (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col gap-1">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>{item.pieceName}</span>
                            <span className="text-emerald-600 font-extrabold">{formatFcfa(rev)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>{item.isPerUnit ? 'À l\'unité' : `${item.weightPerSubjectKg.toFixed(3)} kg à ${item.unitPriceFcfaKg} F/kg`}</span>
                          </div>
                        </div>
                      );
                    })}

                    {(() => {
                      const totalSubjectRev = localCuttingYields.reduce((sum, item) => {
                        const rev = item.isPerUnit 
                          ? (item.pieceName.toLowerCase().includes('patte') ? item.unitPriceFcfaKg * 2 : item.unitPriceFcfaKg)
                          : Math.round(item.weightPerSubjectKg * item.unitPriceFcfaKg);
                        return sum + rev;
                      }, 0);

                      const totalCostEst = chickPrice + healthPrice + (0.45 * feedPre + 0.45 * feedDem + 1.6 * feedCro + 1.0 * feedFin);
                      const netProfitEst = totalSubjectRev - totalCostEst;

                      return (
                        <div className="border-t border-slate-200 pt-3 space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>Revenu Total / Poulet :</span>
                            <span className="text-emerald-600">{formatFcfa(totalSubjectRev)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Coût Aliment + Poussin + Santé :</span>
                            <span>~ {formatFcfa(totalCostEst)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold border-t border-slate-100 pt-1 text-slate-900">
                            <span>Marge Nette Théorique :</span>
                            <span className={netProfitEst >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {formatFcfa(netProfitEst)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-emerald-600" /> Simulateur de Formulation Maison Optimisée
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                    Calculez les pesées d'ingrédients pour préparer n'importe quel tonnage d'aliment.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {(['Démarrage', 'Croissance', 'Finition'] as const).map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setSimulatedPhase(phase)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all border cursor-pointer min-h-[40px] ${
                        simulatedPhase === phase 
                          ? 'bg-emerald-600 border-emerald-500 text-white' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Selection with Presets */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-inner">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-600">Volumes prédéfinis :</span>
                  <div className="flex flex-wrap gap-2">
                    {[50, 100, 250, 500, 1000, 2000].map(v => (
                      <button
                        key={v}
                        onClick={() => setSimulatedVolume(v)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          simulatedVolume === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {v} kg
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-slate-500">Curseur de volume personnalisé :</span>
                      <span className="text-emerald-600 font-extrabold text-sm">{simulatedVolume} kg</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="5000"
                      step="25"
                      value={simulatedVolume}
                      onChange={(e) => setSimulatedVolume(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold font-mono uppercase block">Coût Est. de Fabrication</span>
                    <span className="block text-xl font-bold text-emerald-600 font-mono mt-0.5">
                      {formatFcfa(simulatedVolume * (technicalParams.feedCostPerKg[simulatedPhase] || 285))}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono block mt-0.5">
                      (~{technicalParams.feedCostPerKg[simulatedPhase] || 285} FCFA / kg)
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulation table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3 md:p-4 font-sans text-xs">Ingrédient</th>
                      <th className="p-3 md:p-4 text-center">Base 100 kg</th>
                      <th className="p-3 md:p-4 text-center text-emerald-700 font-extrabold">Pour {simulatedVolume} kg</th>
                      <th className="p-3 md:p-4">Rôle & Ajustements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {FEED_INGREDIENTS_100KG.map((ing, idx) => {
                      const propKey = simulatedPhase === 'Démarrage' ? 'demarrageKg' : (simulatedPhase === 'Croissance' ? 'croissanceKg' : 'finitionKg');
                      const baseProportion = ing[propKey];
                      const computedWeight = (baseProportion / 100) * simulatedVolume;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 md:p-4 font-sans font-bold text-slate-800 text-sm">{ing.name}</td>
                          <td className="p-3 md:p-4 text-center text-slate-500">{baseProportion.toFixed(2)} kg</td>
                          <td className="p-3 md:p-4 text-center font-bold text-emerald-600 text-sm">
                            {computedWeight >= 1 ? `${computedWeight.toFixed(2)} kg` : `${(computedWeight * 1000).toFixed(0)} g`}
                          </td>
                          <td className="p-3 md:p-4 font-sans text-[11px] text-slate-500 leading-relaxed">{ing.roleAndAdjustment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rotation' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Layers className="h-5 w-5" />
                  <h3 className="text-base md:text-lg font-bold text-slate-900">
                    Planification de Rotation Continue (Introduction tous les 10 jours)
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pour stabiliser la trésorerie et alimenter le marché en continu, une rotation de bandes tous les 10 jours permet des ventes régulières. 
                  Cela implique que <strong>3 bandes d'âges différents coexistent simultanément</strong> dans la ferme.
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 shadow-inner">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                    Chevauchement des 3 cohortes à un instant T
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center font-mono text-xs">
                    <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                      <span className="text-emerald-600 font-bold block uppercase text-[10px]">Cohorte 1 (Aînés)</span>
                      <span className="text-sm font-bold text-slate-800 block mt-1">Finition (J29-J35)</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Vente / Abattage immédiat</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                      <span className="text-emerald-600 font-bold block uppercase text-[10px]">Cohorte 2 (Intermédiaire)</span>
                      <span className="text-sm font-bold text-slate-800 block mt-1">Croissance (J15-J28)</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Pic d'ingestion d'aliment</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm">
                      <span className="text-emerald-600 font-bold block uppercase text-[10px]">Cohorte 3 (Poussins)</span>
                      <span className="text-sm font-bold text-slate-800 block mt-1">Prédémarrage (J1-J10)</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Chauffage et soins stricts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenarios */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {ROTATION_SCENARIOS.map((sc, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:border-emerald-500/40 transition-all">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 font-sans">{sc.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {sc.totalPresentInRotation} sujets en élevage permanent
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 font-mono text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Achat Poussins (tous les 10j) :</span>
                        <span className="text-slate-800 font-bold">{formatFcfa(sc.poussinInvestment10d)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Fonds de Roulement Requis :</span>
                        <span className="text-emerald-600 font-bold">{formatFcfa(sc.workingCapitalRequired)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Revenus Découpe (tous les 10j) :</span>
                        <span className="text-slate-800 font-bold">{formatFcfa(sc.expectedRevenue10d)}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-sm">
                        <span className="text-slate-700 font-sans font-bold">Bénéfice Net Mensuel :</span>
                        <span className="text-emerald-600 font-extrabold">{formatFcfa(sc.netMonthlyProfit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 shadow-sm">
                <ShieldCheck className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-900">Règle de Biosécurité Absolue pour la Rotation</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {ADVICE_BIOSAFETY}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lotsOverview' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-base">Tableau Récapitulatif Technico-Économique</h3>
                </div>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  {nonDeletedBatches.length} lot(s) analysé(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] text-slate-500 font-bold">
                    <tr>
                      <th className="p-3 font-sans">Lot</th>
                      <th className="p-3 text-center">Statut</th>
                      <th className="p-3 text-center">Âge</th>
                      <th className="p-3 text-center">Effectif</th>
                      <th className="p-3 text-center">Pertes</th>
                      <th className="p-3 text-center">Dernier Poids</th>
                      <th className="p-3 text-center">GMQ</th>
                      <th className="p-3 text-center">IC</th>
                      <th className="p-3 text-right">Coût Total</th>
                      <th className="p-3 text-right">Revenu</th>
                      <th className="p-3 text-right font-sans">Marge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nonDeletedBatches.map(b => {
                      const m = calculateBatchMetrics(b, technicalParams, cuttingYields);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-sans font-bold text-slate-800">{b.name}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.status === 'completed' ? 'bg-slate-100 text-slate-700' : (m.status === 'planned' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')
                            }`}>
                              {m.status === 'completed' ? 'Clôturé' : (m.status === 'planned' ? 'Planifié' : 'Actif')}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">J{m.ageDays}</td>
                          <td className="p-3 text-center text-slate-700">{b.initialSize}</td>
                          <td className="p-3 text-center text-rose-600 font-bold">{m.totalMortalities} ({m.mortalityRatePercent.toFixed(1)}%)</td>
                          <td className="p-3 text-center">{m.latestWeightGrams ? `${m.latestWeightGrams} g` : '-'}</td>
                          <td className="p-3 text-center">{m.gmqGramsPerDay > 0 ? `${m.gmqGramsPerDay.toFixed(1)} g/j` : '-'}</td>
                          <td className="p-3 text-center">{m.feedIndexIC !== null ? m.feedIndexIC.toFixed(2) : '-'}</td>
                          <td className="p-3 text-right">{formatFcfa(m.expensesRealTotalFcfa)}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">
                            {formatFcfa(m.salesRealTotalFcfa > 0 ? m.salesRealTotalFcfa : m.estimatedPotentialCuttingRevenueFcfa)}
                          </td>
                          <td className={`p-3 text-right font-bold ${m.netMarginRealizedFcfa >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatFcfa(m.netMarginRealizedFcfa)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
