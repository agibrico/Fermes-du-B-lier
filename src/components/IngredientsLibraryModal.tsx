import React, { useState } from 'react';
import { IngredientDefinition } from '../types';
import { formatFcfa } from '../utils/dateUtils';
import { 
  X, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Trash2, 
  Edit3, 
  ShieldAlert,
  Info
} from 'lucide-react';

interface IngredientsLibraryModalProps {
  ingredients: IngredientDefinition[];
  onUpdateIngredients: (ingredients: IngredientDefinition[]) => void;
  onClose: () => void;
}

export default function IngredientsLibraryModal({
  ingredients,
  onUpdateIngredients,
  onClose
}: IngredientsLibraryModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [typeOrForm, setTypeOrForm] = useState('');
  const [unit, setUnit] = useState('kg');
  const [priceStr, setPriceStr] = useState('');
  const [supplier, setSupplier] = useState('');
  const [dataSource, setDataSource] = useState('Tables INRAE / AFZ Aviculture');
  const [maxIncorporation, setMaxIncorporation] = useState('');
  const [justification, setJustification] = useState('');
  const [isAdditive, setIsAdditive] = useState(false);

  // Nutrition subfields
  const [energyKcal, setEnergyKcal] = useState('');
  const [crudeProtein, setCrudeProtein] = useState('');
  const [lysineDig, setLysineDig] = useState('');
  const [methionineDig, setMethionineDig] = useState('');
  const [calcium, setCalcium] = useState('');
  const [availPhosphorus, setAvailPhosphorus] = useState('');
  const [crudeFiber, setCrudeFiber] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setTypeOrForm('');
    setUnit('kg');
    setPriceStr('');
    setSupplier('');
    setDataSource('Tables INRAE / AFZ Aviculture');
    setMaxIncorporation('');
    setJustification('');
    setIsAdditive(false);
    setEnergyKcal('');
    setCrudeProtein('');
    setLysineDig('');
    setMethionineDig('');
    setCalcium('');
    setAvailPhosphorus('');
    setCrudeFiber('');
    setFormError(null);
    setShowAddForm(true);
  };

  const handleOpenEdit = (item: IngredientDefinition) => {
    setEditingId(item.id);
    setName(item.name);
    setTypeOrForm(item.typeOrForm);
    setUnit(item.unit || 'kg');
    setPriceStr(item.refPriceFcfaKg !== undefined ? item.refPriceFcfaKg.toString() : '');
    setSupplier(item.supplier || '');
    setDataSource(item.dataSource || '');
    setMaxIncorporation(item.maxIncorporationPercent !== undefined ? item.maxIncorporationPercent.toString() : '');
    setJustification(item.incorporationJustification || '');
    setIsAdditive(item.isAdditiveOrMineral || false);

    if (item.nutrition) {
      setEnergyKcal(item.nutrition.energyKcalKg?.toString() || '');
      setCrudeProtein(item.nutrition.crudeProteinPercent?.toString() || '');
      setLysineDig(item.nutrition.digestibleLysinePercent?.toString() || '');
      setMethionineDig(item.nutrition.digestibleMethioninePercent?.toString() || '');
      setCalcium(item.nutrition.calciumPercent?.toString() || '');
      setAvailPhosphorus(item.nutrition.availablePhosphorusPercent?.toString() || '');
      setCrudeFiber(item.nutrition.crudeFiberPercent?.toString() || '');
    } else {
      setEnergyKcal('');
      setCrudeProtein('');
      setLysineDig('');
      setMethionineDig('');
      setCalcium('');
      setAvailPhosphorus('');
      setCrudeFiber('');
    }

    setFormError(null);
    setShowAddForm(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Le nom précis de l\'ingrédient est obligatoire.');
      return;
    }

    const price = priceStr.trim() !== '' ? parseFloat(priceStr) : undefined;
    const maxInc = maxIncorporation.trim() !== '' ? parseFloat(maxIncorporation) : undefined;

    const nutrition = (energyKcal || crudeProtein || lysineDig || methionineDig || calcium || availPhosphorus || crudeFiber) ? {
      energyKcalKg: energyKcal.trim() !== '' ? parseFloat(energyKcal) : undefined,
      crudeProteinPercent: crudeProtein.trim() !== '' ? parseFloat(crudeProtein) : undefined,
      digestibleLysinePercent: lysineDig.trim() !== '' ? parseFloat(lysineDig) : undefined,
      digestibleMethioninePercent: methionineDig.trim() !== '' ? parseFloat(methionineDig) : undefined,
      calciumPercent: calcium.trim() !== '' ? parseFloat(calcium) : undefined,
      availablePhosphorusPercent: availPhosphorus.trim() !== '' ? parseFloat(availPhosphorus) : undefined,
      crudeFiberPercent: crudeFiber.trim() !== '' ? parseFloat(crudeFiber) : undefined
    } : undefined;

    if (editingId) {
      const updated = ingredients.map(i => i.id === editingId ? {
        ...i,
        name: name.trim(),
        typeOrForm: typeOrForm.trim() || 'Matière première',
        unit,
        refPriceFcfaKg: price,
        supplier: supplier.trim() || undefined,
        dataSource: dataSource.trim() || undefined,
        maxIncorporationPercent: maxInc,
        incorporationJustification: justification.trim() || undefined,
        isAdditiveOrMineral: isAdditive,
        nutrition
      } : i);

      onUpdateIngredients(updated);
      setFormSuccess(`Ingrédient « ${name} » mis à jour avec succès.`);
    } else {
      const newItem: IngredientDefinition = {
        id: 'ing_custom_' + Date.now(),
        name: name.trim(),
        typeOrForm: typeOrForm.trim() || 'Matière première',
        unit,
        refPriceFcfaKg: price,
        supplier: supplier.trim() || undefined,
        dataSource: dataSource.trim() || undefined,
        maxIncorporationPercent: maxInc,
        incorporationJustification: justification.trim() || undefined,
        isAdditiveOrMineral: isAdditive,
        nutrition
      };

      onUpdateIngredients([newItem, ...ingredients]);
      setFormSuccess(`Nouvel ingrédient « ${newItem.name} » ajouté à la bibliothèque.`);
    }

    setShowAddForm(false);
    setTimeout(() => setFormSuccess(null), 3500);
  };

  const handleDelete = (id: string, itemName: string) => {
    if (confirm(`Confirmez-vous la suppression définitive de « ${itemName} » de la bibliothèque ?`)) {
      onUpdateIngredients(ingredients.filter(i => i.id !== id));
      setFormSuccess(`« ${itemName} » supprimé.`);
      setTimeout(() => setFormSuccess(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="font-bold text-lg text-slate-900">Bibliothèque & Répertoire des Ingrédients</h3>
              <p className="text-xs text-slate-500 font-mono">
                {ingredients.length} ingrédients répertoriés • Caractéristiques nutritionnelles vs Prix d'achat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Nouvel Ingrédient
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {formSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm ? (
          <form onSubmit={handleSaveIngredient} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="font-bold text-sm text-slate-800">
                {editingId ? 'Modifier la fiche ingrédient' : 'Créer un nouvel ingrédient'}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 hover:text-slate-700 font-bold"
              >
                Fermer formulaire
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom précis de l'ingrédient *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Grain de blé tendre concassé"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Type ou forme *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Grain broyé, Son de blé, Tourteau..."
                  value={typeOrForm}
                  onChange={e => setTypeOrForm(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prix de référence / kg (FCFA)</label>
                <input
                  type="number"
                  placeholder="Laisser vide si non chiffré"
                  value={priceStr}
                  onChange={e => setPriceStr(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Fournisseur (facultatif)</label>
                <input
                  type="text"
                  placeholder="Ex : Grands Moulins d'Abidjan"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Source des données de référence</label>
                <input
                  type="text"
                  placeholder="Ex : Tables INRAE, Table PDF Bélier..."
                  value={dataSource}
                  onChange={e => setDataSource(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Limite d'incorporation max (%)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex : 10 pour 10%"
                  value={maxIncorporation}
                  onChange={e => setMaxIncorporation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Justification agronomique / digestive de la limite</label>
              <input
                type="text"
                placeholder="Ex : Risque digestif, encombrement fibreux, goût de poisson au-delà de 6%..."
                value={justification}
                onChange={e => setJustification(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAdditive"
                checked={isAdditive}
                onChange={e => setIsAdditive(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <label htmlFor="isAdditive" className="font-semibold text-slate-700">
                Cet ingrédient est un additif, prémix ou minéral sensible (nécessite un avertissement strict au remplacement)
              </label>
            </div>

            {/* Nutrition subsection */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="font-bold text-slate-800 text-xs">
                Composition nutritionnelle de référence (si connue) :
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Énergie (EM kcal/kg)</label>
                  <input
                    type="number"
                    placeholder="Ex: 3200"
                    value={energyKcal}
                    onChange={e => setEnergyKcal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Protéine Brute (PB %)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 46.5"
                    value={crudeProtein}
                    onChange={e => setCrudeProtein(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Lysine digestible (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2.65"
                    value={lysineDig}
                    onChange={e => setLysineDig(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Méthionine dig. (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 0.60"
                    value={methionineDig}
                    onChange={e => setMethionineDig(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Calcium (Ca %)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 0.30"
                    value={calcium}
                    onChange={e => setCalcium(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Phosphore disp. (P disp. %)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 0.20"
                    value={availPhosphorus}
                    onChange={e => setAvailPhosphorus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Cellulose brute (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 3.5"
                    value={crudeFiber}
                    onChange={e => setCrudeFiber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                ℹ️ Règle stricte : Ne pas confondre phosphore total et phosphore disponible, ni nutriments totaux et digestibles.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {editingId ? 'Mettre à jour l\'ingrédient' : 'Enregistrer dans la bibliothèque'}
              </button>
            </div>
          </form>
        ) : null}

        {/* Ingredients Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full border-collapse text-left text-xs font-mono text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="p-3 font-sans">Ingrédient</th>
                <th className="p-3">Type / Forme</th>
                <th className="p-3 text-right">Prix Ref. / kg</th>
                <th className="p-3 text-center">Limite Max</th>
                <th className="p-3 font-sans">Valeurs Nutritives Clés</th>
                <th className="p-3 font-sans">Source / Fournisseur</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {ingredients.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-sans font-bold text-slate-900">
                    {item.name}
                    {item.isAdditiveOrMineral && (
                      <span className="ml-2 bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                        Additif/Minéral
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{item.typeOrForm}</td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    {item.refPriceFcfaKg !== undefined ? `${formatFcfa(item.refPriceFcfaKg)}` : <span className="text-amber-600 font-normal">Non chiffré</span>}
                  </td>
                  <td className="p-3 text-center font-bold text-slate-600">
                    {item.maxIncorporationPercent ? `${item.maxIncorporationPercent} %` : '—'}
                  </td>
                  <td className="p-3 text-[11px] font-sans text-slate-600">
                    {item.nutrition ? (
                      <span>
                        EM: {item.nutrition.energyKcalKg || '—'} kcal • PB: {item.nutrition.crudeProteinPercent ? `${item.nutrition.crudeProteinPercent}%` : '—'} • Lys: {item.nutrition.digestibleLysinePercent ? `${item.nutrition.digestibleLysinePercent}%` : '—'}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Non renseignée</span>
                    )}
                  </td>
                  <td className="p-3 text-[10px] text-slate-400 font-sans">
                    {item.dataSource || item.supplier || 'Standard local'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
