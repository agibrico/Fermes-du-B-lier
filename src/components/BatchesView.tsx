import React, { useState } from 'react';
import { 
  PoultryBatch, 
  TechnicalParams, 
  CuttingYield 
} from '../types';
import { calculateBatchMetrics } from '../utils/calculations';
import { formatDateFr, formatFcfa, getTodayDateStr } from '../utils/dateUtils';
import { validateBatchForm } from '../utils/validation';
import { FEED_PROGRAM_STANDARD, WEIGHT_TARGET_DEFAULT } from '../data';
import { 
  Layers, 
  Plus, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Sparkles, 
  Scale, 
  FileText,
  X
} from 'lucide-react';
import { printBatchReport } from '../utils/exportUtils';

interface BatchesViewProps {
  batches: PoultryBatch[];
  onAddBatch: (batch: PoultryBatch) => void;
  onUpdateBatch: (batch: PoultryBatch) => void;
  onSoftDeleteBatch: (id: string) => void;
  onRestoreBatch: (id: string) => void;
  onPermanentDeleteBatch: (id: string) => void;
  technicalParams: TechnicalParams;
  cuttingYields: CuttingYield[];
  currentDateStr: string;
  selectedBatchId?: string | null;
  onSelectBatchId: (id: string | null) => void;
}

export default function BatchesView({
  batches,
  onAddBatch,
  onUpdateBatch,
  onSoftDeleteBatch,
  onRestoreBatch,
  onPermanentDeleteBatch,
  technicalParams,
  cuttingYields,
  currentDateStr,
  selectedBatchId,
  onSelectBatchId
}: BatchesViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  // New batch form states
  const [name, setName] = useState('');
  const [initialSize, setInitialSize] = useState<number>(150);
  const [startDate, setStartDate] = useState(currentDateStr || getTodayDateStr());
  const [receptionAgeDays, setReceptionAgeDays] = useState<number>(1);
  const [strain, setStrain] = useState('Cobb 500');
  const [hatcheryName, setHatcheryName] = useState('');
  const [hatcheryVaccines, setHatcheryVaccines] = useState('Newcastle nébulisation + Marek au couvoir');
  const [targetMin, setTargetMin] = useState(2100);
  const [targetMax, setTargetMax] = useState(2200);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const nonDeleted = batches.filter(b => !b.deletedAt);
  const deleted = batches.filter(b => !!b.deletedAt);

  const selectedBatch = nonDeleted.find(b => b.id === selectedBatchId);
  const selectedMetrics = selectedBatch 
    ? calculateBatchMetrics(selectedBatch, technicalParams, cuttingYields, currentDateStr)
    : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateBatchForm({ name, initialSize, startDate });
    if (!val.isValid) {
      setFormErrors(val.errors);
      return;
    }
    setFormErrors([]);

    const newBatch: PoultryBatch = {
      id: 'batch_' + Date.now(),
      name: name.trim(),
      initialSize: Number(initialSize),
      startDate,
      receptionAgeDays: Number(receptionAgeDays) || 1,
      strain: strain.trim() || undefined,
      hatcheryName: hatcheryName.trim() || undefined,
      hatcheryVaccinationsDone: hatcheryVaccines ? [hatcheryVaccines] : [],
      feedProgramId: FEED_PROGRAM_STANDARD.id,
      hasAdoptedNewProgram: true,
      targetWeightMinGrams: Number(targetMin) || 2100,
      targetWeightMaxGrams: Number(targetMax) || 2200,
      targetAgeDays: 35,
      mortalities: [],
      weights: [
        {
          id: 'w_' + Date.now(),
          day: 1,
          weight: 42,
          date: startDate,
          notes: 'Poids moyen à la réception',
          ageDaysCalculated: 1
        }
      ],
      flockMovements: [],
      dailyLogs: [],
      sales: [],
      expenses: [
        {
          id: 'exp_' + Date.now(),
          date: startDate,
          category: 'Poussins',
          description: `Achat ${initialSize} poussins d'un jour`,
          amountFcfa: Number(initialSize) * technicalParams.chickUnitPriceFcfa
        }
      ],
      healthLogs: [],
      status: 'active'
    };

    onAddBatch(newBatch);
    onSelectBatchId(newBatch.id);
    setShowModal(false);
    setName('');
  };

  // Adopt new program for historical batch
  const handleAdoptProgram = (batch: PoultryBatch) => {
    if (window.confirm(`Adopter le nouveau programme alimentaire (J1-J10 Démarrage Industriel, J11-J24 Croissance PDF, J25-J35 Finition PDF) pour le lot "${batch.name}" ? Vos opérations passées ne seront pas altérées.`)) {
      onUpdateBatch({
        ...batch,
        feedProgramId: FEED_PROGRAM_STANDARD.id,
        hasAdoptedNewProgram: true,
        targetWeightMinGrams: 2100,
        targetWeightMaxGrams: 2200
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header of Lots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Gestion des Lots de Volailles</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Suivi des bandes actives, planifiées et archivées • Cible 2,1 à 2,2 kg à J35
          </p>
        </div>

        <div className="flex items-center gap-2">
          {deleted.length > 0 && (
            <button
              onClick={() => setShowTrash(!showTrash)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px]"
            >
              <Trash2 className="h-4 w-4 text-slate-500" />
              <span>Corbeille ({deleted.length})</span>
            </button>
          )}

          <button
            onClick={() => {
              setStartDate(currentDateStr);
              setFormErrors([]);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Nouveau Lot
          </button>
        </div>
      </div>

      {/* Corbeille Accordion if open */}
      {showTrash && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs text-rose-900 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-600" /> Lots dans la Corbeille (Restaurables)
            </span>
            <button onClick={() => setShowTrash(false)} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              Fermer
            </button>
          </div>

          <div className="space-y-2">
            {deleted.map(dBatch => (
              <div key={dBatch.id} className="bg-white p-3 rounded-xl border border-rose-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{dBatch.name}</span>
                  <span className="text-slate-400 ml-2 font-mono">{dBatch.initialSize} poussins</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRestoreBatch(dBatch.id)}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    Restaurer
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer DÉFINITIVEMENT le lot "${dBatch.name}" ? Action irréversible.`)) {
                        onPermanentDeleteBatch(dBatch.id);
                      }
                    }}
                    className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Batch Details or Grid */}
      {selectedBatch && selectedMetrics ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-2xl font-extrabold text-slate-900">{selectedBatch.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  selectedMetrics.status === 'planned' 
                    ? 'bg-blue-50 text-blue-700' 
                    : (selectedMetrics.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-700')
                }`}>
                  {selectedMetrics.status === 'planned' ? 'Planifié' : `Jour ${selectedMetrics.ageDays}/35`}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Souche : <strong>{selectedBatch.strain || 'Cobb 500'}</strong> • Couvoir : <strong>{selectedBatch.hatcheryName || 'Standard'}</strong> • Mise en place : {formatDateFr(selectedBatch.startDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => printBatchReport(selectedBatch, selectedMetrics)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[40px]"
              >
                <FileText className="h-4 w-4" /> Imprimer Fiche Lot
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Mettre le lot "${selectedBatch.name}" dans la corbeille ?`)) {
                    onSoftDeleteBatch(selectedBatch.id);
                    onSelectBatchId(null);
                  }
                }}
                className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer min-h-[40px]"
                title="Mettre à la corbeille"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                onClick={() => onSelectBatchId(null)}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer min-h-[40px]"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Program Adoption Proposal for Historical Batches */}
          {!selectedBatch.hasAdoptedNewProgram && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
              <div>
                <span className="font-bold flex items-center gap-1.5 text-sm text-emerald-800">
                  <Sparkles className="h-4 w-4" /> Programme alimentaire officiel disponible
                </span>
                <p className="text-emerald-700 mt-0.5">
                  Ce lot utilise un modèle antérieur. Vous pouvez adopter le nouveau programme : J1-J10 Démarrage Industriel (15 000 F/25kg), J11-J24 Croissance PDF, J25-J35 Finition PDF avec objectif 2,1 - 2,2 kg.
                </p>
              </div>
              <button
                onClick={() => handleAdoptProgram(selectedBatch)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shrink-0 cursor-pointer"
              >
                Adopter le Nouveau Programme
              </button>
            </div>
          )}

          {/* Overdue alert if applicable */}
          {selectedMetrics.isOverdue && selectedMetrics.status !== 'completed' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Cycle dépassé :</strong> Jour {selectedMetrics.ageDays} (+{selectedMetrics.overdueDays} jours après J35). 
                L'âge réel continue d'être suivi. Prévoyez l'abattage ou la vente pour limiter le coût alimentaire.
              </span>
            </div>
          )}

          {/* Core batch indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Sujets Vivants</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
                {selectedMetrics.activeLiveSubjects} <span className="text-xs font-normal text-slate-400">/ {selectedBatch.initialSize}</span>
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Pertes : {selectedMetrics.totalMortalities} ({selectedMetrics.mortalityRatePercent.toFixed(1)}%)
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Dernier Poids</span>
              <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
                {selectedMetrics.latestWeightGrams > 0 ? `${selectedMetrics.latestWeightGrams} g` : '-'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Cible J35 : 2 100 à 2 200 g
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Gain Moyen (GMQ)</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
                {selectedMetrics.gmqGramsPerDay > 0 ? `${selectedMetrics.gmqGramsPerDay.toFixed(1)} g/j` : '-'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                IC : {selectedMetrics.feedIndexIC !== null ? selectedMetrics.feedIndexIC.toFixed(2) : 'En attente'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Encaissements</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
                {formatFcfa(selectedMetrics.paymentsReceivedTotalFcfa)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                Dépenses : {formatFcfa(selectedMetrics.expensesRealTotalFcfa)}
              </span>
            </div>
          </div>

          {/* Sanitary Withdrawal Warning */}
          {!selectedMetrics.isSafeForSlaughter && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="h-4 w-4 text-rose-600" /> Restrictions sanitaires actives avant commercialisation :
              </span>
              <ul className="list-disc list-inside">
                {selectedMetrics.activeWithdrawalDetails.map((w, idx) => (
                  <li key={idx}><strong>{w}</strong></li>
                ))}
              </ul>
              <span className="text-[11px] text-rose-600 block pt-1">
                Ne pas abattre ni vendre avant l'expiration totale de ces délais de sécurité vétérinaire.
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Lots List Grid */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonDeleted.map(batch => {
              const m = calculateBatchMetrics(batch, technicalParams, cuttingYields, currentDateStr);
              return (
                <div 
                  key={batch.id}
                  onClick={() => onSelectBatchId(batch.id)}
                  className="bg-white border border-slate-200 hover:border-emerald-500/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{batch.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Mise en place : {formatDateFr(batch.startDate)}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      m.status === 'planned' 
                        ? 'bg-blue-50 text-blue-700' 
                        : (m.isOverdue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800')
                    }`}>
                      {m.status === 'planned' ? 'Planifié' : `J${m.ageDays}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">VIVANTS</span>
                      <span className="text-base font-bold text-slate-800">{m.activeLiveSubjects} <span className="text-xs font-normal text-slate-400">/ {batch.initialSize}</span></span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-bold">POIDS DERNIER</span>
                      <span className="text-base font-bold text-slate-800">{m.latestWeightGrams ? `${m.latestWeightGrams} g` : 'J1: 42g'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="font-medium">Mortalité : <strong className={m.mortalityRatePercent > 5 ? 'text-rose-600' : 'text-slate-700'}>{m.mortalityRatePercent.toFixed(1)}%</strong></span>
                    <span className="text-emerald-600 font-bold">Consulter &gt;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal New Batch */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Création d'un Nouveau Lot</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                {formErrors.map((err, idx) => <p key={idx}>• {err}</p>)}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nom ou Numéro du Lot *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lot #5 - Cobb 500 Chrono"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-emerald-500 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Effectif Initial *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={initialSize}
                    onChange={(e) => setInitialSize(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date Mise en Place (J1) *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Souche de Poussins</label>
                  <input
                    type="text"
                    value={strain}
                    onChange={(e) => setStrain(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Couvoir Fournisseur</label>
                  <input
                    type="text"
                    placeholder="Ex: Couvoir National"
                    value={hatcheryName}
                    onChange={(e) => setHatcheryName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Vaccinations Réalisées au Couvoir</label>
                <input
                  type="text"
                  value={hatcheryVaccines}
                  onChange={(e) => setHatcheryVaccines(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-slate-600">
                <span className="font-bold block text-slate-800">Objectif de Poids Vif à J35 :</span>
                <div className="flex items-center gap-2 font-mono">
                  <span>Entre {targetMin} g</span>
                  <span>et {targetMax} g</span>
                  <span className="text-[10px] text-slate-400">(Non une garantie de résultat)</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Créer et Démarrer le Lot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
