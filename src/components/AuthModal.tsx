import React, { useState } from 'react';
import { api, AuthUser, UserOrganization } from '../services/api';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Inbox, 
  KeyRound,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser, orgs: UserOrganization[]) => void;
}

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'dev_mailbox';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devMessages, setDevMessages] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email, password);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setSuccess('Connexion réussie !');
        setTimeout(() => {
          onSuccess(res.data!.user, res.data!.organizations);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const regRes = await api.register(email, password, fullName);
      if (regRes.error) {
        setError(regRes.error);
        setLoading(false);
        return;
      }

      // Automatically create the first organization if requested
      const initialOrgName = orgName.trim() || `Élevage ${fullName.trim().split(' ')[0]}`;
      const orgRes = await api.createOrganization(initialOrgName);
      
      let orgs: UserOrganization[] = [];
      if (orgRes.data?.organization) {
        orgs = [orgRes.data.organization];
      }

      setSuccess(`Compte créé avec succès ! Organisation « ${initialOrgName} » prête.`);
      setTimeout(() => {
        onSuccess(regRes.data!.user, orgs);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyEmail(token.trim());
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Adresse e-mail vérifiée avec succès !');
        setTimeout(() => setMode('login'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de vérification.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.requestPasswordReset(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Lien de réinitialisation généré. Consultez la boîte de test locale.');
        if (res.data?.simulatedResetToken) {
          setToken(res.data.simulatedResetToken);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.resetPassword(token.trim(), newPassword);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Mot de passe mis à jour ! Vous pouvez vous connecter.');
        setTimeout(() => setMode('login'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDevMailbox = async () => {
    setLoading(true);
    const res = await api.getDevMailbox();
    if (res.data?.messages) {
      setDevMessages(res.data.messages);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {mode === 'login' && 'Connexion Exploitation SaaS'}
                {mode === 'register' && 'Créer un Compte Éleveur'}
                {mode === 'verify' && 'Vérification de l\'E-mail'}
                {mode === 'forgot' && 'Mot de Passe Oublié'}
                {mode === 'reset' && 'Nouveau Mot de Passe'}
                {mode === 'dev_mailbox' && 'Boîte de Test Locale (Emails)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Données strictement isolées par organisation
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Adresse e-mail</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="eleveur@ferme.ci"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium text-xs min-h-[44px]"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700 block">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-medium text-xs min-h-[44px]"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span>Se Connecter à mon Organisation</span>
            </button>

            <div className="pt-2 text-center border-t border-slate-100 flex flex-col gap-1.5">
              <span className="text-slate-500 text-[11px]">Nouvel exploitant avicole ?</span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Créer un compte & ma première organisation →
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nom complet de l'exploitant *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ex : Brice Atsé"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs min-h-[40px]"
                />
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Adresse e-mail professionnelle *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="contact@ferme-belier.ci"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs min-h-[40px]"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nom de votre entreprise / exploitation *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Ex : Élevage Moderne du Bélier"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs min-h-[40px]"
                />
                <Building2 className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Mot de passe (6 caractères min.) *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs min-h-[40px]"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              <span>Créer mon Espace SaaS Dédié</span>
            </button>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Déjà un compte ? Se connecter
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleRequestReset} className="space-y-3.5 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Saisissez l'adresse e-mail associée à votre compte. Un lien de réinitialisation sécurisé sera généré.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Adresse e-mail</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="eleveur@ferme.ci"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 min-h-[44px]"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              <KeyRound className="h-4 w-4" /> Envoyer le lien de réinitialisation
            </button>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-600 hover:underline cursor-pointer"
              >
                Retour connexion
              </button>
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                J'ai déjà un jeton →
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Jeton de réinitialisation *</label>
              <input
                type="text"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Coller le jeton reçu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs min-h-[40px]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Nouveau mot de passe *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs min-h-[40px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer min-h-[44px]"
            >
              Mettre à jour le mot de passe
            </button>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-600 hover:underline cursor-pointer"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}

        {/* 5. DEV MAILBOX VIEWER */}
        {mode === 'dev_mailbox' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Boîte aux lettres locale (Simulation sans SMTP)</span>
              <button
                onClick={handleLoadDevMailbox}
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Actualiser
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50">
              {devMessages.length === 0 ? (
                <p className="text-slate-400 py-6 text-center italic">Aucun e-mail simulé pour le moment.</p>
              ) : (
                devMessages.map((msg, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Destinataire : <strong>{msg.to}</strong></span>
                      <span>{msg.type}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">{msg.subject}</div>
                    <div className="p-1.5 bg-slate-100 rounded text-[10px] font-mono break-all text-slate-600">
                      Jeton : {msg.token}
                    </div>
                    <button
                      onClick={() => {
                        setToken(msg.token);
                        setMode(msg.type === 'verification' ? 'verify' : 'reset');
                      }}
                      className="text-[10px] text-emerald-700 font-bold hover:underline"
                    >
                      Utiliser ce jeton →
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setMode('login')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs cursor-pointer min-h-[40px]"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {/* Footer Dev Mailbox link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Mode local / Dev</span>
          <button
            type="button"
            onClick={() => {
              setMode('dev_mailbox');
              handleLoadDevMailbox();
            }}
            className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-bold cursor-pointer"
          >
            <Inbox className="h-3.5 w-3.5" /> Boîte de test locale ({devMessages.length})
          </button>
        </div>

      </div>
    </div>
  );
}
