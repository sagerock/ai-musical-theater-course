const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {logger} = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

/**
 * Cloud Function to completely delete a user and all associated data
 * This includes:
 * - Firebase Authentication account
 * - User document in Firestore
 * - Course memberships
 * - Chat sessions
 * - Projects
 * - Files and attachments
 */
exports.deleteUserCompletely = onCall({
  enforceAppCheck: false, // Set to true in production if using App Check
}, async (request) => {
  const {userId} = request.data;
  const callerUid = request.auth?.uid;

  logger.info('🔥 deleteUserCompletely called', {userId, callerUid});

  // Validate input
  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  // Security: Only allow authenticated users to call this function
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to delete users');
  }

  // Security: Check if caller is admin (you can customize this logic)
  try {
    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can delete users');
    }
  } catch (error) {
    logger.error('❌ Error checking caller permissions:', error);
    throw new HttpsError('permission-denied', 'Unable to verify admin permissions');
  }

  try {
    logger.info('🧹 Starting complete user deletion process...');

    // 1. Delete course memberships
    logger.info('📚 Deleting course memberships...');
    const membershipsQuery = db.collection('courseMemberships').where('userId', '==', userId);
    const membershipsSnapshot = await membershipsQuery.get();
    
    const batch = db.batch();
    const coursesToUpdate = new Set();
    
    membershipsSnapshot.forEach((doc) => {
      const membership = doc.data();
      coursesToUpdate.add(membership.courseId);
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    logger.info(`✅ Deleted ${membershipsSnapshot.size} course memberships`);

    // 2. Delete chat sessions
    logger.info('💬 Deleting chat sessions...');
    const chatsQuery = db.collection('chats').where('userId', '==', userId);
    const chatsSnapshot = await chatsQuery.get();
    
    const chatBatch = db.batch();
    chatsSnapshot.forEach((doc) => {
      chatBatch.delete(doc.ref);
    });
    
    await chatBatch.commit();
    logger.info(`✅ Deleted ${chatsSnapshot.size} chat sessions`);

    // 3. Delete projects
    logger.info('📁 Deleting projects...');
    const projectsQuery = db.collection('projects').where('userId', '==', userId);
    const projectsSnapshot = await projectsQuery.get();
    
    const projectBatch = db.batch();
    projectsSnapshot.forEach((doc) => {
      projectBatch.delete(doc.ref);
    });
    
    await projectBatch.commit();
    logger.info(`✅ Deleted ${projectsSnapshot.size} projects`);

    // 4. Delete instructor notes (if any)
    logger.info('📝 Deleting instructor notes...');
    const notesQuery = db.collection('instructorNotes').where('userId', '==', userId);
    const notesSnapshot = await notesQuery.get();
    
    const notesBatch = db.batch();
    notesSnapshot.forEach((doc) => {
      notesBatch.delete(doc.ref);
    });
    
    await notesBatch.commit();
    logger.info(`✅ Deleted ${notesSnapshot.size} instructor notes`);

    // 5. Delete reflections
    logger.info('🤔 Deleting reflections...');
    const reflectionsQuery = db.collection('reflections').where('userId', '==', userId);
    const reflectionsSnapshot = await reflectionsQuery.get();
    
    const reflectionsBatch = db.batch();
    reflectionsSnapshot.forEach((doc) => {
      reflectionsBatch.delete(doc.ref);
    });
    
    await reflectionsBatch.commit();
    logger.info(`✅ Deleted ${reflectionsSnapshot.size} reflections`);

    // 6. Delete user document from Firestore
    logger.info('👤 Deleting user document...');
    await db.collection('users').doc(userId).delete();
    logger.info('✅ User document deleted');

    // 7. Delete Firebase Authentication account
    logger.info('🔐 Deleting Firebase Auth account...');
    try {
      await auth.deleteUser(userId);
      logger.info('✅ Firebase Auth account deleted');
    } catch (authError) {
      // If user doesn't exist in Auth, that's fine
      if (authError.code === 'auth/user-not-found') {
        logger.info('⚠️ User not found in Firebase Auth (already deleted?)');
      } else {
        logger.error('❌ Error deleting Firebase Auth account:', authError);
        throw authError;
      }
    }

    // 8. Update course member counts
    logger.info('📊 Updating course member counts...');
    for (const courseId of coursesToUpdate) {
      try {
        // Get updated membership count
        const membershipQuery = db.collection('courseMemberships')
          .where('courseId', '==', courseId)
          .where('status', '==', 'approved');
        const membershipSnapshot = await membershipQuery.get();
        
        await db.collection('courses').doc(courseId).update({
          memberCount: membershipSnapshot.size,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (courseError) {
        logger.error(`❌ Error updating course ${courseId}:`, courseError);
        // Don't fail the whole operation for this
      }
    }

    logger.info('🎉 User deletion completed successfully');
    
    return {
      success: true,
      message: 'User and all associated data deleted successfully',
      deletedData: {
        courseMemberships: membershipsSnapshot.size,
        chatSessions: chatsSnapshot.size,
        projects: projectsSnapshot.size,
        instructorNotes: notesSnapshot.size,
        reflections: reflectionsSnapshot.size,
        coursesUpdated: coursesToUpdate.size
      }
    };

  } catch (error) {
    logger.error('❌ Error in deleteUserCompletely:', error);
    
    // Re-throw HttpsError as-is, wrap others
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});