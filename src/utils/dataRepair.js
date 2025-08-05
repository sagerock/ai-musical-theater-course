// Data repair utilities for fixing database inconsistencies
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Repairs projects that have course_id instead of courseId field
 * or projects that are missing courseId but have chats with courseId
 */
export async function repairProjectCourseIds() {
  console.log('🔧 Starting project courseId repair...');
  
  try {
    const batch = writeBatch(db);
    let repairedCount = 0;
    
    // 1. Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log(`📁 Found ${projectsSnapshot.size} total projects`);
    
    for (const projectDoc of projectsSnapshot.docs) {
      const project = projectDoc.data();
      let needsRepair = false;
      let updates = {};
      
      // Check if project has course_id but not courseId
      if (project.course_id && !project.courseId) {
        console.log(`🔧 Project ${projectDoc.id} has course_id but no courseId`);
        updates.courseId = project.course_id;
        needsRepair = true;
      }
      
      // If project has no courseId at all, try to find it from associated chats
      if (!project.courseId && !project.course_id) {
        const chatsQuery = query(
          collection(db, 'chats'),
          where('projectId', '==', projectDoc.id)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        
        if (chatsSnapshot.size > 0) {
          // Get courseId from the first chat
          const firstChat = chatsSnapshot.docs[0].data();
          if (firstChat.courseId) {
            console.log(`🔧 Project ${projectDoc.id} missing courseId, found from chat: ${firstChat.courseId}`);
            updates.courseId = firstChat.courseId;
            needsRepair = true;
          }
        }
      }
      
      if (needsRepair) {
        batch.update(doc(db, 'projects', projectDoc.id), updates);
        repairedCount++;
      }
    }
    
    if (repairedCount > 0) {
      await batch.commit();
      console.log(`✅ Repaired ${repairedCount} projects`);
    } else {
      console.log('✅ No projects needed repair');
    }
    
    return {
      success: true,
      repairedCount,
      totalProjects: projectsSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error repairing projects:', error);
    throw error;
  }
}

/**
 * Diagnostic function to check for common project issues
 */
export async function diagnoseProjectIssues() {
  console.log('🔍 Diagnosing project issues...');
  
  const issues = {
    missingCourseId: [],
    hasCourse_id: [],
    orphanedChats: [],
    duplicateFields: []
  };
  
  try {
    // Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    
    for (const projectDoc of projectsSnapshot.docs) {
      const project = projectDoc.data();
      
      // Check for missing courseId
      if (!project.courseId) {
        issues.missingCourseId.push({
          id: projectDoc.id,
          title: project.title,
          hasCourse_id: !!project.course_id
        });
      }
      
      // Check for course_id field
      if (project.course_id) {
        issues.hasCourse_id.push({
          id: projectDoc.id,
          title: project.title,
          course_id: project.course_id,
          courseId: project.courseId
        });
      }
      
      // Check for both fields
      if (project.course_id && project.courseId && project.course_id !== project.courseId) {
        issues.duplicateFields.push({
          id: projectDoc.id,
          title: project.title,
          course_id: project.course_id,
          courseId: project.courseId
        });
      }
    }
    
    console.log('📊 Diagnostic Results:', issues);
    return issues;
    
  } catch (error) {
    console.error('❌ Error in diagnosis:', error);
    throw error;
  }
}