import { Router, Response } from 'express';
import { getDb } from '../db';
import { 
  hashPassword, 
  verifyPassword, 
  createSession, 
  revokeSession, 
  generateRandomToken, 
  recordSimulatedEmail, 
  devMailbox,
  UserRecord
} from '../auth';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// 1. Inscription (Register)
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse e-mail valide requise.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Le nom complet de l\'exploitant est requis.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDb();

    // Check duplicate
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cette adresse e-mail existe déjà.' });
    }

    const userId = 'usr_' + generateRandomToken(12);
    const passwordHash = hashPassword(password);
    const verificationToken = generateRandomToken(24);

    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, is_email_verified, verification_token)
       VALUES ($1, $2, $3, $4, FALSE, $5)`,
      [userId, cleanEmail, passwordHash, fullName.trim(), verificationToken]
    );

    // Record local test verification email
    recordSimulatedEmail(cleanEmail, 'verification', verificationToken);

    // Create session
    const { token, expiresAt } = await createSession(db, userId);

    return res.status(201).json({
      message: 'Compte créé avec succès. Vérification envoyée.',
      token,
      expiresAt,
      user: {
        id: userId,
        email: cleanEmail,
        fullName: fullName.trim(),
        isEmailVerified: false
      },
      devTestNotice: 'Mode local : le jeton de vérification est disponible dans /api/auth/dev-mailbox',
      simulatedVerificationToken: verificationToken
    });
  } catch (err: any) {
    console.error('[REGISTER_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
});

// 2. Connexion (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Adresse e-mail et mot de passe requis.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDb();

    const result = await db.query<UserRecord>(
      'SELECT * FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides (adresse e-mail ou mot de passe incorrect).' });
    }

    const user = result.rows[0];
    const isMatch = verifyPassword(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants invalides (adresse e-mail ou mot de passe incorrect).' });
    }

    const { token, expiresAt } = await createSession(db, user.id);

    // Fetch user organizations
    const orgsRes = await db.query(
      `SELECT o.id, o.name, o.slug, om.role
       FROM organizations o
       JOIN organization_members om ON om.organization_id = o.id
       WHERE om.user_id = $1
       ORDER BY om.created_at ASC`,
      [user.id]
    );

    return res.json({
      message: 'Connexion réussie.',
      token,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isEmailVerified: user.is_email_verified
      },
      organizations: orgsRes.rows
    });
  } catch (err: any) {
    console.error('[LOGIN_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
});

// 3. Déconnexion (Logout)
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.sessionToken) {
      const db = await getDb();
      await revokeSession(db, req.sessionToken);
    }
    return res.json({ message: 'Déconnexion effectuée avec succès.' });
  } catch (err: any) {
    console.error('[LOGOUT_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la déconnexion.' });
  }
});

// 4. Utilisateur actuel (Me)
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const orgsRes = await db.query(
      `SELECT o.id, o.name, o.slug, om.role
       FROM organizations o
       JOIN organization_members om ON om.organization_id = o.id
       WHERE om.user_id = $1
       ORDER BY om.created_at ASC`,
      [user.id]
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isEmailVerified: user.is_email_verified
      },
      organizations: orgsRes.rows
    });
  } catch (err: any) {
    console.error('[ME_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
});

// 5. Vérification d'adresse e-mail
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Jeton de vérification requis.' });
    }

    const db = await getDb();
    const result = await db.query(
      `UPDATE users 
       SET is_email_verified = TRUE, verification_token = NULL, updated_at = NOW()
       WHERE verification_token = $1
       RETURNING id, email, full_name, is_email_verified`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Jeton de vérification invalide ou déjà utilisé.' });
    }

    return res.json({
      message: 'Adresse e-mail vérifiée avec succès !',
      user: result.rows[0]
    });
  } catch (err: any) {
    console.error('[VERIFY_EMAIL_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la vérification.' });
  }
});

// 6. Demande de réinitialisation de mot de passe
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Adresse e-mail requise.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = await getDb();

    const userRes = await db.query<UserRecord>('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      // Return neutral message to avoid email enumeration
      return res.json({ message: 'Si cette adresse existe, un lien de réinitialisation a été généré.' });
    }

    const user = userRes.rows[0];
    const resetToken = generateRandomToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      `UPDATE users SET reset_token = $1, reset_token_expires_at = $2, updated_at = NOW() WHERE id = $3`,
      [resetToken, expiresAt.toISOString(), user.id]
    );

    recordSimulatedEmail(cleanEmail, 'reset_password', resetToken);

    return res.json({
      message: 'Si cette adresse existe, un lien de réinitialisation a été généré.',
      devTestNotice: 'Mode local : le jeton de réinitialisation est disponible dans /api/auth/dev-mailbox',
      simulatedResetToken: resetToken
    });
  } catch (err: any) {
    console.error('[REQUEST_RESET_ERROR]', err);
    return res.status(500).json({ error: 'Erreur de réinitialisation.' });
  }
});

// 7. Réinitialisation effective du mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Jeton valide et mot de passe d\'au moins 6 caractères requis.' });
    }

    const db = await getDb();
    const userRes = await db.query<UserRecord>(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()`,
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré.' });
    }

    const user = userRes.rows[0];
    const newHash = hashPassword(newPassword);

    await db.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL, updated_at = NOW()
       WHERE id = $2`,
      [newHash, user.id]
    );

    // Invalidate all active sessions for security
    await db.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);

    return res.json({ message: 'Mot de passe mis à jour avec succès. Veuillez vous reconnecter.' });
  } catch (err: any) {
    console.error('[RESET_PASSWORD_ERROR]', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe.' });
  }
});

// 8. Boîte aux lettres locale de test (simulée)
router.get('/dev-mailbox', (req, res) => {
  return res.json({
    description: 'Boîte aux lettres locale de test (simulée) — Fermes du Bélier',
    notice: 'Ce mécanisme transparent affiche les notifications d\'e-mails générées en local pour les tests automatisés et manuels.',
    messages: devMailbox
  });
});

export default router;
