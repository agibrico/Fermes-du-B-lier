import React, { useState } from 'react';
import { PoultryBatch, WeightLog } from '../types';
import { calculateBatchMetrics } from '../utils/calculations';
import { formatDateFr, getTodayDateStr } from '../utils/dateUtils';
import { validateWeight } from '../utils/validation';
import { Scale, Plus, TrendingUp, AlertCircle, BarChart2, Trash2 } from 'lucide-react';

interface WeighingsViewProps {
  batches: PoultryBatch[];
  onUpdateBatch: (batch: PoultryBatch) => void;
  currentDateStr: string;
  selectedBatchId?: string | null;
  onSelectBatchId: (id: string | null) => void;
}

export default function WeighingsView({
  batches,
  onUpdateBatch,
  currentDateStr,
  selectedBatchId,
  onSelectBatchId
}: WeighingsViewProps) {
  const activeBatches = batches.filter(b => !b.deletedAt && b.status === 'active');
  const currentBatch = activeBatches.find(b => b.id === selectedBatchId) || activeBatches[0];

  const [date, setDate] = useState(currentDateStr || getTodayDateStr());
  const [dayInput, setDayInput] = useState<string>('');
  const [birdsWeighed, setBirdsWeighed] = useState<string>('20');
  const [totalWeight, setTotalWeight] = useState<string>('');
  const [avgWeight, setAvgWeight] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!currentBatch) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
        <Scale className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800">Aucun lot actif</h3>
        <p className="text-xs text-slate-500">Créez ou sélectionnez un lot pour suivre les pesées et les performances GMQ / IC.</p>
      </div>
    );
  }

  const metrics = calculateBatchMetrics(currentBatch, {
    chickUnitPriceFcfa: 630,
    healthUnitPriceFcfa: 150,
    feedIndustrial25kgBagFcfa: 15000,
    feedIndustrialPerKgFcfa: 600,
    feedCostPerKg: { 'Démarrage Industriel': 600, 'Croissance': 290.09, 'Finition': 301.60, 'Prédémarrage Historique': 400 }
  }, [], date);

  // If user enters total weight and birds count, compute avg
  const handleTotalWeightChange = (val: string) => {
    setTotalWeight(val);
    const tot = parseFloat(val);
    const count = parseInt(birdsWeighed, 10);
    if (!isNaN(tot) && !isNaN(count) && count > 0) {
      setAvgWeight((tot / count).toFixed(0));
    }
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const calculatedDay = dayInput ? parseInt(dayInput, 10) : metrics.ageDays;
    const finalWeight = parseFloat(avgWeight);

    const val = validateWeight(finalWeight, calculatedDay, currentBatch.startDate, date);
    if (!val.isValid) {
      setErrorMsg(val.errors[0]);
      return;
    }

    const newWeight: WeightLog = {
      id: 'w_' + Date.now(),
      day: calculatedDay,
      date,
      birdsWeighedCount: parseInt(birdsWeighed, 10) || undefined,
      totalWeightGrams: parseFloat(totalWeight) || undefined,
      weight: finalWeight,
      notes: notes.trim() || undefined,
      ageDaysCalculated: calculatedDay
    };

    // Do NOT replace weighing of Day 35 with Day 40!
    // Replace only if exact same day re-entered
    const updated = currentBatch.weights.filter(w => w.day !== calculatedDay);
    updated.push(newWeight);
    updated.sort((a, b) => a.day - b.day);

    onUpdateBatch({
      ...currentBatch,
      weights: updated
    });

    setTotalWeight('');
    setAvgWeight('');
    setNotes('');
    setDayInput('');
  };

  const handleDeleteWeight = (id: string) => {
    if (!window.confirm('Supprimer cette pesée ?')) return;
    onUpdateBatch({
      ...currentBatch,
      weights: currentBatch.weights.filter(w => w.id !== id)
    });
  };

  // Reminders check: J7, J14, J21, J28, J35
  const reminderDays = [7, 14, 21, 28, 35];
  const sortedWeights = [...currentBatch.weights].sort((a, b) => a.day - b.day);

  // SVG Chart points calculation adapting after J35
  const maxDayChart = Math.max(35, metrics.ageDays, ...sortedWeights.map(w => w.day));
  const getX = (d: number) => 30 + ((d - 1) / Math.max(34, maxDayChart - 1)) * 320;
  const getY = (w: number) => 135 - (w / 2800) * 120;

  // Target curve adapted to 2 150 g at J35
  const targetPoints = [
    { day: 1, weight: 42 },
    { day: 7, weight: 190 },
    { day: 14, weight: 510 },
    { day: 21, weight: 980 },
    { day: 28, weight: 1540 },
    { day: 35, weight: 2150 }
  ];

  const targetPath = targetPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.weight)}`).join(' ');
  const actualPath = sortedWeights.length > 0 
    ? sortedWeights.map((w, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(w.day)} ${getY(w.weight)}`).join(' ') 
    : '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Pesées & Performances de Croissance</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cible officielle de suivi : <strong>2,1 à 2,2 kg</strong> à J35 • Calcul GMQ & Indice de Consommation (IC)
          </p>
        </div>

        {activeBatches.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Lot :</span>
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

      {/* Reminders Bar J7, J14, J21, J28, J35 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
          Rappels des Pesées Clés Hebdomadaires (Programme Bélier)
        </span>
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
          {reminderDays.map(rd => {
            const hasWeight = sortedWeights.some(w => Math.abs(w.day - rd) <= 1);
            const isDue = metrics.ageDays >= rd && !hasWeight;
            return (
              <div 
                key={rd}
                className={`p-2.5 rounded-xl border ${
                  hasWeight 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' 
                    : (isDue ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500')
                }`}
              >
                <span className="block text-[10px]">J{rd}</span>
                <span className="text-xs font-extrabold">{hasWeight ? 'Effectuée' : (isDue ? 'À faire !' : 'À venir')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Performance row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Dernier Poids Moyen</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
            {metrics.latestWeightGrams > 0 ? `${metrics.latestWeightGrams} g` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {metrics.daysSinceLastWeight > 0 ? `Mesuré il y a ${metrics.daysSinceLastWeight} jour(s)` : 'Mesuré aujourd\'hui'}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Cible à J35</span>
          <span className="text-xl md:text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
            2 100 - 2 200 g
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Cible de suivi, non une garantie
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Gain Moyen Quotidien</span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
            {metrics.gmqGramsPerDay > 0 ? `${metrics.gmqGramsPerDay.toFixed(1)} g/j` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Croissance journalière moyenne
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs text-center">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Indice de Conso (IC)</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
            {metrics.feedIndexIC !== null ? metrics.feedIndexIC.toFixed(2) : 'En attente'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block" title={metrics.icDocumentation}>
            {metrics.feedIndexIC !== null ? 'Kg aliment / Kg gain' : 'Données nécessaires manquantes'}
          </span>
        </div>
      </div>

      {/* Curve and Log Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SVG Growth Chart adapting after J35 */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Courbe de Croissance Réelle vs Cible 2,1 - 2,2 kg</h3>
            <span className="text-xs font-mono text-slate-400">Échelle étendue jusqu'à J{maxDayChart}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 overflow-x-auto shadow-inner">
            <svg className="w-full min-w-[340px] h-48 overflow-visible" viewBox="0 0 380 160">
              {/* Horizontal grid lines */}
              <line x1="30" y1="135" x2="360" y2="135" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="30" y1="85" x2="360" y2="85" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="30" y1="35" x2="360" y2="35" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />

              {/* Y Axis labels */}
              <text x="5" y="138" fill="#94a3b8" className="text-[9px] font-mono">0g</text>
              <text x="5" y="88" fill="#94a3b8" className="text-[9px] font-mono">1.2k</text>
              <text x="5" y="38" fill="#94a3b8" className="text-[9px] font-mono">2.2k</text>

              {/* Target Curve */}
              <path d={targetPath} fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="3,3" opacity="0.7" />
              {targetPoints.map((tp, i) => (
                <circle key={i} cx={getX(tp.day)} cy={getY(tp.weight)} r="2.5" fill="#d97706" />
              ))}

              {/* Actual Weights Curve */}
              {actualPath && (
                <>
                  <path d={actualPath} fill="none" stroke="#059669" strokeWidth="2.5" />
                  {sortedWeights.map((sw, i) => (
                    <circle key={i} cx={getX(sw.day)} cy={getY(sw.weight)} r="3.5" fill="#059669" />
                  ))}
                </>
              )}

              {/* Target band J35 */}
              <line x1={getX(35)} y1="15" x2={getX(35)} y2="135" stroke="#059669" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
              <text x={getX(35)} y="150" fill="#059669" textAnchor="middle" className="text-[9px] font-mono font-bold">J35</text>
              {maxDayChart > 35 && (
                <text x={getX(maxDayChart)} y="150" fill="#b45309" textAnchor="middle" className="text-[9px] font-mono font-bold">J{maxDayChart}</text>
              )}
            </svg>
          </div>

          <div className="flex gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Cible de référence (2 150g à J35)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Pesées réelles
            </span>
          </div>
        </div>

        {/* Form Add Weight */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900">Enregistrer une Pesée</h3>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddWeight} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Date de pesée *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Âge calculé (Jour)</label>
                <input
                  type="number"
                  placeholder={`Défaut : J${metrics.ageDays}`}
                  value={dayInput}
                  onChange={(e) => setDayInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nombre de sujets pesés</label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 20"
                value={birdsWeighed}
                onChange={(e) => {
                  setBirdsWeighed(e.target.value);
                  const tot = parseFloat(totalWeight);
                  const count = parseInt(e.target.value, 10);
                  if (!isNaN(tot) && !isNaN(count) && count > 0) {
                    setAvgWeight((tot / count).toFixed(0));
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Poids total échantillon (g)</label>
                <input
                  type="number"
                  placeholder="Ex: 11600"
                  value={totalWeight}
                  onChange={(e) => handleTotalWeightChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Poids moyen calculé (g) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="Ex: 580"
                  value={avgWeight}
                  onChange={(e) => setAvgWeight(e.target.value)}
                  className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 font-mono font-bold min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Commentaires / Conditions</label>
              <input
                type="text"
                placeholder="Ex: Échantillon représentatif 10% du poulailler"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
            >
              Enregistrer la Pesée
            </button>
          </form>
        </div>
      </div>

      {/* Weights History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900">
          Historique des Pesées du Lot ({sortedWeights.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
              <tr>
                <th className="p-3">Âge (Jour)</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Échantillon</th>
                <th className="p-3 text-center font-bold text-slate-900">Poids Moyen</th>
                <th className="p-3">Écart vs Cible Indicative</th>
                <th className="p-3">Observations</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedWeights.slice().reverse().map(w => (
                <tr key={w.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-emerald-700">Jour {w.day}</td>
                  <td className="p-3 text-slate-500">{formatDateFr(w.date)}</td>
                  <td className="p-3 text-center">{w.birdsWeighedCount ? `${w.birdsWeighedCount} sujets` : '1'}</td>
                  <td className="p-3 text-center font-bold text-sm text-slate-900">{w.weight} g</td>
                  <td className="p-3 text-slate-500">
                    {w.day >= 35 ? (
                      w.weight >= 2100 ? (
                        <span className="text-emerald-700 font-bold">Atteint (≥ 2 100g)</span>
                      ) : (
                        <span className="text-amber-700">Sous la cible 2 100g</span>
                      )
                    ) : 'En cours de croissance'}
                  </td>
                  <td className="p-3 font-sans text-slate-500 text-[11px]">{w.notes || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteWeight(w.id)}
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
      </div>
    </div>
  );
}
