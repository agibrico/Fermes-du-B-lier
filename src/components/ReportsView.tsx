import React, { useRef, useState } from 'react';
import { 
  PoultryBatch, 
  StockItem, 
  FeedManufacturingLog, 
  FeedFormula,
  TechnicalParams, 
  CuttingYield,
  AppBackupData 
} from '../types';
import { calculateBatchMetrics } from '../utils/calculations';
import { formatDateFr, formatFcfa, getTodayDateStr } from '../utils/dateUtils';
import { downloadCsv, printBatchReport, printManufacturingLog } from '../utils/exportUtils';
import { validateImportedData } from '../utils/validation';
import { FileText, Download, Upload, RotateCcw, Check, AlertCircle, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface ReportsViewProps {
  batches: PoultryBatch[];
  stockItems: StockItem[];
  manufacturingLogs: FeedManufacturingLog[];
  formulas?: FeedFormula[];
  technicalParams: TechnicalParams;
  cuttingYields: CuttingYield[];
  onImportBackup: (data: AppBackupData, mode: 'replace' | 'merge') => void;
  onResetEmptyFarm: () => void;
  onResetDemoData: () => void;
  currentDateStr: string;
}

export default function ReportsView({
  batches,
  stockItems,
  manufacturingLogs,
  formulas = [],
  technicalParams,
  cuttingYields,
  onImportBackup,
  onResetEmptyFarm,
  onResetDemoData,
  currentDateStr
}: ReportsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    parsedBackup?: AppBackupData;
  }>({ type: null, message: '' });

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');

  // Export full JSON Backup
  const handleExportJSON = () => {
    const backup: AppBackupData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      appTitle: 'Fermes du Bélier - Plan 35 Jours',
      batches,
      formulas,
      stockItems,
      stockMovements: [],
      healthProtocols: [],
      technicalParams,
      cuttingYields
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `fermes_belier_sauvegarde_complete_${getTodayDateStr()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  // Import JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const val = validateImportedData(parsed);

        if (!val.isValid || !val.parsedBatches) {
          setImportStatus({
            type: 'error',
            message: `Erreurs dans le fichier de sauvegarde :\n${val.errors.join('\n')}`
          });
        } else {
          setImportStatus({
            type: 'success',
            message: `Sauvegarde valide ! ${val.parsedBatches.length} lot(s) prêt(s) à être importé(s).`,
            parsedBackup: {
              version: parsed.version || '2.0.0',
              exportDate: parsed.exportDate || new Date().toISOString(),
              appTitle: parsed.appTitle || 'Fermes du Bélier',
              batches: val.parsedBatches,
              formulas: parsed.formulas || [],
              stockItems: parsed.stockItems || stockItems,
              stockMovements: parsed.stockMovements || [],
              healthProtocols: parsed.healthProtocols || [],
              technicalParams: parsed.technicalParams || technicalParams,
              cuttingYields: parsed.cuttingYields || cuttingYields
            }
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Erreur de syntaxe JSON : ${err.message}`
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Apply Import
  const handleApplyImport = () => {
    if (!importStatus.parsedBackup) return;
    onImportBackup(importStatus.parsedBackup, importMode);
    setImportStatus({
      type: 'success',
      message: 'Restauration appliquée avec succès !'
    });
  };

  // CSV Export: Batches summary
  const handleExportBatchesCsv = () => {
    const headers = [
      'Identifiant',
      'Nom du Lot',
      'Statut',
      'Date Mise en Place',
      'Âge Réel (Jours)',
      'Effectif Initial',
      'Mortalités Cumulées',
      'Taux Mortalité (%)',
      'Sujets Vivants Présents',
      'Dernier Poids (g)',
      'GMQ (g/j)',
      'IC',
      'Dépenses Réelles (FCFA)',
      'Ventes Facturées (FCFA)',
      'Encaissements Perçus (FCFA)',
      'Créances Clients (FCFA)',
      'Marge Nette Réalisée (FCFA)'
    ];

    const rows = batches.filter(b => !b.deletedAt).map(b => {
      const m = calculateBatchMetrics(b, technicalParams, cuttingYields, currentDateStr);
      return [
        b.id,
        b.name,
        m.status,
        b.startDate,
        m.ageDays,
        b.initialSize,
        m.totalMortalities,
        m.mortalityRatePercent.toFixed(1),
        m.activeLiveSubjects,
        m.latestWeightGrams,
        m.gmqGramsPerDay > 0 ? m.gmqGramsPerDay.toFixed(1) : '',
        m.feedIndexIC !== null ? m.feedIndexIC.toFixed(2) : '',
        m.expensesRealTotalFcfa,
        m.salesRealTotalFcfa,
        m.paymentsReceivedTotalFcfa,
        m.receivablesUnpaidFcfa,
        m.netMarginRealizedFcfa
      ];
    });

    downloadCsv(`recapitulatif_lots_${getTodayDateStr()}`, headers, rows);
  };

  // CSV Export: Stocks
  const handleExportStocksCsv = () => {
    const headers = ['Article', 'Catégorie', 'Quantité en Stock', 'Unité', 'Coût Unitaire (FCFA)', 'Valeur Totale Stock (FCFA)', 'Péremption', 'Fournisseur'];
    const rows = stockItems.map(s => [
      s.name,
      s.category,
      s.quantityOnHand,
      s.unit,
      s.unitCostFcfa,
      Math.round(s.quantityOnHand * s.unitCostFcfa),
      s.expiryDate || '',
      s.supplier || ''
    ]);
    downloadCsv(`inventaire_stocks_${getTodayDateStr()}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Rapports, Fiches Imprimables & Sauvegardes</h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Exports CSV Excel • Fiches officielles de lot • Sauvegarde et restauration JSON locale
        </p>
      </div>

      {/* Row 1: Quick CSV Exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export CSV Synthèse des Lots (Excel)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Génère un tableau complet de tous les lots (effectifs, mortalités, poids, GMQ, IC, dépenses, ventes et encaissements) au format CSV séparateur point-virgule avec encodage UTF-8.
            </p>
          </div>
          <button
            onClick={handleExportBatchesCsv}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm cursor-pointer min-h-[44px]"
          >
            <Download className="h-4 w-4" /> Télécharger CSV Synthèse Lots
          </button>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export CSV Inventaire des Stocks</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Télécharge l'état complet du stock (sacs de 25 kg, céréales, tourteau, prémix et vaccins) avec les quantités, coûts unitaires et dates de péremption.
            </p>
          </div>
          <button
            onClick={handleExportStocksCsv}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm cursor-pointer min-h-[44px]"
          >
            <Download className="h-4 w-4" /> Télécharger CSV Inventaire
          </button>
        </div>
      </div>

      {/* Row 2: Printable Sheets Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" /> Fiches Techniques Imprimables (Format A4 / PDF)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {batches.filter(b => !b.deletedAt).map(batch => {
            const m = calculateBatchMetrics(batch, technicalParams, cuttingYields, currentDateStr);
            return (
              <div key={batch.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{batch.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Jour {m.ageDays} • {m.activeLiveSubjects} sujets</span>
                </div>
                <button
                  onClick={() => printBatchReport(batch, m)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 cursor-pointer"
                >
                  Imprimer Fiche
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Backup and Restoration JSON */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" /> Sauvegarde Complète & Restauration Locale
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Sauvegardez vos données sous forme de fichier JSON autonome ou restaurez une archive précédente.
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer min-h-[44px]"
          >
            <Download className="h-4 w-4" /> Exporter JSON
          </button>
        </div>

        {importStatus.type && (
          <div className={`p-4 rounded-xl border text-xs whitespace-pre-line flex items-start gap-2.5 ${
            importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {importStatus.type === 'success' ? <Check className="h-4 w-4 text-emerald-600 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />}
            <span className="flex-1 font-medium">{importStatus.message}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div>
            <span className="font-bold text-xs text-slate-800 block">Restaurer depuis un fichier JSON</span>
            <span className="text-[11px] text-slate-500">Contrôle de conformité automatique avant import</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <Upload className="h-4 w-4 inline mr-1 text-slate-500" /> Sélectionner Sauvegarde
            </button>
          </div>
        </div>

        {/* If ready to apply import */}
        {importStatus.type === 'success' && importStatus.parsedBackup && (
          <div className="p-4 bg-white border border-emerald-300 rounded-2xl space-y-3">
            <span className="font-bold text-xs text-slate-800 block">Mode d'intégration des données :</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer ${
                importMode === 'merge' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="accent-emerald-600"
                />
                <div>
                  <span className="block font-bold">Fusionner</span>
                  <span className="text-[10px] text-slate-500 font-normal">Préserve l'existant et ajoute les nouveaux enregistrements</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer ${
                importMode === 'replace' ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="accent-amber-600"
                />
                <div>
                  <span className="block font-bold">Remplacer</span>
                  <span className="text-[10px] text-slate-500 font-normal">Écrase toute la base avec le fichier importé</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleApplyImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Appliquer l'Importation
              </button>
            </div>
          </div>
        )}

        {/* Isolation demo vs real farm */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-semibold">
            Gestion du mode Démonstration vs Exploitation Réelle :
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm("Démarrer une exploitation réelle vide ? Tous les lots de démonstration seront effacés pour partir d'une base vierge.")) {
                  onResetEmptyFarm();
                }
              }}
              className="text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg font-bold cursor-pointer"
            >
              Démarrer Exploitation Vierge
            </button>

            <button
              onClick={() => {
                if (window.confirm("Recharger les lots témoins de démonstration du Plan 35 jours ?")) {
                  onResetDemoData();
                }
              }}
              className="text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg font-bold cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Recharger Démo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
