import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { runSaasIsolationTests } from '../../tests/saas-isolation.test';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = await db.query('SELECT 1 as is_healthy, NOW() as current_time');
    
    return res.json({
      status: 'ok',
      service: 'fermes-du-belier-saas-api',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        isPgPool: db.isPgPool,
        dbTime: result.rows[0]?.current_time
      },
      version: '1.0.0'
    });
  } catch (error: any) {
    console.error('[HEALTH_CHECK_ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

router.post('/tests/saas-isolation', async (req: Request, res: Response) => {
  try {
    const result = await runSaasIsolationTests();
    return res.json(result);
  } catch (error: any) {
    console.error('[SAAS_TESTS_ENDPOINT_ERROR]', error);
    return res.status(500).json({
      passed: false,
      error: error.message,
      results: []
    });
  }
});

export default router;
