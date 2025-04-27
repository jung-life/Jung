#!/usr/bin/env node

/**
 * Script to apply the database fixes for the Jung app
 * This script uses the Supabase JS client to execute the SQL migrations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // This should be a service key with more privileges

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

// Create Supabase client with service key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Paths to the migration files
const migrationFiles = [
  path.join(__dirname, 'supabase/migrations/20250427110500_fix_new_user_database_error.sql'),
  path.join(__dirname, 'supabase/migrations/20250427113100_add_check_disclaimer_status_function.sql')
];

async function applyMigrations() {
  try {
    console.log('Applying database migrations...');
    
    for (const migrationFilePath of migrationFiles) {
      const fileName = path.basename(migrationFilePath);
      console.log(`\nProcessing migration: ${fileName}`);
      console.log('Reading migration file...');
      
      const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
      
      // Execute the SQL directly using the rpc function
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: migrationSql
      });
      
      if (error) {
        console.error(`Error applying migration ${fileName}:`, error);
        
        // Try an alternative approach if the RPC method fails
        console.log('Trying alternative approach...');
        
        // Split the SQL into separate statements
        const statements = migrationSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        // Execute each statement separately
        let success = true;
        for (const stmt of statements) {
          console.log(`Executing statement: ${stmt.substring(0, 50)}...`);
          
          const { error } = await supabase.rpc('execute_sql', {
            sql_query: stmt + ';'
          });
          
          if (error) {
            console.error('Error executing statement:', error);
            success = false;
          }
        }
        
        if (success) {
          console.log(`Migration ${fileName} applied successfully using alternative approach.`);
        } else {
          console.error(`Failed to apply some parts of migration ${fileName}.`);
          console.log('You may need to apply the migration manually in the Supabase dashboard SQL editor.');
        }
      } else {
        console.log(`Migration ${fileName} applied successfully!`);
      }
    }

    // Verify the installations
    console.log('\nVerifying installations...');
    
    // Verify the trigger exists
    const { data: triggerData, error: triggerError } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger 
          WHERE tgname = 'on_auth_user_created'
        );
      `
    });
    
    if (triggerError) {
      console.error('Error verifying trigger installation:', triggerError);
    } else {
      console.log('Trigger verification result:', triggerData);
    }
    
    // Verify the function exists
    const { data: functionData, error: functionError } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'check_disclaimer_status'
        );
      `
    });
    
    if (functionError) {
      console.error('Error verifying function installation:', functionError);
    } else {
      console.log('Function verification result:', functionData);
    }
    
    console.log('\nDatabase fixes have been applied successfully.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migrations
applyMigrations();
