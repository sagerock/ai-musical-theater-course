#!/usr/bin/env node

/**
 * Firebase Migration Script
 * Migrates data from Supabase to Firebase/Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, writeBatch } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Supabase config
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔥🔄 Starting Firebase Migration...');
console.log('Firebase Project:', firebaseConfig.projectId);
console.log('Supabase URL:', supabaseUrl);

// Initialize clients
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const supabase = createClient(supabaseUrl, supabaseKey);

// Migration functions
async function migrateUsers() {
  console.log('👥 Migrating users...');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*');
    
  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }
  
  console.log(`📊 Found ${users.length} users to migrate`);
  
  const batch = writeBatch(db);
  
  for (const user of users) {
    const userDoc = doc(db, 'users', user.id);
    batch.set(userDoc, {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role || 'student',
      isGlobalAdmin: user.is_global_admin || false,
      emailNotificationsEnabled: user.email_notifications_enabled ?? true,
      instructorNoteEmails: user.instructor_note_emails ?? true,
      newProjectEmails: user.new_project_emails ?? true,
      weeklyReminderEmails: user.weekly_summary_emails ?? true,
      systemUpdateEmails: user.system_update_emails ?? true,
      createdAt: user.created_at ? new Date(user.created_at) : new Date(),
      updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
    });
  }
  
  await batch.commit();
  console.log('✅ Users migrated successfully');
}

async function migrateCourses() {
  console.log('📚 Migrating courses...');
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*');
    
  if (error) {
    console.error('❌ Error fetching courses:', error);
    return;
  }
  
  console.log(`📊 Found ${courses.length} courses to migrate`);
  
  const batch = writeBatch(db);
  
  for (const course of courses) {
    const courseDoc = doc(db, 'courses', course.id);
    batch.set(courseDoc, {
      id: course.id,
      name: course.name,
      description: course.description,
      accessCode: course.access_code,
      instructorId: course.instructor_id,
      createdAt: course.created_at ? new Date(course.created_at) : new Date(),
      updatedAt: course.updated_at ? new Date(course.updated_at) : new Date()
    });
  }
  
  await batch.commit();
  console.log('✅ Courses migrated successfully');
}

async function migrateCourseMemberships() {
  console.log('👨‍🎓 Migrating course memberships...');
  
  const { data: memberships, error } = await supabase
    .from('course_memberships')
    .select('*');
    
  if (error) {
    console.error('❌ Error fetching course memberships:', error);
    return;
  }
  
  console.log(`📊 Found ${memberships.length} memberships to migrate`);
  
  const batch = writeBatch(db);
  
  for (const membership of memberships) {
    // Create composite ID: userId_courseId
    const membershipId = `${membership.user_id}_${membership.course_id}`;
    const membershipDoc = doc(db, 'courseMemberships', membershipId);
    
    batch.set(membershipDoc, {
      userId: membership.user_id,
      courseId: membership.course_id,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joined_at ? new Date(membership.joined_at) : new Date(),
      createdAt: membership.created_at ? new Date(membership.created_at) : new Date()
    });
  }
  
  await batch.commit();
  console.log('✅ Course memberships migrated successfully');
}

async function migrateProjects() {
  console.log('📁 Migrating projects...');
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*');
    
  if (error) {
    console.error('❌ Error fetching projects:', error);
    return;
  }
  
  console.log(`📊 Found ${projects.length} projects to migrate`);
  
  const batch = writeBatch(db);
  
  for (const project of projects) {
    const projectDoc = doc(db, 'projects', project.id);
    batch.set(projectDoc, {
      id: project.id,
      title: project.title,
      description: project.description,
      createdBy: project.created_by,
      courseId: project.course_id,
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date()
    });
  }
  
  await batch.commit();
  console.log('✅ Projects migrated successfully');
}

async function migrateChats() {
  console.log('💬 Migrating chats...');
  
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('❌ Error fetching chats:', error);
    return;
  }
  
  console.log(`📊 Found ${chats.length} chats to migrate`);
  
  // Process in batches of 500 (Firestore batch limit)
  const batchSize = 500;
  for (let i = 0; i < chats.length; i += batchSize) {
    const batch = writeBatch(db);
    const chatBatch = chats.slice(i, i + batchSize);
    
    for (const chat of chatBatch) {
      const chatDoc = doc(db, 'chats', chat.id);
      batch.set(chatDoc, {
        id: chat.id,
        userId: chat.user_id,
        projectId: chat.project_id,
        courseId: chat.course_id,
        prompt: chat.prompt,
        response: chat.response,
        toolUsed: chat.tool_used,
        title: chat.title,
        createdAt: chat.created_at ? new Date(chat.created_at) : new Date(),
        updatedAt: chat.updated_at ? new Date(chat.updated_at) : new Date()
      });
    }
    
    await batch.commit();
    console.log(`✅ Migrated chat batch ${i + 1}-${Math.min(i + batchSize, chats.length)} of ${chats.length}`);
  }
  
  console.log('✅ Chats migrated successfully');
}

async function migrateTags() {
  console.log('🏷️ Migrating tags...');
  
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*');
    
  if (error) {
    console.error('❌ Error fetching tags:', error);
    return;
  }
  
  console.log(`📊 Found ${tags.length} tags to migrate`);
  
  const batch = writeBatch(db);
  
  for (const tag of tags) {
    const tagDoc = doc(db, 'tags', tag.id);
    batch.set(tagDoc, {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      color: tag.color,
      courseId: tag.course_id,
      createdBy: tag.created_by,
      createdAt: tag.created_at ? new Date(tag.created_at) : new Date()
    });
  }
  
  await batch.commit();
  console.log('✅ Tags migrated successfully');
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting data migration...\n');
    
    await migrateUsers();
    console.log('');
    
    await migrateCourses();
    console.log('');
    
    await migrateCourseMemberships();
    console.log('');
    
    await migrateProjects();
    console.log('');
    
    await migrateChats();
    console.log('');
    
    await migrateTags();
    console.log('');
    
    console.log('🎉 Migration completed successfully!');
    console.log('🔥 Your data is now in Firebase/Firestore');
    console.log('📋 Next steps:');
    console.log('   1. Deploy security rules to Firebase');
    console.log('   2. Test application with new Firebase backend');
    console.log('   3. Update any remaining Supabase references');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };