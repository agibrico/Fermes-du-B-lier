import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TechnicalParams, 
  FeedIngredient, 
  CuttingYield, 
  PoultryBatch 
} from '../types';
import { 
  FEED_INGREDIENTS_100KG, 
  CUTTING_YIELDS_STANDARD, 
  ROTATION_SCENARIOS, 
  ADVICE_BIOSAFETY 
} from '../data';
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
  User 
} from 'lucide-react';

interface AdminDashboardProps {
  batches: PoultryBatch[];
  technicalParams: TechnicalParams;
  onUpdateTechnicalParams: (params: TechnicalParams) => void;
  cuttingYields: CuttingYield[];
  onUpdateCuttingYields: (yields: CuttingYield[]) => void;
  onBack: () => void;
}

export default function AdminDashboard({
  batches,
  technicalParams,
  onUpdateTechnicalParams,
  cuttingYields,
  onUpdateCuttingYields,
  onBack
}: AdminDashboardProps) {

  // Active sub-tabs in admin dashboard
  const [activeTab, setActiveTab] = useState<'financials' | 'formulas' | 'rotation'>('financials');

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

  // Formula simulator state
  const [simulatedPhase, setSimulatedPhase] = useState<'Démarrage' | 'Croissance' | 'Finition'>('Croissance');
  const [simulatedVolume, setSimulatedVolume] = useState<number>(500); // desired volume in kg

  // Save changes handler
  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    
    // update technical params
    onUpdateTechnicalParams({
      chickUnitPriceFcfa: chickPrice,
      healthUnitPriceFcfa: healthPrice,
      feedCostPerKg: {
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
      unitPriceFcfaKg: newPrice
    };
    setLocalCuttingYields(updated);
  };

  // Calculations for global KPIs across all batches
  const getGlobalKpis = () => {
    const totalLots = batches.length;
    const activeLots = batches.filter(b => b.status === 'active').length;
    
    let totalInitialBirds = 0;
    let totalMortalities = 0;
    let totalRevenueRecorded = 0;

    batches.forEach(b => {
      totalInitialBirds += b.initialSize;
      totalMortalities += b.mortalities.reduce((sum, log) => sum + log.count, 0);
      if (b.status === 'completed' && b.soldRevenue) {
        totalRevenueRecorded += b.soldRevenue;
      }
    });

    const overallMortalityRate = totalInitialBirds > 0 
      ? ((totalMortalities / totalInitialBirds) * 100).toFixed(1)
      : '0.0';

    return {
      totalLots,
      activeLots,
      totalInitialBirds,
      totalMortalities,
      overallMortalityRate,
      totalRevenueRecorded
    };
  };

  const kpis = getGlobalKpis();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              id="back-to-welcome-btn"
              onClick={onBack}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-sans font-bold text-lg text-slate-900">
                Espace Décisionnel Administrateur
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Pilotage économique, standards techniques & Formulation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 text-emerald-700">
            <User className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Compte Directeur</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Row 1: Global KPIs Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Lots Enregistrés</span>
            <span className="block text-2xl font-bold text-slate-950 font-mono mt-1">
              {kpis.totalLots} <span className="text-xs font-normal text-slate-500">({kpis.activeLots} actifs)</span>
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Sujets Introduits</span>
            <span className="block text-2xl font-bold text-slate-950 font-mono mt-1">
              {kpis.totalInitialBirds} <span className="text-xs font-normal text-slate-500">têtes</span>
            </span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Taux de Mortalité Global</span>
            <span className={`block text-2xl font-bold font-mono mt-1 ${parseFloat(kpis.overallMortalityRate) > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {kpis.overallMortalityRate}%
            </span>
            <span className="text-[9px] text-slate-500 block font-semibold">Perte cumulée : {kpis.totalMortalities} têtes</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block font-bold">Revenus Enregistrés</span>
            <span className="block text-2xl font-bold text-emerald-600 font-mono mt-1">
              {kpis.totalRevenueRecorded.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">FCFA</span>
            </span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 px-5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'financials' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="h-4 w-4" /> Tarifs & Tarification Découpe
          </button>
          
          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 px-5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'formulas' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ChefHat className="h-4 w-4" /> Simulateur Formules Aliments
          </button>

          <button
            onClick={() => setActiveTab('rotation')}
            className={`py-3 px-5 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'rotation' 
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm rounded-t-xl border-t border-x border-slate-200' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" /> Plan de Rotation & Trésorerie
          </button>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'financials' && (
            /* Tab 1: Financial & Technical parameters configuration */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <form onSubmit={handleSaveParams} className="lg:col-span-8 space-y-6">
                
                {/* Save message notification */}
                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2.5 font-medium shadow-sm"
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>Standards financiers mis à jour avec succès ! Toutes les simulations et calculs opérationnels ont été ajustés en temps réel.</span>
                  </motion.div>
                )}

                {/* Sub-section: Purchase prices and production costs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                    <Sliders className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-sm uppercase font-mono tracking-wider">Configuration des Coûts de Production</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chick price */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-600 font-bold flex justify-between">
                        <span>Achat Poussin (amortissement 5% inclus)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Standard : 630 FCFA</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={chickPrice}
                          onChange={(e) => setChickPrice(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 font-semibold">FCFA / poussin</span>
                      </div>
                    </div>

                    {/* Health cost */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-600 font-bold flex justify-between">
                        <span>Frais Annexes (Vaccins, Électricité, Copeaux)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Standard : 150 FCFA</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={healthPrice}
                          onChange={(e) => setHealthPrice(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500/20 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 font-semibold">FCFA / sujet</span>
                      </div>
                    </div>
                  </div>

                  {/* Feed prices by phase */}
                  <div className="space-y-3 pt-3">
                    <span className="text-xs text-slate-700 font-bold block">Coûts de l'aliment par kg</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Prédémarrage</span>
                        <input
                          type="number"
                          value={feedPre}
                          onChange={(e) => setFeedPre(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Démarrage</span>
                        <input
                          type="number"
                          value={feedDem}
                          onChange={(e) => setFeedDem(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Croissance</span>
                        <input
                          type="number"
                          value={feedCro}
                          onChange={(e) => setFeedCro(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-bold font-mono">Finition</span>
                        <input
                          type="number"
                          value={feedFin}
                          onChange={(e) => setFeedFin(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none"
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Sub-section: Selling prices for different cuts */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
                    <Scale className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-sm uppercase font-mono tracking-wider">Tarification de Valorisation à la Découpe</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ajustez les prix de vente au kilogramme (ou à la pièce) pour simuler et adapter la rentabilité selon l'évolution du marché local.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localCuttingYields.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{item.pieceName}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold">
                            {item.isPerUnit ? 'Prix par pièce' : `Rendement : ${item.percentageLiveWeight}% (~${item.weightPerSubjectKg.toFixed(3)}kg)`}
                          </span>
                        </div>
                        <div className="relative w-32">
                          <input
                            type="number"
                            value={item.unitPriceFcfaKg}
                            onChange={(e) => handleYieldPriceChange(idx, parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs text-right font-mono text-slate-800 focus:outline-none"
                          />
                          <span className="absolute left-2 top-2 text-[9px] font-mono text-slate-400 font-bold">FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit save button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <Save className="h-4 w-4" /> Enregistrer les Standards Financiers
                  </button>
                </div>

              </form>

              {/* Side Column: standard revenue reference card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2.5">Analyse Économique Standard</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Modélisation financière de base d'un unique sujet de <strong>2,4 kg</strong> valorisé à la découpe :
                  </p>

                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-600 pr-1">
                    {CUTTING_YIELDS_STANDARD.map((item, idx) => {
                      // calculations
                      let weight = item.isPerUnit ? '-' : `${item.weightPerSubjectKg.toFixed(3)} kg`;
                      let formula = item.isPerUnit 
                        ? `${item.pieceName.includes('Pattes') ? '2 x 50 FCFA' : '1 x 100 FCFA'}`
                        : `${item.weightPerSubjectKg.toFixed(3)} kg @ ${item.unitPriceFcfaKg} FCFA/kg`;
                      
                      let rev = item.isPerUnit 
                        ? (item.pieceName.includes('Pattes') ? 100 : 100)
                        : Math.round(item.weightPerSubjectKg * item.unitPriceFcfaKg);

                      return (
                        <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col gap-1">
                          <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                            <span>{item.pieceName}</span>
                            <span className="text-emerald-600 font-extrabold">{rev} FCFA</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                            <span>{formula}</span>
                            <span>{weight}</span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                      <span className="text-slate-700 font-sans font-bold">Total Revenu / Sujet :</span>
                      <span className="text-emerald-600 font-extrabold text-base">4 208 FCFA</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'formulas' && (
            /* Tab 2: House-made improved formulation simulator */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-emerald-600" /> Simulateur de Formulation Maison Réduite (Coût de production optimal)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Générez instantanément les proportions de pesées de matières premières pour fabriquer une quantité personnalisée d'aliment standard.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {(['Démarrage', 'Croissance', 'Finition'] as const).map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setSimulatedPhase(phase)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border cursor-pointer ${
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

              {/* Slider for volume selection */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 items-center shadow-inner">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs text-slate-500 font-bold flex justify-between font-mono">
                    <span>VOLUME TOTAL À FABRIQUER</span>
                    <span className="text-emerald-600 font-extrabold text-sm">{simulatedVolume} kg</span>
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={simulatedVolume}
                    onChange={(e) => setSimulatedVolume(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                    <span>50 kg</span>
                    <span>1 000 kg</span>
                    <span>2 500 kg</span>
                    <span>5 000 kg</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest block">Coût Est. de Production</span>
                  <span className="block text-xl font-bold text-emerald-600 font-mono mt-1">
                    {(simulatedVolume * 285).toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono block mt-0.5">
                    (sur base moyenne de ~285 FCFA/kg)
                  </span>
                </div>
              </div>

              {/* Formulation breakdown table */}
              <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-4 font-sans text-xs">Ingrédient</th>
                      <th className="p-4 text-center">Proportion Base 100 kg</th>
                      <th className="p-4 text-center text-emerald-700 font-extrabold">Poids Requis pour {simulatedVolume} kg</th>
                      <th className="p-4">Rôle technique & Ajustements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {FEED_INGREDIENTS_100KG.map((ing, idx) => {
                      // proportion depending on phase
                      const proportionKey = simulatedPhase === 'Démarrage' ? 'demarrageKg' : simulatedPhase === 'Croissance' ? 'croissanceKg' : 'finitionKg';
                      const baseProportion = ing[proportionKey];
                      const computedWeight = (baseProportion / 100) * simulatedVolume;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-4 font-sans font-bold text-slate-800 text-sm">{ing.name}</td>
                          <td className="p-4 text-center text-slate-500">{baseProportion.toFixed(2)} kg</td>
                          <td className="p-4 text-center font-bold text-emerald-600 text-sm">
                            {computedWeight >= 1 ? `${computedWeight.toFixed(2)} kg` : `${(computedWeight * 1000).toFixed(0)} g`}
                          </td>
                          <td className="p-4 font-sans text-[11px] text-slate-500 leading-relaxed">{ing.roleAndAdjustment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rotation' && (
            /* Tab 3: Continuous rotation overlap schedule and treasury */
            <div className="space-y-6">
              
              {/* Introduction to rotation */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Layers className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-slate-900">Planification de Rotation Continue (Bandes introduites tous les 10 jours)</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pour stabiliser les ventes et alimenter le marché en continu, une rotation de bandes tous les 10 jours est idéale. 
                  Cela implique que <strong>3 bandes d'âges différents coexistent simultanément</strong> dans votre ferme.
                  Le besoin en fonds de roulement de trésorerie est donc triplé par rapport à un cycle classique à vide sanitaire total.
                </p>

                {/* Overlapping matrix visualization */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 shadow-inner">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Illustration du chevauchement de 3 cohortes à un instant T</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center font-mono text-xs">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-24 shadow-sm">
                      <span className="text-emerald-600 font-bold block uppercase tracking-wide text-[10px]">Cohorte A (Les plus âgés)</span>
                      <span className="text-base font-bold text-slate-800 block">Phase Finition (J29-J35)</span>
                      <span className="text-[10px] text-slate-400 font-bold">Prêt pour abattage & découpe</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-24 shadow-sm">
                      <span className="text-emerald-600 font-bold block uppercase tracking-wide text-[10px]">Cohorte B (Intermédiaire)</span>
                      <span className="text-base font-bold text-slate-800 block">Phase Croissance (J15-J28)</span>
                      <span className="text-[10px] text-slate-400 font-bold">Pic de consommation alimentaire</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between h-24 shadow-sm">
                      <span className="text-emerald-600 font-bold block uppercase tracking-wide text-[10px]">Cohorte C (Les poussins)</span>
                      <span className="text-base font-bold text-slate-800 block">Phase Prédémarrage (J1-J10)</span>
                      <span className="text-[10px] text-slate-400 font-bold font-bold">Phase sensible à isoler thermiquement</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenarios Comparison Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {ROTATION_SCENARIOS.map((sc, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full filter blur-md group-hover:bg-emerald-500/10 transition-colors" />
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 font-sans">{sc.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Régime permanent ({sc.totalPresentInRotation} sujets au total sur site)</span>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100 font-mono text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Achat Poussins (tous les 10j) :</span>
                        <span className="text-slate-800 font-bold">{sc.poussinInvestment10d.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Fonds de Roulement Requis :</span>
                        <span className="text-emerald-600 font-bold">{sc.workingCapitalRequired.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Revenus Découpe (tous les 10j) :</span>
                        <span className="text-slate-800 font-bold">{sc.expectedRevenue10d.toLocaleString()} FCFA</span>
                      </div>
                      <div className="border-t border-slate-100 pt-2.5 flex justify-between items-center text-sm">
                        <span className="text-slate-700 font-sans font-bold">Gain Mensuel Récurrent :</span>
                        <span className="text-emerald-600 font-extrabold">{sc.netMonthlyProfit.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Biosecurity Warning advice card */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 shadow-sm">
                <div className="p-3 bg-amber-100/60 text-amber-700 rounded-xl h-fit border border-amber-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-sm text-amber-800">Conseil d'or pour la rotation : Biosécurité & Ventilation</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {ADVICE_BIOSAFETY}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

      </main>
    </div>
  );
}
