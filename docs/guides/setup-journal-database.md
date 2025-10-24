# Journal Database Setup

## Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/create_journal_entries_table.sql`
4. Click **Run** to execute the SQL

## Option 2: Using Supabase CLI (if installed)

```bash
# Run the migration
supabase db push

# Or apply the specific migration file
supabase db reset
```

## Option 3: Manual Setup in Supabase Dashboard

1. Go to **Table Editor**
2. Click **Create a new table**
3. Table name: `journal_entries`
4. Add the following columns:

| Column Name | Type | Default Value | Constraints |
|-------------|------|---------------|-------------|
| id | text | gen_random_uuid()::text | Primary Key |
| user_id | uuid | - | Foreign Key (auth.users) |
| title | text | - | Not Null |
| content | text | - | Not Null |
| mood | text | - | Check constraint (see SQL file) |
| tags | text[] | {} | - |
| date | timestamptz | now() | Not Null |
| updated_at | timestamptz | now() | Not Null |
| weather | text | - | Optional |
| location | text | - | Optional |
| attachments | jsonb | [] | - |
| word_count | int4 | 0 | Not Null |
| reading_time | int4 | 0 | Not Null |
| is_private | bool | false | Not Null |
| is_favorite | bool | false | Not Null |
| created_at | timestamptz | now() | Not Null |

5. Enable Row Level Security (RLS)
6. Add the policies from the SQL file

## Testing

After setting up the database, the journal functionality should work with both:
- **Online mode**: Data saved to Supabase when connected
- **Offline mode**: Data saved locally and can be synced later

The app will automatically fall back to local storage if the database table doesn't exist or there are connection issues.