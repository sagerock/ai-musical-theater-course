import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { projectApi, chatApi, courseApi } from '../../services/supabaseApi';

export default function DashboardDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    testDataAccess();
  }, [currentUser]);

  const testDataAccess = async () => {
    const results = {};
    
    try {
      console.log('🔍 Testing dashboard data access for user:', currentUser.id);
      
      // Test 1: Get user courses
      try {
        const userCourses = await courseApi.getUserCourses(currentUser.id);
        results.userCourses = { success: true, count: userCourses.length, data: userCourses };
        console.log('✅ User courses loaded:', userCourses.length);
      } catch (error) {
        results.userCourses = { success: false, error: error.message };
        console.error('❌ User courses failed:', error);
      }

      // Test 2: Get user projects (no course filter)
      try {
        const userProjects = await projectApi.getUserProjects(currentUser.id);
        results.userProjects = { success: true, count: userProjects.length, data: userProjects };
        console.log('✅ User projects loaded:', userProjects.length);
      } catch (error) {
        results.userProjects = { success: false, error: error.message };
        console.error('❌ User projects failed:', error);
      }

      // Test 3: Get user chats (no course filter)
      try {
        const userChats = await chatApi.getUserChats(currentUser.id, null, 10);
        results.userChats = { success: true, count: userChats.length, data: userChats };
        console.log('✅ User chats loaded:', userChats.length);
      } catch (error) {
        results.userChats = { success: false, error: error.message };
        console.error('❌ User chats failed:', error);
      }

      setDebugInfo(results);
    } catch (error) {
      console.error('❌ Dashboard debug failed:', error);
      setDebugInfo({ globalError: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">🔄 Testing dashboard data access...</div>;
  }

  return (
    <div className="p-4 bg-gray-50 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">🔍 Dashboard Debug Results</h3>
      
      <div className="space-y-4">
        {/* User Courses */}
        <div className="p-3 bg-white border rounded">
          <h4 className="font-semibold">User Courses:</h4>
          {debugInfo.userCourses?.success ? (
            <div className="text-green-600">
              ✅ Success - {debugInfo.userCourses.count} courses found
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Failed - {debugInfo.userCourses?.error}
            </div>
          )}
        </div>

        {/* User Projects */}
        <div className="p-3 bg-white border rounded">
          <h4 className="font-semibold">User Projects:</h4>
          {debugInfo.userProjects?.success ? (
            <div className="text-green-600">
              ✅ Success - {debugInfo.userProjects.count} projects found
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Failed - {debugInfo.userProjects?.error}
            </div>
          )}
        </div>

        {/* User Chats */}
        <div className="p-3 bg-white border rounded">
          <h4 className="font-semibold">User Chats:</h4>
          {debugInfo.userChats?.success ? (
            <div className="text-green-600">
              ✅ Success - {debugInfo.userChats.count} chats found
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Failed - {debugInfo.userChats?.error}
            </div>
          )}
        </div>

        {/* Global Error */}
        {debugInfo.globalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-600">Global Error:</h4>
            <div className="text-red-600">{debugInfo.globalError}</div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Check the browser console for detailed logs.
      </div>
    </div>
  );
}