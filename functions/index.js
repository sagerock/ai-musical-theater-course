const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onDocumentWritten} = require('firebase-functions/v2/firestore');
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

/**
 * Cloud Function to generate comprehensive course analytics
 * Computes and caches student engagement metrics, tool usage, and patterns
 */
exports.generateCourseAnalytics = onCall({
  enforceAppCheck: false,
}, async (request) => {
  const {courseId} = request.data;
  const callerUid = request.auth?.uid;

  logger.info('📊 generateCourseAnalytics called', {courseId, callerUid});

  // Validate input
  if (!courseId) {
    throw new HttpsError('invalid-argument', 'courseId is required');
  }

  // Security: Only allow authenticated users
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to generate analytics');
  }

  // Security: Check if caller is instructor or admin for this course
  try {
    logger.info('🔐 Checking permissions for user:', callerUid, 'course:', courseId);
    
    // First check if user is global admin
    const userDoc = await db.collection('users').doc(callerUid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      logger.info('👤 User data:', { role: userData.role, email: userData.email });
      
      // Allow global admins
      if (userData.role === 'admin') {
        logger.info('✅ User is global admin, allowing access');
        // Continue to analytics generation
      } else {
        // Check course membership for non-admins
        const membershipDoc = await db.collection('courseMemberships')
          .doc(`${callerUid}_${courseId}`)
          .get();
        
        logger.info('📋 Membership check:', {
          exists: membershipDoc.exists,
          docId: `${callerUid}_${courseId}`
        });
        
        if (!membershipDoc.exists) {
          // Try alternative query in case the document ID format is different
          const membershipQuery = await db.collection('courseMemberships')
            .where('userId', '==', callerUid)
            .where('courseId', '==', courseId)
            .get();
          
          logger.info('🔍 Alternative membership query found:', membershipQuery.size, 'documents');
          
          if (membershipQuery.empty) {
            throw new HttpsError('permission-denied', 'Not enrolled in this course');
          }
          
          // Use the first found membership
          const membership = membershipQuery.docs[0].data();
          logger.info('📋 Found membership via query:', membership);
          
          if (membership.role !== 'instructor' && membership.role !== 'admin') {
            throw new HttpsError('permission-denied', 'Only instructors and admins can generate analytics');
          }
        } else {
          const membership = membershipDoc.data();
          logger.info('📋 Direct membership data:', membership);
          
          if (membership.role !== 'instructor' && membership.role !== 'admin') {
            throw new HttpsError('permission-denied', 'Only instructors and admins can generate analytics');
          }
        }
      }
    } else {
      throw new HttpsError('permission-denied', 'User not found');
    }
  } catch (error) {
    logger.error('❌ Error checking course permissions:', error);
    
    // Don't wrap HttpsError - re-throw as-is
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('permission-denied', 'Unable to verify course permissions: ' + error.message);
  }

  try {
    logger.info('📊 Computing course analytics for:', courseId);

    // Get course information
    const courseDoc = await db.collection('courses').doc(courseId).get();
    const courseData = courseDoc.exists ? courseDoc.data() : {};

    // Get all students in the course
    const membershipsQuery = db.collection('courseMemberships')
      .where('courseId', '==', courseId)
      .where('status', '==', 'approved')
      .where('role', '==', 'student');
    const membershipsSnapshot = await membershipsQuery.get();
    
    const studentIds = membershipsSnapshot.docs.map(doc => doc.data().userId);
    logger.info(`👥 Found ${studentIds.length} students in course`);

    // Get all chats for this course (batch query instead of N+1)
    const chatsQuery = db.collection('chats')
      .where('courseId', '==', courseId)
      .orderBy('createdAt', 'desc');
    const chatsSnapshot = await chatsQuery.get();
    
    const allChats = chatsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    logger.info(`💬 Found ${allChats.length} chats in course`);

    // Get all projects for this course (batch query)
    const projectsQuery = db.collection('projects')
      .where('courseId', '==', courseId);
    const projectsSnapshot = await projectsQuery.get();
    
    const allProjects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    logger.info(`📁 Found ${allProjects.length} projects in course`);

    // Get user data for all students (batch query)
    const usersData = {};
    if (studentIds.length > 0) {
      // Firestore 'in' queries have a limit of 10, so we batch them
      const userBatches = [];
      for (let i = 0; i < studentIds.length; i += 10) {
        const batch = studentIds.slice(i, i + 10);
        const usersQuery = db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', batch);
        const usersSnapshot = await usersQuery.get();
        
        usersSnapshot.docs.forEach(doc => {
          usersData[doc.id] = {id: doc.id, ...doc.data()};
        });
      }
    }

    // Compute analytics
    const analytics = {
      courseId,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      
      // Course overview
      courseInfo: {
        name: courseData.title || courseData.name || 'Unknown Course',
        code: courseData.courseCode || courseData.course_code,
        totalStudents: studentIds.length,
        totalInteractions: allChats.length,
        totalProjects: allProjects.length,
        semester: courseData.semester,
        year: courseData.year
      },

      // Student metrics
      studentMetrics: studentIds.map(studentId => {
        const student = usersData[studentId] || {id: studentId, name: 'Unknown Student'};
        const studentChats = allChats.filter(chat => chat.userId === studentId);
        const studentProjects = allProjects.filter(project => project.createdBy === studentId);
        
        // Calculate last activity date
        const lastActivityDate = studentChats.length > 0 
          ? new Date(Math.max(...studentChats.map(chat => {
              if (chat.createdAt && chat.createdAt.toDate) {
                return chat.createdAt.toDate().getTime();
              }
              return new Date(chat.createdAt || 0).getTime();
            })))
          : null;

        // Get tool usage for this student
        const toolUsage = {};
        studentChats.forEach(chat => {
          const tool = chat.tool_used || chat.toolUsed || 'Unknown';
          toolUsage[tool] = (toolUsage[tool] || 0) + 1;
        });

        const mostUsedTool = Object.entries(toolUsage)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

        return {
          id: studentId,
          name: student.name || student.displayName || 'Unknown Student',
          email: student.email || 'No email',
          interactions: studentChats.length,
          projects: studentProjects.length,
          lastActivity: lastActivityDate,
          mostUsedTool,
          toolUsage,
          averageInteractionsPerProject: studentProjects.length > 0 
            ? Math.round(studentChats.length / studentProjects.length * 10) / 10 
            : 0
        };
      }),

      // Tool usage statistics
      toolUsage: allChats.reduce((acc, chat) => {
        const tool = chat.tool_used || chat.toolUsed || 'Unknown';
        acc[tool] = (acc[tool] || 0) + 1;
        return acc;
      }, {}),

      // Engagement patterns
      engagementPatterns: {
        averageInteractionsPerStudent: studentIds.length > 0 
          ? Math.round(allChats.length / studentIds.length * 10) / 10 
          : 0,
        averageProjectsPerStudent: studentIds.length > 0 
          ? Math.round(allProjects.length / studentIds.length * 10) / 10 
          : 0,
        dailyActivityTrend: generateDailyActivityTrend(allChats),
        peakActivityHours: generatePeakActivityHours(allChats)
      },

      // Recent activity summary (last 20 interactions)
      recentActivity: allChats
        .slice(0, 20)
        .map(chat => {
          const student = usersData[chat.userId];
          const project = allProjects.find(p => p.id === chat.projectId);
          
          return {
            studentName: student?.name || student?.displayName || 'Unknown Student',
            tool: chat.tool_used || chat.toolUsed || 'Unknown',
            date: chat.createdAt,
            projectTitle: project?.title || 'Unknown Project'
          };
        })
    };

    // Save analytics to Firestore
    await db.collection('courseAnalytics').doc(courseId).set(analytics);
    
    logger.info('✅ Course analytics generated and cached successfully');
    
    return {
      success: true,
      message: 'Course analytics generated successfully',
      analytics: {
        studentsAnalyzed: analytics.courseInfo.totalStudents,
        interactionsProcessed: analytics.courseInfo.totalInteractions,
        projectsAnalyzed: analytics.courseInfo.totalProjects,
        lastUpdated: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('❌ Error generating course analytics:', error);
    throw new HttpsError('internal', 'Failed to generate analytics: ' + error.message);
  }
});

/**
 * Firestore trigger to incrementally update analytics when chats are added/modified
 */
exports.updateAnalyticsOnChatChange = onDocumentWritten('chats/{chatId}', async (event) => {
  const chatId = event.params.chatId;
  const beforeData = event.data?.before?.data();
  const afterData = event.data?.after?.data();
  
  logger.info('🔄 Updating analytics for chat change:', chatId);

  try {
    // Determine which course is affected
    const courseId = afterData?.courseId || beforeData?.courseId;
    if (!courseId) {
      logger.warn('⚠️ No courseId found for chat, skipping analytics update');
      return;
    }

    // Check if analytics exist for this course
    const analyticsDoc = await db.collection('courseAnalytics').doc(courseId).get();
    if (!analyticsDoc.exists()) {
      logger.info('📊 No analytics found for course, will need full regeneration');
      return;
    }

    // For now, we'll mark analytics as stale and regenerate on next request
    // In a more sophisticated implementation, we could do incremental updates
    await db.collection('courseAnalytics').doc(courseId).update({
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      stale: true
    });

    logger.info('✅ Marked analytics as stale for incremental update');

  } catch (error) {
    logger.error('❌ Error updating analytics on chat change:', error);
    // Don't throw - this is a background trigger
  }
});

// Helper functions for analytics computation
function generateDailyActivityTrend(chats) {
  const last7Days = {};
  const today = new Date();
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    last7Days[dateKey] = 0;
  }
  
  // Count chats by day
  chats.forEach(chat => {
    let chatDate;
    if (chat.createdAt && chat.createdAt.toDate) {
      chatDate = chat.createdAt.toDate();
    } else {
      chatDate = new Date(chat.createdAt || 0);
    }
    
    const dateKey = chatDate.toISOString().split('T')[0];
    if (last7Days.hasOwnProperty(dateKey)) {
      last7Days[dateKey]++;
    }
  });
  
  return last7Days;
}

function generatePeakActivityHours(chats) {
  const hourCounts = new Array(24).fill(0);
  
  chats.forEach(chat => {
    let chatDate;
    if (chat.createdAt && chat.createdAt.toDate) {
      chatDate = chat.createdAt.toDate();
    } else {
      chatDate = new Date(chat.createdAt || 0);
    }
    
    const hour = chatDate.getHours();
    hourCounts[hour]++;
  });
  
  // Find peak hours (top 3)
  const hourData = hourCounts.map((count, hour) => ({hour, count}));
  const peakHours = hourData
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(data => ({
      hour: data.hour,
      count: data.count,
      timeRange: `${data.hour}:00-${data.hour + 1}:00`
    }));
  
  return peakHours;
}

/**
 * Cloud Function to send course join request notifications
 * Runs with administrative privileges to query all users and memberships
 */
exports.sendCourseJoinNotifications = onCall({
  enforceAppCheck: false,
}, async (request) => {
  const {userId, courseId, requestedRole} = request.data;
  const callerUid = request.auth?.uid;

  logger.info('📧 sendCourseJoinNotifications called', {userId, courseId, requestedRole, callerUid});

  // Validate input
  if (!userId || !courseId || !requestedRole) {
    throw new HttpsError('invalid-argument', 'userId, courseId, and requestedRole are required');
  }

  // Security: Only allow authenticated users to call this function
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to send notifications');
  }

  // Security: Only allow the user to send notifications for their own join request
  if (callerUid !== userId) {
    throw new HttpsError('permission-denied', 'Can only send notifications for your own join requests');
  }

  try {
    logger.info('📧 Processing course join notification...');

    // Get user and course information
    const [userDoc, courseDoc] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('courses').doc(courseId).get()
    ]);
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    if (!courseDoc.exists) {
      throw new HttpsError('not-found', 'Course not found');
    }
    
    const user = {id: userDoc.id, ...userDoc.data()};
    const course = {id: courseDoc.id, ...courseDoc.data()};
    
    logger.info('👤 User requesting join:', {name: user.name, email: user.email});
    logger.info('📚 Course:', {title: course.title, code: course.course_code});

    // Get all instructors for this course (using admin privileges)
    const instructorQuery = db.collection('courseMemberships')
      .where('courseId', '==', courseId)
      .where('role', '==', 'instructor')
      .where('status', '==', 'approved');
    
    const instructorsSnapshot = await instructorQuery.get();
    const instructorEmails = [];
    
    logger.info(`🔍 Found ${instructorsSnapshot.size} instructor memberships`);
    
    for (const instructorDoc of instructorsSnapshot.docs) {
      const membership = instructorDoc.data();
      try {
        const instructorUserDoc = await db.collection('users').doc(membership.userId).get();
        if (instructorUserDoc.exists) {
          const instructorUser = instructorUserDoc.data();
          if (instructorUser.email) {
            instructorEmails.push({
              email: instructorUser.email,
              name: instructorUser.name || instructorUser.email.split('@')[0]
            });
            logger.info('📧 Added instructor email:', instructorUser.email);
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch instructor user:', membership.userId, error);
      }
    }
    
    // Get all global admins (using admin privileges)
    const adminQuery = db.collection('users').where('role', '==', 'admin');
    const adminsSnapshot = await adminQuery.get();
    const adminEmails = [];
    
    logger.info(`🔍 Found ${adminsSnapshot.size} admin users`);
    
    adminsSnapshot.forEach((adminDoc) => {
      const adminUser = adminDoc.data();
      if (adminUser.email) {
        adminEmails.push({
          email: adminUser.email,
          name: adminUser.name || adminUser.email.split('@')[0]
        });
        logger.info('📧 Added admin email:', adminUser.email);
      }
    });
    
    logger.info(`📧 Will notify ${instructorEmails.length} instructors and ${adminEmails.length} admins`);
    
    // Prepare email data
    const emailData = {
      studentName: user.name || user.email.split('@')[0],
      studentEmail: user.email,
      courseName: course.title,
      courseCode: course.course_code,
      requestedRole: requestedRole,
      requestDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Send emails via the same API endpoint used by the frontend
    logger.info('📧 Email data prepared:', emailData);
    logger.info('📧 Will send to instructors:', instructorEmails);
    logger.info('📧 Will send to admins:', adminEmails);
    
    let emailsSent = 0;
    let emailsFailed = 0;
    
    try {
      const axios = require('axios');
      const EMAIL_API_URL = process.env.EMAIL_API_URL || 'https://staging-intelligence-8c59c.web.app/api/send-email';
      
      // Send emails to instructors
      for (const instructor of instructorEmails) {
        try {
          const subject = `New Student Enrollment Request - ${emailData.courseName}`;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Student Enrollment Request</h2>
              <p>Hello ${instructor.name},</p>
              <p>A student has requested to join your course and needs your approval.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Student Details:</h3>
                <p><strong>Name:</strong> ${emailData.studentName}</p>
                <p><strong>Email:</strong> ${emailData.studentEmail}</p>
                <p><strong>Request Date:</strong> ${emailData.requestDate}</p>
              </div>
              
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Course Information:</h3>
                <p><strong>Course:</strong> ${emailData.courseName}</p>
                <p><strong>Course Code:</strong> ${emailData.courseCode}</p>
              </div>
              
              <p>Please review and approve or deny this request in your instructor dashboard.</p>
              <p><a href="https://staging-intelligence-8c59c.web.app/instructor" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Request</a></p>
              
              <p>Best regards,<br>AI Engagement Hub</p>
            </div>
          `;
          const textContent = `
New Student Enrollment Request - ${emailData.courseName}

Hello ${instructor.name},

A student has requested to join your course and needs your approval.

Student Details:
- Name: ${emailData.studentName}
- Email: ${emailData.studentEmail}
- Request Date: ${emailData.requestDate}

Course Information:
- Course: ${emailData.courseName}
- Course Code: ${emailData.courseCode}

Please review and approve or deny this request in your instructor dashboard:
https://staging-intelligence-8c59c.web.app/instructor

Best regards,
AI Engagement Hub
          `;
          
          const response = await axios.post(EMAIL_API_URL, {
            to: instructor.email,
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (response.data && response.data.success) {
            emailsSent++;
            logger.info('✅ Email sent to instructor:', instructor.email);
          } else {
            emailsFailed++;
            logger.warn('❌ Email failed to instructor:', instructor.email, response.data);
          }
        } catch (emailError) {
          emailsFailed++;
          logger.error('❌ Error sending email to instructor:', instructor.email, emailError.message);
        }
      }
      
      // Send emails to admins
      for (const admin of adminEmails) {
        try {
          const subject = `Student Enrollment Notification - ${emailData.courseName}`;
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Student Enrollment Notification</h2>
              <p>Hello ${admin.name},</p>
              <p>A student has requested to join a course in your system. This is for your information and oversight.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Student Details:</h3>
                <p><strong>Name:</strong> ${emailData.studentName}</p>
                <p><strong>Email:</strong> ${emailData.studentEmail}</p>
                <p><strong>Request Date:</strong> ${emailData.requestDate}</p>
              </div>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Course Information:</h3>
                <p><strong>Course:</strong> ${emailData.courseName}</p>
                <p><strong>Course Code:</strong> ${emailData.courseCode}</p>
              </div>
              
              <p>The course instructors have been notified and will handle the approval. You can monitor all course activities in the admin panel.</p>
              <p><a href="https://staging-intelligence-8c59c.web.app/admin" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Admin Panel</a></p>
              
              <p>Best regards,<br>AI Engagement Hub</p>
            </div>
          `;
          const textContent = `
Student Enrollment Notification - ${emailData.courseName}

Hello ${admin.name},

A student has requested to join a course in your system. This is for your information and oversight.

Student Details:
- Name: ${emailData.studentName}
- Email: ${emailData.studentEmail}
- Request Date: ${emailData.requestDate}

Course Information:
- Course: ${emailData.courseName}
- Course Code: ${emailData.courseCode}

The course instructors have been notified and will handle the approval. You can monitor all course activities in the admin panel:
https://staging-intelligence-8c59c.web.app/admin

Best regards,
AI Engagement Hub
          `;
          
          const response = await axios.post(EMAIL_API_URL, {
            to: admin.email,
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent
          }, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          if (response.data && response.data.success) {
            emailsSent++;
            logger.info('✅ Email sent to admin:', admin.email);
          } else {
            emailsFailed++;
            logger.warn('❌ Email failed to admin:', admin.email, response.data);
          }
        } catch (emailError) {
          emailsFailed++;
          logger.error('❌ Error sending email to admin:', admin.email, emailError.message);
        }
      }
      
      logger.info(`📧 Email sending complete: ${emailsSent} sent, ${emailsFailed} failed`);
      
    } catch (error) {
      logger.error('❌ Email sending setup error:', error.message);
      emailsFailed = instructorEmails.length + adminEmails.length;
    }
    
    return {
      success: true,
      message: 'Course join notifications processed successfully',
      notificationsSent: {
        instructors: instructorEmails.length,
        admins: adminEmails.length,
        total: instructorEmails.length + adminEmails.length
      },
      emailResults: {
        sent: emailsSent,
        failed: emailsFailed,
        total: emailsSent + emailsFailed
      },
      emailData
    };

  } catch (error) {
    logger.error('❌ Error sending course join notifications:', error);
    
    // Re-throw HttpsError as-is, wrap others
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to send notifications: ' + error.message);
  }
});