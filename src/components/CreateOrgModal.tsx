import React, { useState } from 'react';
import { api, UserOrganization } from '../services/api';
import { X, Building2, Plus, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newOrg: UserOrganization) => void;
}

export default function CreateOrgModal({ isOpen, onClose, onCreated }: CreateOrgModalProps) {
  const [name, setName] = useState('');
  const [defaultFarmName, setDefaultFarmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom de l\'organisation est obligatoire.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.createOrganization(name.trim(), defaultFarmName.trim() || undefined);
      if (res.error) {
        setError(res.error);
      } else if (res.data?.organization) {
        onCreated(res.data.organization);
        setName('');
        setDefaultFarmName('');
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" /> Nouvelle Entreprise / Organisation
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nom de l'organisation avicole *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Fermes du Centre — Bouaké"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs min-h-[44px]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nom du premier site / ferme (Optionnel)</label>
            <input
              type="text"
              value={defaultFarmName}
              onChange={e => setDefaultFarmName(e.target.value)}
              placeholder="Ex : Site Principal N°1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs min-h-[44px]"
            />
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            ℹ️ Vous deviendrez automatiquement le <strong>Propriétaire</strong> de cet espace. Les lots, stocks et fabrications y seront strictement étanches.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm min-h-[40px]"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Créer l'organisation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
