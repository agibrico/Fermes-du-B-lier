import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  CalendarCheck, 
  ChefHat, 
  Package, 
  HeartPulse, 
  Scale, 
  DollarSign, 
  FileText, 
  Settings,
  Tractor,
  Menu,
  X
} from 'lucide-react';
import { formatDateLongFr } from '../utils/dateUtils';

export type AppSpace = 
  | 'dashboard'
  | 'batches'
  | 'daily_log'
  | 'feeding'
  | 'stocks'
  | 'health'
  | 'weighings'
  | 'sales_expenses'
  | 'reports'
  | 'parameters';

interface NavigationProps {
  currentSpace: AppSpace;
  onSelectSpace: (space: AppSpace) => void;
  currentDateStr: string;
  lowStockCount?: number;
  overdueTasksCount?: number;
}

export const SPACES_CONFIG = [
  { id: 'dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: LayoutDashboard },
  { id: 'batches', label: 'Lots de volailles', shortLabel: 'Lots', icon: Layers },
  { id: 'daily_log', label: 'Journal quotidien', shortLabel: 'Journal', icon: CalendarCheck },
  { id: 'feeding', label: 'Alimentation & Fabrication', shortLabel: 'Aliment', icon: ChefHat },
  { id: 'stocks', label: 'Stocks & Matières', shortLabel: 'Stocks', icon: Package },
  { id: 'health', label: 'Santé & Traitements', shortLabel: 'Santé', icon: HeartPulse },
  { id: 'weighings', label: 'Pesées & Performances', shortLabel: 'Pesées', icon: Scale },
  { id: 'sales_expenses', label: 'Ventes & Dépenses', shortLabel: 'Finances', icon: DollarSign },
  { id: 'reports', label: 'Rapports & Sauvegardes', shortLabel: 'Rapports', icon: FileText },
  { id: 'parameters', label: 'Paramètres', shortLabel: 'Réglages', icon: Settings },
] as const;

export default function Navigation({
  currentSpace,
  onSelectSpace,
  currentDateStr,
  lowStockCount = 0,
  overdueTasksCount = 0
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectSpace('dashboard')}>
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                <Tractor className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg block leading-tight">
                  FERMES DU BÉLIER <span className="text-emerald-600 font-bold">SYNC</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                  PLAN 35J • CIBLE 2,1 - 2,2 KG
                </span>
              </div>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-100 text-emerald-800 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formatDateLongFr(currentDateStr)}</span>
            </div>

            {/* Quick alert badges */}
            {overdueTasksCount > 0 && (
              <span 
                onClick={() => onSelectSpace('health')}
                className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold cursor-pointer hover:bg-amber-200 transition-colors"
                title={`${overdueTasksCount} tâche(s) en retard`}
              >
                ⚠️ {overdueTasksCount} tâche(s)
              </span>
            )}

            {lowStockCount > 0 && (
              <span 
                onClick={() => onSelectSpace('stocks')}
                className="bg-rose-100 text-rose-800 border border-rose-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold cursor-pointer hover:bg-rose-200 transition-colors"
                title={`${lowStockCount} article(s) en stock bas`}
              >
                📦 {lowStockCount} stock bas
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs (Scrollable on intermediate screens) */}
        <nav className="hidden lg:flex max-w-7xl mx-auto px-4 overflow-x-auto border-t border-slate-100 text-xs font-semibold gap-1 py-1">
          {SPACES_CONFIG.map((space) => {
            const Icon = space.icon;
            const isActive = currentSpace === space.id;
            return (
              <button
                key={space.id}
                onClick={() => onSelectSpace(space.id as AppSpace)}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{space.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-800">Espaces de Gestion</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1">
                {SPACES_CONFIG.map((space) => {
                  const Icon = space.icon;
                  const isActive = currentSpace === space.id;
                  return (
                    <button
                      key={space.id}
                      onClick={() => {
                        onSelectSpace(space.id as AppSpace);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{space.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-slate-400 text-[11px] font-mono">
              Fermes du Bélier Sync • Mode Hors-ligne Actif
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (5 core shortcuts + menu) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-1 flex justify-around items-center shadow-lg">
        {SPACES_CONFIG.slice(0, 4).map((space) => {
          const Icon = space.icon;
          const isActive = currentSpace === space.id;
          return (
            <button
              key={space.id}
              onClick={() => onSelectSpace(space.id as AppSpace)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl cursor-pointer min-h-[44px] min-w-[50px] ${
                isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{space.shortLabel}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl cursor-pointer text-slate-400 min-h-[44px] min-w-[50px]"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Plus</span>
        </button>
      </div>
    </>
  );
}
