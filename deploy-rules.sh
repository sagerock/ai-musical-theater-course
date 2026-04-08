#!/bin/bash
set -euo pipefail

# Firebase Security Rules Deployment Script
# This deploys ONLY the security rules (not the app) for testing

echo "🔐 Deploying Firebase Security Rules for Testing..."

# Deploy Firestore rules
echo "📄 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules  
echo "💾 Deploying Storage rules..."
firebase deploy --only storage

echo "✅ Security rules deployed successfully!"
echo ""
echo "🧪 Testing Options:"
echo "1. Run automated tests: npm run test:rules"
echo "2. Follow manual testing checklist: manual-security-test-checklist.md"
echo "3. Check Firebase Console for any rule deployment errors"
echo ""
echo "⚠️  Important: Test thoroughly before deploying your app!"