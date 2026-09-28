import { Router, Response } from 'express';
import { getDb } from '../db';
import { generateRandomToken } from '../auth';
import { requireAuth, requireOrgMember, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

// List all farms for the organization
router.get('/', requireAuth, requireOrgMember('viewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const orgId = req.params.orgId;

    const farmsRes = await db.query(
      `SELECT f.*,
              (SELECT COUNT(*) FROM buildings b WHERE b.farm_id = f.id)::int as building_count,
              (SELECT COUNT(*) FROM batches bt WHERE bt.farm_id = f.id)::int as batch_count
       FROM farms f
       WHERE f.organization_id = $1
       ORDER BY f.created_at ASC`,
      [orgId]
    );

    const buildingsRes = await db.query(
      `SELECT * FROM buildings WHERE organization_id = $1 ORDER BY name ASC`,
      [orgId]
    );

    // Group buildings by farm
    const farmsWithBuildings = farmsRes.rows.map(farm => ({
      ...farm,
      buildings: buildingsRes.rows.filter(b => b.farm_id === farm.id)
    }));

    return res.json({ farms: farmsWithBuildings });
  } catch (err: any) {
    console.error('[GET_FARMS_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des fermes.' });
  }
});

// Create new farm
router.post('/', requireAuth, requireOrgMember('manager'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, location, surfaceM2 } = req.body;
    const orgId = req.params.orgId;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la ferme ou du site est obligatoire.' });
    }

    const db = await getDb();
    const farmId = 'frm_' + generateRandomToken(12);

    await db.query(
      `INSERT INTO farms (id, organization_id, name, location, surface_m2)
       VALUES ($1, $2, $3, $4, $5)`,
      [farmId, orgId, name.trim(), location?.trim() || null, surfaceM2 || 0]
    );

    // Create default building for convenience
    const buildingId = 'bld_' + generateRandomToken(12);
    await db.query(
      `INSERT INTO buildings (id, organization_id, farm_id, name, capacity)
       VALUES ($1, $2, $3, 'Bâtiment 1', 1000)`,
      [buildingId, orgId, farmId]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details_json)
       VALUES ($1, $2, $3, 'CREATE_FARM', 'farm', $4, $5)`,
      [
        'aud_' + generateRandomToken(12),
        orgId,
        req.user!.id,
        farmId,
        JSON.stringify({ name: name.trim(), location, surfaceM2 })
      ]
    );

    return res.status(201).json({
      message: 'Ferme créée avec succès.',
      farm: {
        id: farmId,
        organizationId: orgId,
        name: name.trim(),
        location: location?.trim() || null,
        surfaceM2: surfaceM2 || 0,
        buildingCount: 1,
        batchCount: 0
      }
    });
  } catch (err: any) {
    console.error('[CREATE_FARM_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la création de la ferme.' });
  }
});

// Update farm
router.put('/:farmId', requireAuth, requireOrgMember('manager'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, location, surfaceM2 } = req.body;
    const { orgId, farmId } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la ferme est obligatoire.' });
    }

    const db = await getDb();

    // Verify farm exists and strictly belongs to this organization
    const existing = await db.query(
      'SELECT id FROM farms WHERE id = $1 AND organization_id = $2',
      [farmId, orgId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Ferme introuvable dans cette organisation.' });
    }

    await db.query(
      `UPDATE farms 
       SET name = $1, location = $2, surface_m2 = $3, updated_at = NOW()
       WHERE id = $4 AND organization_id = $5`,
      [name.trim(), location?.trim() || null, surfaceM2 || 0, farmId, orgId]
    );

    return res.json({ message: 'Ferme mise à jour avec succès.' });
  } catch (err: any) {
    console.error('[UPDATE_FARM_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la ferme.' });
  }
});

// Delete farm (requires admin, blocks if batches attached)
router.delete('/:farmId', requireAuth, requireOrgMember('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orgId, farmId } = req.params;
    const db = await getDb();

    // Check if farm belongs to organization
    const farmRes = await db.query(
      'SELECT id, name FROM farms WHERE id = $1 AND organization_id = $2',
      [farmId, orgId]
    );

    if (farmRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ferme introuvable dans cette organisation.' });
    }

    // Check if batches are attached
    const batchesRes = await db.query(
      'SELECT COUNT(*)::int as count FROM batches WHERE farm_id = $1 AND organization_id = $2',
      [farmId, orgId]
    );

    if (batchesRes.rows[0].count > 0) {
      return res.status(400).json({
        error: `Suppression impossible : ${batchesRes.rows[0].count} lot(s) de volailles sont rattachés à cette ferme. Archivez ou transférez les lots d'abord.`
      });
    }

    await db.query('DELETE FROM farms WHERE id = $1 AND organization_id = $2', [farmId, orgId]);

    return res.json({ message: 'Ferme supprimée avec succès.' });
  } catch (err: any) {
    console.error('[DELETE_FARM_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la suppression de la ferme.' });
  }
});

export default router;
