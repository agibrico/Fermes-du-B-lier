import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Download, Upload, RotateCcw, X, CheckCircle2, AlertCircle, FileJson, ShieldCheck } from 'lucide-react';
import { PoultryBatch, TechnicalParams, CuttingYield, AppBackupData } from '../types';
import { validateImportedData } from '../utils/validation';
import { getTodayDateStr } from '../utils/dateUtils';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: PoultryBatch[];
  technicalParams: TechnicalParams;
  cuttingYields: CuttingYield[];
  onImportBatches: (newBatches: PoultryBatch[], mode: 'replace' | 'merge') => void;
  onResetDemoData: () => void;
}

export default function BackupModal({
  isOpen,
  onClose,
  batches,
  technicalParams,
  cuttingYields,
  onImportBatches,
  onResetDemoData
}: BackupModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    parsedBatches?: PoultryBatch[];
  }>({ type: null, message: '' });

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge');

  if (!isOpen) return null;

  // Handle Export JSON
  const handleExportJSON = () => {
    const backupData: AppBackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      batches,
      technicalParams,
      cuttingYields
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fermes_du_belier_sauvegarde_${getTodayDateStr()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle File Input for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const validation = validateImportedData(parsed);

        if (!validation.isValid || !validation.parsedBatches) {
          setImportStatus({
            type: 'error',
            message: `Erreurs lors de l'analyse du fichier :\n${validation.errors.join('\n')}`
          });
        } else {
          setImportStatus({
            type: 'success',
            message: `Fichier valide ! ${validation.parsedBatches.length} lot(s) analysé(s) avec succès. Choisissez le mode d'intégration ci-dessous.`,
            parsedBatches: validation.parsedBatches
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Le fichier n'est pas un JSON valide : ${err.message || 'Erreur de syntaxe'}`
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm and apply import
  const handleApplyImport = () => {
    if (!importStatus.parsedBatches) return;
    onImportBatches(importStatus.parsedBatches, importMode);
    setImportStatus({
      type: 'success',
      message: `Importation réussie avec succès ! ${importStatus.parsedBatches.length} lot(s) importé(s).`
    });
    setTimeout(() => {
      onClose();
      setImportStatus({ type: null, message: '' });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl relative text-slate-800"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Sauvegarde & Restauration des Données</h3>
              <p className="text-xs text-slate-500">
                Exportez vos données sur votre appareil ou importez une sauvegarde précédente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus.type && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed whitespace-pre-line flex items-start gap-3 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{importStatus.message}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Export */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Download className="h-4 w-4 text-emerald-600" />
                <span>Exporter la Base Complète</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Télécharge un fichier JSON contenant tous les lots ({batches.length}), l'historique complet des pesées, mortalités, préparations d'aliments et standards de prix.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              <Download className="h-4 w-4" /> Télécharger Sauvegarde (.JSON)
            </button>
          </div>

          {/* Card 2: Import */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Upload className="h-4 w-4 text-emerald-600" />
                <span>Importer un Fichier JSON</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Restaurez vos données depuis une sauvegarde précédente. Le fichier est rigoureusement validé avant toute modification.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4 text-slate-500" /> Sélectionner un Fichier JSON
            </button>
          </div>
        </div>

        {/* If file parsed and ready to apply */}
        {importStatus.type === 'success' && importStatus.parsedBatches && (
          <div className="bg-white border border-emerald-200 p-4 rounded-2xl space-y-3 shadow-sm">
            <h4 className="font-bold text-xs text-slate-800 uppercase font-mono tracking-wider">
              Option d'intégration des données :
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  importMode === 'merge' ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-800' : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="accent-emerald-600"
                />
                <div>
                  <span className="block font-bold">Fusionner</span>
                  <span className="text-[10px] text-slate-400 font-normal">Conserve les lots existants et ajoute les nouveaux</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  importMode === 'replace' ? 'border-amber-500 bg-amber-50/50 font-bold text-amber-800' : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="accent-amber-600"
                />
                <div>
                  <span className="block font-bold">Remplacer</span>
                  <span className="text-[10px] text-slate-400 font-normal">Remplace l'ensemble des lots existants</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleApplyImport}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" /> Confirmer et Appliquer
              </button>
            </div>
          </div>
        )}

        {/* Demo reset footer */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-semibold">
            Besoin d'un jeu de démonstration certifié ?
          </span>
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Réinitialiser avec les données certifiées du Plan 35 jours ? Vos lots actuels seront remplacés par les lots témoins.'
                )
              ) {
                onResetDemoData();
                setImportStatus({
                  type: 'success',
                  message: 'Données de démonstration certifiées rechargées avec succès !'
                });
                setTimeout(() => onClose(), 1200);
              }
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Recharger Données Témoins
          </button>
        </div>
      </motion.div>
    </div>
  );
}
