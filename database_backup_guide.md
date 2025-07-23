# Supabase Database Backup Guide

## 🎯 Why Backup Before RLS Changes?
- RLS policies can potentially lock you out of data
- Policy conflicts might require complete rollback
- Schema changes could affect existing data access
- Testing might require multiple restore attempts

## 📋 Backup Options (Choose One)

### Option 1: Supabase Dashboard Backup (Easiest)
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Click **Database Backups** 
4. Click **Create Backup** (if available on your plan)
5. Wait for backup completion
6. Note the backup timestamp/name

**Pros**: Simple, one-click process
**Cons**: May not be available on free tier, limited restore options

### Option 2: SQL Dump via CLI (Most Complete) ⭐ RECOMMENDED
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Get your database connection details from Supabase Dashboard
# Settings → Database → Connection string

# Create full database dump
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --verbose \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file=ai_engagement_hub_backup_$(date +%Y%m%d_%H%M%S).dump

# Alternative: Plain SQL format (more readable)
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  --verbose \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file=ai_engagement_hub_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Option 3: Table-Specific Backup (Selective)
```sql
-- Connect to your Supabase database and run:

-- Backup critical tables
COPY users TO '/tmp/users_backup.csv' WITH (FORMAT CSV, HEADER);
COPY chats TO '/tmp/chats_backup.csv' WITH (FORMAT CSV, HEADER);
COPY pdf_attachments TO '/tmp/pdf_attachments_backup.csv' WITH (FORMAT CSV, HEADER);
COPY projects TO '/tmp/projects_backup.csv' WITH (FORMAT CSV, HEADER);
COPY course_memberships TO '/tmp/course_memberships_backup.csv' WITH (FORMAT CSV, HEADER);
COPY instructor_notes TO '/tmp/instructor_notes_backup.csv' WITH (FORMAT CSV, HEADER);
```

### Option 4: API-Based Backup (Programmatic)
```javascript
// Create a backup script
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function backupTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) throw error;
  
  fs.writeFileSync(`backup_${tableName}_${Date.now()}.json`, JSON.stringify(data, null, 2));
  console.log(`✅ Backed up ${data.length} records from ${tableName}`);
}

async function backupDatabase() {
  const tables = ['users', 'chats', 'projects', 'pdf_attachments', 'course_memberships', 'instructor_notes'];
  
  for (const table of tables) {
    try {
      await backupTable(table);
    } catch (error) {
      console.error(`❌ Failed to backup ${table}:`, error);
    }
  }
}

backupDatabase();
```

## 🚀 Step-by-Step: Recommended CLI Backup

### Step 1: Get Connection Details
1. Go to Supabase Dashboard
2. **Settings** → **Database**  
3. Copy the connection string (looks like):
   ```
   postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

### Step 2: Install PostgreSQL Tools
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

### Step 3: Create Backup
```bash
# Replace [YOUR_CONNECTION_STRING] with your actual connection string
pg_dump "[YOUR_CONNECTION_STRING]" \
  --verbose \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file=ai_hub_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Step 4: Verify Backup
```bash
# Check file exists and has reasonable size
ls -lh *.dump

# Quick verification (optional)
pg_restore --list ai_hub_backup_*.dump | head -20
```

## 🔍 What Should Be Backed Up?

### Critical Tables (Must backup):
- `users` - User accounts and profiles
- `chats` - All AI interactions (most important!)
- `pdf_attachments` - Student uploaded documents
- `instructor_notes` - Private instructor notes
- `projects` - Student projects
- `course_memberships` - Course enrollment data

### Supporting Tables:
- `courses` - Course information
- `tags` - Tagging system
- `reflections` - Student reflections
- `chat_tags` - Tag relationships

### Schema Elements:
- Table structures
- Indexes
- Functions
- Triggers
- Current RLS policies (for reference)

## 🛡️ Backup Verification Checklist

- [ ] **File exists** and is not empty (should be several MB minimum)
- [ ] **Contains all tables** you expect
- [ ] **Record counts match** your expectations
- [ ] **Recent data included** (check timestamps)
- [ ] **Connection string works** (test restore on empty test database)

## 📦 Test Restore Process

Before implementing RLS, test your backup:

```bash
# Create test database (optional)
createdb ai_hub_test

# Test restore
pg_restore --verbose --clean --no-owner --no-privileges \
  --dbname=ai_hub_test ai_hub_backup_*.dump

# Verify data
psql ai_hub_test -c "SELECT count(*) FROM users;"
psql ai_hub_test -c "SELECT count(*) FROM chats;"
```

## 🚨 Emergency Restore Commands

If you need to restore after RLS issues:

```bash
# EMERGENCY: Restore from backup
pg_restore --verbose --clean --no-owner --no-privileges \
  --dbname="[YOUR_CONNECTION_STRING]" ai_hub_backup_*.dump

# Or for SQL format:
psql "[YOUR_CONNECTION_STRING]" < ai_hub_backup_*.sql
```

## 📝 Backup Best Practices

1. **Multiple backups** - Create 2-3 backups before major changes
2. **Test restores** - Verify backup works before proceeding  
3. **Document timing** - Note when backup was created vs. when changes are made
4. **Store safely** - Keep backups in multiple locations
5. **Automate** - Consider setting up regular automated backups

## 🎯 Ready to Proceed?

Once you have a verified backup:
1. ✅ Backup created and verified
2. ✅ Restore process tested
3. ✅ Emergency rollback plan ready
4. ✅ Team notified of maintenance window

Then you can safely proceed with RLS implementation!