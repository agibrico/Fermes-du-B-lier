import React from 'react';
import { 
  PoultryBatch, 
  StockItem, 
  HealthProtocolItem, 
  TechnicalParams, 
  CuttingYield 
} from '../types';
import { calculateBatchMetrics } from '../utils/calculations';
import { formatDateFr, formatFcfa, calendarDaysBetween } from '../utils/dateUtils';
import { 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Package, 
  Scale, 
  TrendingUp, 
  HardDrive, 
  Plus, 
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { AppSpace } from './Navigation';

interface DashboardViewProps {
  batches: PoultryBatch[];
  stockItems: StockItem[];
  healthProtocols: HealthProtocolItem[];
  technicalParams: TechnicalParams;
  cuttingYields: CuttingYield[];
  currentDateStr: string;
  onNavigate: (space: AppSpace) => void;
  onSelectBatch: (batchId: string) => void;
  lastBackupDate?: string;
}

export default function DashboardView({
  batches,
  stockItems,
  healthProtocols,
  technicalParams,
  cuttingYields,
  currentDateStr,
  onNavigate,
  onSelectBatch,
  lastBackupDate
}: DashboardViewProps) {
  const activeBatches = batches.filter(b => !b.deletedAt && b.status === 'active');
  const plannedBatches = batches.filter(b => !b.deletedAt && b.status === 'planned');

  // Global calculations
  let totalLiveBirds = 0;
  let totalExpensesFcfa = 0;
  let totalSalesFcfa = 0;
  let totalPaymentsReceivedFcfa = 0;
  let totalReceivablesFcfa = 0;

  activeBatches.forEach(b => {
    const m = calculateBatchMetrics(b, technicalParams, cuttingYields, currentDateStr);
    totalLiveBirds += m.activeLiveSubjects;
    totalExpensesFcfa += m.expensesRealTotalFcfa;
    totalSalesFcfa += m.salesRealTotalFcfa;
    totalPaymentsReceivedFcfa += m.paymentsReceivedTotalFcfa;
    totalReceivablesFcfa += m.receivablesUnpaidFcfa;
  });

  // Low stocks
  const lowStocks = stockItems.filter(s => s.quantityOnHand <= s.reorderAlertLevel);

  // Today's tasks & overdue health tasks across active batches
  interface TaskAlert {
    batchId: string;
    batchName: string;
    protocolName: string;
    targetDisease: string;
    plannedAge: number;
    currentAge: number;
    isOverdue: boolean;
  }

  const tasksToday: TaskAlert[] = [];
  const tasksOverdue: TaskAlert[] = [];

  activeBatches.forEach(batch => {
    const m = calculateBatchMetrics(batch, technicalParams, cuttingYields, currentDateStr);
    healthProtocols.forEach(proto => {
      // Is task already done in batch?
      const alreadyDone = (batch.healthLogs || []).some(h => 
        h.protocolItemId === proto.id || (h.productName.toLowerCase().includes(proto.productName.toLowerCase()) && h.status === 'Réalisé')
      );

      if (!alreadyDone) {
        if (m.ageDays >= proto.plannedDayStart && m.ageDays <= proto.plannedDayEnd) {
          tasksToday.push({
            batchId: batch.id,
            batchName: batch.name,
            protocolName: proto.productName,
            targetDisease: proto.targetDisease,
            plannedAge: proto.plannedDayStart,
            currentAge: m.ageDays,
            isOverdue: false
          });
        } else if (m.ageDays > proto.plannedDayEnd) {
          tasksOverdue.push({
            batchId: batch.id,
            batchName: batch.name,
            protocolName: proto.productName,
            targetDisease: proto.targetDisease,
            plannedAge: proto.plannedDayStart,
            currentAge: m.ageDays,
            isOverdue: true
          });
        }
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Centre de Pilotage Opérationnel
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2">
            Vue d'ensemble de l'exploitation
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Objectif de croissance standard : <strong>2,1 à 2,2 kg</strong> à J35 • Traçabilité sanitaire & financière
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('daily_log')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer min-h-[44px]"
          >
            <Calendar className="h-4 w-4" /> Saisir Journal du Jour
          </button>
          <button
            onClick={() => onNavigate('batches')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Nouveau Lot
          </button>
        </div>
      </div>

      {/* Row 1: KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div 
          onClick={() => onNavigate('batches')}
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Lots en élevage</span>
            <Layers className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="block text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {activeBatches.length} <span className="text-xs font-normal text-slate-400">actifs</span>
          </span>
          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
            + {plannedBatches.length} lot(s) planifié(s)
          </span>
        </div>

        <div 
          onClick={() => onNavigate('batches')}
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Effectif Présent</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="block text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {totalLiveBirds.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">têtes</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
            Sujets vivants en suivi
          </span>
        </div>

        <div 
          onClick={() => onNavigate('sales_expenses')}
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Encaissements perçus</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="block text-xl md:text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {formatFcfa(totalPaymentsReceivedFcfa)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            Créances : {formatFcfa(totalReceivablesFcfa)}
          </span>
        </div>

        <div 
          onClick={() => onNavigate('stocks')}
          className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold">Alertes Stocks</span>
            <Package className="h-4 w-4 text-amber-600" />
          </div>
          <span className={`block text-2xl font-extrabold font-mono mt-1 ${lowStocks.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {lowStocks.length} <span className="text-xs font-normal text-slate-400">réappro.</span>
          </span>
          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
            {lowStocks.length > 0 ? 'Stocks sous le seuil d\'alerte' : 'Tous les stocks sont OK'}
          </span>
        </div>
      </div>

      {/* Row 2: Tasks Today, Overdue, and Low Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sanitary & Health Tasks */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Tâches Sanitaires & Vaccinales</h3>
            </div>
            <button
              onClick={() => onNavigate('health')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              Gérer Santé &gt;
            </button>
          </div>

          <div className="space-y-2">
            {/* Overdue */}
            {tasksOverdue.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-rose-600 uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> En retard ({tasksOverdue.length})
                </span>
                {tasksOverdue.map((t, idx) => (
                  <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-rose-900 block">{t.protocolName}</span>
                      <span className="text-[10px] text-rose-700">{t.batchName} • Prévu à J{t.plannedAge} (Actuellement J{t.currentAge})</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectBatch(t.batchId);
                        onNavigate('health');
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Traiter
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Today */}
            {tasksToday.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> À faire aujourd'hui ({tasksToday.length})
                </span>
                {tasksToday.map((t, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-emerald-900 block">{t.protocolName}</span>
                      <span className="text-[10px] text-emerald-700">{t.batchName} • J{t.currentAge}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectBatch(t.batchId);
                        onNavigate('health');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Enregistrer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tasksOverdue.length === 0 && tasksToday.length === 0 && (
              <div className="text-center py-6 text-slate-400 space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Tous les vaccins et soins sont à jour !</p>
                <p className="text-[11px]">Aucune tâche en retard sur vos lots actifs.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stocks & Supply Watch */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Vigilance Stocks & Approvisionnements</h3>
            </div>
            <button
              onClick={() => onNavigate('stocks')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
            >
              Voir Stocks &gt;
            </button>
          </div>

          {lowStocks.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lowStocks.map(stock => (
                <div key={stock.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{stock.name}</span>
                    <span className="text-[10px] text-amber-800 font-mono">
                      Seuil de réappro : {stock.reorderAlertLevel} {stock.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 font-mono text-sm block">
                      {stock.quantityOnHand} {stock.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">Stock restant</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 space-y-1">
              <Package className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Niveaux de stock satisfaisants</p>
              <p className="text-[11px]">Matières premières et sacs industriels en quantité suffisante.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Active Lots Summary Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Suivi des Lots en Élevage</h3>
          </div>
          <button
            onClick={() => onNavigate('batches')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
          >
            Tous les lots &gt;
          </button>
        </div>

        {activeBatches.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <p className="text-sm text-slate-600 font-bold">Aucun lot de poulets actif actuellement</p>
            <button
              onClick={() => onNavigate('batches')}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Créer un lot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBatches.map(batch => {
              const m = calculateBatchMetrics(batch, technicalParams, cuttingYields, currentDateStr);
              return (
                <div 
                  key={batch.id}
                  onClick={() => {
                    onSelectBatch(batch.id);
                    onNavigate('batches');
                  }}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-500/60 hover:bg-white transition-all cursor-pointer shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{batch.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Mise en place : {formatDateFr(batch.startDate)}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      m.isOverdue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Jour {m.ageDays}/35 {m.isOverdue ? `(+${m.overdueDays}j)` : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">VIVANTS</span>
                      <span className="font-bold text-slate-800">{m.activeLiveSubjects}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">POIDS</span>
                      <span className="font-bold text-slate-800">{m.latestWeightGrams ? `${m.latestWeightGrams}g` : '-'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block">GMQ</span>
                      <span className="font-bold text-emerald-600">{m.gmqGramsPerDay > 0 ? `${m.gmqGramsPerDay.toFixed(1)}g` : '-'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span>Mortalité : <strong className={m.mortalityRatePercent > 5 ? 'text-rose-600' : 'text-slate-700'}>{m.mortalityRatePercent.toFixed(1)}%</strong></span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      Fiche &gt;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 4: Status footer (Offline Mode, Backup & Local Storage) */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Stockage local sécurisé actif • Prêt pour le fonctionnement autonome hors-connexion.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-slate-400">
            Dernier export : {lastBackupDate ? formatDateFr(lastBackupDate.split('T')[0]) : 'À exporter'}
          </span>
          <button
            onClick={() => onNavigate('reports')}
            className="text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Sauvegarder JSON
          </button>
        </div>
      </div>
    </div>
  );
}
