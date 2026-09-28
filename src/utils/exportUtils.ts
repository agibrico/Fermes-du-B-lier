import { PoultryBatch, FeedManufacturingLog, HealthAdministrationLog } from '../types';
import { formatDateFr, formatFcfa } from './dateUtils';
import { calculateBatchMetrics } from './calculations';

/**
 * Exporte des données en CSV compatible Excel français (point-virgule et BOM UTF-8)
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '\uFEFF';
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
  ].join('\r\n');

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Génère et ouvre une fenêtre d'impression pour une Fiche de Lot officielle
 */
export function printBatchReport(batch: PoultryBatch, metrics: ReturnType<typeof calculateBatchMetrics>) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Fiche de Lot - ${batch.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; }
    h1 { color: #047857; margin-bottom: 4px; font-size: 22px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
    .card-val { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 8px; border: 1px solid #cbd5e1; }
    .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>LES FERMES DU BÉLIER — FICHE DE LOT OFFICIELLE</h1>
  <div class="subtitle">Lot : <strong>${batch.name}</strong> • Mise en place : ${formatDateFr(batch.startDate)} • Statut : ${metrics.status} (Jour ${metrics.ageDays})</div>

  <div class="grid">
    <div class="card">
      <div class="card-label">Sujets Vivants Présents</div>
      <div class="card-val">${metrics.activeLiveSubjects} / ${batch.initialSize}</div>
    </div>
    <div class="card">
      <div class="card-label">Mortalité Cumulée</div>
      <div class="card-val">${metrics.totalMortalities} (${metrics.mortalityRatePercent.toFixed(1)}%)</div>
    </div>
    <div class="card">
      <div class="card-label">Dernier Poids Mesuré</div>
      <div class="card-val">${metrics.latestWeightGrams > 0 ? metrics.latestWeightGrams + ' g' : 'Non renseigné'}</div>
    </div>
    <div class="card">
      <div class="card-label">Gain Moyen Quotidien (GMQ)</div>
      <div class="card-val">${metrics.gmqGramsPerDay > 0 ? metrics.gmqGramsPerDay.toFixed(1) + ' g/j' : '-'}</div>
    </div>
    <div class="card">
      <div class="card-label">Indice de Consommation (IC)</div>
      <div class="card-val">${metrics.feedIndexIC !== null ? metrics.feedIndexIC.toFixed(2) : '-'}</div>
    </div>
    <div class="card">
      <div class="card-label">Encaissements Ventes</div>
      <div class="card-val">${formatFcfa(metrics.paymentsReceivedTotalFcfa)}</div>
    </div>
  </div>

  <h3>Historique des Pesées de Contrôle</h3>
  <table>
    <thead>
      <tr>
        <th>Jour (Âge)</th>
        <th>Date</th>
        <th>Sujets Pesés</th>
        <th>Poids Moyen</th>
        <th>Écart Cible (2100-2200g)</th>
        <th>Commentaire</th>
      </tr>
    </thead>
    <tbody>
      ${(batch.weights || []).map(w => `
        <tr>
          <td>Jour ${w.day}</td>
          <td>${formatDateFr(w.date)}</td>
          <td>${w.birdsWeighedCount || 1}</td>
          <td><strong>${w.weight} g</strong></td>
          <td>${w.weight >= 2100 && w.day >= 35 ? 'Conforme à l\'objectif' : 'En suivi'}</td>
          <td>${w.notes || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3>Sécurité Sanitaire et Délais d'Attente</h3>
  <p style="font-size: 12px;">
    ${metrics.isSafeForSlaughter 
      ? '✅ <strong>Aucun délai d\'attente sanitaire en cours.</strong> Les oiseaux peuvent être abattus ou commercialisés.' 
      : '⚠️ <strong>DÉLAIS D\'ATTENTE ACTIFS :</strong> ' + metrics.activeWithdrawalDetails.join(', ')}
  </p>

  <div class="footer">
    Document édité le ${formatDateFr(new Date().toISOString().split('T')[0])} — Fermes du Bélier Sync Plan 35 jours
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Génère et imprime une Fiche de Fabrication d'Aliment
 */
export function printManufacturingLog(log: FeedManufacturingLog) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Fiche de Fabrication - ${log.formulaVersion}</title>
  <style>
    body { font-family: sans-serif; margin: 30px; font-size: 13px; }
    h1 { color: #047857; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 8px; border: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  <h1>FICHE DE FABRICATION D'ALIMENT</h1>
  <p>Date : ${formatDateFr(log.date)} • Opérateur : <strong>${log.operator || 'Responsable meunerie'}</strong> • Quantité produite : <strong>${log.actualProducedQuantityKg} kg</strong></p>

  <table>
    <thead>
      <tr>
        <th>Matière Première</th>
        <th>Quantité Pesée</th>
        <th>Lot Ingrédient</th>
      </tr>
    </thead>
    <tbody>
      ${log.ingredientsUsed.map(ing => `
        <tr>
          <td><strong>${ing.ingredientName}</strong></td>
          <td>${ing.actualWeighedKg >= 1 ? ing.actualWeighedKg.toFixed(2) + ' kg' : Math.round(ing.actualWeighedKg * 1000) + ' g'}</td>
          <td>${ing.stockLotNumber || 'Stock courant'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p style="margin-top: 20px;">
    Coût matières : ${formatFcfa(log.rawMaterialsCostFcfa)} • Frais broyage/mélange : ${formatFcfa(log.grindingCostFcfa + log.mixingCostFcfa)}<br>
    <strong>Coût Total : ${formatFcfa(log.totalManufacturingCostFcfa)} (${log.costPerKgFcfa.toFixed(2)} FCFA / kg)</strong>
  </p>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
