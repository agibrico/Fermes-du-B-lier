import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Tractor, TrendingUp, Info, Activity, CalendarDays } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: 'admin' | 'farmer') => void;
  activeBatchCount: number;
  totalBirds: number;
}

export default function WelcomeScreen({ onSelectRole, activeBatchCount, totalBirds }: WelcomeScreenProps) {
  return (
    <div id="welcome-screen-container" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/50 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <header id="welcome-header" className="relative z-10 max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Tractor className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans font-bold tracking-tight text-xl md:text-2xl text-slate-900">
              LES FERMES DU BÉLIER <span className="text-emerald-600 font-extrabold">SYNC</span>
            </h1>
            <p className="font-mono text-[10px] text-slate-500 tracking-wider">
              SUPER PRO — PROGRAMME OPTIMISÉ 35J
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50/80 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-mono text-[10px] text-emerald-700 uppercase tracking-widest font-semibold">Plan Directeur Actif</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-10 flex flex-col lg:flex-row items-center gap-10 md:gap-16">
        {/* Left Side: presentation & statistics */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 rounded-full text-emerald-700 text-xs font-semibold border border-emerald-100"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            CYCLE CHRONO 35 JOURS
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-sans font-extrabold tracking-tight text-slate-900 leading-tight"
          >
            Formulation Boostée &<br />
            <span className="text-emerald-600 font-bold">
              Rentabilité Maximisée
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-600 text-base max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Pilotez votre exploitation avicole de manière scientifique. Suivez l'alimentation, la prophylaxie, les courbes de croissance de vos poulets et analysez vos profits à la découpe.
          </motion.p>

          {/* Quick numbers widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 max-w-lg mx-auto lg:mx-0 shadow-sm"
          >
            <div className="text-center p-2">
              <span className="block text-2xl font-bold text-slate-900 font-mono">3,5 kg</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1 font-semibold">Aliment / Sujet</span>
            </div>
            <div className="text-center p-2 border-x border-slate-100">
              <span className="block text-2xl font-bold text-emerald-600 font-mono">2,4 kg</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1 font-semibold">Poids Vif Cible</span>
            </div>
            <div className="text-center p-2">
              <span className="block text-2xl font-bold text-slate-900 font-mono">77%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1 font-semibold">Rendement Découpe</span>
            </div>
          </motion.div>

          {/* Active status */}
          {(activeBatchCount > 0) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 justify-center lg:justify-start text-xs text-slate-600 font-mono bg-white py-2 px-3 rounded-lg border border-slate-200 shadow-sm inline-flex"
            >
              <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span>{activeBatchCount} lot(s) actif(s) en cours ({totalBirds} sujets suivis)</span>
            </motion.div>
          )}
        </div>

        {/* Right Side: Role Selection Buttons */}
        <div id="role-selector-buttons" className="w-full max-w-md space-y-5">
          <p className="text-center lg:text-left text-xs font-mono tracking-widest text-slate-400 uppercase font-semibold">
            SÉLECTIONNEZ VOTRE ESPACE DE TRAVAIL
          </p>

          {/* Farmer Button */}
          <motion.button
            id="btn-farmer-role"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole('farmer')}
            className="w-full text-left bg-white border border-slate-200 hover:border-emerald-500/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl transform translate-x-12 -translate-y-12 transition-all group-hover:bg-emerald-500/10" />
            <div className="flex gap-4 items-start relative z-10">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors duration-300">
                <Tractor className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Espace Fermier / Éleveur
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors font-bold">OPÉRATIONS</span>
                </div>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  Gérer vos lots de poulets au jour le jour : suivi des poids, contrôle des rations quotidiennes, validation du calendrier vaccinal et enregistrement des mortalités.
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
            className="w-full text-left bg-white border border-slate-200 hover:border-emerald-500/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl transform translate-x-12 -translate-y-12 transition-all group-hover:bg-emerald-500/10" />
            <div className="flex gap-4 items-start relative z-10">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors duration-300">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    Espace Administrateur
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors font-bold">CONTRÔLE</span>
                </div>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                  Pilotez les paramètres financiers et standards techniques. Modifiez les prix d'achat, de vente des découpes, simulez les formules alimentaires et visualisez les indicateurs de rentabilité globale.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
        <p>© 2026 Les Fermes du Bélier Super Pro. Tous droits réservés.</p>
        <div className="flex gap-4 items-center font-mono font-semibold">
          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-500" /> Rentabilité &gt; 130%</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1"><Info className="h-3 w-3 text-emerald-500" /> Prophylaxie rigoureuse</span>
        </div>
      </footer>
    </div>
  );
}
