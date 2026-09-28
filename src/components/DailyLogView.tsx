import React, { useState } from 'react';
import { PoultryBatch, DailyLogEntry, MortalityLog, WeightLog } from '../types';
import { calculateBatchMetrics } from '../utils/calculations';
import { formatDateFr, getTodayDateStr } from '../utils/dateUtils';
import { validateMortality, validateWeight } from '../utils/validation';
import { CalendarCheck, Plus, AlertCircle, Trash2, Clock, Check } from 'lucide-react';

interface DailyLogViewProps {
  batches: PoultryBatch[];
  onUpdateBatch: (batch: PoultryBatch) => void;
  currentDateStr: string;
  selectedBatchId?: string | null;
  onSelectBatchId: (id: string | null) => void;
}

export default function DailyLogView({
  batches,
  onUpdateBatch,
  currentDateStr,
  selectedBatchId,
  onSelectBatchId
}: DailyLogViewProps) {
  const activeBatches = batches.filter(b => !b.deletedAt && b.status === 'active');
  const currentBatch = activeBatches.find(b => b.id === selectedBatchId) || activeBatches[0];

  const [date, setDate] = useState(currentDateStr || getTodayDateStr());
  const [mortalityCount, setMortalityCount] = useState<string>('');
  const [mortalityCause, setMortalityCause] = useState<string>('');
  const [feedKg, setFeedKg] = useState<string>('');
  const [feedType, setFeedType] = useState<string>('Aliment Croissance');
  const [waterLiters, setWaterLiters] = useState<string>('');
  const [birdsWeighed, setBirdsWeighed] = useState<string>('');
  const [averageWeight, setAverageWeight] = useState<string>('');
  const [treatments, setTreatments] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [operator, setOperator] = useState<string>('Éleveur');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentBatch) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
        <CalendarCheck className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800">Aucun lot actif disponible</h3>
        <p className="text-xs text-slate-500">Créez ou activez un lot pour commencer à enregistrer les données quotidiennes.</p>
      </div>
    );
  }

  const batchMetrics = calculateBatchMetrics(currentBatch, {
    chickUnitPriceFcfa: 630,
    healthUnitPriceFcfa: 150,
    feedIndustrial25kgBagFcfa: 15000,
    feedIndustrialPerKgFcfa: 600,
    feedCostPerKg: { 'Démarrage Industriel': 600, 'Croissance': 290.09, 'Finition': 301.60, 'Prédémarrage Historique': 400 }
  }, [], date);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const mort = parseInt(mortalityCount, 10) || 0;
    if (mort > 0) {
      const mortVal = validateMortality(mort, batchMetrics.activeLiveSubjects, date, currentBatch.startDate);
      if (!mortVal.isValid) {
        setErrorMsg(mortVal.errors[0]);
        return;
      }
    }

    const wt = parseFloat(averageWeight) || 0;
    if (wt > 0) {
      const wtVal = validateWeight(wt, batchMetrics.ageDays, currentBatch.startDate, date);
      if (!wtVal.isValid) {
        setErrorMsg(wtVal.errors[0]);
        return;
      }
    }

    const newLog: DailyLogEntry = {
      id: 'dlog_' + Date.now(),
      batchId: currentBatch.id,
      date,
      ageDays: batchMetrics.ageDays,
      mortalityCount: mort,
      mortalityCause: mortalityCause.trim() || undefined,
      feedDistributedKg: parseFloat(feedKg) || 0,
      feedDistributedType: feedType,
      waterLiters: parseFloat(waterLiters) || undefined,
      birdsWeighedCount: parseInt(birdsWeighed, 10) || undefined,
      averageWeightGrams: wt > 0 ? wt : undefined,
      healthTreatmentsGiven: treatments.trim() || undefined,
      generalObservations: observations.trim() || undefined,
      operator: operator.trim() || undefined
    };

    // Also update batch-level mortalities and weights for unified tracking
    const updatedMortalities: MortalityLog[] = [...currentBatch.mortalities];
    if (mort > 0) {
      updatedMortalities.push({
        id: 'm_' + Date.now(),
        date,
        count: mort,
        cause: mortalityCause.trim() || undefined
      });
    }

    const updatedWeights: WeightLog[] = [...currentBatch.weights];
    if (wt > 0) {
      updatedWeights.push({
        id: 'w_' + Date.now(),
        day: batchMetrics.ageDays,
        weight: wt,
        date,
        birdsWeighedCount: parseInt(birdsWeighed, 10) || undefined,
        notes: observations.trim() || undefined,
        ageDaysCalculated: batchMetrics.ageDays
      });
      updatedWeights.sort((a, b) => a.day - b.day);
    }

    onUpdateBatch({
      ...currentBatch,
      dailyLogs: [newLog, ...(currentBatch.dailyLogs || [])],
      mortalities: updatedMortalities,
      weights: updatedWeights
    });

    setSuccessMsg(`Journal du ${formatDateFr(date)} enregistré avec succès !`);
    setMortalityCount('');
    setMortalityCause('');
    setFeedKg('');
    setWaterLiters('');
    setBirdsWeighed('');
    setAverageWeight('');
    setTreatments('');
    setObservations('');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDeleteLog = (logId: string) => {
    if (!window.confirm('Supprimer cette entrée du journal ?')) return;
    onUpdateBatch({
      ...currentBatch,
      dailyLogs: (currentBatch.dailyLogs || []).filter(l => l.id !== logId)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Lot selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Journal Quotidien d'Élevage</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Saisie chronologique complète : alimentation, mortalités, eau, pesées et soins
          </p>
        </div>

        {activeBatches.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Lot actif :</span>
            <select
              value={currentBatch.id}
              onChange={(e) => onSelectBatchId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none min-h-[44px]"
            >
              {activeBatches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Nouvelle Saisie pour : {currentBatch.name}</span>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
              Jour {batchMetrics.ageDays} • {batchMetrics.activeLiveSubjects} sujets vivants
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Date : {formatDateFr(date)}</span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Date d'enregistrement *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Opérateur responsable</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Eau bue (Litres - optionnel)</label>
              <input
                type="number"
                step="1"
                placeholder="Ex: 45"
                value={waterLiters}
                onChange={(e) => setWaterLiters(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
              />
            </div>
          </div>

          {/* Feed & Mortality Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Feeding */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                1. Alimentation Distribuée
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Type d'aliment</label>
                  <select
                    value={feedType}
                    onChange={(e) => setFeedType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs min-h-[44px]"
                  >
                    <option value="Démarrage Industriel (Sac 25kg)">Démarrage Industriel (J1-J10)</option>
                    <option value="Aliment Croissance">Aliment Croissance PDF (J11-J24)</option>
                    <option value="Aliment Finition">Aliment Finition PDF (J25-J35)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Quantité (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 22.5"
                    value={feedKg}
                    onChange={(e) => setFeedKg(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Mortalities */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                2. Déclaration Pertes / Mortalité
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Nombre de morts</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={mortalityCount}
                    onChange={(e) => setMortalityCount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Cause suspectée</label>
                  <input
                    type="text"
                    placeholder="Ex: Chaleur, étouffement"
                    value={mortalityCause}
                    onChange={(e) => setMortalityCause(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weighings and Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                3. Pesée éventuelle (échantillon)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Sujets pesés</label>
                  <input
                    type="number"
                    placeholder="Ex: 15"
                    value={birdsWeighed}
                    onChange={(e) => setBirdsWeighed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Poids moyen (g)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 580"
                    value={averageWeight}
                    onChange={(e) => setAverageWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                4. Soins & Observations
              </span>
              <input
                type="text"
                placeholder="Traitements donnés (ex: Vitamines antistress dans l'eau)"
                value={treatments}
                onChange={(e) => setTreatments(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
              />
              <input
                type="text"
                placeholder="Observations générales (litière, comportement...)"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              Enregistrer l'Entrée du Journal
            </button>
          </div>
        </form>
      </div>

      {/* History of Daily Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900">
          Historique du Journal ({currentBatch.dailyLogs ? currentBatch.dailyLogs.length : 0} saisies)
        </h3>

        {(!currentBatch.dailyLogs || currentBatch.dailyLogs.length === 0) ? (
          <p className="text-xs text-slate-400 py-4 text-center">Aucune saisie de journal pour l'instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Âge</th>
                  <th className="p-3 text-center">Mortalités</th>
                  <th className="p-3 text-center">Aliment</th>
                  <th className="p-3 text-center">Pesée</th>
                  <th className="p-3">Soins & Remarques</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentBatch.dailyLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{formatDateFr(log.date)}</td>
                    <td className="p-3 text-center">J{log.ageDays}</td>
                    <td className="p-3 text-center font-bold text-rose-600">
                      {log.mortalityCount > 0 ? `${log.mortalityCount} mort(s)` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {log.feedDistributedKg > 0 ? `${log.feedDistributedKg} kg (${log.feedDistributedType})` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {log.averageWeightGrams ? `${log.averageWeightGrams} g` : '-'}
                    </td>
                    <td className="p-3 font-sans text-slate-600 text-[11px]">
                      {log.healthTreatmentsGiven && <span className="block text-emerald-700 font-semibold">{log.healthTreatmentsGiven}</span>}
                      {log.generalObservations && <span className="block text-slate-500">{log.generalObservations}</span>}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
