/**
 * Utilitaires fiables de manipulation et de calcul des dates calendaires
 * Évite tout décalage horaire UTC / heure d'été en travaillant sur les composantes de date locales.
 */

/**
 * Découpe une chaîne 'YYYY-MM-DD' en Date locale (calée à midi pour éviter les sauts DST)
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

/**
 * Formate un objet Date en chaîne 'YYYY-MM-DD' locale
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retourne la date locale d'aujourd'hui sous format 'YYYY-MM-DD'
 */
export function getTodayDateStr(): string {
  return formatLocalDate(new Date());
}

/**
 * Calcule l'écart en jours calendaires entiers entre dateA et dateB (dateB - dateA)
 */
export function calendarDaysBetween(dateStrA: string, dateStrB: string): number {
  const a = parseLocalDate(dateStrA);
  const b = parseLocalDate(dateStrB);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Calcule le jour de cycle pour un lot :
 * - Le jour de mise en place correspond à J1.
 * - Si la date est future : statut 'planned', jour <= 0
 * - Conserve l'âge réel après J35 (ex: J36, J40)
 * - Pour un lot clôturé, utilise sa date de clôture si fournie
 */
export function getBatchAgeDays(startDateStr: string, completionDateStr?: string, referenceDateStr?: string): {
  ageDays: number;
  status: 'planned' | 'active' | 'completed';
  daysToStart: number;
  isOverdue: boolean;
  overdueDays: number;
} {
  const targetDateStr = completionDateStr || referenceDateStr || getTodayDateStr();
  const diffDays = calendarDaysBetween(startDateStr, targetDateStr);
  
  if (completionDateStr) {
    const finalAge = diffDays + 1;
    return {
      ageDays: Math.max(1, finalAge),
      status: 'completed',
      daysToStart: 0,
      isOverdue: finalAge > 35,
      overdueDays: Math.max(0, finalAge - 35)
    };
  }

  if (diffDays < 0) {
    // Date future -> planifié
    return {
      ageDays: 0,
      status: 'planned',
      daysToStart: Math.abs(diffDays),
      isOverdue: false,
      overdueDays: 0
    };
  }

  // J1 au premier jour
  const ageDays = diffDays + 1;
  const isOverdue = ageDays > 35;
  const overdueDays = Math.max(0, ageDays - 35);

  return {
    ageDays,
    status: 'active',
    daysToStart: 0,
    isOverdue,
    overdueDays
  };
}

/**
 * Formate une date 'YYYY-MM-DD' en format français complet ou court (ex: 28/09/2026)
 */
export function formatDateFr(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formate une date avec le jour de la semaine (ex: Lun. 28 Septembre 2026)
 */
export function formatDateLongFr(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formate un montant en FCFA avec séparateur d'espace
 */
export function formatFcfa(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}
