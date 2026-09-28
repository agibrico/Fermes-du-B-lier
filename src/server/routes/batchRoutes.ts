import { Router, Response } from 'express';
import { getDb } from '../db';
import { generateRandomToken } from '../auth';
import { requireAuth, requireOrgMember, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

// 1. List batches for the organization
router.get('/', requireAuth, requireOrgMember('viewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const orgId = req.params.orgId;
    const { status, farmId } = req.query;

    let querySql = `
      SELECT b.*, f.name as farm_name, bld.name as building_name
      FROM batches b
      JOIN farms f ON f.id = b.farm_id
      LEFT JOIN buildings bld ON bld.id = b.building_id
      WHERE b.organization_id = $1
    `;
    const params: any[] = [orgId];

    if (status && typeof status === 'string') {
      params.push(status);
      querySql += ` AND b.status = $${params.length}`;
    }

    if (farmId && typeof farmId === 'string') {
      params.push(farmId);
      querySql += ` AND b.farm_id = $${params.length}`;
    }

    querySql += ` ORDER BY b.start_date DESC, b.created_at DESC`;

    const result = await db.query(querySql, params);

    // Parse data_json if present
    const batches = result.rows.map(row => {
      let parsedData: any = {};
      try {
        if (row.data_json) {
          parsedData = JSON.parse(row.data_json);
        }
      } catch (e) {
        parsedData = {};
      }
      return {
        id: row.id,
        organizationId: row.organization_id,
        farmId: row.farm_id,
        farmName: row.farm_name,
        buildingId: row.building_id,
        buildingName: row.building_name,
        name: row.name,
        initialSize: row.initial_size,
        startDate: row.start_date ? (typeof row.start_date === 'string' ? row.start_date.substring(0, 10) : new Date(row.start_date).toISOString().substring(0, 10)) : '',
        receptionAgeDays: row.reception_age_days || 1,
        status: row.status,
        targetWeightMinGrams: parseFloat(row.target_weight_min_grams) || 2100,
        targetWeightMaxGrams: parseFloat(row.target_weight_max_grams) || 2200,
        targetAgeDays: row.target_age_days || 35,
        notes: row.notes || '',
        mortalities: parsedData.mortalities || [],
        weights: parsedData.weights || [],
        dailyLogs: parsedData.dailyLogs || [],
        sales: parsedData.sales || [],
        expenses: parsedData.expenses || [],
        healthLogs: parsedData.healthLogs || [],
        flockMovements: parsedData.flockMovements || [],
        feedProgramId: parsedData.feedProgramId || 'prog_belier_35d_v1',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return res.json({ batches });
  } catch (err: any) {
    console.error('[GET_BATCHES_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des lots de volailles.' });
  }
});

// 2. Get single batch by ID (STRICT cross-tenant check)
router.get('/:batchId', requireAuth, requireOrgMember('viewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { orgId, batchId } = req.params;

    const result = await db.query(
      `SELECT b.*, f.name as farm_name, bld.name as building_name
       FROM batches b
       JOIN farms f ON f.id = b.farm_id
       LEFT JOIN buildings bld ON bld.id = b.building_id
       WHERE b.id = $1 AND b.organization_id = $2`,
      [batchId, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lot de volailles introuvable ou non autorisé.' });
    }

    const row = result.rows[0];
    let parsedData: any = {};
    try {
      if (row.data_json) parsedData = JSON.parse(row.data_json);
    } catch (e) {
      parsedData = {};
    }

    const batch = {
      id: row.id,
      organizationId: row.organization_id,
      farmId: row.farm_id,
      farmName: row.farm_name,
      buildingId: row.building_id,
      buildingName: row.building_name,
      name: row.name,
      initialSize: row.initial_size,
      startDate: row.start_date ? (typeof row.start_date === 'string' ? row.start_date.substring(0, 10) : new Date(row.start_date).toISOString().substring(0, 10)) : '',
      receptionAgeDays: row.reception_age_days || 1,
      status: row.status,
      targetWeightMinGrams: parseFloat(row.target_weight_min_grams) || 2100,
      targetWeightMaxGrams: parseFloat(row.target_weight_max_grams) || 2200,
      targetAgeDays: row.target_age_days || 35,
      notes: row.notes || '',
      mortalities: parsedData.mortalities || [],
      weights: parsedData.weights || [],
      dailyLogs: parsedData.dailyLogs || [],
      sales: parsedData.sales || [],
      expenses: parsedData.expenses || [],
      healthLogs: parsedData.healthLogs || [],
      flockMovements: parsedData.flockMovements || [],
      feedProgramId: parsedData.feedProgramId || 'prog_belier_35d_v1',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return res.json({ batch });
  } catch (err: any) {
    console.error('[GET_BATCH_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la consultation du lot.' });
  }
});

// 3. Create batch (with strict farm-to-organization integrity check)
router.post('/', requireAuth, requireOrgMember('operator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.params.orgId;
    const {
      farmId,
      buildingId,
      name,
      initialSize,
      startDate,
      receptionAgeDays = 1,
      status = 'active',
      targetWeightMinGrams = 2100,
      targetWeightMaxGrams = 2200,
      targetAgeDays = 35,
      notes = '',
      mortalities = [],
      weights = [],
      dailyLogs = [],
      sales = [],
      expenses = [],
      healthLogs = [],
      flockMovements = [],
      feedProgramId = 'prog_belier_35d_v1'
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom du lot est obligatoire.' });
    }
    if (!initialSize || initialSize <= 0) {
      return res.status(400).json({ error: 'L\'effectif initial doit être supérieur à zéro.' });
    }
    if (!startDate) {
      return res.status(400).json({ error: 'La date de démarrage est obligatoire.' });
    }

    const db = await getDb();

    // STRICT ISOLATION CHECK: Validate that farmId belongs to THIS organization!
    let targetFarmId = farmId;
    if (targetFarmId) {
      const farmCheck = await db.query(
        'SELECT id FROM farms WHERE id = $1 AND organization_id = $2',
        [targetFarmId, orgId]
      );
      if (farmCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'Violation d\'isolation : La ferme spécifiée n\'appartient pas à cette organisation.'
        });
      }
    } else {
      // Pick the first farm of this organization
      const firstFarm = await db.query(
        'SELECT id FROM farms WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [orgId]
      );
      if (firstFarm.rows.length === 0) {
        return res.status(400).json({ error: 'Veuillez créer une ferme avant de créer un lot.' });
      }
      targetFarmId = firstFarm.rows[0].id;
    }

    // If building specified, verify it belongs to this farm and org
    if (buildingId) {
      const bldCheck = await db.query(
        'SELECT id FROM buildings WHERE id = $1 AND farm_id = $2 AND organization_id = $3',
        [buildingId, targetFarmId, orgId]
      );
      if (bldCheck.rows.length === 0) {
        return res.status(403).json({
          error: 'Violation d\'isolation : Le bâtiment spécifié n\'appartient pas à la ferme sélectionnée.'
        });
      }
    }

    const batchId = 'bat_' + generateRandomToken(12);
    const dataJson = JSON.stringify({
      mortalities,
      weights,
      dailyLogs,
      sales,
      expenses,
      healthLogs,
      flockMovements,
      feedProgramId
    });

    await db.query(
      `INSERT INTO batches (
        id, organization_id, farm_id, building_id, name,
        initial_size, start_date, reception_age_days, status,
        target_weight_min_grams, target_weight_max_grams, target_age_days,
        notes, data_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        batchId,
        orgId,
        targetFarmId,
        buildingId || null,
        name.trim(),
        initialSize,
        startDate,
        receptionAgeDays,
        status,
        targetWeightMinGrams,
        targetWeightMaxGrams,
        targetAgeDays,
        notes,
        dataJson
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details_json)
       VALUES ($1, $2, $3, 'CREATE_BATCH', 'batch', $4, $5)`,
      [
        'aud_' + generateRandomToken(12),
        orgId,
        req.user!.id,
        batchId,
        JSON.stringify({ name: name.trim(), initialSize, startDate, farmId: targetFarmId })
      ]
    );

    return res.status(201).json({
      message: 'Lot créé avec succès.',
      batch: {
        id: batchId,
        organizationId: orgId,
        farmId: targetFarmId,
        buildingId: buildingId || null,
        name: name.trim(),
        initialSize,
        startDate,
        receptionAgeDays,
        status,
        targetWeightMinGrams,
        targetWeightMaxGrams,
        targetAgeDays,
        notes,
        mortalities,
        weights,
        dailyLogs,
        sales,
        expenses,
        healthLogs,
        flockMovements,
        feedProgramId
      }
    });
  } catch (err: any) {
    console.error('[CREATE_BATCH_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la création du lot.' });
  }
});

// 4. Update batch (Strictly checks ownership)
router.put('/:batchId', requireAuth, requireOrgMember('operator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orgId, batchId } = req.params;
    const db = await getDb();

    // Verify batch strictly belongs to this org
    const existing = await db.query(
      'SELECT * FROM batches WHERE id = $1 AND organization_id = $2',
      [batchId, orgId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lot introuvable dans cette organisation.' });
    }

    const {
      farmId,
      buildingId,
      name,
      initialSize,
      startDate,
      receptionAgeDays,
      status,
      targetWeightMinGrams,
      targetWeightMaxGrams,
      targetAgeDays,
      notes,
      mortalities,
      weights,
      dailyLogs,
      sales,
      expenses,
      healthLogs,
      flockMovements,
      feedProgramId
    } = req.body;

    // If changing farmId, verify target farm belongs to org
    if (farmId) {
      const farmCheck = await db.query(
        'SELECT id FROM farms WHERE id = $1 AND organization_id = $2',
        [farmId, orgId]
      );
      if (farmCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Violation d\'isolation : Ferme étrangère.' });
      }
    }

    const currentData = existing.rows[0].data_json ? JSON.parse(existing.rows[0].data_json) : {};
    const updatedDataJson = JSON.stringify({
      mortalities: mortalities !== undefined ? mortalities : currentData.mortalities || [],
      weights: weights !== undefined ? weights : currentData.weights || [],
      dailyLogs: dailyLogs !== undefined ? dailyLogs : currentData.dailyLogs || [],
      sales: sales !== undefined ? sales : currentData.sales || [],
      expenses: expenses !== undefined ? expenses : currentData.expenses || [],
      healthLogs: healthLogs !== undefined ? healthLogs : currentData.healthLogs || [],
      flockMovements: flockMovements !== undefined ? flockMovements : currentData.flockMovements || [],
      feedProgramId: feedProgramId || currentData.feedProgramId || 'prog_belier_35d_v1'
    });

    await db.query(
      `UPDATE batches SET
        farm_id = COALESCE($1, farm_id),
        building_id = COALESCE($2, building_id),
        name = COALESCE($3, name),
        initial_size = COALESCE($4, initial_size),
        start_date = COALESCE($5, start_date),
        reception_age_days = COALESCE($6, reception_age_days),
        status = COALESCE($7, status),
        target_weight_min_grams = COALESCE($8, target_weight_min_grams),
        target_weight_max_grams = COALESCE($9, target_weight_max_grams),
        target_age_days = COALESCE($10, target_age_days),
        notes = COALESCE($11, notes),
        data_json = $12,
        updated_at = NOW()
       WHERE id = $13 AND organization_id = $14`,
      [
        farmId || null,
        buildingId || null,
        name ? name.trim() : null,
        initialSize || null,
        startDate || null,
        receptionAgeDays || null,
        status || null,
        targetWeightMinGrams || null,
        targetWeightMaxGrams || null,
        targetAgeDays || null,
        notes !== undefined ? notes : null,
        updatedDataJson,
        batchId,
        orgId
      ]
    );

    return res.json({ message: 'Lot mis à jour avec succès.' });
  } catch (err: any) {
    console.error('[UPDATE_BATCH_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du lot.' });
  }
});

// 5. Delete batch (Strictly checks ownership, requires manager role)
router.delete('/:batchId', requireAuth, requireOrgMember('manager'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orgId, batchId } = req.params;
    const db = await getDb();

    const existing = await db.query(
      'SELECT id, name FROM batches WHERE id = $1 AND organization_id = $2',
      [batchId, orgId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lot introuvable dans cette organisation.' });
    }

    await db.query(
      'DELETE FROM batches WHERE id = $1 AND organization_id = $2',
      [batchId, orgId]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details_json)
       VALUES ($1, $2, $3, 'DELETE_BATCH', 'batch', $4, $5)`,
      [
        'aud_' + generateRandomToken(12),
        orgId,
        req.user!.id,
        batchId,
        JSON.stringify({ name: existing.rows[0].name })
      ]
    );

    return res.json({ message: 'Lot supprimé avec succès.' });
  } catch (err: any) {
    console.error('[DELETE_BATCH_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la suppression du lot.' });
  }
});

// 6. Organization-scoped statistics
router.get('/kpi/summary', requireAuth, requireOrgMember('viewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orgId } = req.params;
    const db = await getDb();

    const batchesRes = await db.query(
      `SELECT id, name, initial_size, status, data_json FROM batches WHERE organization_id = $1`,
      [orgId]
    );

    let totalBirdsReceived = 0;
    let totalMortalities = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let activeBatchesCount = 0;

    batchesRes.rows.forEach(b => {
      totalBirdsReceived += b.initial_size || 0;
      if (b.status === 'active') activeBatchesCount++;

      if (b.data_json) {
        try {
          const d = JSON.parse(b.data_json);
          if (Array.isArray(d.mortalities)) {
            d.mortalities.forEach((m: any) => { totalMortalities += m.count || 0; });
          }
          if (Array.isArray(d.sales)) {
            d.sales.forEach((s: any) => { totalRevenue += s.totalSalePriceFcfa || 0; });
          }
          if (Array.isArray(d.expenses)) {
            d.expenses.forEach((e: any) => { totalExpenses += e.amountFcfa || 0; });
          }
        } catch (e) {}
      }
    });

    return res.json({
      organizationId: orgId,
      totalBatches: batchesRes.rows.length,
      activeBatchesCount,
      totalBirdsReceived,
      totalMortalities,
      mortalityRatePercent: totalBirdsReceived > 0 ? (totalMortalities / totalBirdsReceived) * 100 : 0,
      totalRevenueFcfa: totalRevenue,
      totalExpensesFcfa: totalExpenses
    });
  } catch (err: any) {
    console.error('[GET_STATS_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques.' });
  }
});

export default router;
