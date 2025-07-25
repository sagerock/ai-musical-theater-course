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
  setDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { extractTextFromPDF, isPDFFile } from '../utils/pdfExtractor';

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
              course_id: membership.courseId
            }];
            user.course_role = membership.role; // For easier access in components
            user.status = membership.status; // Include membership status (pending/approved)
            
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
    console.log('🔥 deleteUser:', userId);
    
    // First, delete all course memberships
    const membershipsQuery = query(
      collection(db, 'courseMemberships'),
      where('userId', '==', userId)
    );
    
    const membershipsSnapshot = await getDocs(membershipsQuery);
    const batch = writeBatch(db);
    
    // Track courses that need member count updates
    const coursesToUpdate = new Set();
    
    membershipsSnapshot.forEach((doc) => {
      const membership = doc.data();
      coursesToUpdate.add(membership.courseId);
      batch.delete(doc.ref);
    });
    
    // Delete the user
    batch.delete(doc(db, 'users', userId));
    
    await batch.commit();
    
    // Update member counts for affected courses
    for (const courseId of coursesToUpdate) {
      await courseApi.updateCourseMemberCounts(courseId);
    }
    
    console.log('✅ User and memberships deleted successfully');
    return true;
  }
};

// COURSES API
export const courseApi = {
  async createCourse(courseData) {
    console.log('🔥 createCourse:', courseData);
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      memberCount: 0,
      instructorCount: 0,
      studentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return this.getCourseById(docRef.id);
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
      throw new Error('User is already enrolled in this course');
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
  async updateMemberRole(membershipId, newRole) {
    console.log('🔥 updateMemberRole:', membershipId, newRole);
    
    const membershipRef = doc(db, 'courseMemberships', membershipId);
    const membershipSnap = await getDoc(membershipRef);
    
    if (!membershipSnap.exists()) {
      throw new Error('Membership not found');
    }
    
    const membership = membershipSnap.data();
    
    await updateDoc(membershipRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    // Update course member counts
    await this.updateCourseMemberCounts(membership.courseId);
    
    console.log('✅ Member role updated successfully');
    return true;
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
      
      console.log('✅ Course member counts updated:', { instructorCount, studentCount });
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

  async joinCourse(userId, courseId, accessCode) {
    console.log('🔥 joinCourse:', userId, courseId);
    
    // Verify course exists and access code is correct
    const course = await this.getCourseById(courseId);
    if (course.accessCode !== accessCode) {
      throw new Error('Invalid access code');
    }
    
    // Create membership with composite ID: userId_courseId
    const membershipId = `${userId}_${courseId}`;
    await setDoc(doc(db, 'courseMemberships', membershipId), {
      userId,
      courseId,
      role: 'student',
      status: 'pending',
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
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
  }
};

// PROJECTS API
export const projectApi = {
  async createProject(projectData, userId, courseId = null) {
    console.log('🔥 createProject:', { projectData, userId, courseId });
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
    return chatsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.createdAt?.toDate?.() || data.createdAt,
        updated_at: data.updatedAt?.toDate?.() || data.updatedAt,
        user_id: data.userId,
        project_id: data.projectId,
        course_id: data.courseId
      };
    });
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
      chatData.tool_used = chatData.toolUsed;
      
      // Fetch user information
      try {
        if (chatData.userId) {
          const userDoc = await getDoc(doc(db, 'users', chatData.userId));
          if (userDoc.exists()) {
            chatData.users = { id: userDoc.id, ...userDoc.data() };
          } else {
            console.warn('User not found for chat:', chatData.userId);
            chatData.users = { name: 'Unknown User', email: 'No email' };
          }
        }
      } catch (error) {
        console.warn('Error fetching user for chat:', chatData.userId, error);
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
      
      chats.push(chatData);
    }
    
    console.log(`✅ getChatsWithFilters loaded ${chats.length} chats with enriched data`);
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
  }
};

// PDF ATTACHMENTS API
export const attachmentApi = {
  async uploadPDFAttachment(file, chatId, userId) {
    console.log('🔥 uploadPDFAttachment:', file.name, chatId, userId);
    
    try {
      // Extract text from PDF first
      let extractedText = '';
      if (isPDFFile(file)) {
        console.log('📄 Extracting text from PDF...');
        extractedText = await extractTextFromPDF(file);
        console.log('📄 Text extraction completed:', extractedText.length, 'characters');
      } else {
        extractedText = '[This file is not a PDF or text extraction is not supported for this file type]';
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
    return attachmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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
      
      // Get all chats for these projects
      const chatsQuery = query(
        collection(db, 'chats'),
        where('projectId', 'in', projectIds.slice(0, 10)) // Firestore 'in' limit is 10
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      const chatIds = chatsSnapshot.docs.map(doc => doc.id);
      
      if (chatIds.length === 0) {
        console.log('🔥 No chats found for course projects');
        return [];
      }
      
      // Get all attachments for these chats  
      const attachmentsQuery = query(
        collection(db, 'pdfAttachments'),
        where('chatId', 'in', chatIds.slice(0, 10)), // Firestore 'in' limit is 10
        orderBy('createdAt', 'desc')
      );
      const attachmentsSnapshot = await getDocs(attachmentsQuery);
      
      // Get detailed data for each attachment with user and project info
      const attachments = [];
      for (const attachmentDoc of attachmentsSnapshot.docs) {
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
      
      console.log('🔥 Found attachments for course:', attachments.length);
      return attachments;
      
    } catch (error) {
      console.error('❌ Error getting course attachments:', error);
      return [];
    }
  }
};

// TAGS API
export const tagApi = {
  async getAllTags(courseId = null) {
    console.log('🔥 getAllTags:', courseId);
    
    let tagsQuery = query(collection(db, 'tags'), orderBy('name'));
    
    if (courseId) {
      tagsQuery = query(
        collection(db, 'tags'),
        where('courseId', '==', courseId),
        orderBy('name')
      );
    }
    
    const tagsSnapshot = await getDocs(tagsQuery);
    return tagsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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

      // Get usage counts for each tag by counting chat_tags
      const tagsWithUsage = [];
      for (const tag of courseTags) {
        try {
          const chatTagsQuery = query(
            collection(db, 'chatTags'),
            where('tagId', '==', tag.id)
          );
          const chatTagsSnapshot = await getDocs(chatTagsQuery);
          
          tagsWithUsage.push({
            ...tag,
            usage_count: chatTagsSnapshot.size
          });
        } catch (error) {
          console.warn('Error getting usage for tag:', tag.id, error);
          tagsWithUsage.push({
            ...tag,
            usage_count: 0
          });
        }
      }

      console.log('🔥 Course tags with usage:', tagsWithUsage.length);
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

      // Get usage counts for each global tag
      const tagsWithUsage = [];
      for (const tag of globalTags) {
        try {
          const chatTagsQuery = query(
            collection(db, 'chatTags'),
            where('tagId', '==', tag.id)
          );
          const chatTagsSnapshot = await getDocs(chatTagsQuery);
          
          tagsWithUsage.push({
            ...tag,
            usage_count: chatTagsSnapshot.size
          });
        } catch (error) {
          console.warn('Error getting usage for global tag:', tag.id, error);
          tagsWithUsage.push({
            ...tag,
            usage_count: 0
          });
        }
      }

      console.log('🔥 Global tags with usage:', tagsWithUsage.length);
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
      // Get all chat-tag relationships for this tag
      const chatTagsQuery = query(
        collection(db, 'chatTags'),
        where('tagId', '==', tagId)
      );
      
      const chatTagsSnapshot = await getDocs(chatTagsQuery);
      const chatIds = chatTagsSnapshot.docs.map(doc => doc.data().chatId);
      
      if (chatIds.length === 0) {
        return [];
      }
      
      // Get chats by IDs
      const chats = [];
      for (const chatId of chatIds) {
        try {
          const chatDoc = await getDoc(doc(db, 'chats', chatId));
          
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            
            // Filter by course if specified
            if (courseId && chatData.courseId !== courseId) {
              continue;
            }
            
            const chat = { id: chatDoc.id, ...chatData };
            
            // Get user details
            if (chat.userId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', chat.userId));
                if (userDoc.exists()) {
                  chat.users = { id: userDoc.id, ...userDoc.data() };
                }
              } catch (error) {
                console.warn('User not found:', chat.userId);
              }
            }
            
            // Get project details
            if (chat.projectId) {
              try {
                const projectDoc = await getDoc(doc(db, 'projects', chat.projectId));
                if (projectDoc.exists()) {
                  chat.projects = { id: projectDoc.id, ...projectDoc.data() };
                }
              } catch (error) {
                console.warn('Project not found:', chat.projectId);
              }
            }
            
            chats.push({
              ...chat,
              created_at: convertTimestamp(chat.createdAt),
              updated_at: convertTimestamp(chat.updatedAt)
            });
          }
        } catch (error) {
          console.warn('Chat not found:', chatId, error);
        }
      }
      
      // Sort by creation date (most recent first)
      chats.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log('✅ getTaggedChats result:', chats.length, 'chats');
      return chats;
      
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

// REFLECTION API (Stub - not implemented in Firebase yet)
export const reflectionApi = {
  async createReflection(reflectionData) {
    console.log('🔥 Reflection API not implemented in Firebase yet');
    return { id: 'stub-id', ...reflectionData };
  },
  
  async getReflectionByChat(chatId) {
    console.log('🔥 Reflection API not implemented in Firebase yet');
    return null;
  },
  
  async updateReflection(id, updates) {
    console.log('🔥 Reflection API not implemented in Firebase yet');
    return { id, ...updates };
  }
};

// INSTRUCTOR NOTES API (Stub - not implemented in Firebase yet)
export const instructorNotesApi = {
  async createNote(noteData) {
    console.log('🔥 Instructor Notes API not implemented in Firebase yet');
    return { id: 'stub-id', ...noteData };
  },
  
  async getNotesByChat(chatId) {
    console.log('🔥 Instructor Notes API not implemented in Firebase yet');
    return [];
  },

  async getProjectNotes(projectId) {
    console.log('🔥 Instructor Notes API not implemented in Firebase yet');
    return [];
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

console.log('🔥 Firebase API initialized');