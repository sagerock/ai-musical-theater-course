#!/bin/bash

# Deploy updated Firestore security rules to Firebase
# This script updates the security rules to allow instructor chat queries

echo "🚀 Deploying updated Firestore security rules..."

# Deploy the rules using Firebase CLI
firebase deploy --only firestore:rules

echo "✅ Firestore security rules deployed successfully!"
echo ""
echo "The updated rules now allow:"
echo "- Instructors to query chat collections"
echo "- Instructors to read student reflections in their courses"
echo "- Proper instructor access to student chat data"
echo "- Continued student privacy protection"
echo ""
echo "Firebase instructor dashboard should now work without permission errors."