import React, { useState } from 'react';
import { 
  PoultryBatch, 
  BatchSaleRecord, 
  ExpenseRecord, 
  SalePayment,
  CuttingYield 
} from '../types';
import { calculateBatchMetrics } from '../utils/calculations';
import { formatDateFr, formatFcfa, getTodayDateStr } from '../utils/dateUtils';
import { validateSaleRecord, validateExtraExpense } from '../utils/validation';
import { DollarSign, Plus, Receipt, AlertCircle, CheckCircle2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SalesExpensesViewProps {
  batches: PoultryBatch[];
  onUpdateBatch: (batch: PoultryBatch) => void;
  cuttingYields: CuttingYield[];
  currentDateStr: string;
  selectedBatchId?: string | null;
  onSelectBatchId: (id: string | null) => void;
}

export default function SalesExpensesView({
  batches,
  onUpdateBatch,
  cuttingYields,
  currentDateStr,
  selectedBatchId,
  onSelectBatchId
}: SalesExpensesViewProps) {
  const activeBatches = batches.filter(b => !b.deletedAt && b.status === 'active');
  const currentBatch = activeBatches.find(b => b.id === selectedBatchId) || activeBatches[0];

  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'summary'>('sales');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<BatchSaleRecord | null>(null);

  // Sale form states
  const [saleDate, setSaleDate] = useState(currentDateStr || getTodayDateStr());
  const [saleType, setSaleType] = useState<BatchSaleRecord['type']>('live_bird');
  const [quantitySold, setQuantitySold] = useState<string>('50');
  const [unitPrice, setUnitPrice] = useState<string>('2500');
  const [birdsCountExited, setBirdsCountExited] = useState<string>('50');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [amountPaidInitial, setAmountPaidInitial] = useState<string>('125000');
  const [paymentMethodInitial, setPaymentMethodInitial] = useState<SalePayment['paymentMethod']>('especes');
  const [saleError, setSaleError] = useState<string | null>(null);

  // Expense form states
  const [expDate, setExpDate] = useState(currentDateStr || getTodayDateStr());
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('Litière');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<string>('15000');
  const [expSupplier, setExpSupplier] = useState('');
  const [expError, setExpError] = useState<string | null>(null);

  // Payment installment form state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<SalePayment['paymentMethod']>('especes');
  const [paymentDate, setPaymentDate] = useState(currentDateStr || getTodayDateStr());

  if (!currentBatch) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
        <DollarSign className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800">Aucun lot actif</h3>
        <p className="text-xs text-slate-500">Créez un lot pour gérer les ventes, encaissements et dépenses réelles.</p>
      </div>
    );
  }

  const metrics = calculateBatchMetrics(currentBatch, {
    chickUnitPriceFcfa: 630,
    healthUnitPriceFcfa: 150,
    feedIndustrial25kgBagFcfa: 15000,
    feedIndustrialPerKgFcfa: 600,
    feedCostPerKg: { 'Démarrage Industriel': 600, 'Croissance': 290.09, 'Finition': 301.60, 'Prédémarrage Historique': 400 }
  }, cuttingYields, currentDateStr);

  // Handle Save Sale
  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError(null);

    const qty = parseFloat(quantitySold);
    const price = parseFloat(unitPrice);
    const exited = parseInt(birdsCountExited, 10) || 0;

    const val = validateSaleRecord(qty, price, metrics.activeLiveSubjects, saleType);
    if (!val.isValid) {
      setSaleError(val.errors[0]);
      return;
    }

    if (exited > metrics.activeLiveSubjects) {
      setSaleError(`Impossible de sortir ${exited} sujets vivants : seulement ${metrics.activeLiveSubjects} sont présents.`);
      return;
    }

    const totalSale = Math.round(qty * price);
    const initialPaid = Math.min(totalSale, parseFloat(amountPaidInitial) || 0);

    const initialPayments: SalePayment[] = initialPaid > 0 ? [
      {
        id: 'pay_' + Date.now(),
        date: saleDate,
        amountFcfa: initialPaid,
        paymentMethod: paymentMethodInitial,
        reference: 'Acompte / Règlement initial'
      }
    ] : [];

    const newSale: BatchSaleRecord = {
      id: 'sale_' + Date.now(),
      date: saleDate,
      type: saleType,
      label: saleType === 'live_bird' 
        ? `Vente de ${qty} poulets vifs` 
        : (saleType === 'cutting' ? `Vente découpe (${qty} kg / morceaux)` : `Vente au poids vif (${qty} kg)`),
      birdsCountExited: exited,
      quantitySold: qty,
      unitPriceFcfa: price,
      totalSalePriceFcfa: totalSale,
      payments: initialPayments,
      amountPaidFcfa: initialPaid,
      amountDueFcfa: Math.max(0, totalSale - initialPaid),
      clientName: clientName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined
    };

    onUpdateBatch({
      ...currentBatch,
      sales: [newSale, ...(currentBatch.sales || [])]
    });

    setShowSaleModal(false);
  };

  // Handle Add Payment Installment
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForPayment) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newPayment: SalePayment = {
      id: 'pay_' + Date.now(),
      date: paymentDate,
      amountFcfa: amount,
      paymentMethod,
      reference: 'Règlement complémentaire'
    };

    const updatedSales = (currentBatch.sales || []).map(s => {
      if (s.id === selectedSaleForPayment.id) {
        const payments = [...(s.payments || []), newPayment];
        const paid = payments.reduce((sum, p) => sum + p.amountFcfa, 0);
        return {
          ...s,
          payments,
          amountPaidFcfa: paid,
          amountDueFcfa: Math.max(0, s.totalSalePriceFcfa - paid)
        };
      }
      return s;
    });

    onUpdateBatch({
      ...currentBatch,
      sales: updatedSales
    });

    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  // Handle Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);

    const val = validateExtraExpense(expDesc, expAmount);
    if (!val.isValid) {
      setExpError(val.errors[0]);
      return;
    }

    const newExp: ExpenseRecord = {
      id: 'exp_' + Date.now(),
      date: expDate,
      category: expCategory,
      description: expDesc.trim(),
      amountFcfa: parseFloat(expAmount),
      supplier: expSupplier.trim() || undefined,
      batchId: currentBatch.id
    };

    onUpdateBatch({
      ...currentBatch,
      expenses: [newExp, ...(currentBatch.expenses || [])]
    });

    setShowExpenseModal(false);
    setExpDesc('');
  };

  const handleDeleteSale = (id: string) => {
    if (!window.confirm('Supprimer cette vente ?')) return;
    onUpdateBatch({
      ...currentBatch,
      sales: (currentBatch.sales || []).filter(s => s.id !== id)
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    onUpdateBatch({
      ...currentBatch,
      expenses: (currentBatch.expenses || []).filter(e => e.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Ventes, Encaissements & Dépenses</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Séparation stricte : Ventes facturées • Encaissements réels • Créances clients • Dépenses réelles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Dépense
          </button>
          <button
            onClick={() => setShowSaleModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Vente / Encaissement
          </button>
        </div>
      </div>

      {/* Financial KPIs 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Encaissements Réels</span>
          <span className="text-xl md:text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
            {formatFcfa(metrics.paymentsReceivedTotalFcfa)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Ventes totales : {formatFcfa(metrics.salesRealTotalFcfa)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Créances / Impayés</span>
          <span className={`text-xl md:text-2xl font-extrabold font-mono mt-1 block ${
            metrics.receivablesUnpaidFcfa > 0 ? 'text-amber-600' : 'text-slate-800'
          }`}>
            {formatFcfa(metrics.receivablesUnpaidFcfa)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Règlements clients attendus
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Dépenses Réelles Engagées</span>
          <span className="text-xl md:text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
            {formatFcfa(metrics.expensesRealTotalFcfa)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Poussins, aliment, litière, soins
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Marge Nette Réalisée</span>
          <span className={`text-xl md:text-2xl font-extrabold font-mono mt-1 block ${
            metrics.netMarginRealizedFcfa >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {formatFcfa(metrics.netMarginRealizedFcfa)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Rentabilité (ROI) : {metrics.roiRealizedPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'sales' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ventes & Facturation ({currentBatch.sales ? currentBatch.sales.length : 0})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dépenses & Factures ({currentBatch.expenses ? currentBatch.expenses.length : 0})
        </button>
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Journal des Ventes de Volailles & Découpe</h3>
            <span className="text-xs text-slate-400 font-mono">Lot : {currentBatch.name}</span>
          </div>

          {(!currentBatch.sales || currentBatch.sales.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucune vente enregistrée pour ce lot.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Désignation</th>
                    <th className="p-3 text-center">Sujets Sortis</th>
                    <th className="p-3 text-center">Quantité</th>
                    <th className="p-3 text-right">Prix Total</th>
                    <th className="p-3 text-right">Encaissé</th>
                    <th className="p-3 text-right">Solde Dû</th>
                    <th className="p-3">Client</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBatch.sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{formatDateFr(s.date)}</td>
                      <td className="p-3 font-sans font-bold text-slate-900">{s.label}</td>
                      <td className="p-3 text-center font-bold text-rose-600">
                        {s.birdsCountExited > 0 ? `-${s.birdsCountExited} têtes` : '0 (découpe stock)'}
                      </td>
                      <td className="p-3 text-center">{s.quantitySold} x {formatFcfa(s.unitPriceFcfa)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatFcfa(s.totalSalePriceFcfa)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatFcfa(s.amountPaidFcfa)}</td>
                      <td className="p-3 text-right font-bold">
                        {s.amountDueFcfa > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{formatFcfa(s.amountDueFcfa)}</span>
                        ) : (
                          <span className="text-slate-400">Soldé</span>
                        )}
                      </td>
                      <td className="p-3 font-sans text-slate-600">{s.clientName || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.amountDueFcfa > 0 && (
                            <button
                              onClick={() => {
                                setSelectedSaleForPayment(s);
                                setPaymentAmount(String(s.amountDueFcfa));
                                setShowPaymentModal(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded hover:bg-emerald-100 cursor-pointer text-[10px]"
                            >
                              + Règlement
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSale(s.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Registre des Dépenses Réelles du Lot</h3>
            <span className="text-xs text-slate-400 font-mono">Total : {formatFcfa(metrics.expensesRealTotalFcfa)}</span>
          </div>

          {(!currentBatch.expenses || currentBatch.expenses.length === 0) ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucune dépense enregistrée pour ce lot.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Description / Motif</th>
                    <th className="p-3 text-right">Montant Réel</th>
                    <th className="p-3">Fournisseur / Réf</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBatch.expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{formatDateFr(e.date)}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-3 font-sans font-medium text-slate-900">{e.description}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatFcfa(e.amountFcfa)}</td>
                      <td className="p-3 font-sans text-slate-500 text-[11px]">{e.supplier || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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
      )}

      {/* Modal New Sale */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enregistrer une Vente Réalisée</h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-slate-600">Fermer</button>
            </div>

            {saleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSale} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date de vente *</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Type de vente</label>
                  <select
                    value={saleType}
                    onChange={(e: any) => {
                      const t = e.target.value;
                      setSaleType(t);
                      if (t === 'live_bird') {
                        setUnitPrice('2500');
                        setBirdsCountExited(quantitySold);
                      } else {
                        setUnitPrice('3000');
                        setBirdsCountExited('0'); // Pas de double retrait si morceaux vendus depuis découpe
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <option value="live_bird">Vente Poulets Vifs (au sujet)</option>
                    <option value="live_weight">Vente au Poids Vif (kg)</option>
                    <option value="cutting">Vente Découpe (morceaux)</option>
                    <option value="carcass_whole">Vente Carcasses Entières</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Quantité vendue *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={quantitySold}
                    onChange={(e) => {
                      setQuantitySold(e.target.value);
                      if (saleType === 'live_bird') setBirdsCountExited(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Prix unitaire (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              {/* Traçabilité des sujets vivants retirés */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <label className="font-bold text-slate-800 block text-xs">
                  Sujets vivants retirés de l'effectif pour cette opération *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={birdsCountExited}
                  onChange={(e) => setBirdsCountExited(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
                <span className="text-[10px] text-slate-500 block leading-tight">
                  ℹ️ Indiquez 0 si vous vendez des morceaux d'oiseaux déjà comptabilisés sortis pour abattage, pour éviter le double décompte.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Acompte / Encaissement Réel (FCFA)</label>
                  <input
                    type="number"
                    value={amountPaidInitial}
                    onChange={(e) => setAmountPaidInitial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mode de règlement</label>
                  <select
                    value={paymentMethodInitial}
                    onChange={(e: any) => setPaymentMethodInitial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money (Wave, OM, Moov)</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nom du client</label>
                  <input
                    type="text"
                    placeholder="Ex: Restaurant Le Bélier"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Téléphone client</label>
                  <input
                    type="text"
                    placeholder="Ex: +225 07 00 00 00"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center font-mono">
                <span className="font-bold">Total Vente : {formatFcfa((parseFloat(quantitySold) || 0) * (parseFloat(unitPrice) || 0))}</span>
                <span className="text-amber-700">
                  Solde dû : {formatFcfa(Math.max(0, ((parseFloat(quantitySold) || 0) * (parseFloat(unitPrice) || 0)) - (parseFloat(amountPaidInitial) || 0)))}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Valider la Vente et l'Encaissement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Enregistrer une Dépense Réelle</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">Fermer</button>
            </div>

            {expError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{expError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Catégorie</label>
                  <select
                    value={expCategory}
                    onChange={(e: any) => setExpCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <option value="Litière">Litière (Copeaux)</option>
                    <option value="Chauffage & Gaz">Chauffage & Gaz radiant</option>
                    <option value="Santé & Vaccins">Produits Santé & Vaccins</option>
                    <option value="Transport">Transport</option>
                    <option value="Main d'œuvre">Main d'œuvre</option>
                    <option value="Autre">Autre dépense</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Montant engagé (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Motif / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5 sacs de copeaux dépoussiérés"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Fournisseur / N° Reçu</label>
                <input
                  type="text"
                  placeholder="Ex: Scierie Centrale - Reçu 0441"
                  value={expSupplier}
                  onChange={(e) => setExpSupplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Valider la Dépense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Payment Installment */}
      {showPaymentModal && selectedSaleForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Encaisser un Paiement Client</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">Fermer</button>
            </div>

            <p className="text-slate-600">
              Vente : <strong>{selectedSaleForPayment.label}</strong> • Reste à payer : <strong className="text-rose-600">{formatFcfa(selectedSaleForPayment.amountDueFcfa)}</strong>
            </p>

            <form onSubmit={handleAddPayment} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Montant encaissé (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date d'encaissement</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mode de paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  >
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Enregistrer le Règlement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
