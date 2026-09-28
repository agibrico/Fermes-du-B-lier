import { Router, Response } from 'express';
import { getDb } from '../db';
import { generateRandomToken } from '../auth';
import { requireAuth, requireOrgMember, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// List user's organizations
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;

    const result = await db.query(
      `SELECT o.id, o.name, o.slug, o.created_at, om.role,
              (SELECT COUNT(*) FROM farms f WHERE f.organization_id = o.id)::int as farm_count,
              (SELECT COUNT(*) FROM batches b WHERE b.organization_id = o.id)::int as batch_count
       FROM organizations o
       JOIN organization_members om ON om.organization_id = o.id
       WHERE om.user_id = $1
       ORDER BY om.created_at ASC`,
      [userId]
    );

    return res.json({ organizations: result.rows });
  } catch (err: any) {
    console.error('[GET_ORGS_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des organisations.' });
  }
});

// Create new organization
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, defaultFarmName } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de l\'exploitation ou entreprise est requis.' });
    }

    const db = await getDb();
    const userId = req.user!.id;

    const orgId = 'org_' + generateRandomToken(12);
    const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug || 'ferme'}-${generateRandomToken(4)}`;

    // Create organization
    await db.query(
      `INSERT INTO organizations (id, name, slug, owner_id)
       VALUES ($1, $2, $3, $4)`,
      [orgId, name.trim(), slug, userId]
    );

    // Assign owner membership
    const memberId = 'mem_' + generateRandomToken(12);
    await db.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role)
       VALUES ($1, $2, $3, 'owner')`,
      [memberId, orgId, userId]
    );

    // Create default farm for convenience
    const farmId = 'frm_' + generateRandomToken(12);
    const farmName = defaultFarmName?.trim() || `Site Principal - ${name.trim()}`;
    await db.query(
      `INSERT INTO farms (id, organization_id, name, location, surface_m2)
       VALUES ($1, $2, $3, 'Site principal', 500)`,
      [farmId, orgId, farmName]
    );

    // Create default building for this farm
    const buildingId = 'bld_' + generateRandomToken(12);
    await db.query(
      `INSERT INTO buildings (id, organization_id, farm_id, name, capacity)
       VALUES ($1, $2, $3, 'Bâtiment 1', 1500)`,
      [buildingId, orgId, farmId]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details_json)
       VALUES ($1, $2, $3, 'CREATE_ORGANIZATION', 'organization', $4, $5)`,
      [
        'aud_' + generateRandomToken(12),
        orgId,
        userId,
        orgId,
        JSON.stringify({ name: name.trim(), defaultFarmId: farmId })
      ]
    );

    return res.status(201).json({
      message: 'Organisation créée avec succès.',
      organization: {
        id: orgId,
        name: name.trim(),
        slug,
        role: 'owner',
        farmCount: 1,
        batchCount: 0
      },
      defaultFarm: {
        id: farmId,
        name: farmName
      }
    });
  } catch (err: any) {
    console.error('[CREATE_ORG_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la création de l\'organisation.' });
  }
});

// Get specific organization
router.get('/:orgId', requireAuth, requireOrgMember('viewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const orgId = req.params.orgId;

    const orgRes = await db.query(
      `SELECT o.id, o.name, o.slug, o.created_at, om.role
       FROM organizations o
       JOIN organization_members om ON om.organization_id = o.id
       WHERE o.id = $1 AND om.user_id = $2`,
      [orgId, req.user!.id]
    );

    if (orgRes.rows.length === 0) {
      return res.status(404).json({ error: 'Organisation non trouvée.' });
    }

    return res.json({ organization: orgRes.rows[0] });
  } catch (err: any) {
    console.error('[GET_ORG_DETAIL_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération de l\'organisation.' });
  }
});

// List members of organization
router.get('/:orgId/members', requireAuth, requireOrgMember('viewer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const orgId = req.params.orgId;

    const membersRes = await db.query(
      `SELECT om.id, om.role, om.created_at, u.id as user_id, u.email, u.full_name, u.is_email_verified
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY om.created_at ASC`,
      [orgId]
    );

    return res.json({ members: membersRes.rows });
  } catch (err: any) {
    console.error('[GET_MEMBERS_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des membres.' });
  }
});

// Invite member to organization (requires admin role)
router.post('/:orgId/members/invite', requireAuth, requireOrgMember('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, role } = req.body;
    const orgId = req.params.orgId;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse e-mail valide requise.' });
    }

    const assignedRole = ['admin', 'manager', 'operator', 'viewer'].includes(role) ? role : 'operator';
    const db = await getDb();

    // Check if target user exists
    const userRes = await db.query('SELECT id, email, full_name FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé. Le collaborateur doit d\'abord créer un compte sur la plateforme avant d\'être rattaché.'
      });
    }

    const targetUser = userRes.rows[0];

    // Check if already member
    const existingMember = await db.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, targetUser.id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'Cet utilisateur est déjà membre de l\'organisation.' });
    }

    const memberId = 'mem_' + generateRandomToken(12);
    await db.query(
      `INSERT INTO organization_members (id, organization_id, user_id, role)
       VALUES ($1, $2, $3, $4)`,
      [memberId, orgId, targetUser.id, assignedRole]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (id, organization_id, user_id, action, entity_type, entity_id, details_json)
       VALUES ($1, $2, $3, 'INVITE_MEMBER', 'member', $4, $5)`,
      [
        'aud_' + generateRandomToken(12),
        orgId,
        req.user!.id,
        memberId,
        JSON.stringify({ invitedUserId: targetUser.id, email: targetUser.email, role: assignedRole })
      ]
    );

    return res.status(201).json({
      message: `Collaborateur ${targetUser.full_name} (${targetUser.email}) ajouté avec le rôle ${assignedRole}.`,
      member: {
        id: memberId,
        userId: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.full_name,
        role: assignedRole
      }
    });
  } catch (err: any) {
    console.error('[INVITE_MEMBER_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de l\'invitation.' });
  }
});

export default router;
