import React, { useState } from 'react';
import { 
  PoultryBatch, 
  HealthProtocolItem, 
  HealthAdministrationLog,
  HealthProductCategory,
  SanitaryTaskStatus 
} from '../types';
import { formatDateFr, getTodayDateStr, parseLocalDate, formatLocalDate, calendarDaysBetween } from '../utils/dateUtils';
import { calculateBatchMetrics } from '../utils/calculations';
import { HeartPulse, Plus, AlertTriangle, ShieldCheck, Check, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface HealthViewProps {
  batches: PoultryBatch[];
  onUpdateBatch: (batch: PoultryBatch) => void;
  healthProtocols: HealthProtocolItem[];
  onUpdateHealthProtocols: (protocols: HealthProtocolItem[]) => void;
  currentDateStr: string;
  selectedBatchId?: string | null;
  onSelectBatchId: (id: string | null) => void;
}

export default function HealthView({
  batches,
  onUpdateBatch,
  healthProtocols,
  onUpdateHealthProtocols,
  currentDateStr,
  selectedBatchId,
  onSelectBatchId
}: HealthViewProps) {
  const activeBatches = batches.filter(b => !b.deletedAt && b.status === 'active');
  const currentBatch = activeBatches.find(b => b.id === selectedBatchId) || activeBatches[0];

  const [activeTab, setActiveTab] = useState<'protocols' | 'history' | 'withdrawal'>('protocols');
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [selectedProtocolForAdminister, setSelectedProtocolForAdminister] = useState<HealthProtocolItem | null>(null);

  // Administration form states
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<HealthProductCategory>('vaccin');
  const [lotManufacturer, setLotManufacturer] = useState('');
  const [date, setDate] = useState(currentDateStr || getTodayDateStr());
  const [birdsTreated, setBirdsTreated] = useState<number>(0);
  const [dosesUsed, setDosesUsed] = useState<number>(0);
  const [unit, setUnit] = useState<HealthAdministrationLog['unit']>('doses');
  const [operator, setOperator] = useState('Éleveur responsable');
  const [coldChainChecked, setColdChainChecked] = useState(true);
  const [withdrawalDays, setWithdrawalDays] = useState<number>(0);
  const [observations, setObservations] = useState('');
  const [adminStatus, setAdminStatus] = useState<SanitaryTaskStatus>('Réalisé');

  // Drink water checklist states
  const [waterQualityChecked, setWaterQualityChecked] = useState(true);
  const [disinfectantNeutralized, setDisinfectantNeutralized] = useState(true);
  const [thirstDuration, setThirstDuration] = useState<number>(2);

  if (!currentBatch) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
        <HeartPulse className="h-10 w-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800">Aucun lot actif</h3>
        <p className="text-xs text-slate-500">Activez un lot pour gérer les protocoles de prophylaxie et les soins sanitaires.</p>
      </div>
    );
  }

  const batchMetrics = calculateBatchMetrics(currentBatch, {
    chickUnitPriceFcfa: 630,
    healthUnitPriceFcfa: 150,
    feedIndustrial25kgBagFcfa: 15000,
    feedIndustrialPerKgFcfa: 600,
    feedCostPerKg: { 'Démarrage Industriel': 600, 'Croissance': 290.09, 'Finition': 301.60, 'Prédémarrage Historique': 400 }
  }, [], currentDateStr);

  const handleOpenAdminister = (proto: HealthProtocolItem) => {
    setSelectedProtocolForAdminister(proto);
    setProductName(proto.productName);
    setCategory(proto.category);
    setWithdrawalDays(proto.withdrawalPeriodDays);
    setBirdsTreated(batchMetrics.activeLiveSubjects);
    setDosesUsed(batchMetrics.activeLiveSubjects);
    setUnit(proto.routeOfAdministration === 'eau_de_boisson' && proto.category !== 'vaccin' ? 'g' : 'doses');
    setShowAdministerModal(true);
  };

  const handleSaveAdministration = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate withdrawal end date
    const d = parseLocalDate(date);
    d.setDate(d.getDate() + withdrawalDays);
    const withdrawalEndDate = formatLocalDate(d);
    const isWithdrawalActive = withdrawalDays > 0 && calendarDaysBetween(currentDateStr, withdrawalEndDate) >= 0;

    const newLog: HealthAdministrationLog = {
      id: 'hlog_' + Date.now(),
      protocolItemId: selectedProtocolForAdminister?.id,
      batchId: currentBatch.id,
      category,
      productName,
      lotManufacturer: lotManufacturer.trim() || 'Non renseigné',
      date,
      effectiveAgeDays: batchMetrics.ageDays,
      birdsTreatedCount: birdsTreated,
      dosesOrQuantityUsed: dosesUsed,
      unit,
      operator: operator.trim() || 'Éleveur',
      conservationConditionsChecked: coldChainChecked,
      withdrawalPeriodDays: withdrawalDays,
      withdrawalEndDate,
      isWithdrawalActive,
      status: adminStatus,
      observationsIncidents: observations.trim() || undefined
    };

    onUpdateBatch({
      ...currentBatch,
      healthLogs: [newLog, ...(currentBatch.healthLogs || [])]
    });

    setShowAdministerModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Santé, Vaccins & Traitements</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Protocoles validables • Traçabilité des lots fabricants • Suivi des Délais d'Attente avant abattage
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

      {/* Sanitary Security Alert if active withdrawal periods */}
      {!batchMetrics.isSafeForSlaughter ? (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-sm block">
              DÉLAI D'ATTENTE SANITAIRE EN COURS — ABATTAGE / VENTE STRICTEMENT BLOQUÉ
            </span>
            <p>
              Des produits vétérinaires avec délai d'attente ont été administrés. Les oiseaux ne doivent pas être abattus avant l'élimination complète des résidus :
            </p>
            <ul className="list-disc list-inside font-semibold">
              {batchMetrics.activeWithdrawalDetails.map((det, idx) => (
                <li key={idx}>{det}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Sécurité sanitaire vérifiée : Aucun délai d'attente actif sur ce lot pour la date d'aujourd'hui.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('protocols')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'protocols' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Protocoles & Calendrier Prévu ({healthProtocols.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'history' ? 'border-emerald-600 text-emerald-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Registre Sanitaire & Administrations ({currentBatch.healthLogs ? currentBatch.healthLogs.length : 0})
        </button>
      </div>

      {activeTab === 'protocols' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthProtocols.map(proto => {
              const isDueToday = batchMetrics.ageDays >= proto.plannedDayStart && batchMetrics.ageDays <= proto.plannedDayEnd;
              const isPast = batchMetrics.ageDays > proto.plannedDayEnd;
              const alreadyDone = (currentBatch.healthLogs || []).some(h => 
                h.protocolItemId === proto.id && h.status === 'Réalisé'
              );

              return (
                <div 
                  key={proto.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3 transition-all ${
                    alreadyDone 
                      ? 'border-slate-200 opacity-75' 
                      : (isDueToday ? 'border-emerald-500 ring-2 ring-emerald-500/10' : (isPast ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'))
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        proto.category === 'vaccin' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : (proto.category === 'medicament' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      }`}>
                        {proto.category} • Prévu J{proto.plannedDayStart}{proto.plannedDayStart !== proto.plannedDayEnd ? `-J${proto.plannedDayEnd}` : ''}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{proto.productName}</h4>
                      <p className="text-xs text-slate-500 font-medium">Cible : {proto.targetDisease}</p>
                    </div>

                    {alreadyDone ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" /> Réalisé
                      </span>
                    ) : isDueToday ? (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        Aujourd'hui
                      </span>
                    ) : isPast ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        En retard
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-sans">
                    <p className="text-[11px] leading-relaxed font-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong>Mode d'administration :</strong> {proto.routeOfAdministration.replace('_', ' ')} • Dose : {proto.standardDose}
                      <br />
                      <span className="text-slate-500">{proto.instructionsNotice}</span>
                    </p>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <span>Délai d'attente : <strong className={proto.withdrawalPeriodDays > 0 ? 'text-rose-600' : 'text-emerald-700'}>{proto.withdrawalPeriodDays} jour(s)</strong></span>
                      <span className="italic">{proto.sourceNoticeRef}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Validé par : {proto.validatingVetName || 'Vétérinaire'}</span>
                    <button
                      onClick={() => handleOpenAdminister(proto)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Enregistrer Administration
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Registre Sanitaire d'Élevage</h3>
            <span className="text-xs text-slate-400 font-mono">Conformité traçabilité vétérinaire</span>
          </div>

          {(!currentBatch.healthLogs || currentBatch.healthLogs.length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-6">Aucune administration de vaccin ou médicament enregistrée pour ce lot.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 font-bold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Produit Administré</th>
                    <th className="p-3">Lot Fabricant</th>
                    <th className="p-3 text-center">Effectif Traité</th>
                    <th className="p-3 text-center">Quantité/Doses</th>
                    <th className="p-3">Délai d'Attente</th>
                    <th className="p-3 text-center">Statut</th>
                    <th className="p-3">Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBatch.healthLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{formatDateFr(log.date)}</td>
                      <td className="p-3 font-bold text-slate-900 font-sans">{log.productName}</td>
                      <td className="p-3 text-slate-500">{log.lotManufacturer}</td>
                      <td className="p-3 text-center">{log.birdsTreatedCount} oiseaux</td>
                      <td className="p-3 text-center font-bold text-slate-800">{log.dosesOrQuantityUsed} {log.unit}</td>
                      <td className="p-3">
                        {log.withdrawalPeriodDays > 0 ? (
                          <span className={log.isWithdrawalActive ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {log.withdrawalPeriodDays} j (Fin : {formatDateFr(log.withdrawalEndDate)})
                          </span>
                        ) : (
                          <span className="text-emerald-700">0 j (Néant)</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">{log.status}</td>
                      <td className="p-3 font-sans text-slate-500">{log.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Administration */}
      {showAdministerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Enregistrer Soin / Vaccin : {productName}
              </h3>
              <button onClick={() => setShowAdministerModal(false)} className="text-slate-400 hover:text-slate-600">
                Fermer
              </button>
            </div>

            <form onSubmit={handleSaveAdministration} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date d'administration *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Numéro Lot Fabricant *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: VAX-2026-99A"
                    value={lotManufacturer}
                    onChange={(e) => setLotManufacturer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Effectif traité (sujets) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={birdsTreated}
                    onChange={(e) => setBirdsTreated(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Doses ou Quantité *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={dosesUsed}
                    onChange={(e) => setDosesUsed(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>
              </div>

              {/* Water checklist if applicable */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Contrôles de Bonne Pratique :</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coldChainChecked}
                    onChange={(e) => setColdChainChecked(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Chaîne du froid et conditions de conservation vérifiées conformes à la notice</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disinfectantNeutralized}
                    onChange={(e) => setDisinfectantNeutralized(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Eau propre sans désinfectant ni chlore (ou neutralisée au lait écrémé)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Délai d'attente (jours) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={withdrawalDays}
                    onChange={(e) => setWithdrawalDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Opérateur / Vaccinateur *</label>
                  <input
                    type="text"
                    required
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Observations / Incidents éventuels</label>
                <input
                  type="text"
                  placeholder="Ex: Température normale, comportement vif post-vaccination"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer min-h-[44px]"
              >
                Valider et Consigner au Registre
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
