/**
 * Database schema migrations for Fermes du Bélier SaaS
 * Applies idempotent table creations, foreign keys, and indexes
 */

import { DbClient } from './db';

export async function runMigrations(db: DbClient): Promise<void> {
  console.log('[Migrations] Running SaaS database schema migrations...');

  await db.exec(`
    -- 1. Users table
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token VARCHAR(255),
      reset_token VARCHAR(255),
      reset_token_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- 2. Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    -- 3. Organizations table
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      owner_id VARCHAR(64) NOT NULL REFERENCES users(id),
      settings_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);

    -- 4. Organization Memberships & Roles
    CREATE TABLE IF NOT EXISTS organization_members (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(32) NOT NULL DEFAULT 'operator',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

    -- 5. Farms table
    CREATE TABLE IF NOT EXISTS farms (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      surface_m2 NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_farms_org ON farms(organization_id);

    -- 6. Buildings table
    CREATE TABLE IF NOT EXISTS buildings (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      farm_id VARCHAR(64) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      capacity INTEGER DEFAULT 1000,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_buildings_farm ON buildings(farm_id);
    CREATE INDEX IF NOT EXISTS idx_buildings_org ON buildings(organization_id);

    -- 7. Batches table (strictly scoped to organization and farm)
    CREATE TABLE IF NOT EXISTS batches (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      farm_id VARCHAR(64) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
      building_id VARCHAR(64) REFERENCES buildings(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      initial_size INTEGER NOT NULL CHECK (initial_size > 0),
      start_date DATE NOT NULL,
      reception_age_days INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      target_weight_min_grams NUMERIC(10,2) DEFAULT 2100,
      target_weight_max_grams NUMERIC(10,2) DEFAULT 2200,
      target_age_days INTEGER DEFAULT 35,
      notes TEXT,
      data_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_batches_org ON batches(organization_id);
    CREATE INDEX IF NOT EXISTS idx_batches_farm ON batches(farm_id);

    -- 8. Essential Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(64) NOT NULL,
      entity_type VARCHAR(64) NOT NULL,
      entity_id VARCHAR(64),
      details_json TEXT,
      ip_address VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_org_date ON audit_logs(organization_id, created_at DESC);
  `);

  console.log('[Migrations] Schema migrations applied successfully.');
}
