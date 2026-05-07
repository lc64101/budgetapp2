# Apply Migration to Supabase

The table `subscription_catalog` doesn't exist yet. Here's how to create it:

## Option 1: Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/tnpimkypymukzgaiwtgm
2. Click **"SQL Editor"** on the left sidebar
3. Click **"New Query"**
4. Paste the entire contents of:
   ```
   supabase/migrations/202603250001_subscription_expenses_revamp.sql
   ```
5. Click **"Run"** (or Cmd+Enter)

Wait for the query to complete — you should see `183 rows inserted` at the bottom.

## Option 2: Via CLI (if you have it configured)

```bash
cd /home/liamc/projects/budgetapp2
supabase link --project-ref tnpimkypymukzgaiwtgm
supabase migration up
```

## Option 3: Direct psql (requires database password from Supabase)

1. Get your database password from Supabase Dashboard → Settings → Database
2. Run:
   ```bash
   psql postgresql://postgres:[PASSWORD]@db.tnpimkypymukzgaiwtgm.supabase.co:5432/postgres < supabase/migrations/202603250001_subscription_expenses_revamp.sql
   ```

Once applied, refresh your browser and try searching again!
