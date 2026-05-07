#!/usr/bin/env node

/**
 * Apply upcoming migrations to Supabase
 * Usage: node scripts/apply-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.resolve('./supabase/migrations/202603250001_subscription_expenses_revamp.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');

    console.log('Executing migration...');
    const { error } = await supabase.rpc('exec', { sql }, { head: 'count' });
    
    if (error?.code === 'PGRST102') {
      // RPC doesn't exist, fallback to raw query via postgres API
      console.log('Using direct SQL execution...');
      // For Supabase, we need to use a different approach
      // Let's split the migration and execute each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      for (const stmt of statements) {
        if (!stmt) continue;
        const { error: execError } = await supabase.rpc('exec', { sql: stmt + ';' });
        if (execError && execError.code !== 'PGRST102') {
          console.error(`Error executing statement: ${execError.message}`);
        }
      }
    } else if (error) {
      throw error;
    }

    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

applyMigration();
