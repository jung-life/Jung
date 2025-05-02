# Conversation History and Insights Feature

This document provides an overview of the new Conversation History and Insights feature added to the Jung App.

## Overview

The Conversation History and Insights feature allows users to:

1. Save conversations for later viewing
2. View a history of saved conversations
3. Generate psychological insights from conversations
4. Export, download, or share conversation insights

## Database Changes

Two new tables have been added to the database:

1. `conversation_history` - Stores saved conversations
2. `conversation_insights` - Stores analysis and insights for conversations

To apply these database changes, run:

```bash
node apply-conversation-history-db.js
```

The script will attempt to apply the migration using either the Supabase CLI or psql, depending on what's available on your system. If both methods fail, you can manually apply the migration using your preferred database tool. The migration file is located at `supabase/migrations/20250430081600_add_conversation_history_and_insights.sql`.

## New Screens

### Conversation History Screen

The Conversation History screen displays a list of saved conversations. Users can:

- View saved conversations
- Delete conversations from history
- Open a conversation to view its contents
- Generate insights for a conversation

To access the Conversation History screen, tap the "History" button in the top-right corner of the Conversations screen.

### Conversation Insights Screen

The Conversation Insights screen displays psychological analysis and insights for a specific conversation. Users can:

- View AI-generated insights
- Copy insights to clipboard
- Share insights with others
- Download insights as a text file
- Regenerate insights

To access the Conversation Insights screen, tap the brain icon next to a conversation in the Conversation History screen.

## How to Use

### Saving a Conversation

1. Open a conversation in the Chat screen
2. Tap the book icon in the top-right corner
3. The conversation will be saved to your history

### Viewing Conversation History

1. Go to the Conversations screen
2. Tap the "History" button in the top-right corner
3. Browse your saved conversations

### Generating Insights

1. Open a conversation in the Chat screen
2. Tap the brain icon in the top-right corner
3. View the generated insights
4. Use the buttons at the bottom to copy, share, or download the insights

### Exporting Insights

1. Generate insights for a conversation
2. Tap the "Share" button to share via your device's share options
3. Tap the "Copy" button to copy to clipboard
4. Tap the "Download" button to save as a text file

## Implementation Details

The feature is implemented using:

- React Native for the UI components
- Supabase for database storage
- Encryption for secure storage of conversation content
- AI-powered analysis for generating insights

## Troubleshooting

If you encounter issues with the Conversation History and Insights feature:

1. Ensure the database migration has been applied
2. Check that you're logged in with a valid user account
3. Verify that conversations have content before attempting to generate insights
4. If sharing or downloading fails, check your device's permissions

For persistent issues, please contact support.
