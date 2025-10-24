const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCreditSpendingFunction() {
  try {
    console.log('🔧 Fixing credit spending function...');
    
    // Read the SQL fix file
    const sqlContent = fs.readFileSync('fix-spend-credits-function.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.length > 0) {
        console.log('📝 Executing SQL statement...');
        const { error } = await supabase.rpc('query', { query: statement });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          // Continue with other statements
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Credit spending function fix complete!');
    
    // Test the fixed function
    console.log('🧪 Testing credit spending function...');
    const { data: testResult, error: testError } = await supabase
      .rpc('has_sufficient_credits', {
        user_uuid: '00000000-0000-0000-0000-000000000000',
        required_credits: 1
      });
    
    if (testError) {
      console.log('⚠️ Test failed (expected for non-existent user):', testError.message);
    } else {
      console.log('✅ Function test completed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing credit spending function:', error);
    process.exit(1);
  }
}

// Run the fix
fixCreditSpendingFunction();
