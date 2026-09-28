import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PoultryBatch, 
  FeedPhase, 
  TechnicalParams, 
  MortalityLog, 
  WeightLog, 
  FeedPreparationLog 
} from '../types';
import { 
  FEED_PHASE_GUIDES, 
  FEED_INGREDIENTS_100KG, 
  SANITARY_CALENDAR, 
  CUTTING_YIELDS_STANDARD 
} from '../data';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  CircleDot, 
  ChefHat, 
  Layers, 
  Trash2, 
  Archive,
  BarChart4,
  Tractor
} from 'lucide-react';

interface FarmerDashboardProps {
  batches: PoultryBatch[];
  onAddBatch: (batch: PoultryBatch) => void;
  onUpdateBatch: (batch: PoultryBatch) => void;
  onDeleteBatch: (id: string) => void;
  onBack: () => void;
  technicalParams: TechnicalParams;
}

export default function FarmerDashboard({ 
  batches, 
  onAddBatch, 
  onUpdateBatch, 
  onDeleteBatch, 
  onBack,
  technicalParams 
}: FarmerDashboardProps) {
  
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  
  // New batch form states
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSize, setNewBatchSize] = useState<number>(150);
  const [newBatchDate, setNewBatchDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Interactive entry forms states
  const [weightInput, setWeightInput] = useState<string>('');
  const [mortalityInput, setMortalityInput] = useState<string>('');
  const [feedQuantityInput, setFeedQuantityInput] = useState<string>('');
  
  // Active batch selection
  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Calculate today's day number in the cycle for a batch (1-indexed)
  const getBatchAgeDays = (startDateStr: string): number => {
    const start = new Date(startDateStr);
    const today = new Date();
    // Zero out times
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // day 1 on start date
    return Math.min(35, Math.max(1, diffDays)); // clamp to standard 35 days cycle for operational tracking
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;

    const newBatch: PoultryBatch = {
      id: 'batch_' + Date.now(),
      name: newBatchName,
      initialSize: newBatchSize,
      startDate: newBatchDate,
      mortalities: [],
      weights: [],
      feedPreparations: [],
      completedSanitaryTasks: [],
      status: 'active'
    };

    onAddBatch(newBatch);
    setSelectedBatchId(newBatch.id);
    setShowNewBatchModal(false);
    setNewBatchName('');
  };

  // Helper calculations for selected batch
  const getBatchLiveStats = (batch: PoultryBatch) => {
    const totalMortalities = batch.mortalities.reduce((sum, log) => sum + log.count, 0);
    const activeSubjects = Math.max(0, batch.initialSize - totalMortalities);
    const mortalityRate = ((totalMortalities / batch.initialSize) * 100).toFixed(1);
    
    const ageDays = getBatchAgeDays(batch.startDate);
    const currentPhaseGuide = FEED_PHASE_GUIDES.find(g => ageDays >= g.startDay && ageDays <= g.endDay) || FEED_PHASE_GUIDES[FEED_PHASE_GUIDES.length - 1];
    
    const latestWeightLog = batch.weights.length > 0 ? batch.weights[batch.weights.length - 1] : null;
    const latestWeight = latestWeightLog ? latestWeightLog.weight : 0;
    
    // Total feed prepared/consumed in kg
    const totalFeedPrepared = batch.feedPreparations.reduce((sum, p) => sum + p.quantityKg, 0);

    return {
      ageDays,
      totalMortalities,
      activeSubjects,
      mortalityRate,
      currentPhaseGuide,
      latestWeight,
      totalFeedPrepared
    };
  };

  // Quick action: log weight
  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const weightGrams = parseFloat(weightInput);
    if (isNaN(weightGrams) || weightGrams <= 0) return;

    const ageDays = getBatchAgeDays(selectedBatch.startDate);
    
    const newWeightLog: WeightLog = {
      day: ageDays,
      weight: weightGrams,
      date: new Date().toISOString().split('T')[0]
    };

    // Filter out previous weight for this same day if re-entered
    const updatedWeights = selectedBatch.weights.filter(w => w.day !== ageDays);
    updatedWeights.push(newWeightLog);
    updatedWeights.sort((a, b) => a.day - b.day);

    onUpdateBatch({
      ...selectedBatch,
      weights: updatedWeights
    });

    setWeightInput('');
  };

  // Quick action: log mortality
  const handleLogMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const count = parseInt(mortalityInput);
    if (isNaN(count) || count <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    const newMortalityLog: MortalityLog = {
      date: todayStr,
      count
    };

    onUpdateBatch({
      ...selectedBatch,
      mortalities: [...selectedBatch.mortalities, newMortalityLog]
    });

    setMortalityInput('');
  };

  // Quick action: log feed preparation
  const handleLogFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    const qtyKg = parseFloat(feedQuantityInput);
    if (isNaN(qtyKg) || qtyKg <= 0) return;

    const ageDays = getBatchAgeDays(selectedBatch.startDate);
    const phaseGuide = FEED_PHASE_GUIDES.find(g => ageDays >= g.startDay && ageDays <= g.endDay) || FEED_PHASE_GUIDES[FEED_PHASE_GUIDES.length - 1];
    
    // Cost calculation per kg
    const costPerKg = technicalParams.feedCostPerKg[phaseGuide.phase] || 285;
    const totalCost = qtyKg * costPerKg;

    const newFeedLog: FeedPreparationLog = {
      id: 'feed_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      phase: phaseGuide.phase,
      quantityKg: qtyKg,
      costFcfa: totalCost
    };

    onUpdateBatch({
      ...selectedBatch,
      feedPreparations: [...selectedBatch.feedPreparations, newFeedLog]
    });

    setFeedQuantityInput('');
  };

  // Toggle sanitary task completed
  const handleToggleSanitaryTask = (day: number) => {
    if (!selectedBatch) return;
    const existingIndex = selectedBatch.completedSanitaryTasks.findIndex(t => t.day === day);
    
    let updatedTasks = [...selectedBatch.completedSanitaryTasks];
    if (existingIndex >= 0) {
      // Toggle off
      updatedTasks.splice(existingIndex, 1);
    } else {
      // Toggle on
      updatedTasks.push({
        day,
        completed: true,
        completedAt: new Date().toISOString()
      });
    }

    onUpdateBatch({
      ...selectedBatch,
      completedSanitaryTasks: updatedTasks
    });
  };

  // Complete batch and archive with cutting revenue simulation
  const handleArchiveBatch = (simulatedRevenue: number) => {
    if (!selectedBatch) return;
    onUpdateBatch({
      ...selectedBatch,
      status: 'completed',
      completionDate: new Date().toISOString().split('T')[0],
      soldRevenue: simulatedRevenue
    });
    setSelectedBatchId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              id="back-to-welcome-btn"
              onClick={selectedBatchId ? () => setSelectedBatchId(null) : onBack}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-sans font-bold text-lg text-slate-900">
                {selectedBatchId ? `Lot : ${selectedBatch?.name}` : 'Espace Opérationnel Fermier'}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                {selectedBatchId ? 'Suivi quotidien & Fabrication d\'aliments' : 'Gestion des lots actifs de poulets'}
              </p>
            </div>
          </div>
          
          {!selectedBatchId && (
            <button
              id="new-batch-btn"
              onClick={() => setShowNewBatchModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Nouveau Lot
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {!selectedBatchId ? (
            /* Lot List View */
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {batches.filter(b => b.status === 'active').length === 0 ? (
                /* No Active Lots Empty State */
                <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                    <Tractor className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Aucun lot de poulets actif</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Vous n'avez actuellement aucun élevage en cours. Démarrez un nouveau lot de 150, 200 ou 250 sujets pour appliquer le cycle Chrono de 35 jours.
                  </p>
                  <button
                    onClick={() => setShowNewBatchModal(true)}
                    className="mt-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Démarrer mon premier lot
                  </button>
                </div>
              ) : (
                /* Lots List Grid */
                <div className="space-y-4">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1 font-bold">Lots de production actifs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {batches.filter(b => b.status === 'active').map(batch => {
                      const stats = getBatchLiveStats(batch);
                      return (
                        <motion.button
                          key={batch.id}
                          onClick={() => setSelectedBatchId(batch.id)}
                          whileHover={{ scale: 1.01, y: -2 }}
                          className="text-left bg-white border border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between h-56 relative overflow-hidden group shadow-sm cursor-pointer w-full"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-lg group-hover:bg-emerald-500/10 transition-colors" />
                          <div className="w-full">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{batch.name}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Lancé le : {new Date(batch.startDate).toLocaleDateString('fr-FR')}</p>
                              </div>
                              <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold font-mono">
                                Jour {stats.ageDays}/35
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-5">
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold font-mono">Sujets vivants</span>
                                <span className="text-xl font-bold text-slate-800 font-mono">{stats.activeSubjects} <span className="text-xs font-normal text-slate-400">/ {batch.initialSize}</span></span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-bold font-mono">Dernier poids</span>
                                <span className="text-xl font-bold text-slate-800 font-mono">{stats.latestWeight ? `${stats.latestWeight} g` : 'Non renseigné'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 mt-4 w-full flex items-center justify-between text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1.5 font-sans text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Phase: {stats.currentPhaseGuide.phase}
                            </span>
                            <span className="font-mono text-emerald-600 group-hover:translate-x-1 transition-transform font-bold">Gérer &gt;</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Archived History Panel */}
              {batches.filter(b => b.status === 'completed').length > 0 && (
                <div className="space-y-3 pt-6 border-t border-slate-200">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1 font-bold">Historique des lots finalisés</h2>
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-4">Nom du lot</th>
                          <th className="p-4">Période</th>
                          <th className="p-4 text-center">Effectif Initial</th>
                          <th className="p-4 text-center">Mortalité Totale</th>
                          <th className="p-4 text-right">Revenu Abattage</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batches.filter(b => b.status === 'completed').map(batch => {
                          const totalMortalities = batch.mortalities.reduce((sum, log) => sum + log.count, 0);
                          return (
                            <tr key={batch.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-bold text-slate-800">{batch.name}</td>
                              <td className="p-4 text-slate-400 text-xs font-semibold">
                                Du {new Date(batch.startDate).toLocaleDateString('fr-FR')} au {batch.completionDate ? new Date(batch.completionDate).toLocaleDateString('fr-FR') : 'Non spécifié'}
                              </td>
                              <td className="p-4 text-center font-mono text-slate-700">{batch.initialSize}</td>
                              <td className="p-4 text-center font-mono text-rose-600 font-bold">{totalMortalities} ({((totalMortalities / batch.initialSize) * 100).toFixed(1)}%)</td>
                              <td className="p-4 text-right font-mono font-bold text-emerald-600">{(batch.soldRevenue || 0).toLocaleString('fr-FR')} FCFA</td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => onDeleteBatch(batch.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                                  title="Supprimer ce lot de l'historique"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Selected Active Lot Workspace */
            <motion.div 
              key="workspace-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Quick Stats, Log forms, Slaughter projection */}
              <div className="space-y-6 lg:col-span-1">
                {/* Lot Status Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-mono text-emerald-600 text-[10px] uppercase tracking-wider block font-bold">STATUT DE L'ÉLEVAGE</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedBatch.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedBatchId(null)}
                      className="text-xs font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 cursor-pointer font-semibold"
                    >
                      &lt; Quitter le lot
                    </button>
                  </div>

                  {(() => {
                    const stats = getBatchLiveStats(selectedBatch);
                    const daysRemaining = 35 - stats.ageDays;
                    const percentComplete = (stats.ageDays / 35) * 100;
                    
                    return (
                      <div className="space-y-4">
                        {/* Timeline bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono font-bold">
                            <span className="text-slate-500">Progression du cycle</span>
                            <span className="text-slate-800">{stats.ageDays} / 35 Jours</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/40">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentComplete}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold">
                            <span>J1 (Poussins)</span>
                            <span>{daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Cycle complet !'}</span>
                            <span>J35 (Découpe)</span>
                          </div>
                        </div>

                        {/* Live Key Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shadow-inner">
                            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Vivants / Initiaux</span>
                            <span className="block text-lg font-bold text-slate-800 font-mono mt-1">
                              {stats.activeSubjects} <span className="text-xs text-slate-400">/ {selectedBatch.initialSize}</span>
                            </span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shadow-inner">
                            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Taux Mortalité</span>
                            <span className={`block text-lg font-bold font-mono mt-1 ${parseFloat(stats.mortalityRate) > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {stats.mortalityRate}%
                            </span>
                          </div>
                        </div>

                        {/* Active Phase Banner */}
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                              <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-widest font-bold">Phase actuelle</span>
                              <span className="text-slate-800 font-bold">{stats.currentPhaseGuide.phase}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono text-slate-500 font-bold">
                            Cible : <span className="text-emerald-600">{stats.currentPhaseGuide.targetWeightGrams}g</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Log Data Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h4 className="font-mono text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 font-bold">Enregistrer des données</h4>
                  
                  {/* Log weight Form */}
                  <form onSubmit={handleLogWeight} className="space-y-2">
                    <label className="text-xs text-slate-600 font-bold flex items-center justify-between">
                      <span>Pesée d'aujourd'hui (poids moyen)</span>
                      <span className="font-mono text-[10px] text-slate-400">Jour {getBatchAgeDays(selectedBatch.startDate)}</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="Ex: 580"
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs font-mono text-slate-400 font-bold">g</span>
                      </div>
                      <button 
                        type="submit"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>

                  {/* Log Mortality Form */}
                  <form onSubmit={handleLogMortality} className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs text-slate-600 font-bold block">
                      Signaler des pertes (mortalité)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="Ex: 1"
                          value={mortalityInput}
                          onChange={(e) => setMortalityInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500/50 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs font-mono text-slate-400 font-bold">sujet(s)</span>
                      </div>
                      <button 
                        type="submit"
                        className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Signaler
                      </button>
                    </div>
                  </form>
                </div>

                {/* Slaughtering Simulator & Complete Batch */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <TrendingUp className="h-5 w-5" />
                    <h4 className="font-bold text-sm">Abattage & Valorisation Découpe</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    À la fin des 35 jours, simulez les gains générés si vous valorisez le lot de poulets à la découpe selon les rendements de l'analyse économique.
                  </p>

                  {(() => {
                    const stats = getBatchLiveStats(selectedBatch);
                    
                    // Calculation of revenues:
                    const avgWeightKg = stats.latestWeight ? stats.latestWeight / 1000 : 2.4;
                    
                    let totalRevenuePerBird = 0;
                    CUTTING_YIELDS_STANDARD.forEach(item => {
                      let revenue = 0;
                      if (item.isPerUnit) {
                        if (item.pieceName.includes('Pattes')) {
                          revenue = item.unitPriceFcfaKg * 2; // 2 units
                        } else if (item.pieceName.includes('Gésier')) {
                          revenue = item.unitPriceFcfaKg * 1; // 1 unit
                        }
                      } else {
                        const pieceWeightKg = avgWeightKg * (item.percentageLiveWeight / 100);
                        revenue = pieceWeightKg * item.unitPriceFcfaKg;
                      }
                      totalRevenuePerBird += revenue;
                    });

                    const totalEstimatedRevenue = Math.round(totalRevenuePerBird * stats.activeSubjects);
                    
                    // Standard cost estimate (chick price + estimated feed cost + health)
                    const estimatedFeedPreparedKg = stats.totalFeedPrepared;
                    const activeFeedCost = estimatedFeedPreparedKg > 0 
                      ? selectedBatch.feedPreparations.reduce((sum, p) => sum + p.costFcfa, 0)
                      : (stats.activeSubjects * (0.45 * 400 + 3.05 * 285)); // standard feed cost
                    
                    const chickCostTotal = selectedBatch.initialSize * technicalParams.chickUnitPriceFcfa;
                    const healthCostTotal = stats.activeSubjects * technicalParams.healthUnitPriceFcfa;
                    
                    const totalCostTotal = chickCostTotal + activeFeedCost + healthCostTotal;
                    const netBenefitEstimated = totalEstimatedRevenue - totalCostTotal;

                    return (
                      <div className="space-y-3 pt-2">
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2.5 shadow-sm">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Sujets à valoriser :</span>
                            <span className="text-slate-800 font-mono font-bold">{stats.activeSubjects} poulets</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Poids moyen utilisé :</span>
                            <span className="text-emerald-700 font-mono font-bold">{avgWeightKg.toFixed(2)} kg</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Valorisation par sujet :</span>
                            <span className="text-slate-800 font-mono font-bold">~ {Math.round(totalRevenuePerBird).toLocaleString()} FCFA</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                            <span className="text-xs text-slate-700 font-bold">Revenu Total Est. :</span>
                            <span className="text-emerald-600 font-mono font-extrabold text-base">{totalEstimatedRevenue.toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                            <span>Coûts totaux est. :</span>
                            <span className="font-mono">~ {Math.round(totalCostTotal).toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5">
                            <span className="text-slate-700 font-bold">Bénéfice Net Est. :</span>
                            <span className={`font-mono font-bold text-sm ${netBenefitEstimated > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {netBenefitEstimated.toLocaleString()} FCFA
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (window.confirm(`Êtes-vous sûr de vouloir finaliser et archiver ce lot ? Un revenu réel estimé de ${totalEstimatedRevenue.toLocaleString()} FCFA sera enregistré dans l'historique.`)) {
                              handleArchiveBatch(totalEstimatedRevenue);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                        >
                          <Archive className="h-4 w-4" /> Finaliser & Vendre le Lot
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Middle Column: Feeding guidance and Custom recipe calculation */}
              <div className="space-y-6 lg:col-span-1">
                {/* Daily Feed Standard and Proportional Formulation */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <ChefHat className="h-5 w-5" />
                    <h4 className="font-bold text-base text-slate-900">Calculateur d'Aliment du Jour</h4>
                  </div>

                  {(() => {
                    const stats = getBatchLiveStats(selectedBatch);
                    const ageDays = stats.ageDays;
                    const phaseGuide = stats.currentPhaseGuide;
                    
                    const dailyRationGrams = phaseGuide.rationPerSubjectGrams / phaseGuide.durationDays;
                    const dailyNeedSubjectKg = dailyRationGrams / 1000;
                    const dailyTotalBatchKg = dailyNeedSubjectKg * stats.activeSubjects;

                    return (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          Pour vos <strong className="text-slate-800">{stats.activeSubjects}</strong> sujets au <strong className="text-slate-800">Jour {ageDays}</strong> ({phaseGuide.phase}), la ration quotidienne standard est de :
                        </p>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center relative overflow-hidden shadow-inner">
                          <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest block">RATION DU JOUR RECOMMANDÉE</span>
                          <span className="block text-2xl font-extrabold text-emerald-600 font-mono mt-1">
                            {dailyTotalBatchKg.toFixed(1)} kg <span className="text-xs font-normal text-slate-400">/ Jour</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold font-mono block mt-0.5">
                            (soit {Math.round(dailyRationGrams)} g par sujet)
                          </span>
                        </div>

                        {/* Feed Type Alert */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 text-xs leading-relaxed">
                          <CircleDot className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-800 font-bold block">Type d'Aliment Requis :</span>
                            <span className="text-slate-500 font-medium">{phaseGuide.feedType}</span>
                          </div>
                        </div>

                        {phaseGuide.phase !== 'Prédémarrage' ? (
                          /* Show exact recipe breakdown to prepare exactly the batch's daily need! */
                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">Recette sur-mesure ({dailyTotalBatchKg.toFixed(1)} kg)</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-mono px-2 py-0.5 rounded border border-emerald-200 font-bold">Maison</span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-60 overflow-y-auto text-xs font-mono divide-y divide-slate-100 space-y-1.5 shadow-inner">
                              {FEED_INGREDIENTS_100KG.map((ing, idx) => {
                                const proportionKey = phaseGuide.phase === 'Démarrage' ? 'demarrageKg' : phaseGuide.phase === 'Croissance' ? 'croissanceKg' : 'finitionKg';
                                const proportion = ing[proportionKey];
                                const requiredWeightKg = (proportion / 100) * dailyTotalBatchKg;
                                
                                return (
                                  <div key={idx} className="flex justify-between py-1.5">
                                    <span className="text-slate-600 max-w-[160px] truncate font-semibold" title={ing.name}>{ing.name}</span>
                                    <span className="text-emerald-600 font-extrabold">
                                      {requiredWeightKg >= 1 ? `${requiredWeightKg.toFixed(2)} kg` : `${(requiredWeightKg * 1000).toFixed(0)} g`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Log direct daily preparation */}
                            <form onSubmit={handleLogFeed} className="space-y-2 pt-2 border-t border-slate-100">
                              <label className="text-xs text-slate-600 font-bold block">
                                Enregistrer la préparation d'un stock d'aliment
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    placeholder={`Ex: ${dailyTotalBatchKg.toFixed(1)}`}
                                    value={feedQuantityInput}
                                    onChange={(e) => setFeedQuantityInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none"
                                  />
                                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-400 font-bold">kg</span>
                                </div>
                                <button 
                                  type="submit"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  Enregistrer
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 leading-relaxed font-semibold">
                            <span className="text-amber-700 font-bold block mb-1">💡 Note Industrielle</span>
                            L'aliment de prédémarrage de J1 à J10 s'achète tout prêt en miettes du commerce. Pas de fabrication maison requise pour cette phase osseuse initiale.
                          </div>
                        )}

                        {/* Total feed prepared log summary */}
                        <div className="text-xs flex justify-between text-slate-500 pt-2 border-t border-slate-100 font-bold">
                          <span>Total d'aliments préparés pour ce lot :</span>
                          <span className="text-slate-800 font-mono font-bold">{stats.totalFeedPrepared.toFixed(1)} kg</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Feed Preparation History List widget */}
                {selectedBatch.feedPreparations.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <h4 className="font-mono text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 font-bold">Historique des préparations</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedBatch.feedPreparations.slice().reverse().map((log) => (
                        <div key={log.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono shadow-sm">
                          <div>
                            <span className="text-slate-700 block font-bold">{log.quantityKg} kg ({log.phase})</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(log.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <span className="text-emerald-600 font-bold">{log.costFcfa.toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Sanitary/Vaccine Checklist & Curves */}
              <div className="space-y-6 lg:col-span-1">
                {/* Weight Curve and Comparison Chart (Stylized SVG) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600">
                    <div className="flex items-center gap-2">
                      <BarChart4 className="h-5 w-5" />
                      <h4 className="font-bold text-base text-slate-900 font-sans">Suivi de la Courbe de Poids</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">Objectif 2,4 kg</span>
                  </div>

                  {(() => {
                    const targets = [
                      { day: 1, weight: 40 },
                      { day: 10, weight: 310 },
                      { day: 14, weight: 560 },
                      { day: 28, weight: 1520 },
                      { day: 35, weight: 2400 }
                    ];

                    const actuals = selectedBatch.weights;

                    const getX = (day: number) => 15 + ((day - 1) / 34) * 270;
                    const getY = (weight: number) => 135 - (weight / 2500) * 120;

                    const targetPath = targets.map((t, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(t.day)} ${getY(t.weight)}`).join(' ');
                    const actualPath = actuals.length > 0 
                      ? actuals.map((a, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(a.day)} ${getY(a.weight)}`).join(' ')
                      : '';

                    return (
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative shadow-inner">
                          <svg className="w-full h-40 overflow-visible" viewBox="0 0 300 150">
                            {/* Grid lines */}
                            <line x1="15" y1="135" x2="285" y2="135" stroke="#e2e8f0" strokeWidth="1" />
                            <line x1="15" y1="75" x2="285" y2="75" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
                            <line x1="15" y1="15" x2="285" y2="15" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
                            
                            {/* Y axis labels */}
                            <text x="5" y="138" fill="#94a3b8" className="text-[8px] font-mono font-bold">0g</text>
                            <text x="5" y="78" fill="#94a3b8" className="text-[8px] font-mono font-bold">1.2k</text>
                            <text x="5" y="18" fill="#94a3b8" className="text-[8px] font-mono font-bold">2.5k</text>

                            {/* X axis labels */}
                            <text x="15" y="148" fill="#94a3b8" className="text-[8px] font-mono font-bold">J1</text>
                            <text x="90" y="148" fill="#94a3b8" className="text-[8px] font-mono font-bold">J10</text>
                            <text x="120" y="148" fill="#94a3b8" className="text-[8px] font-mono font-bold">J14</text>
                            <text x="230" y="148" fill="#94a3b8" className="text-[8px] font-mono font-bold">J28</text>
                            <text x="275" y="148" fill="#94a3b8" className="text-[8px] font-mono font-bold">J35</text>

                            {/* Target Weight Curve (Dashed line) */}
                            <path d={targetPath} fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="3,3" opacity="0.6" />
                            {targets.map((t, idx) => (
                              <circle key={idx} cx={getX(t.day)} cy={getY(t.weight)} r="2.5" fill="#d97706" opacity="0.8" />
                            ))}

                            {/* Actual Logged Weight Curve (Solid Line) */}
                            {actualPath && (
                              <>
                                <path d={actualPath} fill="none" stroke="#059669" strokeWidth="2.5" />
                                {actuals.map((a, idx) => (
                                  <circle key={idx} cx={getX(a.day)} cy={getY(a.weight)} r="3.5" fill="#059669" />
                                ))}
                              </>
                            )}
                          </svg>

                          {/* Legend overlay */}
                          <div className="absolute top-2 right-2 flex gap-3 text-[9px] font-mono bg-white/95 py-1 px-2 rounded border border-slate-200 shadow-sm font-bold">
                            <span className="flex items-center gap-1 text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" /> Cible PDF
                            </span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" /> Pesées réelles
                            </span>
                          </div>
                        </div>

                        {actuals.length > 0 ? (
                          (() => {
                            const stats = getBatchLiveStats(selectedBatch);
                            const ageDays = stats.ageDays;
                            const interpolatedTarget = (() => {
                              const before = [...targets].reverse().find(t => t.day <= ageDays);
                              const after = targets.find(t => t.day >= ageDays);
                              if (!before) return targets[0].weight;
                              if (!after) return targets[targets.length - 1].weight;
                              if (before.day === after.day) return before.weight;
                              const ratio = (ageDays - before.day) / (after.day - before.day);
                              return before.weight + ratio * (after.weight - before.weight);
                            })();

                            const diff = stats.latestWeight - interpolatedTarget;
                            const statusColor = diff >= 0 ? 'text-emerald-600' : 'text-amber-600';
                            
                            return (
                              <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between font-bold shadow-sm">
                                <span className="text-slate-500">Comparatif poids actuel :</span>
                                <span className={`font-mono ${statusColor}`}>
                                  {stats.latestWeight}g vs cible est. {Math.round(interpolatedTarget)}g ({diff >= 0 ? '+' : ''}{Math.round(diff)}g)
                                </span>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-[11px] text-slate-400 font-semibold text-center py-2">
                            Enregistrez votre première pesée pour afficher la courbe de croissance réelle.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Sanitary Actions Checklist */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Calendar className="h-5 w-5" />
                    <h4 className="font-bold text-base text-slate-900 font-sans">Calendrier Sanitaire & Vaccins</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Validez chaque jour de traitement pour garantir la biosécurité de votre lot.
                  </p>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                    {(() => {
                      const ageDays = getBatchAgeDays(selectedBatch.startDate);
                      return SANITARY_CALENDAR.map((task) => {
                        const isCurrent = ageDays >= task.dayStart && ageDays <= task.dayEnd;
                        const isCompleted = selectedBatch.completedSanitaryTasks.some(t => t.day === task.dayStart);
                        
                        return (
                          <div 
                            key={task.dayStart} 
                            className={`p-3 rounded-xl border transition-all flex gap-3 items-start shadow-sm ${
                              isCurrent 
                                ? 'bg-emerald-50 border-emerald-300' 
                                : isCompleted 
                                  ? 'bg-slate-50/70 border-slate-100 opacity-60' 
                                  : 'bg-slate-50 border-slate-200/60'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleSanitaryTask(task.dayStart)}
                              className={`shrink-0 p-1 rounded-lg border transition-all mt-0.5 cursor-pointer ${
                                isCompleted 
                                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                                  : 'border-slate-300 hover:border-emerald-500/50 text-transparent'
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center gap-1.5">
                                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {task.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-wider animate-pulse">Aujourd'hui</span>
                                )}
                              </div>
                              <span className="font-bold text-slate-800 block">{task.prophylaxis}</span>
                              <span className="text-slate-500 text-[11px] block leading-normal font-semibold">{task.vitamines}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* New Batch Creation Modal Dialog Overlay */}
      <AnimatePresence>
        {showNewBatchModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-slate-800"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-lg text-slate-900">Démarrer un nouveau lot</h3>
                <button 
                  onClick={() => setShowNewBatchModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4">
                {/* Batch Name */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold block">Nom du lot ou Référence</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lot #3 - Chrono"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Preset size options */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-600 font-bold block">Effectif (Nombre de sujets)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[150, 200, 250].map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setNewBatchSize(size)}
                        className={`py-2 px-3 rounded-xl border font-mono text-sm font-bold transition-all cursor-pointer ${
                          newBatchSize === size 
                            ? 'bg-emerald-600 border-emerald-500 text-white' 
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-500'
                        }`}
                      >
                        {size} sujets
                      </button>
                    ))}
                  </div>
                  {/* Custom size input */}
                  <div className="pt-1.5">
                    <input
                      type="number"
                      placeholder="Autre effectif personnalisé"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setNewBatchSize(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-bold block">Date de mise en place (J1)</label>
                  <input
                    type="date"
                    required
                    value={newBatchDate}
                    onChange={(e) => setNewBatchDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-2 text-sm text-slate-800 font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block leading-normal mt-1 font-semibold">
                    Ceci permet de calculer précisément le calendrier de prophylaxie et les besoins alimentaires au jour le jour.
                  </span>
                </div>

                {/* Dynamic estimates based on selected size */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-500 font-semibold shadow-inner">
                  <div className="flex justify-between">
                    <span>Investissement Poussins :</span>
                    <span className="text-slate-800 font-mono font-bold">{(newBatchSize * technicalParams.chickUnitPriceFcfa).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projections Recette Découpe :</span>
                    <span className="text-emerald-600 font-mono font-bold">{(newBatchSize * 4208).toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  Lancer ce lot (Cycle 35J)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
