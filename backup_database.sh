#!/bin/bash

# AI Engagement Hub Database Backup Script
# Run this before implementing RLS policies

set -e  # Exit on any error

echo "🔒 AI Engagement Hub - Database Backup Script"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found. Please install PostgreSQL client tools:${NC}"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Prompt for connection string if not provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}📝 Please provide your Supabase connection string:${NC}"
    echo "   Get it from: Supabase Dashboard → Settings → Database"
    echo "   Format: postgresql://postgres.[PROJECT]:PASSWORD@HOST:PORT/postgres"
    echo ""
    read -p "Connection string: " CONNECTION_STRING
else
    CONNECTION_STRING=$1
fi

# Validate connection string format
if [[ ! $CONNECTION_STRING =~ ^postgresql:// ]]; then
    echo -e "${RED}❌ Invalid connection string format${NC}"
    exit 1
fi

# Create timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="database_backups"
BACKUP_FILE="$BACKUP_DIR/ai_engagement_hub_backup_$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo ""
echo -e "${BLUE}🚀 Starting database backup...${NC}"
echo "   Timestamp: $TIMESTAMP"
echo "   Backup location: $BACKUP_FILE"
echo ""

# Test connection first
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if ! psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to database. Check your connection string.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"

# Get table counts before backup
echo ""
echo -e "${BLUE}📊 Current database statistics:${NC}"
psql "$CONNECTION_STRING" -t -c "
SELECT 
    '   Users: ' || count(*) as stat FROM users
    UNION ALL
SELECT 
    '   Chats: ' || count(*) as stat FROM chats
    UNION ALL
SELECT 
    '   Projects: ' || count(*) as stat FROM projects
    UNION ALL
SELECT 
    '   PDF Attachments: ' || count(*) as stat FROM pdf_attachments
    UNION ALL  
SELECT 
    '   Course Memberships: ' || count(*) as stat FROM course_memberships
    UNION ALL
SELECT 
    '   Instructor Notes: ' || count(*) as stat FROM instructor_notes;
"

echo ""
echo -e "${BLUE}💾 Creating database backup...${NC}"

# Create custom format backup (recommended for large databases)
pg_dump "$CONNECTION_STRING" \
    --verbose \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="$BACKUP_FILE.dump" \
    2>&1 | grep -E "(COPY|CREATE|ALTER|INSERT)" || true

# Also create a plain SQL backup (human readable)
pg_dump "$CONNECTION_STRING" \
    --verbose \
    --no-owner \
    --no-privileges \
    --format=plain \
    --file="$BACKUP_FILE.sql" \
    2>&1 | grep -E "(COPY|CREATE|ALTER|INSERT)" || true

echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"

# Verify backup files
echo ""
echo -e "${BLUE}🔍 Backup verification:${NC}"

if [ -f "$BACKUP_FILE.dump" ]; then
    DUMP_SIZE=$(ls -lh "$BACKUP_FILE.dump" | awk '{print $5}')
    echo -e "   Custom format: ${GREEN}✅ $DUMP_SIZE${NC} - $BACKUP_FILE.dump"
else
    echo -e "   Custom format: ${RED}❌ Failed${NC}"
fi

if [ -f "$BACKUP_FILE.sql" ]; then
    SQL_SIZE=$(ls -lh "$BACKUP_FILE.sql" | awk '{print $5}')
    echo -e "   SQL format: ${GREEN}✅ $SQL_SIZE${NC} - $BACKUP_FILE.sql"
else
    echo -e "   SQL format: ${RED}❌ Failed${NC}"
fi

# Test backup integrity
echo ""
echo -e "${BLUE}🧪 Testing backup integrity...${NC}"
if pg_restore --list "$BACKUP_FILE.dump" > /dev/null 2>&1; then
    TABLE_COUNT=$(pg_restore --list "$BACKUP_FILE.dump" | grep -c "TABLE DATA")
    echo -e "   ${GREEN}✅ Backup is valid - Contains $TABLE_COUNT tables${NC}"
else
    echo -e "   ${RED}❌ Backup integrity check failed${NC}"
    exit 1
fi

# Create restore instructions
RESTORE_SCRIPT="$BACKUP_DIR/restore_instructions_$TIMESTAMP.txt"
cat > "$RESTORE_SCRIPT" << EOF
RESTORE INSTRUCTIONS for backup created: $TIMESTAMP
=====================================================

CONNECTION STRING (keep secure):
$CONNECTION_STRING

TO RESTORE CUSTOM FORMAT (.dump file):
pg_restore --verbose --clean --no-owner --no-privileges \\
  --dbname="$CONNECTION_STRING" \\
  "$BACKUP_FILE.dump"

TO RESTORE SQL FORMAT (.sql file):  
psql "$CONNECTION_STRING" < "$BACKUP_FILE.sql"

EMERGENCY ROLLBACK:
If RLS policies cause issues, run:
psql "$CONNECTION_STRING" -f emergency_rollback_rls.sql
Then restore from backup using commands above.

BACKUP CREATED: $(date)
BACKUP SIZE: Custom=$DUMP_SIZE, SQL=$SQL_SIZE
EOF

echo ""
echo -e "${GREEN}🎯 BACKUP COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}📋 Files created:${NC}"
echo "   • $BACKUP_FILE.dump (binary format)"
echo "   • $BACKUP_FILE.sql (readable SQL)"  
echo "   • $RESTORE_SCRIPT"
echo ""
echo -e "${GREEN}✅ You're now ready to implement RLS policies safely!${NC}"
echo ""
echo -e "${YELLOW}📚 Next steps:${NC}"
echo "   1. Review the backup files and restore instructions"
echo "   2. Run the RLS implementation: psql \"\$CONNECTION\" -f implement_privacy_rls.sql"
echo "   3. Test with: psql \"\$CONNECTION\" -f test_rls_policies.sql"
echo "   4. If issues occur: Use emergency_rollback_rls.sql"
echo ""
echo -e "${BLUE}💾 Backup location: $BACKUP_DIR/${NC}"
ls -la $BACKUP_DIR/

echo ""
echo -e "${GREEN}🔒 Your data is safely backed up! Proceed with confidence.${NC}"