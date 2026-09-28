import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  PoultryBatch, 
  TechnicalParams, 
  CuttingYield,
  MortalityLog, 
  WeightLog, 
  ExpenseRecord,
  BatchSaleRecord
} from '../types';
import { 
  formatDateFr, 
  formatFcfa, 
  getTodayDateStr
} from '../utils/dateUtils';
import { calculateBatchMetrics } from '../utils/calculations';
import { 
  validateMortality, 
  validateWeight, 
  validateExtraExpense, 
  validateSaleRecord 
} from '../utils/validation';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  Layers, 
  Trash2, 
  AlertCircle,
  AlertTriangle,
  Scale,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

interface FarmerDashboardProps {
  batch: PoultryBatch;
  onUpdateBatch: (batch: PoultryBatch) => void;
  onBack: () => void;
  technicalParams: TechnicalParams;
  cuttingYields: CuttingYield[];
  allBatches?: PoultryBatch[];
  onSelectBatch?: (id: string) => void;
  onOpenBackup?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
}

export default function FarmerDashboard({
  batch,
  onUpdateBatch,
  onBack,
  technicalParams,
  cuttingYields
}: FarmerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'weighings' | 'finances'>('overview');
  const [showMortalityModal, setShowMortalityModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Form states
  const [mortalityCount, setMortalityCount] = useState<number>(1);
  const [mortalityCause, setMortalityCause] = useState<string>('');
  const [mortalityDate, setMortalityDate] = useState<string>(getTodayDateStr());

  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [weightDay, setWeightDay] = useState<number>(batch.weights.length ? batch.weights[batch.weights.length - 1].day + 7 : 7);
  const [weightDate, setWeightDate] = useState<string>(getTodayDateStr());
  const [birdsSampleCount, setBirdsSampleCount] = useState<number>(20);

  const [expenseCategory, setExpenseCategory] = useState<string>('Aliment');
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(5000);

  const [saleType, setSaleType] = useState<'live' | 'cutting' | 'slaughter'>('live');
  const [saleLabel, setSaleLabel] = useState<string>('Vente poulets vifs');
  const [saleBirdsCount, setSaleBirdsCount] = useState<number>(10);
  const [saleUnitPrice, setSaleUnitPrice] = useState<number>(3000);
  const [salePaidNow, setSalePaidNow] = useState<number>(30000);

  const [formError, setFormError] = useState<string | null>(null);

  const metrics = calculateBatchMetrics(batch, technicalParams, cuttingYields);

  // Submit mortality
  const handleAddMortality = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateMortality(mortalityCount, metrics.activeLiveSubjects, mortalityDate, batch.startDate);
    if (!val.isValid) {
      setFormError(val.errors.join(' '));
      return;
    }
    const newLog: MortalityLog = {
      id: 'm_' + Date.now(),
      date: mortalityDate,
      count: mortalityCount,
      cause: mortalityCause.trim() || undefined
    };
    onUpdateBatch({
      ...batch,
      mortalities: [newLog, ...batch.mortalities]
    });
    setShowMortalityModal(false);
    setMortalityCause('');
    setFormError(null);
  };

  // Submit weight
  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateWeight(weightDay, weightGrams, weightDate, batch.startDate);
    if (!val.isValid) {
      setFormError(val.errors.join(' '));
      return;
    }
    const newLog: WeightLog = {
      id: 'w_' + Date.now(),
      day: weightDay,
      weight: weightGrams,
      date: weightDate,
      birdsWeighedCount: birdsSampleCount,
      ageDaysCalculated: weightDay
    };
    onUpdateBatch({
      ...batch,
      weights: [...batch.weights, newLog].sort((a, b) => a.day - b.day)
    });
    setShowWeightModal(false);
    setFormError(null);
  };

  // Submit expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateExtraExpense(expenseDesc, expenseAmount);
    if (!val.isValid) {
      setFormError(val.errors.join(' '));
      return;
    }
    const newExp: ExpenseRecord = {
      id: 'exp_' + Date.now(),
      date: getTodayDateStr(),
      category: expenseCategory,
      description: expenseDesc,
      amountFcfa: expenseAmount
    };
    onUpdateBatch({
      ...batch,
      expenses: [newExp, ...batch.expenses]
    });
    setShowExpenseModal(false);
    setExpenseDesc('');
    setFormError(null);
  };

  // Submit sale
  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSale = saleBirdsCount * saleUnitPrice;
    const val = validateSaleRecord(
      saleBirdsCount,
      saleUnitPrice,
      metrics.activeLiveSubjects,
      saleType
    );
    if (!val.isValid) {
      setFormError(val.errors.join(' '));
      return;
    }
    const newSale: BatchSaleRecord = {
      id: 'sale_' + Date.now(),
      date: getTodayDateStr(),
      type: saleType,
      label: saleLabel,
      birdsCountExited: saleBirdsCount,
      quantitySold: saleBirdsCount,
      unitPriceFcfa: saleUnitPrice,
      totalSalePriceFcfa: totalSale,
      payments: salePaidNow > 0 ? [{
        id: 'pay_' + Date.now(),
        date: getTodayDateStr(),
        amountFcfa: salePaidNow,
        paymentMethod: 'especes'
      }] : [],
      amountPaidFcfa: salePaidNow,
      amountDueFcfa: Math.max(0, totalSale - salePaidNow)
    };
    onUpdateBatch({
      ...batch,
      sales: [newSale, ...batch.sales]
    });
    setShowSaleModal(false);
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{batch.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                metrics.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                metrics.status === 'planned' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {metrics.status === 'active' ? `Actif — J${metrics.ageDays}` :
                 metrics.status === 'planned' ? `Planifié (dans ${metrics.daysToStart} j)` : 'Clôturé'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mise en place le {formatDateFr(batch.startDate)} • Objectif J35 : 2 100 - 2 200 g
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setFormError(null); setShowMortalityModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Mortalité
          </button>
          <button
            onClick={() => { setFormError(null); setShowWeightModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 cursor-pointer"
          >
            <Scale className="h-4 w-4" /> Pesée
          </button>
          <button
            onClick={() => { setFormError(null); setShowExpenseModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-all border border-amber-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Dépense
          </button>
          <button
            onClick={() => { setFormError(null); setShowSaleModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Coins className="h-4 w-4" /> Vente / Sortie
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Effectif Actif</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.activeLiveSubjects} <span className="text-xs font-normal text-slate-500">/ {metrics.initialSize}</span>
          </div>
          <span className="text-[11px] text-rose-600 mt-1 block">
            Taux perte : {metrics.mortalityRatePercent.toFixed(1)} % ({metrics.totalMortalities} morts)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Dernière Pesée</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.latestWeightGrams > 0 ? `${metrics.latestWeightGrams} g` : 'Non pesé'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.latestWeightDate ? `Pesé le ${formatDateFr(metrics.latestWeightDate)}` : 'Aucune pesée'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Indice de Consommation (IC)</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {metrics.feedIndexIC !== null ? metrics.feedIndexIC.toFixed(2) : '—'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.icDocumentation}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Encaissements / Ventes</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {formatFcfa(metrics.paymentsReceivedTotalFcfa)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Facturé : {formatFcfa(metrics.salesRealTotalFcfa)}
          </span>
        </div>
      </div>

      {/* Safety Alert if withdrawal active */}
      {!metrics.isSafeForSlaughter && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl text-rose-800 text-xs flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Délai d'attente sanitaire en cours :</strong>
            <p className="mt-0.5">Ce lot ne peut pas être abattu ni commercialisé pour la consommation humaine avant expiration du délai.</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {metrics.activeWithdrawalDetails.map((det, idx) => (
                <li key={idx}>{det}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {(['overview', 'daily', 'weighings', 'finances'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'overview' && 'Vue d\'ensemble & Suivi'}
            {tab === 'daily' && 'Journal Quotidien'}
            {tab === 'weighings' && 'Historique Pesées'}
            {tab === 'finances' && 'Bilan Financier'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" /> Informations du Lot
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Date de mise en place :</span>
                <span className="font-bold text-slate-800">{formatDateFr(batch.startDate)} (J1)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Souche :</span>
                <span className="font-bold text-slate-800">{batch.strain || 'Standard chair'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Origine couvoir :</span>
                <span className="font-bold text-slate-800">{batch.hatcheryName || 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Objectif Poids J35 :</span>
                <span className="font-bold text-emerald-700">2 100 g - 2 200 g</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Sorties pour abattage :</span>
                <span className="font-bold text-slate-800">{metrics.totalSlaughterExits} sujets</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Ventes vifs :</span>
                <span className="font-bold text-slate-800">{metrics.totalLiveSalesBirds} sujets</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-600" /> Bilan Économique Réalisé
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Dépenses totales engagées :</span>
                <span className="font-bold text-rose-700">{formatFcfa(metrics.expensesRealTotalFcfa)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Ventes totales facturées :</span>
                <span className="font-bold text-slate-800">{formatFcfa(metrics.salesRealTotalFcfa)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Encaissements réels :</span>
                <span className="font-bold text-emerald-700">{formatFcfa(metrics.paymentsReceivedTotalFcfa)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Créances impayées clients :</span>
                <span className="font-bold text-amber-600">{formatFcfa(metrics.receivablesUnpaidFcfa)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Marge nette réalisée (Trésorerie) :</span>
                <span className={`font-bold ${metrics.netMarginRealizedFcfa >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatFcfa(metrics.netMarginRealizedFcfa)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Mortality, Weight, Expense, Sale */}
      {showMortalityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Enregistrer une Mortalité</h3>
            {formError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddMortality} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de sujets morts</label>
                <input
                  type="number"
                  min="1"
                  max={metrics.activeLiveSubjects}
                  value={mortalityCount}
                  onChange={e => setMortalityCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date du constat</label>
                <input
                  type="date"
                  value={mortalityDate}
                  onChange={e => setMortalityDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cause constatée</label>
                <input
                  type="text"
                  placeholder="Ex : Asphyxie, écrasement, maladie..."
                  value={mortalityCause}
                  onChange={e => setMortalityCause(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMortalityModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Enregistrer une Pesée</h3>
            {formError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddWeight} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jour d'âge (J)</label>
                <input
                  type="number"
                  min="1"
                  value={weightDay}
                  onChange={e => setWeightDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poids moyen par sujet (en grammes)</label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  value={weightGrams}
                  onChange={e => setWeightGrams(Math.max(20, parseInt(e.target.value) || 20))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Taille de l'échantillon pesé</label>
                <input
                  type="number"
                  min="1"
                  value={birdsSampleCount}
                  onChange={e => setBirdsSampleCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWeightModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Valider la pesée
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Ajouter une Dépense</h3>
            {formError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="Poussins">Poussins</option>
                  <option value="Aliment">Aliment</option>
                  <option value="Santé">Santé & Traitements</option>
                  <option value="Litière">Litière</option>
                  <option value="Chauffage">Chauffage & Énergie</option>
                  <option value="Main d'oeuvre">Main d'œuvre</option>
                  <option value="Autre">Autre dépense</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Ex : 2 sacs d'aliment croissance..."
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  min="1"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Enregistrer une Vente ou Sortie</h3>
            {formError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddSale} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type d'opération</label>
                <select
                  value={saleType}
                  onChange={e => setSaleType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="live">Vente vif (poulets vivants)</option>
                  <option value="slaughter">Sortie abattage (prêt à cuire)</option>
                  <option value="cutting">Découpe valorisée</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de sujets sortis du troupeau</label>
                <input
                  type="number"
                  min="1"
                  max={metrics.activeLiveSubjects}
                  value={saleBirdsCount}
                  onChange={e => {
                    const n = Math.max(1, parseInt(e.target.value) || 1);
                    setSaleBirdsCount(n);
                    setSalePaidNow(n * saleUnitPrice);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prix unitaire (FCFA / sujet)</label>
                <input
                  type="number"
                  min="0"
                  value={saleUnitPrice}
                  onChange={e => {
                    const p = Math.max(0, parseInt(e.target.value) || 0);
                    setSaleUnitPrice(p);
                    setSalePaidNow(saleBirdsCount * p);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Montant total de la vente :</span>
                  <span className="font-bold text-slate-900">{formatFcfa(saleBirdsCount * saleUnitPrice)}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant encaissé immédiatement (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  max={saleBirdsCount * saleUnitPrice}
                  value={salePaidNow}
                  onChange={e => setSalePaidNow(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  required
                />
                <span className="text-[11px] text-slate-500">
                  Reste dû en créance : {formatFcfa(Math.max(0, (saleBirdsCount * saleUnitPrice) - salePaidNow))}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Confirmer la vente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
