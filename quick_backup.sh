#!/bin/bash

# Quick Backup - Replace CONNECTION_STRING below with your actual connection string
# Get it from: Supabase Dashboard → Settings → Database

echo "🔒 Quick Database Backup"
echo "======================="

# REPLACE THIS WITH YOUR ACTUAL CONNECTION STRING:
CONNECTION_STRING="postgresql://postgres.qbkpxtrnseghzsrvqhih:kjdg$$%@#dlkiji499@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Check if connection string was updated
if [[ $CONNECTION_STRING == *"[YOUR_PROJECT]"* ]]; then
    echo "❌ Please edit this file and replace CONNECTION_STRING with your actual Supabase connection string"
    echo "   Get it from: Supabase Dashboard → Settings → Database"
    exit 1
fi

# Create backup directory
mkdir -p database_backups

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Creating backup: ai_engagement_hub_backup_$TIMESTAMP"

# Create backup
pg_dump "$CONNECTION_STRING" \
    --verbose \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="database_backups/ai_engagement_hub_backup_$TIMESTAMP.dump"

echo "✅ Backup completed: database_backups/ai_engagement_hub_backup_$TIMESTAMP.dump"
echo ""
echo "🎯 You're ready to implement RLS policies!"