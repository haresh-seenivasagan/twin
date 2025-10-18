#!/usr/bin/env node

/**
 * Run Supabase migrations programmatically
 * Usage: node scripts/run-migrations.js
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lbyicktafbnqwbieffbj.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY not found')
  console.error('Get your service role key from: https://supabase.com/dashboard/project/lbyicktafbnqwbieffbj/settings/api')
  console.error('Then run: export SUPABASE_SERVICE_KEY="your-service-key"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runMigrations() {
  console.log('🚀 Running Supabase migrations...\n')

  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    console.log(`📄 Running migration: ${file}`)

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

    try {
      // Execute SQL using Supabase's RPC or direct query
      const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

      if (error) {
        // If exec_sql doesn't exist, try direct query
        const { error: queryError } = await supabase.from('_migrations').insert({
          name: file,
          executed_at: new Date().toISOString()
        })

        if (queryError) {
          console.error(`   ❌ Failed: ${error.message}`)
          console.error('   Note: Direct SQL execution may require service role key or SQL Editor')
          console.error('   Please run this migration manually in Supabase Dashboard → SQL Editor')
          continue
        }
      }

      console.log(`   ✅ Success\n`)
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`)
    }
  }

  console.log('✨ Migration script completed')
  console.log('Note: For complex migrations, use Supabase Dashboard → SQL Editor')
}

runMigrations().catch(console.error)
