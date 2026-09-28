/**
 * Database abstraction layer for Fermes du Bélier SaaS
 * Supports PostgreSQL via standard `pg.Pool` or embedded `@electric-sql/pglite`
 * Provides uniform `query(sql, params)` interface with transactions
 */

import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  isPgPool: boolean;
}

let dbInstance: DbClient | null = null;

export async function getDb(dataDirOverride?: string): Promise<DbClient> {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim().startsWith('postgres')) {
    console.log('[DB] Connecting to PostgreSQL via pg.Pool...');
    const pool = new pg.Pool({ connectionString: databaseUrl });
    
    dbInstance = {
      isPgPool: true,
      async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
        const res = await pool.query(sql, params);
        return {
          rows: res.rows as T[],
          rowCount: res.rowCount ?? res.rows.length
        };
      },
      async exec(sql: string): Promise<void> {
        await pool.query(sql);
      },
      async close() {
        await pool.end();
        dbInstance = null;
      }
    };
    return dbInstance;
  }

  // Embedded PostgreSQL engine (reproducible, zero-dependency)
  const dbPath = dataDirOverride || process.env.PGLITE_DIR || path.resolve(process.cwd(), 'data', 'belier_db');
  
  if (dbPath !== ':memory:') {
    const parentDir = path.dirname(dbPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
  }

  console.log(`[DB] Initializing embedded PostgreSQL engine at: ${dbPath}`);
  const pglite = new PGlite(dbPath === ':memory:' ? undefined : dbPath);
  await pglite.waitReady;

  dbInstance = {
    isPgPool: false,
    async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
      const res = await pglite.query(sql, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rows ? res.rows.length : 0
      };
    },
    async exec(sql: string): Promise<void> {
      await pglite.exec(sql);
    },
    async close() {
      await pglite.close();
      dbInstance = null;
    }
  };

  return dbInstance;
}

export async function resetDbForTesting(): Promise<DbClient> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
  return getDb(':memory:');
}
