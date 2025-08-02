/**
 * Firebase Security Rules Testing
 * 
 * Install: npm install --save-dev @firebase/rules-unit-testing
 * Run: npm test
 * 
 * This tests the security rules without deploying them to production
 */

const { 
  initializeTestEnvironment,
  assertFails,
  assertSucceeds 
} = require('@firebase/rules-unit-testing');

const fs = require('fs');
const path = require('path');

let testEnv;

// Test data
const TEST_DATA = {
  users: {
    student1: { uid: 'student1', role: 'student', name: 'Alice Student', email: 'alice@student.com' },
    student2: { uid: 'student2', role: 'student', name: 'Bob Student', email: 'bob@student.com' },
    instructor1: { uid: 'instructor1', role: 'instructor', name: 'Carol Instructor', email: 'carol@instructor.com' },
    admin1: { uid: 'admin1', role: 'admin', name: 'David Admin', email: 'david@admin.com' }
  },
  courses: {
    course1: { id: 'course1', title: 'CS 101', accessCode: 'CS101', instructorId: 'instructor1' },
    course2: { id: 'course2', title: 'CS 102', accessCode: 'CS102', instructorId: 'instructor1' }
  },
  memberships: {
    student1_course1: { userId: 'student1', courseId: 'course1', role: 'student', status: 'approved' },
    instructor1_course1: { userId: 'instructor1', courseId: 'course1', role: 'instructor', status: 'approved' }
  },
  chats: {
    chat1: { id: 'chat1', userId: 'student1', courseId: 'course1', messages: [] },
    chat2: { id: 'chat2', userId: 'student2', courseId: 'course2', messages: [] }
  },
  projects: {
    project1: { id: 'project1', createdBy: 'student1', courseId: 'course1', title: 'My Project' }
  }
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ai-engagement-hub-test',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8'),
    },
    storage: {
      rules: fs.readFileSync(path.join(__dirname, 'storage.rules'), 'utf8'),
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

// Helper function to set up test data
async function setupTestData() {
  const adminDb = testEnv.authenticatedContext('admin1').firestore();
  
  // Add users
  for (const [id, user] of Object.entries(TEST_DATA.users)) {
    await adminDb.collection('users').doc(id).set(user);
  }
  
  // Add courses
  for (const [id, course] of Object.entries(TEST_DATA.courses)) {
    await adminDb.collection('courses').doc(id).set(course);
  }
  
  // Add memberships
  for (const [id, membership] of Object.entries(TEST_DATA.memberships)) {
    await adminDb.collection('courseMemberships').doc(id).set(membership);
  }
  
  // Add chats
  for (const [id, chat] of Object.entries(TEST_DATA.chats)) {
    await adminDb.collection('chats').doc(id).set(chat);
  }
  
  // Add projects
  for (const [id, project] of Object.entries(TEST_DATA.projects)) {
    await adminDb.collection('projects').doc(id).set(project);
  }
}

describe('Firebase Security Rules Tests', () => {
  
  describe('User Access Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Users can read their own profile', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(student1Db.collection('users').doc('student1').get());
    });

    test('Users cannot read other users profiles', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertFails(student1Db.collection('users').doc('student2').get());
    });

    test('Unauthenticated users cannot read any profiles', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('users').doc('student1').get());
    });
  });

  describe('Course Access Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Course members can read course info', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(student1Db.collection('courses').doc('course1').get());
    });

    test('Non-members can still read course info for joining', async () => {
      const student2Db = testEnv.authenticatedContext('student2').firestore();
      await assertSucceeds(student2Db.collection('courses').doc('course1').get());
    });

    test('Unauthenticated users cannot read course info', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('courses').doc('course1').get());
    });

    test('Students can query courses by accessCode', async () => {
      const student2Db = testEnv.authenticatedContext('student2').firestore();
      await assertSucceeds(
        student2Db.collection('courses').where('accessCode', '==', 'CS101').get()
      );
    });
  });

  describe('Chat Access Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Students can read their own chats', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(student1Db.collection('chats').doc('chat1').get());
    });

    test('Students cannot read other students chats', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertFails(student1Db.collection('chats').doc('chat2').get());
    });

    test('Instructors can read student chats in their courses', async () => {
      const instructorDb = testEnv.authenticatedContext('instructor1').firestore();
      await assertSucceeds(instructorDb.collection('chats').doc('chat1').get());
    });

    test('Students can create chats in their courses', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(
        student1Db.collection('chats').add({
          userId: 'student1',
          courseId: 'course1',
          messages: []
        })
      );
    });

    test('Students cannot create chats for other users', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertFails(
        student1Db.collection('chats').add({
          userId: 'student2', // Wrong user!
          courseId: 'course1',
          messages: []
        })
      );
    });
  });

  describe('Chat Tags Access Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Students can create tags for their own chats', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(
        student1Db.collection('chatTags').add({
          chatId: 'chat1',
          tagId: 'tag1'
        })
      );
    });

    test('Students cannot create tags for other students chats', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertFails(
        student1Db.collection('chatTags').add({
          chatId: 'chat2', // Chat belongs to student2
          tagId: 'tag1'
        })
      );
    });

    test('Instructors can create tags for student chats in their courses', async () => {
      const instructorDb = testEnv.authenticatedContext('instructor1').firestore();
      await assertSucceeds(
        instructorDb.collection('chatTags').add({
          chatId: 'chat1',
          tagId: 'tag1'
        })
      );
    });
  });

  describe('Project Access Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Students can read their own projects', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(student1Db.collection('projects').doc('project1').get());
    });

    test('Instructors can read student projects in their courses', async () => {
      const instructorDb = testEnv.authenticatedContext('instructor1').firestore();
      await assertSucceeds(instructorDb.collection('projects').doc('project1').get());
    });

    test('Students can create projects in their courses', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertSucceeds(
        student1Db.collection('projects').add({
          createdBy: 'student1',
          courseId: 'course1',
          title: 'New Project'
        })
      );
    });
  });

  describe('Course Membership Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Students can create pending membership requests', async () => {
      const student2Db = testEnv.authenticatedContext('student2').firestore();
      await assertSucceeds(
        student2Db.collection('courseMemberships').doc('student2_course1').set({
          userId: 'student2',
          courseId: 'course1',
          role: 'student',
          status: 'pending'
        })
      );
    });

    test('Students cannot create approved memberships', async () => {
      const student2Db = testEnv.authenticatedContext('student2').firestore();
      await assertFails(
        student2Db.collection('courseMemberships').doc('student2_course1').set({
          userId: 'student2',
          courseId: 'course1',
          role: 'student',
          status: 'approved' // Only instructors/admins can approve
        })
      );
    });

    test('Students cannot create memberships for other users', async () => {
      const student1Db = testEnv.authenticatedContext('student1').firestore();
      await assertFails(
        student1Db.collection('courseMemberships').doc('student2_course1').set({
          userId: 'student2', // Wrong user!
          courseId: 'course1',
          role: 'student',
          status: 'pending'
        })
      );
    });
  });

  describe('Admin Access Tests', () => {
    beforeEach(async () => {
      await setupTestData();
    });

    test('Admins can read any user profile', async () => {
      const adminDb = testEnv.authenticatedContext('admin1').firestore();
      await assertSucceeds(adminDb.collection('users').doc('student1').get());
      await assertSucceeds(adminDb.collection('users').doc('student2').get());
    });

    test('Admins can read any chat', async () => {
      const adminDb = testEnv.authenticatedContext('admin1').firestore();
      await assertSucceeds(adminDb.collection('chats').doc('chat1').get());
      await assertSucceeds(adminDb.collection('chats').doc('chat2').get());
    });

    test('Admins can modify course memberships', async () => {
      const adminDb = testEnv.authenticatedContext('admin1').firestore();
      await assertSucceeds(
        adminDb.collection('courseMemberships').doc('student1_course1').update({
          status: 'approved'
        })
      );
    });
  });
});

describe('Storage Security Rules Tests', () => {
  
  describe('PDF Upload Tests', () => {
    test('Users can upload PDFs to their own folder', async () => {
      const student1Storage = testEnv.authenticatedContext('student1').storage();
      await assertSucceeds(
        student1Storage.ref('pdf-uploads/student1/chat1/document.pdf').put(Buffer.from('test'))
      );
    });

    test('Users cannot upload PDFs to other users folders', async () => {
      const student1Storage = testEnv.authenticatedContext('student1').storage();
      await assertFails(
        student1Storage.ref('pdf-uploads/student2/chat1/document.pdf').put(Buffer.from('test'))
      );
    });

    test('Users can read their own PDFs', async () => {
      const student1Storage = testEnv.authenticatedContext('student1').storage();
      // First upload a file
      await student1Storage.ref('pdf-uploads/student1/chat1/document.pdf').put(Buffer.from('test'));
      // Then read it
      await assertSucceeds(
        student1Storage.ref('pdf-uploads/student1/chat1/document.pdf').getDownloadURL()
      );
    });

    test('Users cannot read other users PDFs', async () => {
      const adminStorage = testEnv.authenticatedContext('admin1').storage();
      await adminStorage.ref('pdf-uploads/student1/chat1/document.pdf').put(Buffer.from('test'));
      
      const student2Storage = testEnv.authenticatedContext('student2').storage();
      await assertFails(
        student2Storage.ref('pdf-uploads/student1/chat1/document.pdf').getDownloadURL()
      );
    });
  });
});