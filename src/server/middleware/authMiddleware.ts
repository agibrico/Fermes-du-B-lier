/**
 * Middleware for SaaS Authentication and Multi-Tenant Isolation
 * Strictly verifies user sessions, organization memberships, and role permissions
 */

import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { getUserBySessionToken, UserRecord } from '../auth';

export type RoleName = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  owner: 50,
  admin: 40,
  manager: 30,
  operator: 20,
  viewer: 10
};

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  sessionToken?: string;
  orgMembership?: {
    organizationId: string;
    role: RoleName;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Session non authentifiée. En-tête Bearer manquant.' });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Jeton de session vide.' });
    }

    const db = await getDb();
    const user = await getUserBySessionToken(db, token);

    if (!user) {
      return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (err: any) {
    console.error('[AUTH_MIDDLEWARE_ERROR]', err);
    return res.status(500).json({ error: 'Erreur interne d\'authentification.' });
  }
}

export function requireOrgMember(minRole: RoleName = 'viewer') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }

      // Organization ID from route param or header
      const orgId = req.params.orgId || (req.headers['x-organization-id'] as string);

      if (!orgId) {
        return res.status(400).json({ error: 'Identifiant d\'organisation (orgId) manquant dans la requête.' });
      }

      const db = await getDb();
      const memberRes = await db.query<{ role: RoleName }>(
        `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
        [orgId, req.user.id]
      );

      if (memberRes.rows.length === 0) {
        return res.status(403).json({
          error: 'Accès refusé. Vous n\'êtes pas membre de cette organisation avicole.'
        });
      }

      const userRole = memberRes.rows[0].role;
      const userLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: `Permission insuffisante. Rôle minimum requis: « ${minRole} », votre rôle: « ${userRole} ».`
        });
      }

      req.orgMembership = {
        organizationId: orgId,
        role: userRole
      };

      next();
    } catch (err: any) {
      console.error('[ORG_MIDDLEWARE_ERROR]', err);
      return res.status(500).json({ error: 'Erreur de contrôle d\'accès organisationnel.' });
    }
  };
}
