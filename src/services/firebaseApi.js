import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  setDoc,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, functions, auth } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { extractTextFromDocument, isSupportedDocument, getDocumentType } from '../utils/documentExtractorWithOCR';
import emailService from './emailService';
import approvalEmailService from './approvalEmailService';

// Simple in-memory cache for frequently accessed data
const dataCache = {
  users: new Map(),
  projects: new Map(),
  lastClearTime: Date.now(),
  
  // Clear cache if it's older than 5 minutes
  checkAndClear() {
    const now = Date.now();
    if (now - this.lastClearTime > 5 * 60 * 1000) { // 5 minutes
      this.users.clear();
      this.projects.clear();
      this.lastClearTime = now;
      console.log('🗑️ Cleared data cache after 5 minutes');
    }
  },
  
  getUser(userId) {
    this.checkAndClear();
    return this.users.get(userId);
  },
  
  setUser(userId, userData) {
    this.checkAndClear();
    this.users.set(userId, userData);
  },
  
  getProject(projectId) {
    this.checkAndClear();
    return this.projects.get(projectId);
  },
  
  setProject(projectId, projectData) {
    this.checkAndClear();
    this.projects.set(projectId, projectData);
  }
};

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  return timestamp;
};

// USERS API
export const userApi = {
  async getUserById(userId) {
    console.log('🔥 getUserById:', userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    throw new Error('User not found');
  },

  async updateUser(userId, updates) {
    console.log('🔥 updateUser:', userId, updates);
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return this.getUserById(userId);
  },

  async getAllUsers(courseId = null) {
    console.log('🔥 getAllUsers:', courseId);
    
    let users = [];
    
    if (courseId) {
      // Get users for a specific course (include both approved and pending for instructor view)
      const membershipsQuery = query(
        collection(db, 'courseMemberships'),
        where('courseId', '==', courseId)
        // Note: Removed status filter to include pending students for instructor approval
      );
      
      const membershipsSnapshot = await getDocs(membershipsQuery);
      
      for (const membershipDoc of membershipsSnapshot.docs) {
        const membership = { id: membershipDoc.id, ...membershipDoc.data() };
        
        // Fetch user details
        try {
          const userDoc = await getDoc(doc(db, 'users', membership.userId));
          if (userDoc.exists()) {
            const user = { id: userDoc.id, ...userDoc.data() };
            
            // Add course membership info
            user.course_memberships = [{
              ...membership,
              course_id: membership.courseId,
              // Convert Firestore timestamps to JavaScript Dates
              joinedAt: membership.joinedAt?.toDate?.() || membership.joinedAt,
              createdAt: membership.createdAt?.toDate?.() || membership.createdAt,
              updatedAt: membership.updatedAt?.toDate?.() || membership.updatedAt
            }];
            user.course_role = membership.role; // For easier access in components
            user.status = membership.status; // Include membership status (pending/approved)
            
            // Also convert user timestamps
            user.created_at = user.createdAt?.toDate?.() || user.createdAt;
            user.updated_at = user.updatedAt?.toDate?.() || user.updatedAt;
            
            users.push(user);
          } else {
            // User document doesn't exist, but membership does - this is an orphaned membership
            console.warn('⚠️ Orphaned course membership found - user deleted but membership remains:', membership.userId);
            // Skip adding this orphaned membership instead of showing "User Not Found"
          }
        } catch (error) {
          console.warn('❌ Error fetching user:', membership.userId, error);
          // Skip this user on error instead of showing fallback data
        }
      }
    } else {
      // Get all users
      const usersQuery = query(
        collection(db, 'users'), 
        orderBy('createdAt', 'desc')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      // Get course memberships for each user
      for (const userDoc of usersSnapshot.docs) {
        const user = { id: userDoc.id, ...userDoc.data() };
        
        // Fetch user's course memberships
        const membershipsQuery = query(
          collection(db, 'courseMemberships'),
          where('userId', '==', user.id)
        );
        
        const membershipsSnapshot = await getDocs(membershipsQuery);
        const memberships = [];
        
        for (const membershipDoc of membershipsSnapshot.docs) {
          const membership = { id: membershipDoc.id, ...membershipDoc.data() };
          
          // Convert Firestore timestamps to JavaScript Dates
          membership.joinedAt = membership.joinedAt?.toDate?.() || membership.joinedAt;
          membership.createdAt = membership.createdAt?.toDate?.() || membership.createdAt;
          membership.updatedAt = membership.updatedAt?.toDate?.() || membership.updatedAt;
          
          // Fetch course details
          try {
            const courseDoc = await getDoc(doc(db, 'courses', membership.courseId));
            if (courseDoc.exists()) {
              membership.courses = { id: courseDoc.id, ...courseDoc.data() };
              membership.course_id = membership.courseId; // For compatibility
            }
          } catch (error) {
            console.warn('Course not found:', membership.courseId);
          }
          
          memberships.push(membership);
        }
        
        user.course_memberships = memberships;
        
        // Convert user timestamps
        user.created_at = user.createdAt?.toDate?.() || user.createdAt;
        user.updated_at = user.updatedAt?.toDate?.() || user.updatedAt;
        
        users.push(user);
      }
    }
    
    console.log('✅ getAllUsers result:', users.length, 'users');
    return users;
  },

  async searchUsers(searchTerm, excludeCourseId = null, limitCount = 20) {
    console.log('🔥 searchUsers:', searchTerm, excludeCourseId, limitCount);
    
    try {
      // Get all users
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('name'),
        limit(limitCount * 2) // Get more to filter out existing members
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter users by search term (case-insensitive search in name and email)
      const filteredUsers = allUsers.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch;
      });
      
      // If excludeCourseId is provided, filter out users already in that course
      if (excludeCourseId) {
        const membershipsQuery = query(
          collection(db, 'courseMemberships'),
          where('courseId', '==', excludeCourseId)
        );
        
        const membershipsSnapshot = await getDocs(membershipsQuery);
        const existingMemberIds = new Set(
          membershipsSnapshot.docs.map(doc => doc.data().userId)
        );
        
        const availableUsers = filteredUsers.filter(user => 
          !existingMemberIds.has(user.id)
        );
        
        console.log('✅ searchUsers result:', availableUsers.length, 'available users');
        return availableUsers.slice(0, limitCount);
      }
      
      console.log('✅ searchUsers result:', filteredUsers.length, 'matching users');
      return filteredUsers.slice(0, limitCount);
      
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw error;
    }
  },

  async deleteUser(userId) {
    console.log('🔥 deleteUser (calling cloud function):', userId);
    
    try {
      // Call the cloud function to handle complete user deletion
      const deleteUserCompletely = httpsCallable(functions, 'deleteUserCompletely');
      const result = await deleteUserCompletely({ userId });
      
      console.log('✅ User deletion completed via cloud function:', result.data);
      
      // Return the detailed results for admin feedback
      return {
        success: true,
        message: result.data.message,
        deletedData: result.data.deletedData
      };
      
    } catch (error) {
      console.error('❌ Error calling deleteUserCompletely function:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'functions/permission-denied') {
        throw new Error('Permission denied. Only admins can delete users.');
      } else if (error.code === 'functions/unauthenticated') {
        throw new Error('You must be logged in to delete users.');
      } else if (error.code === 'functions/invalid-argument') {
        throw new Error('Invalid user ID provided.');
      } else {
        throw new Error(`Failed to delete user: ${error.message}`);
      }
    }
  },

  async hasEmailNotificationsEnabled(userId, notificationType = 'instructor_note_emails') {
    console.log('🔥 hasEmailNotificationsEnabled:', userId, notificationType);
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        console.log('⚠️ User not found, defaulting to notifications enabled');
        return true; // Default to enabled if user not found
      }
      
      const userData = userDoc.data();
      const emailSettings = userData.emailSettings || {};
      
      // Default to true if not specified
      const isEnabled = emailSettings[notificationType] !== false;
      
      console.log('✅ Email notifications enabled:', isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('❌ Error checking email notification settings:', error);
      return true; // Default to enabled on error
    }
  }
};

// COURSES API
export const courseApi = {
  async createCourse(courseData) {
    console.log('🔥 createCourse:', courseData);
    
    try {
      // Check if a course with the same name and semester/year already exists
      const duplicateQuery = query(
        collection(db, 'courses'),
        where('title', '==', courseData.title),
        where('semester', '==', courseData.semester),
        where('year', '==', courseData.year)
      );
      
      const duplicateSnapshot = await getDocs(duplicateQuery);
      
      if (!duplicateSnapshot.empty) {
        const existingCourse = duplicateSnapshot.docs[0].data();
        throw new Error(`A course named "${courseData.title}" already exists for ${courseData.semester} ${courseData.year}. Please use a different name or check if you're already an instructor for this course.`);
      }
      
      // Check if the course code already exists
      const codeQuery = query(
        collection(db, 'courses'),
        where('course_code', '==', courseData.course_code)
      );
      
      const codeSnapshot = await getDocs(codeQuery);
      
      if (!codeSnapshot.empty) {
        // If code exists, generate a new one
        const newCode = await this.generateCourseCode(
          courseData.title,
          courseData.semester,
          courseData.year + '_' + Date.now() // Add timestamp to ensure uniqueness
        );
        courseData.course_code = newCode;
        courseData.accessCode = newCode;
        console.log('⚠️ Course code already existed, generated new one:', newCode);
      }
      
      // Ensure accessCode is set for student enrollment
      const accessCode = courseData.accessCode || courseData.course_code;
      
      const docRef = await addDoc(collection(db, 'courses'), {
        ...courseData,
        accessCode: accessCode, // Set accessCode for student joining
        memberCount: 0,
        instructorCount: 0,
        studentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Course created with accessCode:', accessCode);
      return this.getCourseById(docRef.id);
    } catch (error) {
      console.error('❌ Error creating course:', error);
      throw error;
    }
  },

  async getCourseById(courseId) {
    console.log('🔥 getCourseById:', courseId);
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      return { id: courseDoc.id, ...courseDoc.data() };
    }
    throw new Error('Course not found');
  },

  async getAllCourses() {
    console.log('🔥 getAllCourses');
    const coursesQuery = query(
      collection(db, 'courses'), 
      orderBy('createdAt', 'desc')
    );
    
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = [];
    
    // Get course memberships for each course
    for (const courseDoc of coursesSnapshot.docs) {
      const course = { id: courseDoc.id, ...courseDoc.data() };
      
      // Fetch course memberships
      const membershipsQuery = query(
        collection(db, 'courseMemberships'),
        where('courseId', '==', course.id)
      );
      
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const memberships = [];
      
      for (const membershipDoc of membershipsSnapshot.docs) {
        const membership = { id: membershipDoc.id, ...membershipDoc.data() };
        
        // Fetch user details
        try {
          const userDoc = await getDoc(doc(db, 'users', membership.userId));
          if (userDoc.exists()) {
            membership.users = { id: userDoc.id, ...userDoc.data() };
          }
        } catch (error) {
          console.warn('User not found:', membership.userId);
        }
        
        memberships.push(membership);
      }
      
      course.course_memberships = memberships;
      courses.push(course);
    }
    
    console.log('✅ getAllCourses result:', courses.length, 'courses');
    return courses;
  },

  async updateCourse(courseId, updateData) {
    console.log('🔥 updateCourse:', courseId, updateData);
    await updateDoc(doc(db, 'courses', courseId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return this.getCourseById(courseId);
  },

  async deleteCourse(courseId) {
    console.log('🔥 deleteCourse:', courseId);
    
    // First, delete all course memberships
    const membershipsQuery = query(
      collection(db, 'courseMemberships'),
      where('courseId', '==', courseId)
    );
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const batch = writeBatch(db);
    
    membershipsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the course
    batch.delete(doc(db, 'courses', courseId));
    
    await batch.commit();
    console.log('✅ Course and memberships deleted successfully');
    return true;
  },

  // Generate course code
  async generateCourseCode(courseName, semester, year) {
    try {
      // Create code from course name (first 3 letters, uppercase)
      const nameCode = courseName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      
      // Create semester code
      const semesterCode = semester.substring(0, 2).toUpperCase();
      
      // Create year code (last 2 digits)
      const yearCode = year.toString().slice(-2);
      
      // Generate random number
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      const courseCode = `${nameCode}${semesterCode}${yearCode}${randomNum}`;
      
      console.log('✅ Generated course code:', courseCode);
      return courseCode;
    } catch (error) {
      console.error('❌ Error generating course code:', error);
      throw error;
    }
  },

  // Fix existing courses that might be missing accessCode
  async fixMissingAccessCodes() {
    console.log('🔧 Checking for courses missing accessCode...');
    
    try {
      const coursesQuery = query(collection(db, 'courses'));
      const coursesSnapshot = await getDocs(coursesQuery);
      
      let fixedCount = 0;
      const batch = writeBatch(db);
      
      coursesSnapshot.docs.forEach((courseDoc) => {
        const courseData = courseDoc.data();
        
        // If course has course_code but no accessCode, fix it
        if (courseData.course_code && !courseData.accessCode) {
          console.log(`🔧 Adding accessCode to course: ${courseData.title} (${courseData.course_code})`);
          batch.update(courseDoc.ref, {
            accessCode: courseData.course_code,
            updatedAt: serverTimestamp()
          });
          fixedCount++;
        }
      });
      
      if (fixedCount > 0) {
        await batch.commit();
        console.log(`✅ Fixed ${fixedCount} courses with missing accessCode`);
      } else {
        console.log('✅ All courses already have accessCode');
      }
      
      return fixedCount;
    } catch (error) {
      console.error('❌ Error fixing missing access codes:', error);
      throw error;
    }
  },

  // Add user to course with specified role
  async addUserToCourse(userId, courseId, role = 'student', addedBy) {
    console.log('🔥 addUserToCourse:', userId, courseId, role);
    
    // Check if user is already in course
    const existingQuery = query(
      collection(db, 'courseMemberships'),
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      const existingMembership = existingSnapshot.docs[0].data();
      
      // If user is already an instructor and trying to add as student, prevent downgrade
      if (existingMembership.role === 'instructor' && role === 'student') {
        throw new Error('User is already an instructor for this course. Cannot downgrade instructor to student role.');
      }
      
      // If trying to add with same role, just return success
      if (existingMembership.role === role) {
        return true;
      }
      
      // Otherwise, this is upgrading student to instructor or changing roles
      throw new Error(`User is already enrolled in this course as ${existingMembership.role}`);
    }
    
    const membershipDoc = {
      userId,
      courseId,
      role: role, // Use the specified role (student or instructor)
      status: 'approved', // Auto-approve for admin-created memberships
      addedBy,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Use composite ID: userId_courseId (required by security rules)
    const membershipId = `${userId}_${courseId}`;
    await setDoc(doc(db, 'courseMemberships', membershipId), membershipDoc);
    
    // Update course member counts
    await this.updateCourseMemberCounts(courseId);
    
    console.log('✅ User added to course successfully');
    return true;
  },

  // Backward compatibility - keep the old function name
  async addStudentToCourse(userId, courseId, addedBy) {
    return this.addUserToCourse(userId, courseId, 'student', addedBy);
  },

  // Remove member from course
  async removeMemberFromCourse(membershipId) {
    console.log('🔥 removeMemberFromCourse:', membershipId);
    
    // Get membership to get courseId for count update
    const membershipRef = doc(db, 'courseMemberships', membershipId);
    const membershipSnap = await getDoc(membershipRef);
    
    if (!membershipSnap.exists()) {
      throw new Error('Membership not found');
    }
    
    const membership = membershipSnap.data();
    
    // Delete membership
    await deleteDoc(membershipRef);
    
    // Update course member counts
    await this.updateCourseMemberCounts(membership.courseId);
    
    console.log('✅ User removed from course successfully');
    return true;
  },

  // Update member role
  async updateMemberRole(membershipId, newRole, changedBy = null) {
    console.log('🔥 updateMemberRole:', membershipId, newRole, changedBy);
    
    const membershipRef = doc(db, 'courseMemberships', membershipId);
    const membershipSnap = await getDoc(membershipRef);
    
    if (!membershipSnap.exists()) {
      console.error('❌ Membership document not found:', membershipId);
      throw new Error('Membership not found');
    }
    
    const membership = membershipSnap.data();
    const oldRole = membership.role;
    
    console.log('📋 Current membership data:', {
      id: membershipId,
      userId: membership.userId,
      courseId: membership.courseId,
      oldRole: oldRole,
      newRole: newRole,
      status: membership.status
    });
    
    // Only proceed if the role is actually changing
    if (oldRole === newRole) {
      console.log('⚠️ Role is already set to', newRole, '- no change needed');
      return true;
    }
    
    console.log('🔄 Updating role from', oldRole, 'to', newRole);
    
    await updateDoc(membershipRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    // Verify the update by reading the document again
    const updatedMembershipSnap = await getDoc(membershipRef);
    const updatedMembership = updatedMembershipSnap.data();
    console.log('✅ Verified updated role:', updatedMembership.role);
    
    // Update course member counts
    await this.updateCourseMemberCounts(membership.courseId);
    
    // Send role change notification email
    try {
      await approvalEmailService.sendRoleChangeNotification({
        userId: membership.userId,
        courseId: membership.courseId,
        oldRole: oldRole,
        newRole: newRole,
        changedBy: changedBy || 'Your instructor'
      });
      console.log('✅ Role change notification email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Failed to send role change notification email:', emailError);
      // Don't fail the role update if email fails
    }
    
    console.log('✅ Member role updated successfully from', oldRole, 'to', newRole);
    return true;
  },

  // Cleanup function to identify and fix duplicate memberships
  async cleanupDuplicateMemberships() {
    console.log('🧹 Starting duplicate membership cleanup...');
    
    const membershipsQuery = collection(db, 'courseMemberships');
    const membershipsSnapshot = await getDocs(membershipsQuery);
    
    const membershipMap = new Map(); // userId_courseId -> [membership records]
    const duplicates = [];
    
    // Group memberships by user-course combination
    membershipsSnapshot.docs.forEach(doc => {
      const membership = { id: doc.id, ...doc.data() };
      const key = `${membership.userId}_${membership.courseId}`;
      
      if (!membershipMap.has(key)) {
        membershipMap.set(key, []);
      }
      membershipMap.get(key).push(membership);
    });
    
    // Find user-course combinations with multiple records
    for (const [key, memberships] of membershipMap.entries()) {
      if (memberships.length > 1) {
        console.log(`🔍 Found ${memberships.length} memberships for ${key}:`);
        memberships.forEach((m, index) => {
          console.log(`  ${index + 1}. ID: ${m.id}, Role: ${m.role}, Status: ${m.status}, Updated: ${m.updatedAt?.toDate ? m.updatedAt.toDate() : m.updatedAt}`);
        });
        duplicates.push({ key, memberships });
      }
    }
    
    console.log(`📊 Found ${duplicates.length} user-course combinations with duplicate memberships`);
    return duplicates;
  },

  // Fix duplicate memberships by keeping the most recent approved one
  async fixDuplicateMemberships(dryRun = true) {
    console.log('🔧 Starting duplicate membership fix...', dryRun ? '(DRY RUN)' : '(LIVE)');
    
    const duplicates = await this.cleanupDuplicateMemberships();
    const fixes = [];
    
    for (const { key, memberships } of duplicates) {
      // Sort by priority: approved status first, then by most recent update
      const sorted = memberships.sort((a, b) => {
        // Prioritize approved memberships
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (b.status === 'approved' && a.status !== 'approved') return 1;
        
        // If both approved or both not approved, sort by most recent update
        const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
        const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
        return bTime - aTime;
      });
      
      const keepMembership = sorted[0]; // Keep the first (best) one
      const deleteMemberships = sorted.slice(1); // Delete the rest
      
      console.log(`🎯 For ${key}:`);
      console.log(`  ✅ KEEP: ${keepMembership.id} (${keepMembership.role}, ${keepMembership.status})`);
      deleteMemberships.forEach(m => {
        console.log(`  🗑️ DELETE: ${m.id} (${m.role}, ${m.status})`);
      });
      
      if (!dryRun) {
        // Actually delete the duplicate memberships
        const batch = writeBatch(db);
        deleteMemberships.forEach(m => {
          batch.delete(doc(db, 'courseMemberships', m.id));
        });
        await batch.commit();
        console.log(`✅ Deleted ${deleteMemberships.length} duplicate memberships for ${key}`);
      }
      
      fixes.push({
        key,
        kept: keepMembership,
        deleted: deleteMemberships.length
      });
    }
    
    console.log(`🎉 Fix complete: ${fixes.length} user-course combinations processed`);
    return fixes;
  },

  // Restore instructor role for a user in a course (admin function)
  async restoreInstructorRole(userId, courseId, adminId) {
    console.log('🔥 restoreInstructorRole:', userId, courseId, adminId);
    
    try {
      // Find the existing membership
      const membershipId = `${userId}_${courseId}`;
      const membershipRef = doc(db, 'courseMemberships', membershipId);
      const membershipSnap = await getDoc(membershipRef);
      
      if (membershipSnap.exists()) {
        // Update existing membership to instructor role
        await updateDoc(membershipRef, {
          role: 'instructor',
          status: 'approved',
          restoredBy: adminId,
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
          addedBy: adminId,
          restoredBy: adminId,
          joinedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(membershipRef, membershipDoc);
        console.log('✅ New instructor membership created');
      }
      
      // Update course member counts
      await this.updateCourseMemberCounts(courseId);
      
      return { success: true, message: 'Instructor role restored successfully' };
    } catch (error) {
      console.error('❌ Error restoring instructor role:', error);
      throw error;
    }
  },

  // Update course member counts
  async updateCourseMemberCounts(courseId) {
    try {
      const membershipsQuery = query(
        collection(db, 'courseMemberships'),
        where('courseId', '==', courseId),
        where('status', '==', 'approved')
      );
      
      const snapshot = await getDocs(membershipsQuery);
      let instructorCount = 0;
      let studentCount = 0;
      let teachingAssistantCount = 0;
      let studentAssistantCount = 0;
      let schoolAdministratorCount = 0;
      
      snapshot.forEach((doc) => {
        const membership = doc.data();
        switch (membership.role) {
          case 'instructor':
            instructorCount++;
            break;
          case 'student':
            studentCount++;
            break;
          case 'teaching_assistant':
            teachingAssistantCount++;
            break;
          case 'student_assistant':
            studentAssistantCount++;
            break;
          case 'school_administrator':
            schoolAdministratorCount++;
            break;
          default:
            // Default unknown roles to student for counting
            studentCount++;
        }
      });
      
      const totalMembers = instructorCount + studentCount + teachingAssistantCount + studentAssistantCount + schoolAdministratorCount;
      
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        memberCount: totalMembers,
        instructorCount,
        studentCount,
        teachingAssistantCount,
        studentAssistantCount,
        schoolAdministratorCount,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Course member counts updated:', { 
        totalMembers, 
        instructorCount, 
        studentCount, 
        teachingAssistantCount, 
        studentAssistantCount, 
        schoolAdministratorCount 
      });
    } catch (error) {
      console.error('❌ Error updating course member counts:', error);
    }
  },

  async getUserCourses(userId) {
    console.log('🔥 getUserCourses:', userId);
    
    // Get user's course memberships
    const membershipsQuery = query(
      collection(db, 'courseMemberships'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const courses = [];
    
    // Fetch course details for each membership
    for (const membershipDoc of membershipsSnapshot.docs) {
      const membership = membershipDoc.data();
      try {
        const course = await this.getCourseById(membership.courseId);
        courses.push({
          ...membership,
          courses: course
        });
      } catch (error) {
        console.warn('Course not found:', membership.courseId);
      }
    }
    
    console.log('✅ getUserCourses result:', courses.length, 'courses');
    return courses;
  },

  async joinCourse(userId, courseId, accessCode, role = 'student') {
    console.log('🔥 joinCourse:', userId, courseId, 'role:', role);
    
    // Verify course exists and access code is correct
    const course = await this.getCourseById(courseId);
    if (course.accessCode !== accessCode) {
      throw new Error('Invalid access code');
    }
    
    // Check for existing membership to preserve instructor roles
    const membershipId = `${userId}_${courseId}`;
    const existingMembershipDoc = await getDoc(doc(db, 'courseMemberships', membershipId));
    
    if (existingMembershipDoc.exists()) {
      const existingMembership = existingMembershipDoc.data();
      
      // If user is already an instructor, don't allow downgrade to student
      if (existingMembership.role === 'instructor' && role === 'student') {
        throw new Error('You are already an instructor for this course. Instructors cannot join as students.');
      }
      
      // If existing membership exists, update status if needed
      if (existingMembership.role === role) {
        await updateDoc(doc(db, 'courseMemberships', membershipId), {
          status: 'pending',
          updatedAt: serverTimestamp()
        });
        
        // Send email notifications for re-enrollment request via Cloud Function
        try {
          const { httpsCallable } = await import('firebase/functions');
          const { functions } = await import('../config/firebase');
          const sendNotifications = httpsCallable(functions, 'sendCourseJoinNotifications');
          
          const result = await sendNotifications({
            userId,
            courseId,
            requestedRole: role
          });
          
          console.log('✅ Course re-join request notifications sent:', result.data);
        } catch (emailError) {
          console.error('❌ Error sending course re-join request notifications:', emailError);
          // Don't fail the join request if email fails
        }
        
        return { success: true };
      }
    }
    
    // Create new membership with the specified role
    const membershipData = {
      userId,
      courseId,
      role: role,
      status: 'pending',
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('🔥 joinCourse: Creating membership with role:', role);
    console.log('🔥 joinCourse: Full membership data:', membershipData);
    
    await setDoc(doc(db, 'courseMemberships', membershipId), membershipData);
    
    // Send email notifications to instructors and admins via Cloud Function
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../config/firebase');
      const sendNotifications = httpsCallable(functions, 'sendCourseJoinNotifications');
      
      const result = await sendNotifications({
        userId,
        courseId,
        requestedRole: role
      });
      
      console.log('✅ Course join request notifications sent:', result.data);
    } catch (emailError) {
      console.error('❌ Error sending course join request notifications:', emailError);
      // Don't fail the join request if email fails
    }
    
    return { success: true };
  },


  async getPendingApprovals(courseId, instructorId) {
    console.log('🔥 getPendingApprovals:', courseId, instructorId);
    
    // Query for pending memberships in the specified course
    const pendingQuery = query(
      collection(db, 'courseMemberships'),
      where('courseId', '==', courseId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingRequests = [];
    
    // Fetch user details for each pending request
    for (const membershipDoc of pendingSnapshot.docs) {
      const membership = { id: membershipDoc.id, ...membershipDoc.data() };
      
      // Fetch user details
      try {
        const userDoc = await getDoc(doc(db, 'users', membership.userId));
        if (userDoc.exists()) {
          membership.users = { id: userDoc.id, ...userDoc.data() };
        }
      } catch (error) {
        console.warn('User not found:', membership.userId);
        // Set fallback user data
        membership.users = {
          id: membership.userId,
          name: 'Unknown User',
          email: 'No email'
        };
      }
      
      pendingRequests.push(membership);
    }
    
    console.log('✅ getPendingApprovals result:', pendingRequests.length, 'pending requests');
    return pendingRequests;
  },

  async getCourseByCode(courseCode) {
    console.log('🔥 getCourseByCode:', courseCode);
    
    try {
      // Clean the course code (trim whitespace and convert to uppercase)
      const cleanCode = courseCode.trim().toUpperCase();
      console.log('🔥 Cleaned course code:', cleanCode);
      
      // Query courses by access code
      const coursesQuery = query(
        collection(db, 'courses'),
        where('accessCode', '==', cleanCode)
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      
      if (coursesSnapshot.empty) {
        throw new Error(`Course not found with access code: ${cleanCode}. Please check the code and try again.`);
      }
      
      // Get the first matching course
      const courseDoc = coursesSnapshot.docs[0];
      const course = { id: courseDoc.id, ...courseDoc.data() };
      
      console.log('✅ getCourseByCode result:', course.title);
      return course;
      
    } catch (error) {
      console.error('❌ Error getting course by code:', error);
      throw error;
    }
  },

  async getCourseMembers(courseId) {
    console.log('🔥 getCourseMembers:', courseId);
    
    try {
      // Get all memberships for this course
      const membershipsQuery = query(
        collection(db, 'courseMemberships'),
        where('courseId', '==', courseId)
      );
      
      const membershipsSnapshot = await getDocs(membershipsQuery);
      const members = [];
      
      // Fetch user details for each membership
      for (const membershipDoc of membershipsSnapshot.docs) {
        const membership = { id: membershipDoc.id, ...membershipDoc.data() };
        
        // Get user details
        try {
          const userDoc = await getDoc(doc(db, 'users', membership.userId));
          if (userDoc.exists()) {
            members.push({
              ...membership,
              users: { id: userDoc.id, ...userDoc.data() }
            });
          }
        } catch (error) {
          console.warn('User not found for membership:', membership.userId);
          // Include membership even without user details
          members.push({
            ...membership,
            users: {
              id: membership.userId,
              name: 'Unknown User',
              email: 'No email'
            }
          });
        }
      }
      
      console.log('✅ getCourseMembers result:', members.length, 'members');
      return members;
      
    } catch (error) {
      console.error('❌ Error getting course members:', error);
      throw error;
    }
  },

  async joinTrialCourse(courseCode, userId, role) {
    console.log('🔥 joinTrialCourse:', courseCode, userId, role);
    
    try {
      // Get the course first
      const course = await this.getCourseByCode(courseCode);
      
      // Check if user is already enrolled
      const existingQuery = query(
        collection(db, 'courseMemberships'),
        where('userId', '==', userId),
        where('courseId', '==', course.id)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        throw new Error('User is already enrolled in this course');
      }
      
      // Create membership with auto-approval for trial course
      const membershipId = `${userId}_${course.id}`;
      const membershipData = {
        userId,
        courseId: course.id,
        role: role,
        status: 'approved', // Auto-approve trial course memberships
        joinedAt: serverTimestamp(),
        approvedBy: 'system', // System approval for trial
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'courseMemberships', membershipId), membershipData);
      
      // Update course member counts
      await this.updateCourseMemberCounts(course.id);
      
      console.log('✅ Trial course membership created successfully');
      return { id: membershipId, ...membershipData };
      
    } catch (error) {
      console.error('❌ Error joining trial course:', error);
      throw error;
    }
  },

  async updateMembershipStatus(membershipId, status, instructorId) {
    console.log('🔥 updateMembershipStatus:', membershipId, status, instructorId);
    
    const membershipRef = doc(db, 'courseMemberships', membershipId);
    const membershipSnap = await getDoc(membershipRef);
    
    if (!membershipSnap.exists()) {
      throw new Error('Membership not found');
    }
    
    const membership = membershipSnap.data();
    
    // Update membership status
    await updateDoc(membershipRef, {
      status: status,
      approvedBy: status === 'approved' ? instructorId : null,
      rejectedBy: status === 'rejected' ? instructorId : null,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // If approved, update course member counts
    if (status === 'approved') {
      await this.updateCourseMemberCounts(membership.courseId);
    }
    
    console.log('✅ Membership status updated successfully');
    return true;
  },

  async cleanupOrphanedMemberships(courseId = null) {
    console.log('🔥 cleanupOrphanedMemberships:', courseId);
    
    let membershipsQuery;
    if (courseId) {
      membershipsQuery = query(
        collection(db, 'courseMemberships'),
        where('courseId', '==', courseId)
      );
    } else {
      membershipsQuery = query(collection(db, 'courseMemberships'));
    }
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const batch = writeBatch(db);
    let orphanedCount = 0;
    const coursesToUpdate = new Set();
    
    for (const membershipDoc of membershipsSnapshot.docs) {
      const membership = membershipDoc.data();
      
      try {
        const userDoc = await getDoc(doc(db, 'users', membership.userId));
        if (!userDoc.exists()) {
          // This is an orphaned membership - user was deleted
          console.log(`🗑️ Removing orphaned membership: user ${membership.userId} from course ${membership.courseId}`);
          batch.delete(membershipDoc.ref);
          orphanedCount++;
          coursesToUpdate.add(membership.courseId);
        }
      } catch (error) {
        console.warn('Error checking user existence:', membership.userId, error);
        // Also remove memberships where we can't verify the user
        batch.delete(membershipDoc.ref);
        orphanedCount++;
        coursesToUpdate.add(membership.courseId);
      }
    }
    
    if (orphanedCount > 0) {
      await batch.commit();
      console.log(`✅ Removed ${orphanedCount} orphaned memberships`);
      
      // Update member counts for affected courses
      for (const courseId of coursesToUpdate) {
        try {
          await this.updateCourseMemberCounts(courseId);
        } catch (error) {
          console.warn('Failed to update member count for course:', courseId, error);
        }
      }
    } else {
      console.log('✅ No orphaned memberships found');
    }
    
    return { cleaned: orphanedCount, coursesUpdated: coursesToUpdate.size };
  },

  async debugListAllCourses() {
    console.log('🔥 debugListAllCourses - Listing all courses for debugging');
    
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const courses = [];
      
      coursesSnapshot.docs.forEach(doc => {
        const course = { id: doc.id, ...doc.data() };
        courses.push(course);
        console.log('📚 Course found:', {
          id: course.id,
          title: course.title,
          accessCode: course.accessCode,
          courseCode: course.courseCode
        });
      });
      
      console.log('✅ debugListAllCourses result:', courses.length, 'courses found');
      return courses;
    } catch (error) {
      console.error('❌ debugListAllCourses error:', error);
      throw error;
    }
  },

  async updateCourseAccessCode(courseId, accessCode) {
    console.log('🔥 updateCourseAccessCode:', courseId, accessCode);
    
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        accessCode: accessCode.trim().toUpperCase(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Course access code updated successfully');
      return await this.getCourseById(courseId);
    } catch (error) {
      console.error('❌ updateCourseAccessCode error:', error);
      throw error;
    }
  },

  // Get a specific user's membership in a course
  async getUserCourseMembership(userId, courseId) {
    console.log('🔥 getUserCourseMembership:', { userId, courseId });

    try {
      const membershipId = `${userId}_${courseId}`;
      const membershipDoc = await getDoc(doc(db, 'courseMemberships', membershipId));

      if (!membershipDoc.exists()) {
        return null;
      }

      return {
        id: membershipDoc.id,
        ...membershipDoc.data()
      };
    } catch (error) {
      console.error('❌ Error getting user course membership:', error);
      throw error;
    }
  },

  // Alias for getCourseById for backwards compatibility
  async getCourse(courseId) {
    return this.getCourseById(courseId);
  },

  async cleanupOrphanedChats(courseId = null, dryRun = true) {
    console.log('🔥 cleanupOrphanedChats:', { courseId, dryRun });
    
    try {
      let chatsQuery;
      if (courseId) {
        chatsQuery = query(collection(db, 'chats'), where('courseId', '==', courseId));
      } else {
        chatsQuery = query(collection(db, 'chats'));
      }
      
      const chatsSnapshot = await getDocs(chatsQuery);
      const orphanedChats = [];
      
      console.log(`🔍 Checking ${chatsSnapshot.docs.length} chats for orphaned user references...`);
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        
        if (chatData.userId) {
          // Check if user still exists
          const userDoc = await getDoc(doc(db, 'users', chatData.userId));
          if (!userDoc.exists()) {
            orphanedChats.push({
              chatId: chatDoc.id,
              userId: chatData.userId,
              projectId: chatData.projectId,
              courseId: chatData.courseId,
              createdAt: chatData.createdAt
            });
          }
        }
      }
      
      console.log(`🔍 Found ${orphanedChats.length} orphaned chats`);
      
      if (dryRun) {
        console.log('🔍 DRY RUN - Would delete these chats:', orphanedChats);
        return {
          orphanedCount: orphanedChats.length,
          orphanedChats: orphanedChats,
          deleted: 0,
          message: `Found ${orphanedChats.length} orphaned chats. Run with dryRun=false to delete them.`
        };
      } else {
        // Actually delete the orphaned chats
        let deleted = 0;
        for (const orphan of orphanedChats) {
          await deleteDoc(doc(db, 'chats', orphan.chatId));
          deleted++;
          console.log(`🗑️ Deleted orphaned chat: ${orphan.chatId}`);
        }
        
        console.log(`✅ Cleanup complete: ${deleted} orphaned chats deleted`);
        return {
          orphanedCount: orphanedChats.length,
          deleted: deleted,
          message: `Successfully deleted ${deleted} orphaned chats`
        };
      }
    } catch (error) {
      console.error('❌ cleanupOrphanedChats error:', error);
      throw error;
    }
  }
};

// PROJECTS API
export const projectApi = {
  async createProject(projectData, userId, courseId) {
    console.log('🔥 createProject:', { projectData, userId, courseId });
    
    // SECURITY: All projects must be associated with a course
    if (!courseId) {
      throw new Error('Projects must be created within a course. CourseId is required.');
    }
    
    const docRef = await addDoc(collection(db, 'projects'), {
      title: projectData.title,
      description: projectData.description || '',
      createdBy: userId,
      courseId: courseId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return this.getProjectById(docRef.id);
  },

  async getProjectById(projectId) {
    console.log('🔥 getProjectById:', projectId);
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (projectDoc.exists()) {
      const data = projectDoc.data();
      return { 
        id: projectDoc.id, 
        ...data,
        created_at: data.createdAt?.toDate?.() || data.createdAt,
        updated_at: data.updatedAt?.toDate?.() || data.updatedAt,
        created_by: data.createdBy,
        course_id: data.courseId
      };
    }
    throw new Error('Project not found');
  },

  async getUserProjects(userId, courseId = null) {
    console.log('🔥 getUserProjects:', userId, courseId);
    
    let projectsQuery = query(
      collection(db, 'projects'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    if (courseId) {
      projectsQuery = query(
        collection(db, 'projects'),
        where('createdBy', '==', userId),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const projectsSnapshot = await getDocs(projectsQuery);
    return projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.createdAt?.toDate?.() || data.createdAt,
        updated_at: data.updatedAt?.toDate?.() || data.updatedAt,
        created_by: data.createdBy,
        course_id: data.courseId
      };
    });
  },

  async updateProject(projectId, updates) {
    console.log('🔥 updateProject:', projectId, updates);
    await updateDoc(doc(db, 'projects', projectId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return this.getProjectById(projectId);
  },

  async deleteProject(projectId) {
    console.log('🔥 deleteProject:', projectId);
    await deleteDoc(doc(db, 'projects', projectId));
  },

  async getAllProjects(courseId = null) {
    console.log('🔥 getAllProjects:', courseId);
    
    let projectsQuery;
    
    if (courseId) {
      // Query by courseId only (without orderBy to avoid composite index requirement)
      console.log('🔍 Searching for projects with courseId:', courseId);
      projectsQuery = query(
        collection(db, 'projects'),
        where('courseId', '==', courseId)
      );
    } else {
      projectsQuery = query(
        collection(db, 'projects'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const projectsSnapshot = await getDocs(projectsQuery);
    console.log(`📊 Found ${projectsSnapshot.docs.length} projects in Firebase query`);
    
    const projects = [];
    
    // Fetch user details for each project
    for (const projectDoc of projectsSnapshot.docs) {
      const project = { id: projectDoc.id, ...projectDoc.data() };
      
      // Debug: log the raw project data to see field structure
      console.log(`🔍 Raw project data:`, {
        id: project.id,
        title: project.title,
        courseId: project.courseId,
        course_id: project.course_id,
        createdBy: project.createdBy
      });
      
      // Fetch creator details
      try {
        const userDoc = await getDoc(doc(db, 'users', project.createdBy));
        if (userDoc.exists()) {
          project.users = { id: userDoc.id, ...userDoc.data() };
        }
      } catch (error) {
        console.warn('User not found for project:', project.createdBy);
        // Set fallback user data
        project.users = {
          id: project.createdBy,
          name: 'Unknown User',
          email: 'No email'
        };
      }
      
      // Handle both possible course field names
      const projectCourseId = project.courseId || project.course_id;
      
      projects.push({
        ...project,
        created_at: convertTimestamp(project.createdAt),
        updated_at: convertTimestamp(project.updatedAt),
        created_by: project.createdBy,
        course_id: projectCourseId
      });
    }
    
    // Sort projects by creation date (newest first) since we couldn't do it in the query for courseId filtering
    projects.sort((a, b) => {
      const dateA = a.created_at || new Date(0);
      const dateB = b.created_at || new Date(0);
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Additional filtering if courseId was specified but query didn't filter properly
    if (courseId) {
      const filteredProjects = projects.filter(p => p.course_id === courseId);
      console.log(`📊 After filtering by course ${courseId}: ${filteredProjects.length} of ${projects.length} projects match`);
      console.log('✅ getAllProjects result:', filteredProjects.length, 'projects for course', courseId);
      return filteredProjects;
    }
    
    console.log('✅ getAllProjects result:', projects.length, 'total projects');
    return projects;
  }
};

// CHATS API
export const chatApi = {
  async createChat(chatData, courseId) {
    console.log('🔥 createChat:', chatData, courseId);
    const docRef = await addDoc(collection(db, 'chats'), {
      prompt: chatData.prompt,
      response: chatData.response,
      tool_used: chatData.tool_used,
      userId: chatData.user_id,
      projectId: chatData.project_id,
      courseId: courseId || chatData.courseId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return this.getChatById(docRef.id);
  },

  async getChatById(chatId) {
    console.log('🔥 getChatById:', chatId);
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      const data = chatDoc.data();
      return { 
        id: chatDoc.id, 
        ...data,
        created_at: data.createdAt?.toDate?.() || data.createdAt,
        updated_at: data.updatedAt?.toDate?.() || data.updatedAt,
        user_id: data.userId,
        project_id: data.projectId,
        course_id: data.courseId
      };
    }
    throw new Error('Chat not found');
  },

  async getProjectChats(projectId) {
    console.log('🔥 getProjectChats:', projectId);
    const chatsQuery = query(
      collection(db, 'chats'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );

    const chatsSnapshot = await getDocs(chatsQuery);
    const chats = [];

    // Process each chat and load reflections
    for (const doc of chatsSnapshot.docs) {
      const data = doc.data();
      const chatData = {
        id: doc.id,
        ...data,
        created_at: data.createdAt?.toDate?.() || data.createdAt,
        updated_at: data.updatedAt?.toDate?.() || data.updatedAt,
        user_id: data.userId,
        project_id: data.projectId,
        course_id: data.courseId,
        reflections: [] // Initialize with empty array
      };

      // Load reflection for this chat if it has one
      if (data.has_reflection) {
        console.log(`🔍 Chat ${doc.id} has_reflection flag is true, loading reflection...`);
        try {
          const reflection = await reflectionApi.getReflectionByChat(doc.id);
          if (reflection) {
            chatData.reflections = [reflection];
            console.log(`✅ Loaded reflection for chat ${doc.id}`);
          } else {
            console.warn(`⚠️ Chat ${doc.id} marked as having reflection but none found`);
          }
        } catch (error) {
          console.error(`❌ Error loading reflection for chat ${doc.id}:`, error);
        }
      } else {
        console.log(`ℹ️ Chat ${doc.id} has no reflection (has_reflection: ${data.has_reflection})`);
      }

      chats.push(chatData);
    }

    console.log(`✅ Loaded ${chats.length} chats for project ${projectId}, ${chats.filter(c => c.reflections.length > 0).length} have reflections`);
    return chats;
  },

  async getUserChats(userId, courseId = null, limitCount = 100) {
    console.log('🔥 getUserChats:', userId, courseId, limitCount);
    
    let chatsQuery = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (courseId) {
      chatsQuery = query(
        collection(db, 'chats'),
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const chatsSnapshot = await getDocs(chatsQuery);
    return chatsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    }));
  },

  async getChatsWithFilters(filters = {}) {
    console.log('🔥 getChatsWithFilters:', filters);
    
    // Build query based on filters
    let queryConstraints = [orderBy('createdAt', 'desc')];
    
    if (filters.courseId) {
      queryConstraints.unshift(where('courseId', '==', filters.courseId));
    }
    
    if (filters.userId) {
      queryConstraints.unshift(where('userId', '==', filters.userId));
    }
    
    if (filters.projectId) {
      queryConstraints.unshift(where('projectId', '==', filters.projectId));
    }
    
    if (filters.toolUsed) {
      // Database field is tool_used (snake_case)
      queryConstraints.unshift(where('tool_used', '==', filters.toolUsed));
    }
    
    if (filters.startDate) {
      queryConstraints.unshift(where('createdAt', '>=', new Date(filters.startDate)));
    }
    
    if (filters.endDate) {
      // Add one day to end date to include the entire end date
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      queryConstraints.unshift(where('createdAt', '<', endDate));
    }
    
    if (filters.limit) {
      queryConstraints.push(limit(filters.limit));
    }
    
    const chatsQuery = query(collection(db, 'chats'), ...queryConstraints);
    
    const chatsSnapshot = await getDocs(chatsQuery);
    const chats = [];
    
    // Enrich each chat with user and project information
    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = { id: chatDoc.id, ...chatDoc.data() };
      
      // Convert timestamps
      chatData.created_at = convertTimestamp(chatData.createdAt);
      chatData.updated_at = convertTimestamp(chatData.updatedAt);
      chatData.user_id = chatData.userId;
      chatData.project_id = chatData.projectId;
      chatData.course_id = chatData.courseId;
      chatData.user_message = chatData.userMessage;
      chatData.ai_response = chatData.aiResponse;
      // Handle both possible field names for tool_used
      chatData.tool_used = chatData.tool_used || chatData.toolUsed;
      
      // Fetch user information
      try {
        if (chatData.userId) {
          const userDoc = await getDoc(doc(db, 'users', chatData.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            chatData.users = { id: userDoc.id, ...userData };
          } else {
            // Log orphaned chats only once per session to reduce console noise
            if (!window.loggedOrphanedChats) window.loggedOrphanedChats = new Set();
            if (!window.loggedOrphanedChats.has(chatData.userId)) {
              console.warn(`⚠️ Orphaned chat found - User ${chatData.userId} no longer exists (chat: ${chatData.id})`);
              window.loggedOrphanedChats.add(chatData.userId);
            }
            
            chatData.users = { name: 'Deleted User', email: 'User no longer exists' };
          }
        } else {
          console.warn(`❌ No userId found for chat ${chatData.id}`);
          chatData.users = { name: 'Unknown User', email: 'No email' };
        }
      } catch (error) {
        console.error(`❌ Error fetching user for chat ${chatData.id}:`, error);
        chatData.users = { name: 'Unknown User', email: 'No email' };
      }
      
      // Fetch project information
      try {
        if (chatData.projectId) {
          const projectDoc = await getDoc(doc(db, 'projects', chatData.projectId));
          if (projectDoc.exists()) {
            chatData.projects = { id: projectDoc.id, ...projectDoc.data() };
          } else {
            console.warn('Project not found for chat:', chatData.projectId);
            chatData.projects = { title: 'Untitled Project' };
          }
        }
      } catch (error) {
        console.warn('Error fetching project for chat:', chatData.projectId, error);
        chatData.projects = { title: 'Untitled Project' };
      }
      
      // Load reflections for this chat if it has any
      try {
        if (chatData.has_reflection) {
          console.log(`🔍 Loading reflection for chat ${chatData.id}`);
          const reflection = await reflectionApi.getReflectionByChat(chatData.id);
          chatData.reflections = reflection ? [reflection] : [];
          console.log(`✅ Loaded reflection for chat ${chatData.id}:`, reflection ? 'Found' : 'Not found');
        } else {
          chatData.reflections = [];
        }
      } catch (error) {
        console.warn('❌ Error loading reflection for chat:', chatData.id, error);
        chatData.reflections = [];
      }
      
      // Load tags for this chat
      try {
        const chatTags = await tagApi.getChatTags(chatData.id);
        chatData.chat_tags = chatTags;
      } catch (error) {
        console.warn('❌ Error loading tags for chat:', chatData.id, error);
        chatData.chat_tags = [];
      }
      
      chats.push(chatData);
    }
    
    console.log(`✅ getChatsWithFilters loaded ${chats.length} chats with enriched data`);
    return chats;
  },

  // Optimized version with batch fetching for better performance
  async getChatsWithFiltersOptimized(filters = {}) {
    console.log('🚀 getChatsWithFiltersOptimized:', filters);
    
    // Build query based on filters (same as before)
    let queryConstraints = [orderBy('createdAt', 'desc')];
    
    if (filters.courseId) {
      queryConstraints.unshift(where('courseId', '==', filters.courseId));
    }
    
    if (filters.userId) {
      queryConstraints.unshift(where('userId', '==', filters.userId));
    }
    
    if (filters.projectId) {
      queryConstraints.unshift(where('projectId', '==', filters.projectId));
    }
    
    if (filters.toolUsed) {
      queryConstraints.unshift(where('tool_used', '==', filters.toolUsed));
    }
    
    if (filters.startDate) {
      queryConstraints.unshift(where('createdAt', '>=', new Date(filters.startDate)));
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      queryConstraints.unshift(where('createdAt', '<', endDate));
    }
    
    if (filters.limit) {
      queryConstraints.push(limit(filters.limit));
    }
    
    const chatsQuery = query(collection(db, 'chats'), ...queryConstraints);
    const snapshot = await getDocs(chatsQuery);
    
    // First pass: collect all chats and unique IDs
    const chats = [];
    const userIds = new Set();
    const projectIds = new Set();
    const chatIdsWithReflections = [];
    
    snapshot.forEach(doc => {
      const chatData = { id: doc.id, ...doc.data() };
      
      // Normalize field names
      chatData.createdAt = convertTimestamp(chatData.createdAt);
      chatData.updatedAt = convertTimestamp(chatData.updatedAt);
      chatData.created_at = chatData.createdAt;
      chatData.user_id = chatData.userId;
      chatData.project_id = chatData.projectId;
      chatData.course_id = chatData.courseId;
      chatData.user_message = chatData.userMessage;
      chatData.ai_response = chatData.aiResponse;
      chatData.tool_used = chatData.tool_used || chatData.toolUsed;
      
      // Collect unique IDs for batch fetching
      if (chatData.userId) userIds.add(chatData.userId);
      if (chatData.projectId) projectIds.add(chatData.projectId);
      if (chatData.has_reflection) chatIdsWithReflections.push(chatData.id);
      
      chats.push(chatData);
    });
    
    // Batch fetch users (max 10 per batch due to Firestore limits)
    const userMap = new Map();
    const userIdArray = Array.from(userIds);
    const uncachedUserIds = [];
    
    // Check cache first
    userIdArray.forEach(userId => {
      const cachedUser = dataCache.getUser(userId);
      if (cachedUser) {
        userMap.set(userId, cachedUser);
      } else {
        uncachedUserIds.push(userId);
      }
    });
    
    // Fetch only uncached users
    for (let i = 0; i < uncachedUserIds.length; i += 10) {
      const batch = uncachedUserIds.slice(i, i + 10);
      const userQuery = query(collection(db, 'users'), where('__name__', 'in', batch));
      const userSnapshot = await getDocs(userQuery);
      
      userSnapshot.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        userMap.set(doc.id, userData);
        dataCache.setUser(doc.id, userData); // Cache for future use
      });
    }
    
    console.log(`📊 Cache performance: ${userIdArray.length - uncachedUserIds.length}/${userIdArray.length} users from cache`);
    
    // Batch fetch projects
    const projectMap = new Map();
    const projectIdArray = Array.from(projectIds);
    const uncachedProjectIds = [];
    
    // Check cache first
    projectIdArray.forEach(projectId => {
      const cachedProject = dataCache.getProject(projectId);
      if (cachedProject) {
        projectMap.set(projectId, cachedProject);
      } else {
        uncachedProjectIds.push(projectId);
      }
    });
    
    // Fetch only uncached projects
    for (let i = 0; i < uncachedProjectIds.length; i += 10) {
      const batch = uncachedProjectIds.slice(i, i + 10);
      const projectQuery = query(collection(db, 'projects'), where('__name__', 'in', batch));
      const projectSnapshot = await getDocs(projectQuery);
      
      projectSnapshot.forEach(doc => {
        const projectData = { id: doc.id, ...doc.data() };
        projectMap.set(doc.id, projectData);
        dataCache.setProject(doc.id, projectData); // Cache for future use
      });
    }
    
    console.log(`📊 Cache performance: ${projectIdArray.length - uncachedProjectIds.length}/${projectIdArray.length} projects from cache`);
    
    // Skip individual reflection and tag fetching for now (can be loaded on-demand)
    // This saves hundreds of additional queries
    
    // Enrich chats with batch-fetched data
    for (const chatData of chats) {
      // Add user data from cache
      if (chatData.userId) {
        chatData.users = userMap.get(chatData.userId) || { 
          name: 'Unknown User', 
          email: 'No email' 
        };
      }
      
      // Add project data from cache
      if (chatData.projectId) {
        chatData.projects = projectMap.get(chatData.projectId) || { 
          title: 'Untitled Project' 
        };
      }
      
      // Initialize empty arrays for reflections and tags (load on-demand if needed)
      chatData.reflections = [];
      chatData.chat_tags = [];
    }
    
    console.log(`✅ getChatsWithFiltersOptimized loaded ${chats.length} chats with batch fetching`);
    console.log(`📊 Performance: ${userIds.size} users and ${projectIds.size} projects fetched in ${Math.ceil(userIds.size/10) + Math.ceil(projectIds.size/10)} batches instead of ${chats.length * 2} individual queries`);
    
    return chats;
  },

  async updateChat(chatId, updates) {
    console.log('🔥 updateChat:', chatId, updates);
    await updateDoc(doc(db, 'chats', chatId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return this.getChatById(chatId);
  },

  async deleteChat(chatId) {
    console.log('🔥 deleteChat:', chatId);
    await deleteDoc(doc(db, 'chats', chatId));
  },

  async fixMissingToolUsed(courseId = null) {
    console.log('🔧 fixMissingToolUsed - Starting migration for courseId:', courseId);
    
    try {
      // Build query to get all chats for the course
      let queryConstraints = [];
      
      // If courseId specified, filter by course
      if (courseId) {
        queryConstraints.push(where('courseId', '==', courseId));
      }
      
      // Query for all chats, then filter for missing tool_used in JavaScript
      const chatsQuery = query(collection(db, 'chats'), ...queryConstraints);
      const chatsSnapshot = await getDocs(chatsQuery);
      
      console.log(`🔧 Found ${chatsSnapshot.docs.length} total chats to check`);
      
      // Filter for chats with missing or empty tool_used
      const chatsToFix = [];
      chatsSnapshot.docs.forEach((chatDoc) => {
        const chatData = chatDoc.data();
        const toolUsed = chatData.tool_used;
        
        // Check if tool_used is missing, null, empty string, or undefined
        if (!toolUsed || toolUsed === '' || toolUsed === null) {
          chatsToFix.push(chatDoc);
        }
      });
      
      console.log(`🔧 Found ${chatsToFix.length} chats with missing tool_used`);
      
      if (chatsToFix.length === 0) {
        return { fixed: 0, message: 'No chats found with missing tool_used' };
      }
      
      // Set default tool_used based on creation date
      // Newer chats (after 2025) likely used GPT-5 Mini (default)
      // Older chats might have used Claude Sonnet 4 or other tools
      const batch = writeBatch(db);
      let fixCount = 0;
      
      chatsToFix.forEach((chatDoc) => {
        const chatData = chatDoc.data();
        const createdAt = chatData.createdAt?.toDate?.() || new Date(chatData.createdAt || Date.now());
        
        // Default to GPT-5 Mini for recent chats, Claude Sonnet 4 for older ones
        const defaultTool = createdAt > new Date('2025-01-01') ? 'GPT-5 Mini' : 'Claude Sonnet 4';
        
        console.log(`🔧 Fixing chat ${chatDoc.id}: setting tool_used to "${defaultTool}"`);
        
        batch.update(doc(db, 'chats', chatDoc.id), {
          tool_used: defaultTool,
          updatedAt: serverTimestamp()
        });
        
        fixCount++;
      });
      
      // Execute the batch update
      await batch.commit();
      
      console.log(`✅ Successfully fixed ${fixCount} chats with missing tool_used`);
      return { 
        fixed: fixCount, 
        message: `Fixed ${fixCount} chats with missing AI tool data` 
      };
      
    } catch (error) {
      console.error('❌ Error fixing missing tool_used:', error);
      throw new Error(`Failed to fix missing tool_used: ${error.message}`);
    }
  },

  async fixOrphanedChats(courseId = null) {
    console.log('🔧 fixOrphanedChats - Starting repair for courseId:', courseId);
    
    try {
      // Build query to get all chats for the course
      let queryConstraints = [];
      
      // If courseId specified, filter by course
      if (courseId) {
        queryConstraints.push(where('courseId', '==', courseId));
      }
      
      const chatsQuery = query(collection(db, 'chats'), ...queryConstraints);
      const chatsSnapshot = await getDocs(chatsQuery);
      
      console.log(`🔧 Found ${chatsSnapshot.docs.length} total chats to check`);
      
      // Get all users to create a lookup map
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersByEmail = new Map();
      const usersById = new Map();
      
      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        usersById.set(userDoc.id, userData);
        if (userData.email) {
          usersByEmail.set(userData.email.toLowerCase(), { id: userDoc.id, ...userData });
        }
      });
      
      console.log(`📋 Found ${usersById.size} users in database`);
      
      const batch = writeBatch(db);
      let fixedCount = 0;
      let orphanedCount = 0;
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        const currentUserId = chatData.userId;
        
        // Check if user exists
        if (currentUserId && usersById.has(currentUserId)) {
          // User exists, no fix needed
          continue;
        }
        
        // User not found - try to fix by matching email or other criteria
        console.log(`🔧 Attempting to fix orphaned chat ${chatDoc.id} with userId: ${currentUserId}`);
        
        // For now, we'll mark these as orphaned and potentially match by project owner
        if (chatData.projectId) {
          try {
            const projectDoc = await getDoc(doc(db, 'projects', chatData.projectId));
            if (projectDoc.exists()) {
              const projectData = projectDoc.data();
              const projectOwnerId = projectData.createdBy;
              
              if (projectOwnerId && usersById.has(projectOwnerId)) {
                console.log(`✅ Fixing chat ${chatDoc.id}: linking to project owner ${projectOwnerId}`);
                batch.update(doc(db, 'chats', chatDoc.id), {
                  userId: projectOwnerId,
                  fixedOrphan: true,
                  fixedAt: serverTimestamp(),
                  originalUserId: currentUserId,
                  updatedAt: serverTimestamp()
                });
                fixedCount++;
              } else {
                orphanedCount++;
              }
            } else {
              orphanedCount++;
            }
          } catch (error) {
            console.warn(`Failed to fix chat ${chatDoc.id}:`, error);
            orphanedCount++;
          }
        } else {
          orphanedCount++;
        }
      }
      
      if (fixedCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully fixed ${fixedCount} orphaned chats`);
      }
      
      if (orphanedCount > 0) {
        console.log(`⚠️ Found ${orphanedCount} chats that couldn't be automatically fixed`);
      }
      
      return { 
        fixed: fixedCount, 
        orphaned: orphanedCount,
        message: `Fixed ${fixedCount} orphaned chats. ${orphanedCount} chats still need manual attention.` 
      };
      
    } catch (error) {
      console.error('❌ Error fixing orphaned chats:', error);
      throw new Error(`Failed to fix orphaned chats: ${error.message}`);
    }
  }
};

// PDF ATTACHMENTS API
export const attachmentApi = {
  async uploadPDFAttachment(file, chatId, userId) {
    console.log('🔥 uploadPDFAttachment:', file.name, chatId, userId);
    
    try {
      // Extract text from document
      let extractedText = '';
      if (isSupportedDocument(file)) {
        const docType = getDocumentType(file);
        console.log(`📄 Extracting text from ${docType} document...`);
        extractedText = await extractTextFromDocument(file);
        console.log(`📄 Text extraction completed for ${docType}:`, extractedText.length, 'characters');
      } else {
        extractedText = `[This file type is not supported. Supported formats: PDF, TXT, DOC, DOCX]`;
      }
      
      // Create storage reference
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `pdf-uploads/${userId}/${chatId}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create attachment document with extracted text
      const attachmentData = {
        chatId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream', // Add file type
        storageRef: snapshot.ref.fullPath,
        downloadURL,
        extractedText,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'pdfAttachments'), attachmentData);
      
      return {
        id: docRef.id,
        ...attachmentData,
        file_name: file.name,
        extracted_text: extractedText
      };
      
    } catch (error) {
      console.error('❌ Error uploading PDF attachment:', error);
      throw error;
    }
  },

  async getChatAttachments(chatId) {
    console.log('🔥 getChatAttachments:', chatId);
    const attachmentsQuery = query(
      collection(db, 'pdfAttachments'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc')
    );
    
    const attachmentsSnapshot = await getDocs(attachmentsQuery);
    return attachmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Normalize field names for consistent access
        file_name: data.fileName || data.file_name || 'Unknown File',
        file_size: data.fileSize || data.file_size || 0,
        storage_path: data.storageRef || data.storage_path || data.downloadURL,
        extracted_text: data.extractedText || data.extracted_text || ''
      };
    });
  },

  async getAttachmentDownloadUrl(storagePath) {
    console.log('🔥 getAttachmentDownloadUrl:', storagePath);
    
    try {
      // If storagePath is actually the downloadURL (for Firebase attachments), return it directly
      if (storagePath && storagePath.startsWith('https://')) {
        return storagePath;
      }
      
      // Otherwise, get the download URL from Firebase Storage
      const storageRef = ref(storage, storagePath);
      const downloadURL = await getDownloadURL(storageRef);
      
      console.log('✅ Got download URL for:', storagePath);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error getting download URL:', error);
      throw error;
    }
  },

  async getStudentAttachments(courseId, studentId) {
    console.log('📚 getStudentAttachments:', courseId, studentId);
    
    try {
      // Get all projects for this student in the course
      // Based on createProject, fields are: createdBy and courseId (camelCase)
      const projectsQuery = query(
        collection(db, 'projects'),
        where('courseId', '==', courseId),
        where('createdBy', '==', studentId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      let projectIds = projectsSnapshot.docs.map(doc => doc.id);
      
      if (projectIds.length === 0) {
        console.log('📚 No projects found for student in course');
        return [];
      }
      
      console.log('📚 Found student projects:', projectIds.length);
      
      // Get all chats for these projects (in batches if needed)
      const allChatIds = [];
      for (let i = 0; i < projectIds.length; i += 10) {
        const projectBatch = projectIds.slice(i, i + 10);
        
        // Try with projectId field first
        let chatsQuery = query(
          collection(db, 'chats'),
          where('projectId', 'in', projectBatch),
          where('userId', '==', studentId)
        );
        let chatsSnapshot = await getDocs(chatsQuery);
        
        // If no results, try with underscore field names
        if (chatsSnapshot.empty) {
          chatsQuery = query(
            collection(db, 'chats'),
            where('project_id', 'in', projectBatch),
            where('user_id', '==', studentId)
          );
          chatsSnapshot = await getDocs(chatsQuery);
        }
        
        const chatIds = chatsSnapshot.docs.map(doc => doc.id);
        allChatIds.push(...chatIds);
      }
      
      if (allChatIds.length === 0) {
        console.log('📚 No chats found for student projects');
        return [];
      }
      
      console.log('📚 Found student chats:', allChatIds.length);
      
      // Get all attachments for these chats (in batches if needed)
      const allAttachments = [];
      for (let i = 0; i < allChatIds.length; i += 10) {
        const chatBatch = allChatIds.slice(i, i + 10);
        const attachmentsQuery = query(
          collection(db, 'pdfAttachments'),
          where('chatId', 'in', chatBatch),
          orderBy('createdAt', 'desc')
        );
        const attachmentsSnapshot = await getDocs(attachmentsQuery);
        allAttachments.push(...attachmentsSnapshot.docs);
      }
      
      // Deduplicate attachments by ID
      const uniqueAttachmentDocs = Array.from(
        new Map(allAttachments.map(doc => [doc.id, doc])).values()
      );
      
      console.log('📚 Found student attachments:', uniqueAttachmentDocs.length);
      
      // Get project details for each attachment
      const attachments = [];
      const projectCache = new Map();
      
      for (const attachmentDoc of uniqueAttachmentDocs) {
        const attachment = { id: attachmentDoc.id, ...attachmentDoc.data() };
        
        // Get project info from chat
        const chatDoc = await getDoc(doc(db, 'chats', attachment.chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          
          // Get or cache project details (try both field names)
          const projectId = chatData.projectId || chatData.project_id;
          if (projectId) {
            let projectData;
            if (projectCache.has(projectId)) {
              projectData = projectCache.get(projectId);
            } else {
              const projectDoc = await getDoc(doc(db, 'projects', projectId));
              if (projectDoc.exists()) {
                projectData = projectDoc.data();
                projectCache.set(projectId, projectData);
              }
            }
            
            if (projectData) {
              attachment.project = projectData;
            }
          }
        }
        
        attachments.push(attachment);
      }
      
      // Sort by date (newest first)
      attachments.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('📚 Returning student attachments:', attachments.length);
      return attachments;
      
    } catch (error) {
      console.error('❌ Error getting student attachments:', error);
      return [];
    }
  },

  async getCourseAttachments(courseId, instructorId) {
    console.log('🔥 getCourseAttachments:', courseId, instructorId);
    
    try {
      // Get all chats for projects in this course
      const projectsQuery = query(
        collection(db, 'projects'),
        where('courseId', '==', courseId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectIds = projectsSnapshot.docs.map(doc => doc.id);
      
      if (projectIds.length === 0) {
        console.log('🔥 No projects found for course:', courseId);
        return [];
      }
      
      console.log('🔥 Found projects for course:', projectIds.length);
      
      // Batch project IDs into chunks of 10 (Firestore 'in' limit)
      const projectBatches = [];
      for (let i = 0; i < projectIds.length; i += 10) {
        projectBatches.push(projectIds.slice(i, i + 10));
      }
      
      // Get all chats for these projects (in batches)
      const allChatIds = [];
      for (const projectBatch of projectBatches) {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('projectId', 'in', projectBatch)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        const chatIds = chatsSnapshot.docs.map(doc => doc.id);
        allChatIds.push(...chatIds);
      }
      
      if (allChatIds.length === 0) {
        console.log('🔥 No chats found for course projects');
        return [];
      }
      
      console.log('🔥 Found chats for course:', allChatIds.length);
      
      // Batch chat IDs into chunks of 10 (Firestore 'in' limit)
      const chatBatches = [];
      for (let i = 0; i < allChatIds.length; i += 10) {
        chatBatches.push(allChatIds.slice(i, i + 10));
      }
      
      // Get all attachments for these chats (in batches)
      const allAttachments = [];
      for (const chatBatch of chatBatches) {
        const attachmentsQuery = query(
          collection(db, 'pdfAttachments'),
          where('chatId', 'in', chatBatch),
          orderBy('createdAt', 'desc')
        );
        const attachmentsSnapshot = await getDocs(attachmentsQuery);
        allAttachments.push(...attachmentsSnapshot.docs);
      }
      
      console.log('🔥 Found raw attachments for course:', allAttachments.length);
      
      // Deduplicate attachments by ID (in case of duplicate queries)
      const uniqueAttachmentDocs = Array.from(
        new Map(allAttachments.map(doc => [doc.id, doc])).values()
      );
      console.log('🔥 Unique attachments after deduplication:', uniqueAttachmentDocs.length);
      
      // Get detailed data for each attachment with user and project info
      const attachments = [];
      for (const attachmentDoc of uniqueAttachmentDocs) {
        const attachment = { id: attachmentDoc.id, ...attachmentDoc.data() };
        
        // Get chat details to find user and project info
        const chatDoc = await getDoc(doc(db, 'chats', attachment.chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          
          // Get user details
          if (chatData.userId) {
            const userDoc = await getDoc(doc(db, 'users', chatData.userId));
            if (userDoc.exists()) {
              attachment.chats = {
                users: userDoc.data()
              };
            }
          }
          
          // Get project details
          if (chatData.projectId) {
            const projectDoc = await getDoc(doc(db, 'projects', chatData.projectId));
            if (projectDoc.exists()) {
              attachment.chats = {
                ...attachment.chats,
                projects: projectDoc.data()
              };
            }
          }
        }
        
        attachments.push(attachment);
      }
      
      // Sort attachments by createdAt date (newest first)
      attachments.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log('🔥 Found attachments for course:', attachments.length);
      return attachments;
      
    } catch (error) {
      console.error('❌ Error getting course attachments:', error);
      return [];
    }
  },

  // Course Materials API (for instructor-managed library)
  async uploadCourseMaterial(materialData) {
    console.log('📚 uploadCourseMaterial START:', {
      fileName: materialData.file.name,
      courseId: materialData.courseId,
      uploadedBy: materialData.uploadedBy,
      visibility: materialData.visibility
    });

    try {
      const { file, courseId, uploadedBy, category, visibility, title, description } = materialData;
      
      // Extract text from document if supported
      let extractedText = '';
      if (isSupportedDocument(file)) {
        const docType = getDocumentType(file);
        console.log(`📄 Extracting text from ${docType} document...`);
        extractedText = await extractTextFromDocument(file);
      }
      
      // Create storage reference for course materials
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `course-materials/${courseId}/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Create course material document
      const materialDoc = {
        courseId,
        uploadedBy,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description: description || '',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        category: category || 'resource',
        visibility: visibility || 'visible',
        storageRef: snapshot.ref.fullPath,
        downloadURL,
        extractedText,
        uploadedAt: serverTimestamp(),
        accessCount: 0,
        lastAccessed: null
      };
      
      const docRef = await addDoc(collection(db, 'courseMaterials'), materialDoc);
      console.log('✅ Course material uploaded successfully:', {
        docId: docRef.id,
        courseId,
        fileName: file.name,
        visibility: materialDoc.visibility
      });

      return {
        id: docRef.id,
        ...materialDoc,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date()
      };
      
    } catch (error) {
      console.error('❌ Error uploading course material:', error);
      throw error;
    }
  },

  async getCourseMaterials(courseId) {
    console.log('📚 getCourseMaterials START for course:', courseId);
    
    try {
      const materialsQuery = query(
        collection(db, 'courseMaterials'),
        where('courseId', '==', courseId),
        orderBy('uploadedAt', 'desc')
      );
      
      const snapshot = await getDocs(materialsQuery);
      console.log(`📚 Found ${snapshot.docs.length} materials for course ${courseId}`);

      const materials = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          file_name: data.fileName,
          file_size: data.fileSize,
          file_type: data.fileType,
          uploaded_at: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt || 0)
        };
      });

      console.log('📚 Mapped materials:', materials.map(m => ({
        id: m.id,
        fileName: m.file_name,
        visibility: m.visibility
      })));

      return materials;
    } catch (error) {
      console.error('❌ Error getting course materials:', error);
      return [];
    }
  },

  async getVisibleCourseMaterials(courseId) {
    console.log('📚 getVisibleCourseMaterials:', courseId);
    
    try {
      // Simplified query - just filter by courseId and visibility
      const materialsQuery = query(
        collection(db, 'courseMaterials'),
        where('courseId', '==', courseId),
        where('visibility', '==', 'visible')
      );
      
      const snapshot = await getDocs(materialsQuery);
      const materials = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          file_name: data.fileName,
          file_size: data.fileSize,
          file_type: data.fileType,
          uploaded_at: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt || 0)
        };
      });
      
      // Sort in JavaScript instead of Firestore
      materials.sort((a, b) => {
        // First by category
        const catCompare = (a.category || '').localeCompare(b.category || '');
        if (catCompare !== 0) return catCompare;
        // Then by date (newest first)
        return (b.uploaded_at || new Date(0)) - (a.uploaded_at || new Date(0));
      });
      
      console.log(`📚 Found ${materials.length} visible course materials for course ${courseId}`);
      return materials;
    } catch (error) {
      console.error('❌ Error getting visible course materials:', error);
      console.error('Error details:', error.message);
      return [];
    }
  },

  async updateCourseMaterial(materialId, updates) {
    console.log('📚 updateCourseMaterial:', materialId);
    
    try {
      const materialRef = doc(db, 'courseMaterials', materialId);
      await updateDoc(materialRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating course material:', error);
      throw error;
    }
  },

  async deleteCourseMaterial(materialId) {
    console.log('📚 deleteCourseMaterial:', materialId);
    
    try {
      // Get the material first to delete the storage file
      const materialRef = doc(db, 'courseMaterials', materialId);
      const materialDoc = await getDoc(materialRef);
      
      if (materialDoc.exists()) {
        const data = materialDoc.data();
        
        // Delete from storage if path exists
        if (data.storageRef) {
          try {
            const storageRefObj = ref(storage, data.storageRef);
            await deleteObject(storageRefObj);
          } catch (storageError) {
            console.warn('Could not delete storage file:', storageError);
          }
        }
        
        // Delete the document
        await deleteDoc(materialRef);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting course material:', error);
      throw error;
    }
  },

  async trackMaterialAccess(materialId, userId) {
    console.log('📚 trackMaterialAccess:', materialId);
    
    try {
      const materialRef = doc(db, 'courseMaterials', materialId);
      await updateDoc(materialRef, {
        accessCount: increment(1),
        lastAccessed: serverTimestamp(),
        lastAccessedBy: userId
      });
    } catch (error) {
      console.error('Warning: Could not track material access:', error);
    }
  },

  async deleteAttachment(attachmentId) {
    console.log('🗑️ deleteAttachment:', attachmentId);
    
    try {
      // Get the attachment first to delete the storage file
      const attachmentRef = doc(db, 'pdfAttachments', attachmentId);
      const attachmentDoc = await getDoc(attachmentRef);
      
      if (attachmentDoc.exists()) {
        const data = attachmentDoc.data();
        
        // Delete from storage if path exists
        if (data.storageRef || data.storagePath) {
          try {
            const storagePath = data.storageRef || data.storagePath;
            const storageRefObj = ref(storage, storagePath);
            await deleteObject(storageRefObj);
            console.log('🗑️ Deleted file from storage:', storagePath);
          } catch (storageError) {
            console.warn('Could not delete storage file:', storageError);
          }
        }
        
        // Delete the document from Firestore
        await deleteDoc(attachmentRef);
        console.log('🗑️ Deleted attachment document from Firestore');
        
        return { success: true };
      } else {
        throw new Error('Attachment not found');
      }
    } catch (error) {
      console.error('❌ Error deleting attachment:', error);
      throw error;
    }
  }
};

// TAGS API
export const tagApi = {
  async getAllTags(courseId = null) {
    console.log('🔥 getAllTags:', courseId);
    
    if (courseId) {
      // Load both global tags (no courseId) and course-specific tags
      const [globalTags, courseTags] = await Promise.all([
        // Global tags (courseId is null or undefined)
        getDocs(query(
          collection(db, 'tags'),
          where('courseId', '==', null),
          orderBy('name')
        )),
        // Course-specific tags
        getDocs(query(
          collection(db, 'tags'),
          where('courseId', '==', courseId),
          orderBy('name')
        ))
      ]);
      
      const allTags = [
        ...globalTags.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isGlobal: true
        })),
        ...courseTags.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isGlobal: false
        }))
      ];
      
      // Sort combined tags alphabetically
      return allTags.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Load all tags when no courseId is specified
      const tagsQuery = query(collection(db, 'tags'), orderBy('name'));
      const tagsSnapshot = await getDocs(tagsQuery);
      return tagsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  },

  async createTag(tagData, courseId, userRole) {
    console.log('🔥 createTag:', tagData, courseId, userRole);
    
    // Only instructors and admins can create tags
    if (userRole !== 'instructor' && userRole !== 'admin') {
      throw new Error('Permission denied: Only instructors and admins can create tags');
    }
    
    // Convert course_id to courseId for Firebase consistency
    const { course_id, ...restTagData } = tagData;
    const docRef = await addDoc(collection(db, 'tags'), {
      ...restTagData,
      courseId: course_id || null, // Use courseId field name for Firebase
      createdAt: serverTimestamp()
    });
    
    return this.getTagById(docRef.id);
  },

  async getTagById(tagId) {
    console.log('🔥 getTagById:', tagId);
    const tagDoc = await getDoc(doc(db, 'tags', tagId));
    if (tagDoc.exists()) {
      return { id: tagDoc.id, ...tagDoc.data() };
    }
    throw new Error('Tag not found');
  },

  async getCourseTagsWithUsage(courseId) {
    console.log('🔥 getCourseTagsWithUsage:', courseId);
    
    try {
      // Get course-specific tags
      const courseTagsQuery = query(
        collection(db, 'tags'),
        where('courseId', '==', courseId),
        orderBy('name')
      );
      const courseTagsSnapshot = await getDocs(courseTagsQuery);
      const courseTags = courseTagsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get usage counts by directly querying chats in this course, then counting tags
      // This is more efficient and avoids permission issues
      const tagsWithUsage = [];
      for (const tag of courseTags) {
        try {
          // Get chats in this course that are tagged with this tag
          // We'll use a more efficient approach by getting chats first, then filtering by tags
          const chatsInCourseQuery = query(
            collection(db, 'chats'),
            where('courseId', '==', courseId)
          );
          const chatsSnapshot = await getDocs(chatsInCourseQuery);
          
          // Now count how many of these chats have this tag
          let courseSpecificUsageCount = 0;
          const chatIds = chatsSnapshot.docs.map(doc => doc.id);
          
          if (chatIds.length > 0) {
            // Get all chatTags for this tag that reference chats in this course
            const chatTagsQuery = query(
              collection(db, 'chatTags'),
              where('tagId', '==', tag.id)
            );
            const chatTagsSnapshot = await getDocs(chatTagsQuery);
            
            // Count only those that reference chats in this course
            for (const chatTagDoc of chatTagsSnapshot.docs) {
              const chatTag = chatTagDoc.data();
              if (chatIds.includes(chatTag.chatId)) {
                courseSpecificUsageCount++;
              }
            }
          }
          
          tagsWithUsage.push({
            ...tag,
            usage_count: courseSpecificUsageCount
          });
        } catch (error) {
          console.warn('Error getting usage for tag:', tag.id, error);
          tagsWithUsage.push({
            ...tag,
            usage_count: 0
          });
        }
      }

      console.log('🔥 Course tags with usage (course-specific):', tagsWithUsage.length);
      return tagsWithUsage;
      
    } catch (error) {
      console.error('❌ Error getting course tags with usage:', error);
      return [];
    }
  },

  async getGlobalTagsWithUsage(courseId) {
    console.log('🔥 getGlobalTagsWithUsage:', courseId);
    
    try {
      // For now, let's try a different approach - get all tags and filter for global ones
      // This avoids the courseId == null query which might have permission issues
      const allTagsQuery = query(
        collection(db, 'tags'),
        orderBy('name')
      );
      const allTagsSnapshot = await getDocs(allTagsQuery);
      
      // Filter for global tags (ones without courseId or with isGlobal flag)
      const globalTags = allTagsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(tag => !tag.courseId || tag.isGlobal === true);

      // Get usage counts by querying chats in this course first
      // This is more efficient and avoids permission issues
      const tagsWithUsage = [];
      
      // Get all chats in this course once
      let chatsInCourse = [];
      try {
        const chatsInCourseQuery = query(
          collection(db, 'chats'),
          where('courseId', '==', courseId)
        );
        const chatsSnapshot = await getDocs(chatsInCourseQuery);
        chatsInCourse = chatsSnapshot.docs.map(doc => doc.id);
      } catch (error) {
        console.warn('Could not load chats for course:', courseId, error);
      }

      for (const tag of globalTags) {
        try {
          let courseSpecificUsageCount = 0;
          
          if (chatsInCourse.length > 0) {
            // Get all chatTags for this tag
            const chatTagsQuery = query(
              collection(db, 'chatTags'),
              where('tagId', '==', tag.id)
            );
            const chatTagsSnapshot = await getDocs(chatTagsQuery);
            
            // Count only those that reference chats in this course
            for (const chatTagDoc of chatTagsSnapshot.docs) {
              const chatTag = chatTagDoc.data();
              if (chatsInCourse.includes(chatTag.chatId)) {
                courseSpecificUsageCount++;
              }
            }
          }
          
          tagsWithUsage.push({
            ...tag,
            usage_count: courseSpecificUsageCount
          });
        } catch (error) {
          console.warn('Error getting usage for global tag:', tag.id, error);
          tagsWithUsage.push({
            ...tag,
            usage_count: 0
          });
        }
      }

      console.log('🔥 Global tags with usage (course-specific):', tagsWithUsage.length);
      return tagsWithUsage;
      
    } catch (error) {
      console.error('❌ Error getting global tags with usage:', error);
      // Return empty array instead of throwing, so the UI doesn't break
      return [];
    }
  },

  async addTagsToChat(chatId, tagIds) {
    console.log('🔥 addTagsToChat:', chatId, tagIds);
    
    const batch = writeBatch(db);
    const chatTagRefs = [];
    
    for (const tagId of tagIds) {
      // Use composite ID: chatId_tagId
      const chatTagId = `${chatId}_${tagId}`;
      const chatTagRef = doc(db, 'chatTags', chatTagId);
      
      batch.set(chatTagRef, {
        chatId,
        tagId,
        createdAt: serverTimestamp()
      });
      
      chatTagRefs.push(chatTagRef);
    }
    
    await batch.commit();
    console.log('✅ Tags added to chat successfully');
    return true;
  },

  async removeTagsFromChat(chatId, tagIds) {
    console.log('🔥 removeTagsFromChat:', chatId, tagIds);
    
    const batch = writeBatch(db);
    
    for (const tagId of tagIds) {
      // Use composite ID: chatId_tagId
      const chatTagId = `${chatId}_${tagId}`;
      const chatTagRef = doc(db, 'chatTags', chatTagId);
      batch.delete(chatTagRef);
    }
    
    await batch.commit();
    console.log('✅ Tags removed from chat successfully');
    return true;
  },

  async getCourseTags(courseId) {
    console.log('🔥 getCourseTags:', courseId);
    return this.getCourseTagsWithUsage(courseId);
  },

  async updateTag(tagId, updates) {
    console.log('🔥 updateTag:', tagId, updates);
    await updateDoc(doc(db, 'tags', tagId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return this.getTagById(tagId);
  },

  async deleteTag(tagId) {
    console.log('🔥 deleteTag:', tagId);
    
    // First, delete all chat-tag relationships
    const chatTagsQuery = query(
      collection(db, 'chatTags'),
      where('tagId', '==', tagId)
    );
    
    const chatTagsSnapshot = await getDocs(chatTagsQuery);
    const batch = writeBatch(db);
    
    chatTagsSnapshot.forEach((chatTagDoc) => {
      batch.delete(chatTagDoc.ref);
    });
    
    // Delete the tag itself
    batch.delete(doc(db, 'tags', tagId));
    
    await batch.commit();
    console.log('✅ Tag and its relationships deleted successfully');
    return true;
  },

  async getTaggedChats(tagId, courseId) {
    console.log('🔥 getTaggedChats:', tagId, courseId);
    
    try {
      // More efficient approach: Get chats in the course first, then filter by tag
      // This avoids permission issues and is more performant
      const chatsInCourseQuery = query(
        collection(db, 'chats'),
        where('courseId', '==', courseId)
      );
      const chatsSnapshot = await getDocs(chatsInCourseQuery);
      
      if (chatsSnapshot.empty) {
        console.log('No chats found in course:', courseId);
        return [];
      }
      
      // Get all chat-tag relationships for this tag
      const chatTagsQuery = query(
        collection(db, 'chatTags'),
        where('tagId', '==', tagId)
      );
      const chatTagsSnapshot = await getDocs(chatTagsQuery);
      const taggedChatIds = new Set(chatTagsSnapshot.docs.map(doc => doc.data().chatId));
      
      console.log('Tagged chat IDs for tag:', tagId, Array.from(taggedChatIds));
      
      // Filter chats to only those that are tagged with this tag
      const taggedChats = [];
      for (const chatDoc of chatsSnapshot.docs) {
        if (taggedChatIds.has(chatDoc.id)) {
          const chatData = { id: chatDoc.id, ...chatDoc.data() };
          
          // Enrich with user details
          if (chatData.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', chatData.userId));
              if (userDoc.exists()) {
                chatData.users = { id: userDoc.id, ...userDoc.data() };
                console.log('✅ User loaded for chat:', chatData.id, chatData.users.name || chatData.users.displayName);
              } else {
                console.warn('❌ User not found for chat:', chatData.userId);
                chatData.users = { 
                  id: chatData.userId, 
                  name: 'Deleted User', 
                  email: 'User no longer exists',
                  displayName: 'Deleted User'
                };
                console.log('✅ Fallback user data set for chat:', chatData.id);
              }
            } catch (error) {
              console.warn('❌ Error loading user:', chatData.userId, error);
              chatData.users = { 
                id: chatData.userId, 
                name: 'Deleted User', 
                email: 'User no longer exists',
                displayName: 'Deleted User'
              };
              console.log('✅ Fallback user data set for chat (error):', chatData.id);
            }
          } else {
            // Chat has no userId at all
            chatData.users = { 
              id: 'unknown', 
              name: 'Anonymous User', 
              email: 'No user ID',
              displayName: 'Anonymous User'
            };
            console.log('✅ Anonymous user data set for chat:', chatData.id);
          }
          
          // Enrich with project details
          if (chatData.projectId) {
            try {
              const projectDoc = await getDoc(doc(db, 'projects', chatData.projectId));
              if (projectDoc.exists()) {
                chatData.projects = { id: projectDoc.id, ...projectDoc.data() };
                console.log('✅ Project loaded for chat:', chatData.id, chatData.projects.title);
              } else {
                console.warn('❌ Project not found for chat:', chatData.projectId);
                chatData.projects = {
                  id: chatData.projectId,
                  title: 'Deleted Project',
                  description: 'Project no longer exists'
                };
                console.log('✅ Fallback project data set for chat:', chatData.id);
              }
            } catch (error) {
              console.warn('❌ Error loading project:', chatData.projectId, error);
              chatData.projects = {
                id: chatData.projectId,
                title: 'Deleted Project',
                description: 'Project no longer exists'
              };
              console.log('✅ Fallback project data set for chat (error):', chatData.id);
            }
          } else {
            console.log('ℹ️ Chat has no project linked:', chatData.id);
          }
          
          // Add formatted dates
          chatData.created_at = convertTimestamp(chatData.createdAt);
          chatData.updated_at = convertTimestamp(chatData.updatedAt);
          
          taggedChats.push(chatData);
        }
      }
      
      // Sort by creation date (most recent first)
      taggedChats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log('✅ getTaggedChats result:', taggedChats.length, 'tagged chats found');
      console.log('Sample chat data:', taggedChats[0]);
      return taggedChats;
      
    } catch (error) {
      console.error('❌ Error getting tagged chats:', error);
      return [];
    }
  },

  async getChatTags(chatId) {
    console.log('🔥 getChatTags:', chatId);
    
    try {
      const chatTagsQuery = query(
        collection(db, 'chatTags'),
        where('chatId', '==', chatId)
      );
      
      const chatTagsSnapshot = await getDocs(chatTagsQuery);
      const chatTags = [];
      
      for (const chatTagDoc of chatTagsSnapshot.docs) {
        const chatTag = chatTagDoc.data();
        
        // Get the tag details
        try {
          const tagDoc = await getDoc(doc(db, 'tags', chatTag.tagId));
          if (tagDoc.exists()) {
            chatTags.push({
              id: chatTagDoc.id,
              ...chatTag,
              tags: { id: tagDoc.id, ...tagDoc.data() }
            });
          }
        } catch (error) {
          console.warn('Tag not found:', chatTag.tagId);
        }
      }
      
      return chatTags;
    } catch (error) {
      console.error('❌ Error getting chat tags:', error);
      return [];
    }
  },

  // Create global educational tags for all courses
  async createGlobalEducationalTags() {
    console.log('🔥 Creating global educational tags...');
    
    const globalTags = [
      { name: 'Research Help', color: '#3B82F6', description: 'AI assistance with research and fact-finding' },
      { name: 'Writing Support', color: '#10B981', description: 'Help with writing, editing, and structure' },
      { name: 'Problem Solving', color: '#8B5CF6', description: 'Working through complex problems step-by-step' },
      { name: 'Concept Explanation', color: '#F59E0B', description: 'Understanding difficult concepts and topics' },
      { name: 'Study Planning', color: '#EF4444', description: 'Organizing study schedules and learning strategies' },
      { name: 'Critical Thinking', color: '#EC4899', description: 'Developing analytical and critical thinking skills' },
      { name: 'Creative Brainstorming', color: '#6366F1', description: 'Generating creative ideas and solutions' },
      { name: 'Homework Help', color: '#6B7280', description: 'Assistance with specific homework assignments' }
    ];

    const createdTags = [];
    
    for (const tagData of globalTags) {
      try {
        // Check if tag already exists
        const existingTagQuery = query(
          collection(db, 'tags'),
          where('name', '==', tagData.name),
          where('isGlobal', '==', true)
        );
        const existingSnapshot = await getDocs(existingTagQuery);
        
        if (existingSnapshot.empty) {
          // Create the global tag
          const docRef = await addDoc(collection(db, 'tags'), {
            name: tagData.name,
            color: tagData.color,
            description: tagData.description,
            isGlobal: true,
            createdAt: serverTimestamp(),
            courseId: null  // Explicitly null for global tags
          });
          
          const newTag = await this.getTagById(docRef.id);
          createdTags.push(newTag);
          console.log('✅ Created global tag:', tagData.name);
        } else {
          console.log('⚠️ Global tag already exists:', tagData.name);
        }
      } catch (error) {
        console.error('❌ Error creating global tag:', tagData.name, error);
      }
    }
    
    console.log('🔥 Global educational tags setup complete. Created:', createdTags.length);
    return createdTags;
  }
};

// REFLECTION API
export const reflectionApi = {
  async createReflection(reflectionData) {
    console.log('🔥 createReflection:', reflectionData);

    try {
      // First, create the reflection document
      const reflectionDoc = {
        content: reflectionData.content,
        chatId: reflectionData.chatId,
        userId: reflectionData.userId,
        courseId: reflectionData.courseId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('📝 Creating reflection document:', reflectionDoc);
      const docRef = await addDoc(collection(db, 'reflections'), reflectionDoc);
      console.log('✅ Reflection document created with ID:', docRef.id);

      // Update the chat to mark it as having a reflection
      if (reflectionData.chatId) {
        try {
          console.log(`📝 Updating chat ${reflectionData.chatId} to mark has_reflection=true`);
          await updateDoc(doc(db, 'chats', reflectionData.chatId), {
            has_reflection: true,
            reflectionId: docRef.id, // Also store the reflection ID for easier lookup
            updatedAt: serverTimestamp()
          });
          console.log('✅ Chat marked as having reflection');
        } catch (error) {
          console.error('❌ Failed to update chat reflection status:', error);
          // Don't throw here - the reflection was created successfully
        }
      }

      return this.getReflectionById(docRef.id);
    } catch (error) {
      console.error('❌ Error creating reflection:', error);
      throw error;
    }
  },
  
  async getReflectionById(reflectionId) {
    console.log('🔥 getReflectionById:', reflectionId);
    const reflectionDoc = await getDoc(doc(db, 'reflections', reflectionId));
    if (reflectionDoc.exists()) {
      const data = reflectionDoc.data();
      return {
        id: reflectionDoc.id,
        ...data,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt)
      };
    }
    throw new Error('Reflection not found');
  },
  
  async getReflectionByChat(chatId) {
    console.log('🔥 getReflectionByChat:', chatId);

    try {
      // First, try to get the chat document to see if it has a reflectionId
      let reflectionId = null;
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists() && chatDoc.data().reflectionId) {
          reflectionId = chatDoc.data().reflectionId;
          console.log(`🔍 Found reflectionId ${reflectionId} in chat document`);
        }
      } catch (error) {
        console.warn('Could not check chat document for reflectionId:', error);
      }

      // If we have a reflectionId, get it directly
      if (reflectionId) {
        try {
          const reflection = await this.getReflectionById(reflectionId);
          console.log(`✅ Loaded reflection by ID for chat ${chatId}`);
          return reflection;
        } catch (error) {
          console.warn(`Could not load reflection by ID ${reflectionId}, will query instead`);
        }
      }

      // Otherwise, query for reflections with this chatId
      const reflectionsQuery = query(
        collection(db, 'reflections'),
        where('chatId', '==', chatId),
        limit(1) // Only get the first one
      );

      const reflectionsSnapshot = await getDocs(reflectionsQuery);
      console.log(`🔍 Found ${reflectionsSnapshot.docs.length} reflections for chat ${chatId}`);

      if (reflectionsSnapshot.empty) {
        console.log(`⚠️ No reflections found for chat ${chatId}`);
        // Double-check: maybe the chat's has_reflection flag is incorrect
        try {
          const chatDoc = await getDoc(doc(db, 'chats', chatId));
          if (chatDoc.exists() && chatDoc.data().has_reflection) {
            console.warn(`⚠️ Chat ${chatId} marked as having reflection but none found - fixing flag`);
            await updateDoc(doc(db, 'chats', chatId), {
              has_reflection: false,
              reflectionId: null
            });
          }
        } catch (error) {
          console.warn('Could not update chat reflection flag:', error);
        }
        return null;
      }

      // Return the first (and should be only) reflection for this chat
      const reflectionDoc = reflectionsSnapshot.docs[0];
      const data = reflectionDoc.data();

      const reflection = {
        id: reflectionDoc.id,
        ...data,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt)
      };

      // Update the chat with the reflectionId for faster future lookups
      try {
        await updateDoc(doc(db, 'chats', chatId), {
          reflectionId: reflectionDoc.id
        });
      } catch (error) {
        console.warn('Could not update chat with reflectionId:', error);
      }

      console.log(`✅ Loaded reflection for chat ${chatId}:`, reflection);
      return reflection;
    } catch (error) {
      console.error(`❌ Error in getReflectionByChat for chat ${chatId}:`, error);
      // Don't throw - return null instead to avoid breaking the UI
      return null;
    }
  },
  
  async updateReflection(reflectionId, updates) {
    console.log('🔥 updateReflection:', reflectionId, updates);

    try {
      // Update the reflection document
      await updateDoc(doc(db, 'reflections', reflectionId), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Get the updated reflection to return
      const updatedReflection = await this.getReflectionById(reflectionId);

      // Also update the chat's updatedAt timestamp for consistency
      if (updatedReflection.chatId) {
        try {
          await updateDoc(doc(db, 'chats', updatedReflection.chatId), {
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.warn('Could not update chat timestamp:', error);
        }
      }

      return updatedReflection;
    } catch (error) {
      console.error('❌ Error updating reflection:', error);
      throw error;
    }
  },
  
  async deleteReflection(reflectionId) {
    console.log('🔥 deleteReflection:', reflectionId);

    try {
      // Get reflection data to find associated chat
      const reflection = await this.getReflectionById(reflectionId);

      // Delete the reflection
      await deleteDoc(doc(db, 'reflections', reflectionId));

      // Update chat to mark as not having reflection
      if (reflection.chatId) {
        try {
          await updateDoc(doc(db, 'chats', reflection.chatId), {
            has_reflection: false,
            reflectionId: null, // Clear the reflectionId field
            updatedAt: serverTimestamp()
          });
          console.log('✅ Chat marked as not having reflection');
        } catch (error) {
          console.warn('Failed to update chat reflection status:', error);
        }
      }

      console.log('✅ Reflection deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting reflection:', error);
      throw error;
    }
  },
  
  async getCourseReflections(courseId) {
    console.log('🔥 getCourseReflections:', courseId);

    const reflectionsQuery = query(
      collection(db, 'reflections'),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc')
    );

    const reflectionsSnapshot = await getDocs(reflectionsQuery);

    return reflectionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: convertTimestamp(data.createdAt),
        updated_at: convertTimestamp(data.updatedAt)
      };
    });
  },

  // Diagnostic function to check reflection data integrity
  async checkReflectionIntegrity(projectId) {
    console.log('🔍 Running reflection integrity check for project:', projectId);

    try {
      // Get all chats in the project
      const chatsQuery = query(
        collection(db, 'chats'),
        where('projectId', '==', projectId)
      );
      const chatsSnapshot = await getDocs(chatsQuery);

      console.log(`Found ${chatsSnapshot.docs.length} chats in project`);

      // Get all reflections and create a map by chatId
      const reflectionsQuery = query(collection(db, 'reflections'));
      const reflectionsSnapshot = await getDocs(reflectionsQuery);
      const reflectionsByChatId = {};

      reflectionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.chatId) {
          reflectionsByChatId[data.chatId] = { id: doc.id, ...data };
        }
      });

      console.log(`Found ${Object.keys(reflectionsByChatId).length} total reflections in database`);

      // Check each chat
      const issues = [];
      let correctCount = 0;

      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        const hasReflectionFlag = chatData.has_reflection;
        const actualHasReflection = !!reflectionsByChatId[chatId];

        if (hasReflectionFlag !== actualHasReflection) {
          issues.push({
            chatId,
            flagSays: hasReflectionFlag,
            actuallyHas: actualHasReflection,
            reflection: reflectionsByChatId[chatId]
          });
          console.warn(`⚠️ Chat ${chatId}: flag says ${hasReflectionFlag}, actually has ${actualHasReflection}`);
        } else {
          correctCount++;
        }

        if (actualHasReflection) {
          console.log(`✅ Chat ${chatId} has reflection:`, reflectionsByChatId[chatId].content.substring(0, 50) + '...');
        }
      }

      console.log(`
📊 Integrity Check Results:`);
      console.log(`- ${correctCount}/${chatsSnapshot.docs.length} chats have correct reflection flags`);
      console.log(`- ${issues.length} chats have incorrect flags`);

      if (issues.length > 0) {
        console.log('\n🔧 Fixing incorrect flags...');
        for (const issue of issues) {
          try {
            await updateDoc(doc(db, 'chats', issue.chatId), {
              has_reflection: issue.actuallyHas,
              reflectionId: issue.reflection?.id || null
            });
            console.log(`Fixed chat ${issue.chatId}`);
          } catch (error) {
            console.error(`Failed to fix chat ${issue.chatId}:`, error);
          }
        }
      }

      return {
        totalChats: chatsSnapshot.docs.length,
        totalReflections: Object.keys(reflectionsByChatId).length,
        correctFlags: correctCount,
        issues: issues
      };
    } catch (error) {
      console.error('❌ Error checking reflection integrity:', error);
      throw error;
    }
  }
};

// INSTRUCTOR NOTES API
export const instructorNotesApi = {
  async createNote(noteData) {
    console.log('🔥 createNote:', noteData);
    console.log('🔍 Author name in noteData:', noteData.authorName);

    const note = {
      projectId: noteData.project_id,
      instructorId: noteData.instructor_id,
      courseId: noteData.course_id,
      title: noteData.title,
      content: noteData.content,
      is_visible_to_student: noteData.is_visible_to_student,
      parentId: noteData.parentId || null, // Support for threading
      authorId: noteData.authorId || noteData.instructor_id, // Track who wrote this
      authorRole: noteData.authorRole || 'instructor', // Track if instructor or student
      authorName: noteData.authorName || null, // Store author name
      threadId: noteData.threadId || null, // Track root thread
      hasReplies: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('🔍 Note object to be saved:', note);

    const docRef = await addDoc(collection(db, 'instructorNotes'), note);

    // Return note with generated ID and proper timestamp format
    const now = new Date();
    const returnNote = {
      id: docRef.id,
      ...note,
      authorName: note.authorName, // Ensure authorName is included
      createdAt: now,
      updatedAt: now,
      created_at: now, // For compatibility with existing component
      updated_at: now
    };

    console.log('🔍 Returning note with authorName:', returnNote.authorName);
    return returnNote;
  },

  async replyToNote(noteId, replyData) {
    console.log('🔥 replyToNote:', noteId, replyData);

    // Get original note to get thread info
    const originalNote = await getDoc(doc(db, 'instructorNotes', noteId));
    if (!originalNote.exists()) {
      throw new Error('Original note not found');
    }

    const originalData = originalNote.data();
    console.log('🔍 DEBUG: Original note data:', originalData);

    const threadId = originalData.threadId || noteId; // If no threadId, this is root

    const reply = {
      projectId: originalData.projectId,
      courseId: originalData.courseId,
      title: replyData.title || `Re: ${originalData.title}`,
      content: replyData.content,
      is_visible_to_student: true, // Replies are always visible
      parentId: noteId,
      threadId: threadId,
      authorId: replyData.authorId,
      authorRole: replyData.authorRole,
      authorName: replyData.authorName,
      instructorId: replyData.authorRole === 'instructor' ? replyData.authorId : originalData.instructorId,
      hasReplies: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('🔍 DEBUG: Reply object to be created:', reply);

    // Check if user is a member of the course
    try {
      const membershipId = `${replyData.authorId}_${reply.courseId}`;
      const membershipDoc = await getDoc(doc(db, 'courseMemberships', membershipId));
      console.log('🔍 DEBUG: Membership check:', {
        membershipId,
        exists: membershipDoc.exists(),
        data: membershipDoc.exists() ? membershipDoc.data() : null
      });
    } catch (error) {
      console.log('🔍 DEBUG: Error checking membership:', error);
    }

    const docRef = await addDoc(collection(db, 'instructorNotes'), reply);

    // Mark parent as having replies
    await updateDoc(doc(db, 'instructorNotes', noteId), {
      hasReplies: true,
      lastReplyAt: serverTimestamp()
    });

    // If this is part of a thread, update thread root
    if (threadId && threadId !== noteId) {
      await updateDoc(doc(db, 'instructorNotes', threadId), {
        hasReplies: true,
        lastReplyAt: serverTimestamp()
      });
    }

    const now = new Date();
    return {
      id: docRef.id,
      ...reply,
      createdAt: now,
      updatedAt: now,
      created_at: now,
      updated_at: now
    };
  },
  
  async getNotesByChat(chatId) {
    console.log('🔥 getNotesByChat:', chatId);
    
    // First get the chat to find project and course
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) {
      throw new Error('Chat not found');
    }
    
    const chat = chatDoc.data();
    const projectId = chat.projectId;
    
    if (!projectId) {
      return [];
    }
    
    // Get notes for this project
    const notesQuery = query(
      collection(db, 'instructorNotes'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const notesSnapshot = await getDocs(notesQuery);
    return notesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    }));
  },

  async getProjectNotes(projectId) {
    console.log('🔥 getProjectNotes:', projectId);

    const notesQuery = query(
      collection(db, 'instructorNotes'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const notesSnapshot = await getDocs(notesQuery);
    const notes = [];

    // Fetch author names for each note
    for (const noteDoc of notesSnapshot.docs) {
      const data = noteDoc.data();
      const createdAt = convertTimestamp(data.createdAt);
      const updatedAt = convertTimestamp(data.updatedAt);

      // Get author name
      let authorName = data.authorName || 'Unknown';

      // Try to fetch author name if not stored in note
      if (!data.authorName) {
        // Use authorId if available, otherwise fall back to instructorId
        const authorId = data.authorId || data.instructorId;
        console.log('🔍 Fetching author name for note, authorId:', authorId, 'instructorId:', data.instructorId);

        if (authorId) {
          try {
            const authorData = await userApi.getUserById(authorId);
            console.log('🔍 Author data fetched:', authorData);
            if (authorData) {
              authorName = authorData.displayName || authorData.name || authorData.email || 'Unknown';
              console.log('🔍 Author name resolved to:', authorName);
            }
          } catch (error) {
            console.error('Error fetching author for ID:', authorId, error);
          }
        }
      }

      notes.push({
        id: noteDoc.id,
        ...data,
        authorName,
        createdAt,
        updatedAt,
        created_at: createdAt, // For compatibility with existing component
        updated_at: updatedAt
      });
    }

    // Organize into threaded structure
    return this.organizeThreadedNotes(notes);
  },

  organizeThreadedNotes(notes) {
    // Create a map for quick lookups
    const noteMap = new Map();
    notes.forEach(note => {
      noteMap.set(note.id, { ...note, replies: [] });
    });

    // Build the tree structure
    const rootNotes = [];
    notes.forEach(note => {
      if (note.parentId) {
        const parent = noteMap.get(note.parentId);
        if (parent) {
          parent.replies.push(noteMap.get(note.id));
        }
      } else {
        rootNotes.push(noteMap.get(note.id));
      }
    });

    // Sort replies by date
    const sortReplies = (note) => {
      if (note.replies && note.replies.length > 0) {
        note.replies.sort((a, b) => {
          const dateA = a.createdAt || a.created_at;
          const dateB = b.createdAt || b.created_at;
          return new Date(dateA) - new Date(dateB); // Oldest first for replies
        });
        note.replies.forEach(sortReplies);
      }
    };

    rootNotes.forEach(sortReplies);

    return rootNotes;
  },

  async getNotesForDashboard(instructorId, courseId) {
    console.log('🔥 getNotesForDashboard:', instructorId, courseId);
    
    const notesQuery = query(
      collection(db, 'instructorNotes'),
      where('instructorId', '==', instructorId),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc')
    );
    
    const notesSnapshot = await getDocs(notesQuery);
    const notes = [];
    
    // Get project and user details for each note
    for (const noteDoc of notesSnapshot.docs) {
      const note = { id: noteDoc.id, ...noteDoc.data() };
      
      // Convert timestamps
      note.createdAt = convertTimestamp(note.createdAt);
      note.updatedAt = convertTimestamp(note.updatedAt);
      note.created_at = note.createdAt; // For compatibility with existing component
      note.updated_at = note.updatedAt;
      
      // Get project details
      try {
        const projectDoc = await getDoc(doc(db, 'projects', note.projectId));
        if (projectDoc.exists()) {
          note.projects = { id: projectDoc.id, ...projectDoc.data() };
          
          // Get user details for the project
          if (note.projects.createdBy) {
            const userDoc = await getDoc(doc(db, 'users', note.projects.createdBy));
            if (userDoc.exists()) {
              note.projects.users = { id: userDoc.id, ...userDoc.data() };
            }
          }
        }
      } catch (error) {
        console.warn('Error loading project for note:', note.id, error);
      }
      
      notes.push(note);
    }
    
    return notes;
  },

  async updateNote(noteId, updates, instructorId) {
    console.log('🔥 updateNote:', noteId, updates);
    
    // Verify note belongs to instructor
    const noteDoc = await getDoc(doc(db, 'instructorNotes', noteId));
    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    if (noteData.instructorId !== instructorId) {
      throw new Error('Unauthorized to update this note');
    }
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'instructorNotes', noteId), updateData);
    
    // Return updated note with proper timestamp format
    const now = new Date();
    return {
      id: noteId,
      ...noteData,
      ...updates,
      updatedAt: now,
      updated_at: now // For compatibility with existing component
    };
  },

  async deleteNote(noteId, instructorId) {
    console.log('🔥 deleteNote:', noteId);
    
    // Verify note belongs to instructor
    const noteDoc = await getDoc(doc(db, 'instructorNotes', noteId));
    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    if (noteData.instructorId !== instructorId) {
      throw new Error('Unauthorized to delete this note');
    }
    
    await deleteDoc(doc(db, 'instructorNotes', noteId));
    return { success: true };
  }
};

// REAL-TIME SUBSCRIPTIONS
export const realtimeApi = {
  // Subscribe to project chats with real-time updates
  subscribeToProjectChats(projectId, callback) {
    console.log('🔥 subscribeToProjectChats:', projectId);
    const chatsQuery = query(
      collection(db, 'chats'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      }));
      callback(chats);
    });
  },

  // Subscribe to user's courses with real-time updates
  subscribeToUserCourses(userId, callback) {
    console.log('🔥 subscribeToUserCourses:', userId);
    const membershipsQuery = query(
      collection(db, 'courseMemberships'),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );
    
    return onSnapshot(membershipsQuery, async (snapshot) => {
      const courses = [];
      
      for (const membershipDoc of snapshot.docs) {
        const membership = membershipDoc.data();
        try {
          const course = await courseApi.getCourseById(membership.courseId);
          courses.push({
            ...membership,
            courses: course
          });
        } catch (error) {
          console.warn('Course not found:', membership.courseId);
        }
      }
      
      callback(courses);
    });
  }
};

// Analytics API - Server-side analytics with caching
export const analyticsApi = {
  /**
   * Generate comprehensive course analytics using Cloud Function
   * This computes metrics server-side and caches them for performance
   */
  async generateCourseAnalytics(courseId) {
    console.log('📊 generateCourseAnalytics:', courseId);
    
    try {
      const generateAnalytics = httpsCallable(functions, 'generateCourseAnalytics');
      const result = await generateAnalytics({ courseId });
      
      console.log('✅ Course analytics generated:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error generating course analytics:', error);
      throw error;
    }
  },

  /**
   * Get cached course analytics from Firestore
   * Falls back to generating analytics if cache is stale or missing
   */
  async getCourseAnalytics(courseId, forceRefresh = false) {
    console.log('📊 getCourseAnalytics:', courseId, { forceRefresh });
    
    try {
      // Check for cached analytics
      if (!forceRefresh) {
        const analyticsDoc = await getDoc(doc(db, 'courseAnalytics', courseId));
        
        if (analyticsDoc.exists()) {
          const analyticsData = analyticsDoc.data();
          const lastUpdated = analyticsData.lastUpdated?.toDate?.() || new Date(analyticsData.lastUpdated);
          const isStale = analyticsData.stale || false;
          
          // Consider analytics fresh if updated within last hour and not marked stale
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const isFresh = lastUpdated > oneHourAgo && !isStale;
          
          if (isFresh) {
            console.log('✅ Using cached analytics (fresh)');
            return {
              ...analyticsData,
              cached: true,
              lastUpdated: lastUpdated
            };
          } else {
            console.log('⚠️ Analytics cache is stale, will refresh');
          }
        } else {
          console.log('ℹ️ No cached analytics found, will generate');
        }
      }

      // Generate fresh analytics
      const result = await this.generateCourseAnalytics(courseId);
      
      // Return the cached version (will be fresh now)
      const freshAnalyticsDoc = await getDoc(doc(db, 'courseAnalytics', courseId));
      if (freshAnalyticsDoc.exists()) {
        const analyticsData = freshAnalyticsDoc.data();
        return {
          ...analyticsData,
          cached: false,
          lastUpdated: analyticsData.lastUpdated?.toDate?.() || new Date(analyticsData.lastUpdated)
        };
      }
      
      throw new Error('Failed to retrieve generated analytics');
      
    } catch (error) {
      console.error('❌ Error getting course analytics:', error);
      throw error;
    }
  },

  /**
   * Get lightweight analytics summary for quick display
   * Returns only essential metrics without detailed breakdowns
   */
  async getCourseAnalyticsSummary(courseId) {
    console.log('📊 getCourseAnalyticsSummary:', courseId);
    
    try {
      const analytics = await this.getCourseAnalytics(courseId);
      
      return {
        courseInfo: analytics.courseInfo,
        summary: {
          totalStudents: analytics.courseInfo.totalStudents,
          totalInteractions: analytics.courseInfo.totalInteractions,
          totalProjects: analytics.courseInfo.totalProjects,
          averageInteractionsPerStudent: analytics.engagementPatterns.averageInteractionsPerStudent,
          topTool: Object.entries(analytics.toolUsage || {})
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
          lastUpdated: analytics.lastUpdated
        },
        cached: analytics.cached
      };
    } catch (error) {
      console.error('❌ Error getting analytics summary:', error);
      throw error;
    }
  },

  /**
   * Force refresh of course analytics
   * Useful when you know data has changed significantly
   */
  async refreshCourseAnalytics(courseId) {
    console.log('🔄 refreshCourseAnalytics:', courseId);
    
    try {
      // Mark current analytics as stale first
      const analyticsRef = doc(db, 'courseAnalytics', courseId);
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (analyticsDoc.exists()) {
        await updateDoc(analyticsRef, {
          stale: true,
          lastUpdated: serverTimestamp()
        });
      }
      
      // Generate fresh analytics
      return await this.getCourseAnalytics(courseId, true);
    } catch (error) {
      console.error('❌ Error refreshing course analytics:', error);
      throw error;
    }
  },

  /**
   * Check if analytics exist for a course
   */
  async hasAnalytics(courseId) {
    console.log('📊 hasAnalytics:', courseId);
    
    try {
      const analyticsDoc = await getDoc(doc(db, 'courseAnalytics', courseId));
      return analyticsDoc.exists();
    } catch (error) {
      console.error('❌ Error checking analytics existence:', error);
      return false;
    }
  },

  /**
   * Get analytics status for debugging
   */
  async getAnalyticsStatus(courseId) {
    console.log('📊 getAnalyticsStatus:', courseId);
    
    try {
      const analyticsDoc = await getDoc(doc(db, 'courseAnalytics', courseId));
      
      if (!analyticsDoc.exists()) {
        return { exists: false };
      }
      
      const data = analyticsDoc.data();
      const lastUpdated = data.lastUpdated?.toDate?.() || new Date(data.lastUpdated);
      const isStale = data.stale || false;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const isFresh = lastUpdated > oneHourAgo && !isStale;
      
      return {
        exists: true,
        lastUpdated,
        isStale,
        isFresh,
        studentCount: data.courseInfo?.totalStudents || 0,
        interactionCount: data.courseInfo?.totalInteractions || 0,
        projectCount: data.courseInfo?.totalProjects || 0
      };
    } catch (error) {
      console.error('❌ Error getting analytics status:', error);
      return { exists: false, error: error.message };
    }
  }
};

// SCHOOLS API - Organization management
export const schoolsApi = {
  async createSchool(schoolData) {
    console.log('🏫 createSchool:', schoolData);
    
    try {
      const schoolDoc = {
        name: schoolData.name,
        shortName: schoolData.shortName || null,
        address: schoolData.address || null,
        city: schoolData.city || null,
        state: schoolData.state || null,
        country: schoolData.country || 'USA',
        website: schoolData.website || null,
        description: schoolData.description || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null,
        isActive: true
      };
      
      const docRef = await addDoc(collection(db, 'schools'), schoolDoc);
      console.log('✅ School created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...schoolDoc,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating school:', error);
      throw error;
    }
  },
  
  async getAllSchools() {
    console.log('🏫 getAllSchools');
    
    try {
      const schoolsQuery = query(
        collection(db, 'schools'),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(schoolsQuery);
      const schools = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      }));
      
      console.log('✅ getAllSchools result:', schools.length, 'schools');
      return schools;
    } catch (error) {
      console.error('❌ Error getting schools:', error);
      throw error;
    }
  },
  
  async getSchoolById(schoolId) {
    console.log('🏫 getSchoolById:', schoolId);
    
    try {
      const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
      
      if (!schoolDoc.exists()) {
        throw new Error('School not found');
      }
      
      return {
        id: schoolDoc.id,
        ...schoolDoc.data(),
        createdAt: convertTimestamp(schoolDoc.data().createdAt),
        updatedAt: convertTimestamp(schoolDoc.data().updatedAt)
      };
    } catch (error) {
      console.error('❌ Error getting school:', error);
      throw error;
    }
  },
  
  async updateSchool(schoolId, updates) {
    console.log('🏫 updateSchool:', schoolId, updates);
    
    try {
      const schoolRef = doc(db, 'schools', schoolId);
      
      await updateDoc(schoolRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ School updated successfully');
      return await this.getSchoolById(schoolId);
    } catch (error) {
      console.error('❌ Error updating school:', error);
      throw error;
    }
  },
  
  async deleteSchool(schoolId) {
    console.log('🏫 deleteSchool:', schoolId);
    
    try {
      // Soft delete - just mark as inactive
      await this.updateSchool(schoolId, { isActive: false });
      console.log('✅ School soft deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting school:', error);
      throw error;
    }
  },
  
  async getSchoolCourses(schoolId) {
    console.log('🏫 getSchoolCourses:', schoolId);
    
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('schoolId', '==', schoolId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(coursesQuery);
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      }));
      
      console.log('✅ getSchoolCourses result:', courses.length, 'courses');
      return courses;
    } catch (error) {
      console.error('❌ Error getting school courses:', error);
      throw error;
    }
  }
};

// Announcements API
export const announcementApi = {
  // Create a new announcement
  async createAnnouncement(announcementData) {
    console.log('📢 Creating announcement for course:', announcementData.courseId);

    try {
      const announcementDoc = {
        courseId: announcementData.courseId,
        authorId: announcementData.authorId,
        authorName: announcementData.authorName,
        authorRole: announcementData.authorRole,
        title: announcementData.title,
        content: announcementData.content,
        attachments: announcementData.attachments || [],
        isPinned: announcementData.isPinned || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentCount: 0
      };

      const docRef = await addDoc(collection(db, 'announcements'), announcementDoc);
      console.log('✅ Announcement created with ID:', docRef.id);

      const newAnnouncement = {
        id: docRef.id,
        ...announcementDoc,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Send email notifications if requested
      if (announcementData.sendEmail) {
        console.log('📧 Sending email notifications for announcement...');
        try {
          const { emailNotifications } = await import('./emailService.js');
          const emailResult = await emailNotifications.notifyCourseOfAnnouncement({
            announcementId: docRef.id,
            title: announcementData.title,
            content: announcementData.content,
            attachments: announcementData.attachments || [],
            isPinned: announcementData.isPinned || false,
            courseId: announcementData.courseId,
            instructorId: announcementData.authorId,
            instructorName: announcementData.authorName,
            instructorEmail: announcementData.instructorEmail || announcementData.authorEmail
          });

          if (emailResult.success) {
            console.log(`✅ Announcement emails sent to ${emailResult.totalSent} recipients`);
            if (emailResult.totalFailed > 0) {
              console.warn(`⚠️ Failed to send to ${emailResult.totalFailed} recipients`);
            }
          } else {
            console.error('❌ Failed to send announcement emails:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Error sending announcement emails:', emailError);
          // Don't throw here - the announcement was created successfully
          // We just failed to send emails
        }
      }

      return newAnnouncement;
    } catch (error) {
      console.error('❌ Error creating announcement:', error);
      throw error;
    }
  },

  // Get all announcements for a course
  async getAnnouncements(courseId) {
    console.log('📢 Getting announcements for course:', courseId);

    try {
      // First get pinned announcements
      const pinnedQuery = query(
        collection(db, 'announcements'),
        where('courseId', '==', courseId),
        where('isPinned', '==', true),
        orderBy('createdAt', 'desc')
      );

      // Then get regular announcements
      const regularQuery = query(
        collection(db, 'announcements'),
        where('courseId', '==', courseId),
        where('isPinned', '==', false),
        orderBy('createdAt', 'desc')
      );

      const [pinnedSnapshot, regularSnapshot] = await Promise.all([
        getDocs(pinnedQuery),
        getDocs(regularQuery)
      ]);

      const pinnedAnnouncements = pinnedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      }));

      const regularAnnouncements = regularSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt)
      }));

      // Combine pinned first, then regular
      const allAnnouncements = [...pinnedAnnouncements, ...regularAnnouncements];

      console.log(`✅ Found ${allAnnouncements.length} announcements (${pinnedAnnouncements.length} pinned)`);
      return allAnnouncements;
    } catch (error) {
      console.error('❌ Error getting announcements:', error);
      return [];
    }
  },

  // Update an announcement
  async updateAnnouncement(announcementId, updates) {
    console.log('📢 Updating announcement:', announcementId);

    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Announcement updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
      throw error;
    }
  },

  // Delete an announcement
  async deleteAnnouncement(announcementId) {
    console.log('📢 Deleting announcement:', announcementId);

    try {
      // Delete all comments for this announcement first
      const commentsQuery = query(
        collection(db, 'announcementComments'),
        where('announcementId', '==', announcementId)
      );

      const commentsSnapshot = await getDocs(commentsQuery);
      const deletePromises = commentsSnapshot.docs.map(doc =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
      console.log(`🗑️ Deleted ${commentsSnapshot.size} comments`);

      // Now delete the announcement
      await deleteDoc(doc(db, 'announcements', announcementId));
      console.log('✅ Announcement deleted');

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting announcement:', error);
      throw error;
    }
  },

  // Pin/unpin an announcement
  async pinAnnouncement(announcementId, isPinned) {
    console.log(`📢 ${isPinned ? 'Pinning' : 'Unpinning'} announcement:`, announcementId);

    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        isPinned: isPinned,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Announcement ${isPinned ? 'pinned' : 'unpinned'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error pinning announcement:', error);
      throw error;
    }
  },

  // Add a comment to an announcement
  async addComment(announcementId, commentData) {
    console.log('💬 Adding comment to announcement:', announcementId);

    try {
      const commentDoc = {
        announcementId: announcementId,
        authorId: commentData.authorId,
        authorName: commentData.authorName,
        authorRole: commentData.authorRole,
        content: commentData.content,
        createdAt: serverTimestamp(),
        isEdited: false,
        editedAt: null
      };

      const docRef = await addDoc(collection(db, 'announcementComments'), commentDoc);
      console.log('✅ Comment added with ID:', docRef.id);

      // Try to update comment count, but don't fail if it doesn't work
      try {
        const announcementRef = doc(db, 'announcements', announcementId);
        await updateDoc(announcementRef, {
          commentCount: increment(1)
        });
        console.log('✅ Comment count updated');
      } catch (countError) {
        console.warn('⚠️ Could not update comment count:', countError);
        // This is non-critical, so we continue
      }

      return {
        id: docRef.id,
        ...commentDoc,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  },

  // Get comments for an announcement
  async getComments(announcementId) {
    console.log('💬 Getting comments for announcement:', announcementId);

    try {
      const commentsQuery = query(
        collection(db, 'announcementComments'),
        where('announcementId', '==', announcementId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(commentsQuery);
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        editedAt: convertTimestamp(doc.data().editedAt)
      }));

      console.log(`✅ Found ${comments.length} comments`);

      // Fix the comment count if it's incorrect
      const announcementRef = doc(db, 'announcements', announcementId);
      const announcementDoc = await getDoc(announcementRef);
      if (announcementDoc.exists()) {
        const currentCount = announcementDoc.data().commentCount || 0;
        if (currentCount !== comments.length) {
          console.log(`🔧 Fixing comment count: ${currentCount} -> ${comments.length}`);
          await updateDoc(announcementRef, {
            commentCount: comments.length
          });
        }
      }

      return comments;
    } catch (error) {
      console.error('❌ Error getting comments:', error);
      return [];
    }
  },

  // Update a comment
  async updateComment(commentId, content) {
    console.log('💬 Updating comment:', commentId);

    try {
      await updateDoc(doc(db, 'announcementComments', commentId), {
        content: content,
        isEdited: true,
        editedAt: serverTimestamp()
      });

      console.log('✅ Comment updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating comment:', error);
      throw error;
    }
  },

  // Delete a comment
  async deleteComment(commentId, announcementId) {
    console.log('💬 Deleting comment:', commentId);

    try {
      await deleteDoc(doc(db, 'announcementComments', commentId));
      console.log('✅ Comment deleted');

      // Try to update comment count, but don't fail if it doesn't work
      try {
        const announcementRef = doc(db, 'announcements', announcementId);
        await updateDoc(announcementRef, {
          commentCount: increment(-1)
        });
        console.log('✅ Comment count updated');
      } catch (countError) {
        console.warn('⚠️ Could not update comment count:', countError);
        // This is non-critical, so we continue
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  },

  // Upload attachments for announcement
  async uploadAnnouncementAttachment(file, courseId) {
    console.log('📎 Uploading announcement attachment:', file.name);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `announcements/${courseId}/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        fileName: file.name,
        fileUrl: downloadURL,
        fileType: file.type,
        fileSize: file.size
      };
    } catch (error) {
      console.error('❌ Error uploading attachment:', error);
      throw error;
    }
  }
};

console.log('🔥 Firebase API initialized');