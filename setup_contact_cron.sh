#!/bin/bash
# Setup cron job for contact request notifications

echo "Setting up cron job for contact request notifications..."

# Get the current directory (project root)
PROJECT_DIR="/Volumes/T7/Scripts/AI Engagment Hub"

# Create cron job entry
CRON_JOB="*/5 * * * * cd \"$PROJECT_DIR\" && /usr/local/bin/node send_contact_notifications.js >> contact_notifications.log 2>&1"

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job installed! Contact notifications will check every 5 minutes."
echo "📋 To view the cron job: crontab -l"
echo "📝 To view logs: tail -f contact_notifications.log"
echo "❌ To remove: crontab -e (then delete the line)"