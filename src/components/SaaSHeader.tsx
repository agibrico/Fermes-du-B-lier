import React, { useState } from 'react';
import { AuthUser, UserOrganization, FarmRecord } from '../services/api';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  User, 
  HardDrive, 
  Cloud, 
  Check, 
  Sparkles,
  Inbox
} from 'lucide-react';

interface SaaSHeaderProps {
  currentUser: AuthUser | null;
  organizations: UserOrganization[];
  activeOrgId: string | null;
  activeFarm: FarmRecord | null;
  farms: FarmRecord[];
  onSelectOrg: (orgId: string) => void;
  onSelectFarm: (farmId: string) => void;
  onCreateOrgClick: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenMailbox: () => void;
}

export default function SaaSHeader({
  currentUser,
  organizations,
  activeOrgId,
  activeFarm,
  farms,
  onSelectOrg,
  onSelectFarm,
  onCreateOrgClick,
  onOpenAuth,
  onLogout,
  onOpenMailbox
}: SaaSHeaderProps) {
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const activeOrg = organizations.find(o => o.id === activeOrgId) || organizations[0] || null;

  const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: 'Propriétaire', color: 'bg-purple-100 text-purple-800' },
    admin: { label: 'Administrateur', color: 'bg-blue-100 text-blue-800' },
    manager: { label: 'Gestionnaire', color: 'bg-emerald-100 text-emerald-800' },
    operator: { label: 'Opérateur', color: 'bg-amber-100 text-amber-800' },
    viewer: { label: 'Lecture seule', color: 'bg-slate-100 text-slate-800' }
  };

  const currentRole = activeOrg ? roleLabels[activeOrg.role] || { label: activeOrg.role, color: 'bg-slate-100 text-slate-800' } : null;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 text-xs py-2 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: SaaS Organization Switcher or Local Mode Indicator */}
        <div className="flex items-center gap-3">
          {currentUser && activeOrg ? (
            <div className="relative">
              <button
                onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer min-h-[36px]"
              >
                <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-100 flex items-center gap-1.5 leading-none">
                    <span>{activeOrg.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Organisation active • {farms.length} site(s)
                  </span>
                </div>
              </button>

              {/* Organization Dropdown */}
              {showOrgDropdown && (
                <div className="absolute left-0 top-full mt-1.5 z-50 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-2 min-w-[260px] space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 py-1">
                    Vos entreprises / exploitations ({organizations.length})
                  </div>
                  
                  {organizations.map(org => {
                    const isSelected = org.id === activeOrg.id;
                    const roleBadge = roleLabels[org.role] || { label: org.role, color: 'bg-slate-100 text-slate-700' };

                    return (
                      <button
                        key={org.id}
                        onClick={() => {
                          onSelectOrg(org.id);
                          setShowOrgDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs">{org.name}</div>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowOrgDropdown(false);
                        onCreateOrgClick();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-bold text-xs cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Créer une nouvelle organisation
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl font-mono text-[11px]">
              <HardDrive className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>Mode Local (Données privées sur cet appareil)</span>
            </div>
          )}

          {/* Role badge if logged in */}
          {currentRole && (
            <span className={`hidden md:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${currentRole.color}`}>
              {currentRole.label}
            </span>
          )}

          {/* Farm selection if multiple farms */}
          {currentUser && farms.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-[11px]">
              <span className="text-slate-400">Site :</span>
              <select
                value={activeFarm?.id || ''}
                onChange={e => onSelectFarm(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                {farms.map(f => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: SaaS Cloud Status & User Account */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer min-h-[36px]"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-200 font-medium truncate max-w-[120px] sm:max-w-[180px]">
                  {currentUser.fullName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-3 min-w-[240px] space-y-2">
                  <div className="border-b border-slate-100 pb-2 space-y-0.5">
                    <div className="font-bold text-xs text-slate-900">{currentUser.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-1">
                      <Cloud className="h-3.5 w-3.5" /> Synchronisation PostgreSQL active
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenMailbox();
                      }}
                      className="w-full text-left text-xs p-2 rounded-xl hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Inbox className="h-4 w-4 text-blue-600" /> Boîte de test locale
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left text-xs p-2 rounded-xl hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer min-h-[36px]"
            >
              <LogIn className="h-4 w-4" /> Se Connecter / Créer Organisation
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
