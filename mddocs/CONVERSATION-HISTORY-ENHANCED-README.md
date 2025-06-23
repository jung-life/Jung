# Conversation History and Insights for Jung App Enhanced Version

This document describes the implementation of the Conversation History and Insights feature in the enhanced version of the Jung App.

## Overview

The Conversation History and Insights feature allows users to:

1. Save conversations for later reference
2. View a history of saved conversations
3. Generate in-depth psychological insights for conversations
4. Export or share conversation insights

## Database Schema

The feature uses two main tables:

1. `conversation_history` - Stores saved conversations
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `conversation_id`: UUID (references conversations)
   - `saved_at`: Timestamp
   - `title`: Text

2. `conversation_insights` - Stores AI-generated insights for conversations
   - `id`: UUID (primary key)
   - `user_id`: UUID (references auth.users)
   - `conversation_id`: UUID (references conversations)
   - `content`: Text (encrypted)
   - `created_at`: Timestamp
   - `title`: Text
   - `is_shared`: Boolean
   - `share_url`: Text

## Implementation Details

### Navigation

The feature is accessible through:
- A "History" button in the Conversations screen
- The "Brain" icon on each conversation item, which provides options to view insights

### Screens

1. **ConversationHistoryScreen**
   - Displays a list of saved conversations
   - Allows users to navigate to the original conversation
   - Provides options to delete saved conversations
   - Includes a button to view detailed insights for each conversation

2. **ConversationInsightsScreen**
   - Displays AI-generated psychological insights for a specific conversation
   - Provides options to:
     - Regenerate insights
     - Share insights via the device's share functionality
     - Download insights as a text file
     - Copy insights to clipboard

### Security

- All conversation content and insights are encrypted using the app's encryption utilities
- Row-level security policies ensure users can only access their own data

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

## Applying the Database Migration

To apply the necessary database migration for this feature:

1. Ensure you have the Supabase CLI installed and configured
2. Run the migration script:
   ```
   node apply-conversation-history-db.js
   ```

This will create the required tables and security policies in your Supabase database.

## Technical Notes

- The feature is fully integrated with the enhanced version's security model
- All data is encrypted using the same encryption utilities as the rest of the app
- The insights generation uses the app's AI service to analyze conversation content
- The feature respects user privacy and data ownership principles
