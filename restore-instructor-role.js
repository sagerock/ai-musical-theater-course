#!/usr/bin/env node

/**
 * Instructor Role Restoration Script for AI Engagement Hub
 * 
 * This script restores instructor roles for users who may have lost them
 * when trying to join a course as a student. The issue has been fixed in
 * the main application, but this script serves as a backup solution.
 * 
 * Usage:
 *   node restore-instructor-role.js [userEmail] [courseCode]
 * 
 * Example:
 *   node restore-instructor-role.js instructor@university.edu MUSSP25001
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  setDoc,
  serverTimestamp 
} = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findUserByEmail(email) {
  console.log(`🔍 Looking for user with email: ${email}`);
  
  const usersQuery = query(
    collection(db, 'users'),
    where('email', '==', email)
  );
  
  const snapshot = await getDocs(usersQuery);
  
  if (snapshot.empty) {
    throw new Error(`User not found with email: ${email}`);
  }
  
  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
}

async function findCourseByCode(courseCode) {
  console.log(`🔍 Looking for course with code: ${courseCode}`);
  
  const coursesQuery = query(
    collection(db, 'courses'),
    where('accessCode', '==', courseCode.toUpperCase())
  );
  
  const snapshot = await getDocs(coursesQuery);
  
  if (snapshot.empty) {
    throw new Error(`Course not found with code: ${courseCode}`);
  }
  
  const courseDoc = snapshot.docs[0];
  return { id: courseDoc.id, ...courseDoc.data() };
}

async function updateCourseMemberCounts(courseId) {
  console.log(`📊 Updating member counts for course ${courseId}`);
  
  try {
    const membershipsQuery = query(
      collection(db, 'courseMemberships'),
      where('courseId', '==', courseId),
      where('status', '==', 'approved')
    );
    
    const snapshot = await getDocs(membershipsQuery);
    let instructorCount = 0;
    let studentCount = 0;
    
    snapshot.forEach((doc) => {
      const membership = doc.data();
      if (membership.role === 'instructor') {
        instructorCount++;
      } else if (membership.role === 'student') {
        studentCount++;
      }
    });
    
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      memberCount: instructorCount + studentCount,
      instructorCount,
      studentCount,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Course member counts updated: ${instructorCount} instructors, ${studentCount} students`);
  } catch (error) {
    console.error('❌ Error updating course member counts:', error);
  }
}

async function restoreInstructorRole(userId, courseId, restoredBy = 'script') {
  console.log(`🔧 Restoring instructor role for user ${userId} in course ${courseId}`);
  
  try {
    const membershipId = `${userId}_${courseId}`;
    const membershipRef = doc(db, 'courseMemberships', membershipId);
    const membershipSnap = await getDoc(membershipRef);
    
    if (membershipSnap.exists()) {
      const currentData = membershipSnap.data();
      console.log('📋 Current membership:', {
        role: currentData.role,
        status: currentData.status
      });
      
      if (currentData.role === 'instructor' && currentData.status === 'approved') {
        console.log('✅ User is already an approved instructor in this course');
        return true;
      }
      
      // Special case: If user is pending student (lost instructor role issue)
      if (currentData.role === 'student' && currentData.status === 'pending') {
        console.log('🔧 Detected pending student enrollment - likely lost instructor role scenario');
        console.log('🔧 Converting pending student enrollment back to approved instructor');
      }
      
      // Update existing membership to instructor role
      await updateDoc(membershipRef, {
        role: 'instructor',
        status: 'approved',
        restoredBy: restoredBy,
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Existing membership updated to instructor role');
    } else {
      // Create new instructor membership
      const membershipDoc = {
        userId,
        courseId,
        role: 'instructor',
        status: 'approved',
        addedBy: restoredBy,
        restoredBy: restoredBy,
        joinedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(membershipRef, membershipDoc);
      console.log('✅ New instructor membership created');
    }
    
    // Update course member counts
    await updateCourseMemberCounts(courseId);
    
    return true;
  } catch (error) {
    console.error('❌ Error restoring instructor role:', error);
    throw error;
  }
}

async function main() {
  const [userEmail, courseCode] = process.argv.slice(2);
  
  if (!userEmail || !courseCode) {
    console.log(`
🔧 Instructor Role Restoration Script for AI Engagement Hub

BACKGROUND:
This issue has been FIXED in the main application! Instructors can no longer
accidentally lose their role when joining as students. This script is provided
as a backup solution for any existing cases.

USAGE:
  node restore-instructor-role.js [userEmail] [courseCode]

EXAMPLE:
  node restore-instructor-role.js instructor@university.edu MUSSP25001

ARGUMENTS:
  userEmail   - Email of the user whose instructor role needs to be restored
  courseCode  - Course access code (e.g., MUSSP25001)

ALTERNATIVE SOLUTION:
You can also use the Admin Panel in the web app:
1. Go to Admin Panel > User Management
2. Find the user who lost their instructor role
3. Click the green graduation cap icon next to their course membership
4. This will restore their instructor role

The web interface is recommended as it's easier and provides immediate feedback.
`);
    process.exit(1);
  }
  
  try {
    console.log('🚀 Starting instructor role restoration...');
    console.log(`   User: ${userEmail}`);
    console.log(`   Course: ${courseCode}`);
    console.log('');
    
    // Find user
    const user = await findUserByEmail(userEmail);
    console.log(`✅ Found user: ${user.name} (${user.id})`);
    
    // Find course
    const course = await findCourseByCode(courseCode);
    console.log(`✅ Found course: ${course.title} (${course.id})`);
    
    console.log('');
    
    // Restore instructor role
    await restoreInstructorRole(user.id, course.id, 'restore-script');
    
    console.log('');
    console.log('🎉 Instructor role restoration completed successfully!');
    console.log(`${user.name} is now an instructor in ${course.title}`);
    console.log('');
    console.log('💡 Note: This issue has been fixed in the main application.');
    console.log('   Instructors can no longer accidentally lose their role when joining courses.');
    
  } catch (error) {
    console.error('❌ Error during restoration:', error.message);
    console.log('');
    console.log('💡 Alternative: Use the Admin Panel in the web app to restore instructor roles.');
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}