// Diagnostic utilities for debugging data issues
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function diagnoseCourseProjects(courseId) {
  console.log('🔍 Diagnosing projects for course:', courseId);
  
  try {
    // 1. Get all projects with this courseId
    const projectsQuery = query(
      collection(db, 'projects'),
      where('courseId', '==', courseId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    console.log(`📁 Found ${projectsSnapshot.size} projects with courseId="${courseId}"`);
    
    // 2. Also check for projects with course_id (in case of field name mismatch)
    const projectsQuery2 = query(
      collection(db, 'projects'),
      where('course_id', '==', courseId)
    );
    const projectsSnapshot2 = await getDocs(projectsQuery2);
    
    console.log(`📁 Found ${projectsSnapshot2.size} projects with course_id="${courseId}"`);
    
    // 3. Get all chats for this course
    const chatsQuery = query(
      collection(db, 'chats'),
      where('courseId', '==', courseId)
    );
    const chatsSnapshot = await getDocs(chatsQuery);
    
    console.log(`💬 Found ${chatsSnapshot.size} chats with courseId="${courseId}"`);
    
    // 4. List actual project data
    const projects = [];
    projectsSnapshot.forEach(doc => {
      const data = doc.data();
      projects.push({
        id: doc.id,
        title: data.title,
        courseId: data.courseId,
        course_id: data.course_id,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
    });
    
    console.log('📋 Project details:', projects);
    
    // 5. Check for orphaned chats (chats without corresponding projects)
    const projectIds = new Set();
    projectsSnapshot.forEach(doc => projectIds.add(doc.id));
    
    const orphanedChats = [];
    chatsSnapshot.forEach(doc => {
      const chat = doc.data();
      if (chat.projectId && !projectIds.has(chat.projectId)) {
        orphanedChats.push({
          id: doc.id,
          projectId: chat.projectId,
          userId: chat.userId
        });
      }
    });
    
    if (orphanedChats.length > 0) {
      console.log(`⚠️ Found ${orphanedChats.length} orphaned chats (chats without projects)`);
      console.log('Orphaned chats:', orphanedChats);
    }
    
    return {
      projectsWithCourseId: projectsSnapshot.size,
      projectsWithCourse_id: projectsSnapshot2.size,
      totalChats: chatsSnapshot.size,
      projects: projects,
      orphanedChats: orphanedChats
    };
    
  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
    throw error;
  }
}