// FIXED VERSION: Admin notifications should run independently of instructor notifications

// Send email notification to instructors (non-blocking)
try {
  console.log('📧 Starting email notification process...');
  
  // Get student information
  const { data: studentData } = await dbClient
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .single();
  
  console.log('👤 Student data retrieved:', studentData);

  // Get course instructors
  const { data: instructors } = await dbClient
    .from('course_memberships')
    .select(`
      users!user_id (
        name,
        email
      )
    `)
    .eq('course_id', course.id)
    .eq('role', 'instructor')
    .eq('status', 'approved');

  // Import email service dynamically to avoid circular imports
  const { emailNotifications } = await import('./emailService.js');

  // Send instructor notifications (only if instructors exist)
  if (studentData && instructors && instructors.length > 0) {
    const instructorEmails = instructors.map(instructor => ({
      name: instructor.users.name,
      email: instructor.users.email
    }));

    const enrollmentData = {
      studentName: studentData.name || 'Unknown Student',
      studentEmail: studentData.email,
      courseName: course.title,
      courseCode: course.course_code,
      requestedRole: role,
      instructorEmails: instructorEmails
    };

    console.log('📧 Sending course enrollment notification to instructors...');
    
    // Send email notification to instructors (don't await - non-blocking)
    emailNotifications.notifyInstructorsOfEnrollmentRequest(enrollmentData)
      .then(result => {
        if (result.success) {
          console.log('✅ Course enrollment notification sent successfully to instructors');
        } else {
          console.warn('⚠️ Failed to send course enrollment notification to instructors:', result.error);
        }
      })
      .catch(emailError => {
        console.warn('⚠️ Error sending course enrollment notification to instructors:', emailError.message);
      });
  } else {
    console.log('📧 No existing instructors found - skipping instructor notification');
  }

  // Send admin notification for ALL enrollment requests (students AND instructors)
  // This should ALWAYS run regardless of instructor availability
  if (studentData) {
    console.log(`📧 Sending admin notification for ${role} enrollment request...`);
    
    // Get course statistics for admin context
    try {
      const courseMembers = await this.getCourseMembers(course.id);
      const currentInstructors = courseMembers.filter(m => m.role === 'instructor' && m.status === 'approved');
      const currentStudents = courseMembers.filter(m => m.role === 'student' && m.status === 'approved');
      const pendingRequests = courseMembers.filter(m => m.status === 'pending');

      const adminAlertData = {
        userName: studentData.name || 'Unknown User',
        userEmail: studentData.email,
        courseName: course.title,
        courseCode: course.course_code,
        requestedRole: role,
        currentInstructorCount: currentInstructors.length,
        currentStudentCount: currentStudents.length,
        pendingRequestCount: pendingRequests.length
      };

      console.log('📊 Admin alert data prepared:', {
        user: adminAlertData.userName,
        role: adminAlertData.requestedRole,
        course: adminAlertData.courseName,
        stats: {
          instructors: adminAlertData.currentInstructorCount,
          students: adminAlertData.currentStudentCount,
          pending: adminAlertData.pendingRequestCount
        }
      });

      // Send admin notification (don't await - non-blocking)
      emailNotifications.notifyAdminsOfCourseEnrollmentRequest(adminAlertData)
        .then(result => {
          if (result.success) {
            console.log(`✅ Admin ${role} enrollment alert sent successfully to ${result.results?.length || 0} admins`);
          } else if (result.skipped) {
            console.log('📧 Admin notification skipped:', result.reason);
          } else {
            console.warn(`⚠️ Failed to send admin ${role} enrollment alert:`, result.error);
          }
        })
        .catch(emailError => {
          console.warn(`⚠️ Error sending admin ${role} enrollment alert:`, emailError.message);
        });

    } catch (statsError) {
      console.error('❌ Error gathering course stats for admin alert:', statsError);
      
      // Send basic admin notification without stats
      const basicAdminAlertData = {
        userName: studentData.name || 'Unknown User',
        userEmail: studentData.email,
        courseName: course.title,
        courseCode: course.course_code,
        requestedRole: role,
        currentInstructorCount: 0,
        currentStudentCount: 0,
        pendingRequestCount: 1
      };

      emailNotifications.notifyAdminsOfCourseEnrollmentRequest(basicAdminAlertData)
        .then(result => {
          if (result.success) {
            console.log(`✅ Basic admin ${role} enrollment alert sent successfully`);
          } else if (result.skipped) {
            console.log('📧 Basic admin notification skipped:', result.reason);
          } else {
            console.warn(`⚠️ Failed to send basic admin ${role} enrollment alert:`, result.error);
          }
        })
        .catch(emailError => {
          console.warn(`⚠️ Error sending basic admin ${role} enrollment alert:`, emailError.message);
        });
    }
  } else {
    console.log('❌ Missing student data - cannot send admin notification');
  }
} catch (emailError) {
  console.warn('⚠️ Non-critical email notification error:', emailError.message);
  // Don't throw - email failure shouldn't prevent course enrollment
}