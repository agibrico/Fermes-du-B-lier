import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Tractor, 
  TrendingUp, 
  Info, 
  Activity, 
  CalendarDays,
  Database,
  Trash2
} from 'lucide-react';
import { formatDateLongFr } from '../utils/dateUtils';

interface WelcomeScreenProps {
  onSelectRole: (role: 'admin' | 'farmer') => void;
  activeBatchCount: number;
  totalBirds: number;
  currentDateStr: string;
  onOpenBackup?: () => void;
  onOpenTrash?: () => void;
  trashCount?: number;
}

export default function WelcomeScreen({ 
  onSelectRole, 
  activeBatchCount, 
  totalBirds,
  currentDateStr,
  onOpenBackup,
  onOpenTrash,
  trashCount = 0
}: WelcomeScreenProps) {
  return (
    <div id="welcome-screen-container" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/50 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <header id="welcome-header" className="relative z-10 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shadow-sm">
            <Tractor className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold tracking-tight text-xl md:text-2xl text-slate-900">
              FERMES DU BÉLIER <span className="text-emerald-600 font-extrabold">SYNC</span>
            </h1>
            <p className="font-mono text-[11px] text-slate-500 tracking-wider">
              PROGRAMME ACCÉLÉRÉ 35 JOURS — VOLAILLES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[40px]"
              title="Sauvegardes et restauration"
            >
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Sauvegardes</span>
            </button>
          )}

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[40px]"
              title="Corbeille des lots"
            >
              <Trash2 className="h-4 w-4 text-slate-500" />
              <span>Corbeille</span>
              {trashCount > 0 && (
                <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-mono">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formatDateLongFr(currentDateStr)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8 md:py-12 flex flex-col lg:flex-row items-center gap-8 md:gap-14">
        {/* Left Side: Presentation & Metrics */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 rounded-full text-emerald-700 text-xs font-bold border border-emerald-100"
          >
            <CalendarDays className="h-4 w-4" />
            CYCLE CHRONO 35 JOURS
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-extrabold tracking-tight text-slate-900 leading-tight"
          >
            Gestion Technico-Économique &<br />
            <span className="text-emerald-600 font-bold">
              Rentabilité Maximisée
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-600 text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal"
          >
            Pilotez votre exploitation avicole de manière scientifique : suivi quotidien de l'alimentation, calendrier de prophylaxie, pesées précises, valorisation à la découpe et calcul des marges réelles en FCFA.
          </motion.p>

          {/* Quick numbers widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 max-w-lg mx-auto lg:mx-0 shadow-sm"
          >
            <div className="text-center p-2">
              <span className="block text-xl md:text-2xl font-bold text-slate-900 font-mono">3,5 kg</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1 font-semibold">Aliment / Sujet</span>
            </div>
            <div className="text-center p-2 border-x border-slate-100">
              <span className="block text-xl md:text-2xl font-bold text-emerald-600 font-mono">2,4 kg</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1 font-semibold">Poids Vif Cible</span>
            </div>
            <div className="text-center p-2">
              <span className="block text-xl md:text-2xl font-bold text-slate-900 font-mono">77%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1 font-semibold">Rendement Découpe</span>
            </div>
          </motion.div>

          {/* Active status */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 justify-center lg:justify-start text-xs text-slate-600 font-mono bg-white py-2 px-3 rounded-xl border border-slate-200 shadow-sm inline-flex"
          >
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span>
              {activeBatchCount > 0 
                ? `${activeBatchCount} lot(s) actif(s) en élevage (${totalBirds} sujets suivis)` 
                : 'Prêt pour le lancement d\'un nouveau lot'}
            </span>
          </motion.div>
        </div>

        {/* Right Side: Role Selection Buttons */}
        <div id="role-selector-buttons" className="w-full max-w-md space-y-4">
          <p className="text-center lg:text-left text-xs font-mono tracking-widest text-slate-400 uppercase font-bold">
            SÉLECTIONNEZ VOTRE ESPACE DE TRAVAIL
          </p>

          {/* Farmer Button */}
          <motion.button
            id="btn-farmer-role"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('farmer')}
            className="w-full text-left bg-white border border-slate-200 hover:border-emerald-500/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden cursor-pointer min-h-[110px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl transform translate-x-12 -translate-y-12 transition-all group-hover:bg-emerald-500/10" />
            <div className="flex gap-4 items-start relative z-10">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shrink-0">
                <Tractor className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Espace Fermier / Éleveur
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors font-bold">OPÉRATIONS</span>
                </div>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">
                  Gestion quotidienne des poulets : suivi des pesées, calcul du besoin alimentaire du jour, validation prophylactique et valorisation à l'abattage.
                </p>
              </div>
            </div>
          </motion.button>

          {/* Admin Button */}
          <motion.button
            id="btn-admin-role"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('admin')}
            className="w-full text-left bg-white border border-slate-200 hover:border-emerald-500/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden cursor-pointer min-h-[110px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl transform translate-x-12 -translate-y-12 transition-all group-hover:bg-emerald-500/10" />
            <div className="flex gap-4 items-start relative z-10">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Espace Administrateur
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors font-bold">DIRECTION</span>
                </div>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold">
                  Paramétrage des coûts de production, ajustement des tarifs de vente à la découpe, simulateur de formulations et rentabilité globale.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full border-t border-slate-200 pt-5 flex flex-col md:flex-row justify-between items-center gap-3 text-slate-400 text-xs font-medium">
        <p>© 2026 Fermes du Bélier — Plan 35 jours. Tous droits réservés.</p>
        <div className="flex gap-4 items-center font-mono font-semibold">
          <span className="flex items-center gap-1 text-slate-600"><TrendingUp className="h-3 w-3 text-emerald-500" /> Rentabilité &gt; 130%</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-slate-600"><Info className="h-3 w-3 text-emerald-500" /> Prophylaxie rigoureuse</span>
        </div>
      </footer>
    </div>
  );
}
