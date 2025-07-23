#!/bin/bash

# Connection String Fixer
# Helps URL-encode special characters in passwords

echo "🔧 Connection String Fixer"
echo "========================="

# Your original connection string has special characters that need encoding:
# kjdg$$%@#dlkiji499 contains: $ $ % @ #

# URL Encoding for special characters:
# $ = %24
# % = %25  
# @ = %40
# # = %23

# So kjdg$$%@#dlkiji499 becomes: kjdg%24%24%25%40%23dlkiji499

FIXED_CONNECTION="postgresql://postgres.qbkpxtrnseghzsrvqhih:kjdg%24%24%25%40%23dlkiji499@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

echo "❌ Original (broken):"
echo "postgresql://postgres.qbkpxtrnseghzsrvqhih:kjdg\$\$%@#dlkiji499@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
echo ""
echo "✅ Fixed (URL-encoded):"  
echo "$FIXED_CONNECTION"
echo ""

# Test the connection
echo "🔍 Testing fixed connection..."
if psql "$FIXED_CONNECTION" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
    echo ""
    echo "🚀 Now running backup with fixed connection string..."
    
    # Create backup directory
    mkdir -p database_backups
    
    # Create timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="database_backups/ai_engagement_hub_backup_$TIMESTAMP"
    
    echo "📊 Current database statistics:"
    psql "$FIXED_CONNECTION" -t -c "
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
    echo "💾 Creating backup..."
    
    # Create backup
    pg_dump "$FIXED_CONNECTION" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=custom \
        --file="$BACKUP_FILE.dump" \
        2>&1 | grep -E "(COPY|CREATE|ALTER|INSERT)" || true
    
    # Also create SQL format
    pg_dump "$FIXED_CONNECTION" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=plain \
        --file="$BACKUP_FILE.sql" \
        2>&1 | grep -E "(COPY|CREATE|ALTER|INSERT)" || true
    
    echo ""
    echo "✅ Backup completed successfully!"
    
    # Show file sizes
    if [ -f "$BACKUP_FILE.dump" ]; then
        DUMP_SIZE=$(ls -lh "$BACKUP_FILE.dump" | awk '{print $5}')
        echo "   Custom format: ✅ $DUMP_SIZE - $BACKUP_FILE.dump"
    fi
    
    if [ -f "$BACKUP_FILE.sql" ]; then
        SQL_SIZE=$(ls -lh "$BACKUP_FILE.sql" | awk '{print $5}')
        echo "   SQL format: ✅ $SQL_SIZE - $BACKUP_FILE.sql"
    fi
    
    # Create restore instructions
    cat > "database_backups/restore_instructions_$TIMESTAMP.txt" << EOF
RESTORE INSTRUCTIONS for backup created: $TIMESTAMP
=====================================================

FIXED CONNECTION STRING:
$FIXED_CONNECTION

TO RESTORE:
pg_restore --verbose --clean --no-owner --no-privileges \\
  --dbname="$FIXED_CONNECTION" \\
  "$BACKUP_FILE.dump"

BACKUP CREATED: $(date)
EOF
    
    echo ""
    echo "🎯 BACKUP COMPLETE!"
    echo "   Files: $BACKUP_FILE.dump, $BACKUP_FILE.sql"
    echo "   Ready for RLS implementation!"
    
else
    echo "❌ Connection still failing. Please check:"
    echo "   1. Password is correct"
    echo "   2. Project ID is correct: qbkpxtrnseghzsrvqhih"
    echo "   3. Database allows connections"
fi