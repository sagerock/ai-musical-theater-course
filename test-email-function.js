// Test script for Cloud Function email notifications
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Initialize Firebase (using your project config)
const firebaseConfig = {
  // Your config here - check src/config/firebase.js
  projectId: "staging-intelligence-8c59c",
  // Add other config as needed
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testEmailFunction() {
  try {
    console.log('🧪 Testing sendCourseJoinNotifications Cloud Function...');
    
    const sendNotifications = httpsCallable(functions, 'sendCourseJoinNotifications');
    
    // Test with sample data
    const result = await sendNotifications({
      userId: 'test-user-id',
      courseId: 'test-course-id', 
      requestedRole: 'student'
    });
    
    console.log('✅ Function result:', result.data);
    
  } catch (error) {
    console.error('❌ Function test failed:', error);
  }
}

// Run the test
testEmailFunction();