import React, { useState } from 'react';
import { TechnicalParams, CuttingYield } from '../types';
import { formatFcfa } from '../utils/dateUtils';
import { runDomainVerificationTests } from '../tests/domain.test';
import { Settings, Save, Check, Scale, Coins, ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { CUTTING_YIELDS_STANDARD, TECHNICAL_PARAMS_DEFAULT } from '../data';

interface ParametersViewProps {
  technicalParams: TechnicalParams;
  onUpdateTechnicalParams: (params: TechnicalParams) => void;
  cuttingYields: CuttingYield[];
  onUpdateCuttingYields: (yields: CuttingYield[]) => void;
}

export default function ParametersView({
  technicalParams,
  onUpdateTechnicalParams,
  cuttingYields,
  onUpdateCuttingYields
}: ParametersViewProps) {
  const [chickPrice, setChickPrice] = useState(technicalParams.chickUnitPriceFcfa);
  const [healthPrice, setHealthPrice] = useState(technicalParams.healthUnitPriceFcfa);
  const [bag25kgPrice, setBag25kgPrice] = useState(technicalParams.feedIndustrial25kgBagFcfa || 15000);
  const [localYields, setLocalYields] = useState<CuttingYield[]>(cuttingYields);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResults, setTestResults] = useState<{ test: string; status: 'OK' | 'FAIL'; details?: string }[] | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedPerKg = Math.round((bag25kgPrice / 25) * 100) / 100;

    onUpdateTechnicalParams({
      ...technicalParams,
      chickUnitPriceFcfa: chickPrice,
      healthUnitPriceFcfa: healthPrice,
      feedIndustrial25kgBagFcfa: bag25kgPrice,
      feedIndustrialPerKgFcfa: calculatedPerKg,
      feedCostPerKg: {
        ...technicalParams.feedCostPerKg,
        'Démarrage Industriel': calculatedPerKg
      }
    });

    onUpdateCuttingYields(localYields);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunTests = () => {
    const res = runDomainVerificationTests();
    setTestResults(res.results);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Paramètres Techniques & Tarifs</h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Standards de coûts • Tarification des découpes • Vérification automatique des règles métier
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Paramètres et tarifs enregistrés avec succès ! Appliqués en temps réel à tous les calculs.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Costs section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Coins className="h-5 w-5 text-emerald-600" /> Coûts de Revient des Intrants de Production
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Poussin 1 jour (FCFA/sujet)</label>
              <input
                type="number"
                value={chickPrice}
                onChange={(e) => setChickPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm min-h-[44px]"
              />
              <span className="text-[10px] text-slate-400 block">Amortissement 5% mortalité inclus</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Sac Démarrage Industriel (25 kg)</label>
              <input
                type="number"
                value={bag25kgPrice}
                onChange={(e) => setBag25kgPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm min-h-[44px]"
              />
              <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                Soit {(bag25kgPrice / 25).toFixed(2)} FCFA / kg
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Frais Sanitaires / Litière (FCFA/sujet)</label>
              <input
                type="number"
                value={healthPrice}
                onChange={(e) => setHealthPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm min-h-[44px]"
              />
              <span className="text-[10px] text-slate-400 block">Vaccins de base et copeaux</span>
            </div>
          </div>
        </div>

        {/* Cutting prices section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" /> Tarifs de Valorisation à la Découpe (FCFA)
            </h3>
            <button
              type="button"
              onClick={() => setLocalYields(CUTTING_YIELDS_STANDARD)}
              className="text-xs text-slate-400 hover:text-slate-600 font-mono underline cursor-pointer"
            >
              Rétablir standards
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {localYields.map((yieldItem, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">{yieldItem.pieceName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {yieldItem.isPerUnit ? 'Par unité' : `${yieldItem.percentageLiveWeight}% du poids vif`}
                  </span>
                </div>
                <div className="w-28 relative">
                  <input
                    type="number"
                    value={yieldItem.unitPriceFcfaKg}
                    onChange={(e) => {
                      const updated = [...localYields];
                      updated[idx] = { ...yieldItem, unitPriceFcfaKg: parseInt(e.target.value, 10) || 0 };
                      setLocalYields(updated);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-right font-mono min-h-[38px]"
                  />
                  <span className="absolute left-2 top-2 text-[9px] text-slate-400 font-bold">F</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              <Save className="h-4 w-4" /> Enregistrer les Tarifs
            </button>
          </div>
        </div>
      </form>

      {/* Domain Verification Test Suite */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Suite de Tests Obligatoires du Métier
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vérifie les 21 règles du cahier des charges : formules PDF, éditeur de recettes, contrôles 100 kg, stocks négatifs, etc.
            </p>
          </div>

          <button
            onClick={handleRunTests}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            Lancer les Tests Métier
          </button>
        </div>

        {testResults && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold font-mono">
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Résultat : {testResults.filter(r => r.status === 'OK').length} / {testResults.length} tests réussis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              {testResults.map((r, i) => (
                <div key={i} className={`p-2.5 rounded-xl border flex justify-between items-center ${
                  r.status === 'OK' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="font-medium text-[11px] truncate mr-2">{r.test}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === 'OK' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SaaS Multi-Tenant Isolation Tests */}
      <SaasTestCard />
    </div>
  );
}

function SaasTestCard() {
  const [running, setRunning] = useState(false);
  const [saasResults, setSaasResults] = useState<{ name: string; passed: boolean; message?: string }[] | null>(null);

  const handleRunSaasTests = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/tests/saas-isolation', { method: 'POST' });
      const data = await res.json();
      setSaasResults(data.results || []);
    } catch (e) {
      console.error('Error running SaaS tests:', e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" /> Tests d'Isolation SaaS Multi-Organisations (PostgreSQL)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exécute les 15 tests d'étanchéité stricte : Utilisateur A vs B, Org A vs B, Fermes A vs B, RBAC et absence de fuite inter-comptes.
          </p>
        </div>

        <button
          onClick={handleRunSaasTests}
          disabled={running}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5"
        >
          {running ? 'Exécution des tests...' : 'Vérifier l\'Isolation SaaS'}
        </button>
      </div>

      {saasResults && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span className={`px-2.5 py-1 rounded-full border ${
              saasResults.every(r => r.passed) 
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}>
              Résultat : {saasResults.filter(r => r.passed).length} / {saasResults.length} tests validés
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {saasResults.map((r, i) => (
              <div key={i} className={`p-2.5 rounded-xl border flex justify-between items-center ${
                r.passed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <span className="font-medium text-[11px] truncate mr-2">{r.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  r.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {r.passed ? 'OK' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
