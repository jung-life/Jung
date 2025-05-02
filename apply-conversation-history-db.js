// apply-conversation-history-db.js
// Script to apply the conversation history database migration

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the migration file
const migrationFile = path.join(__dirname, 'supabase/migrations/20250430081600_add_conversation_history_and_insights.sql');

// Check if the migration file exists
if (!fs.existsSync(migrationFile)) {
  console.error(`Migration file not found: ${migrationFile}`);
  process.exit(1);
}

console.log('Applying conversation history database migration...');

try {
  // Read the migration file
  const migrationSql = fs.readFileSync(migrationFile, 'utf8');
  
  // Create a temporary file with the SQL commands
  const tempFile = path.join(__dirname, 'temp_migration.sql');
  fs.writeFileSync(tempFile, migrationSql);
  
  // Execute the SQL file using the Supabase CLI or psql
  // Note: This assumes either the Supabase CLI is installed and configured
  // or psql is available and configured to connect to your Supabase database
  console.log('Executing SQL migration...');
  try {
    // Try using Supabase CLI with the correct syntax
    execSync(`supabase db execute < ${tempFile}`, { stdio: 'inherit' });
  } catch (error) {
    console.log('Supabase CLI command failed, trying alternative method...');
    
    // Alternative: Use psql if available
    // You'll need to replace these with your actual connection details
    const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
    
    try {
      execSync(`psql "${SUPABASE_DB_URL}" < ${tempFile}`, { stdio: 'inherit' });
    } catch (psqlError) {
      console.error('Failed to execute using psql:', psqlError.message);
      console.error('Please manually apply the migration using your preferred database tool.');
      console.error(`The migration file is located at: ${migrationFile}`);
      throw new Error('Migration failed');
    }
  }
  
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  
  console.log('Migration applied successfully!');
  console.log('New tables created:');
  console.log('- conversation_history: Stores saved conversation history');
  console.log('- conversation_insights: Stores conversation analysis and insights');
  
} catch (error) {
  console.error('Error applying migration:', error.message);
  process.exit(1);
}
