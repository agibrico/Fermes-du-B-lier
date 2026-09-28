import React from 'react';
import { motion } from 'motion/react';
import { Trash2, RotateCcw, X, AlertTriangle, PackageOpen } from 'lucide-react';
import { PoultryBatch } from '../types';
import { formatDateFr } from '../utils/dateUtils';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedBatches: PoultryBatch[];
  onRestoreBatch: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export default function TrashModal({
  isOpen,
  onClose,
  deletedBatches,
  onRestoreBatch,
  onPermanentDelete,
  onEmptyTrash
}: TrashModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative text-slate-800"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Corbeille des Lots</h3>
              <p className="text-xs text-slate-500">
                {deletedBatches.length} lot(s) supprimé(s) temporairement (restaurables à tout moment)
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

        {/* Content */}
        {deletedBatches.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
              <PackageOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">La corbeille est vide</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Les lots que vous supprimez depuis l'espace fermier seront placés ici au lieu d'être effacés immédiatement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {deletedBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{batch.name}</span>
                      <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {batch.initialSize} sujets
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Mise en place : {formatDateFr(batch.startDate)} • Supprimé le :{' '}
                      {batch.deletedAt ? formatDateFr(batch.deletedAt.split('T')[0]) : 'Récemment'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRestoreBatch(batch.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurer
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Confirmer la suppression DÉFINITIVE du lot "${batch.name}" ? Cette action est irréversible.`)) {
                          onPermanentDelete(batch.id);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer définitivement
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Les données restaurées conservent tout leur historique.
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Vider entièrement la corbeille ? Tous les lots supprimés seront définitivement effacés.')) {
                    onEmptyTrash();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold cursor-pointer"
              >
                Vider la corbeille
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
