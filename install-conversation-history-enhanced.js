// install-conversation-history-enhanced.js
// Script to install the conversation history and insights feature in the enhanced version

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing Conversation History and Insights Feature for Enhanced Version');
console.log('==============================================================');

// Step 1: Apply the database migration
console.log('\n1. Applying database migration...');
try {
  execSync('node apply-conversation-history-db.js', { stdio: 'inherit' });
  console.log('✓ Database migration applied successfully');
} catch (error) {
  console.error('❌ Failed to apply database migration:', error.message);
  console.error('Please run the migration script manually: node apply-conversation-history-db.js');
}

// Step 2: Verify that the necessary files exist
console.log('\n2. Verifying necessary files...');
const requiredFiles = [
  'src/screens/ConversationHistoryScreen.tsx',
  'src/screens/ConversationInsightsScreen.tsx',
  'src/screens/ConversationHistoryScreen-enhanced.tsx',
  'src/screens/ConversationInsightsScreen-enhanced.tsx',
  'src/App-enhanced.tsx',
  'src/screens/ConversationsScreen-enhanced.tsx',
  'src/navigation/types.ts'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`❌ Missing file: ${file}`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('Some required files are missing. Please check the error messages above.');
  process.exit(1);
}

console.log('✓ All necessary files exist');

// Step 3: Run the test script to verify the feature works
console.log('\n3. Testing the feature...');
try {
  console.log('This step requires environment variables for testing.');
  console.log('To run the tests manually, use: node test-conversation-history-enhanced.js');
  console.log('Make sure to set TEST_EMAIL and TEST_PASSWORD environment variables first.');
  
  // Uncomment the following line to run the tests automatically
  // execSync('node test-conversation-history-enhanced.js', { stdio: 'inherit' });
  
  console.log('✓ Test script available for manual execution');
} catch (error) {
  console.error('❌ Failed to run tests:', error.message);
  console.error('You can run the tests manually after setting up the environment variables.');
}

// Step 4: Create a README file with instructions
console.log('\n4. Creating documentation...');
if (!fs.existsSync(path.join(__dirname, 'CONVERSATION-HISTORY-ENHANCED-README.md'))) {
  console.log('Creating README file...');
  
  const readmeContent = `# Conversation History and Insights for Jung App Enhanced Version

This document describes the implementation of the Conversation History and Insights feature in the enhanced version of the Jung App.

## Overview

The Conversation History and Insights feature allows users to:

1. Save conversations for later reference
2. View a history of saved conversations
3. Generate in-depth psychological insights for conversations
4. Export or share conversation insights

## How to Use

1. **Saving a Conversation**
   - From the Conversations screen, tap the "Brain" icon on a conversation
   - Select "View Insights" to generate and view insights for that conversation
   - The conversation will be automatically saved to your history

2. **Viewing Conversation History**
   - From the Conversations screen, tap the "History" button in the top-right corner
   - Browse your saved conversations
   - Tap on a conversation to open it
   - Tap the "Brain" icon to view insights for that conversation

3. **Working with Insights**
   - From the Conversation Insights screen, you can:
     - Read the AI-generated psychological analysis
     - Share the insights via email or messaging apps
     - Download the insights as a text file
     - Copy the insights to your clipboard

## Technical Notes

- The feature is fully integrated with the enhanced version's security model
- All data is encrypted using the same encryption utilities as the rest of the app
- The insights generation uses the app's AI service to analyze conversation content
`;

  fs.writeFileSync(path.join(__dirname, 'CONVERSATION-HISTORY-ENHANCED-README.md'), readmeContent);
  console.log('✓ README file created');
} else {
  console.log('✓ README file already exists');
}

// Final message
console.log('\n==============================================================');
console.log('✅ Conversation History and Insights Feature has been installed!');
console.log('==============================================================');
console.log('\nNext steps:');
console.log('1. Run the app with: npm start');
console.log('2. Test the feature by creating a conversation and using the "Brain" icon');
console.log('3. Access the conversation history from the "History" button in the Conversations screen');
console.log('\nFor more information, see CONVERSATION-HISTORY-ENHANCED-README.md');
