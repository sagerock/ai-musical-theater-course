import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseApi } from '../../services/firebaseApi';
import StudentLibrary from './StudentLibrary';

export default function StudentLibraryWrapper() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { courseId } = useParams();

  useEffect(() => {
    if (courseId) {
      loadCourseInfo();
    }
  }, [courseId]);

  const loadCourseInfo = async () => {
    try {
      const courseData = await courseApi.getCourseById(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <StudentLibrary 
      selectedCourseId={courseId}
      selectedCourse={course}
      currentUser={currentUser}
    />
  );
}