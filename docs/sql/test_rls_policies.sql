-- COMPREHENSIVE RLS POLICY TESTING
-- Run these tests to validate privacy protection works correctly
-- Test with different user roles: student, instructor, global admin

-- ============================================================================
-- SETUP: Create test data (run once)
-- ============================================================================

-- Create test users (if they don't exist)
INSERT INTO users (id, name, email, is_global_admin) VALUES
('00000000-0000-0000-0000-000000000001', 'Test Student 1', 'student1@test.edu', false),
('00000000-0000-0000-0000-000000000002', 'Test Student 2', 'student2@test.edu', false),
('00000000-0000-0000-0000-000000000003', 'Test Instructor', 'instructor@test.edu', false),
('00000000-0000-0000-0000-000000000004', 'Test Global Admin', 'admin@test.edu', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  is_global_admin = EXCLUDED.is_global_admin;

-- Create test course
INSERT INTO courses (id, name, course_code, created_by) VALUES
('00000000-0000-0000-0000-000000000100', 'Test Course', 'TEST-01', '00000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Create test course memberships
INSERT INTO course_memberships (course_id, user_id, role, status) VALUES
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001', 'student', 'approved'),
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000002', 'student', 'approved'),  
('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000003', 'instructor', 'approved')
ON CONFLICT (course_id, user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Create test projects
INSERT INTO projects (id, title, description, course_id, created_by) VALUES
('00000000-0000-0000-0000-000000000200', 'Student 1 Project', 'Test project by student 1', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000201', 'Student 2 Project', 'Test project by student 2', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Create test chats (AI interactions)
INSERT INTO chats (id, user_id, project_id, course_id, tool_used, prompt, response) VALUES
('00000000-0000-0000-0000-000000000300', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', 'GPT-4', 'Test prompt from student 1', 'Test response'),
('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', 'Claude', 'Test prompt from student 2', 'Test response')
ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt;

-- Create test PDF attachments
INSERT INTO pdf_attachments (id, chat_id, file_name, file_size, storage_path) VALUES
('00000000-0000-0000-0000-000000000400', '00000000-0000-0000-0000-000000000300', 'student1_document.pdf', 1024, '/student1/doc.pdf'),
('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 'student2_document.pdf', 2048, '/student2/doc.pdf')
ON CONFLICT (id) DO UPDATE SET file_name = EXCLUDED.file_name;

-- Create test instructor notes
INSERT INTO instructor_notes (id, project_id, instructor_id, content) VALUES
('00000000-0000-0000-0000-000000000500', '00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000003', 'Note about student 1 project'),
('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000003', 'Note about student 2 project')  
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- ============================================================================
-- TEST 1: STUDENT PRIVACY PROTECTION
-- ============================================================================

SELECT '=== TESTING STUDENT 1 ACCESS (Should only see own data) ===' as test_section;

-- Simulate Student 1 login
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

-- TEST 1A: Student 1 should only see their own user data
SELECT 
  'TEST 1A: User Access' as test_name,
  count(*) as visible_users,
  CASE 
    WHEN count(*) = 1 AND max(name) = 'Test Student 1' THEN '✅ PASS'
    ELSE '❌ FAIL - Student can see other users'
  END as result
FROM users;

-- TEST 1B: Student 1 should only see their own chats
SELECT 
  'TEST 1B: Chat Access' as test_name,
  count(*) as visible_chats,
  CASE 
    WHEN count(*) = 1 AND max(user_id::text) = '00000000-0000-0000-0000-000000000001' THEN '✅ PASS'
    ELSE '❌ FAIL - Student can see other student chats'
  END as result
FROM chats;

-- TEST 1C: Student 1 should only see their own PDF attachments
SELECT 
  'TEST 1C: PDF Access' as test_name,
  count(*) as visible_pdfs,
  CASE 
    WHEN count(*) = 1 AND max(file_name) = 'student1_document.pdf' THEN '✅ PASS'
    ELSE '❌ FAIL - Student can see other student PDFs'
  END as result
FROM pdf_attachments;

-- TEST 1D: Student 1 should NOT see instructor notes
SELECT 
  'TEST 1D: Instructor Notes' as test_name,
  count(*) as visible_notes,
  CASE 
    WHEN count(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Student can see instructor notes'
  END as result
FROM instructor_notes;

-- TEST 1E: Student 1 should only see their own projects
SELECT 
  'TEST 1E: Project Access' as test_name,
  count(*) as visible_projects,
  CASE 
    WHEN count(*) = 1 AND max(title) = 'Student 1 Project' THEN '✅ PASS'
    ELSE '❌ FAIL - Student can see other student projects'
  END as result
FROM projects;

-- ============================================================================
-- TEST 2: INSTRUCTOR ACCESS (Should see course data)
-- ============================================================================

SELECT '=== TESTING INSTRUCTOR ACCESS (Should see course data) ===' as test_section;

-- Simulate Instructor login
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';

-- TEST 2A: Instructor should see students in their course
SELECT 
  'TEST 2A: Course Students' as test_name,
  count(*) as visible_users,
  CASE 
    WHEN count(*) >= 2 THEN '✅ PASS - Can see course students'
    ELSE '❌ FAIL - Cannot see course students'
  END as result
FROM users;

-- TEST 2B: Instructor should see all chats in their course
SELECT 
  'TEST 2B: Course Chats' as test_name,
  count(*) as visible_chats,
  CASE 
    WHEN count(*) = 2 THEN '✅ PASS - Can see all course chats'
    ELSE '❌ FAIL - Cannot see all course chats'
  END as result
FROM chats;

-- TEST 2C: Instructor should see all PDFs in their course
SELECT 
  'TEST 2C: Course PDFs' as test_name,
  count(*) as visible_pdfs,
  CASE 
    WHEN count(*) = 2 THEN '✅ PASS - Can see all course PDFs'
    ELSE '❌ FAIL - Cannot see all course PDFs'
  END as result
FROM pdf_attachments;

-- TEST 2D: Instructor should see all instructor notes in their course
SELECT 
  'TEST 2D: Own Notes' as test_name,
  count(*) as visible_notes,
  CASE 
    WHEN count(*) = 2 THEN '✅ PASS - Can see own instructor notes'
    ELSE '❌ FAIL - Cannot see own instructor notes'
  END as result
FROM instructor_notes;

-- TEST 2E: Instructor should see all projects in their course
SELECT 
  'TEST 2E: Course Projects' as test_name,
  count(*) as visible_projects,
  CASE 
    WHEN count(*) = 2 THEN '✅ PASS - Can see all course projects'
    ELSE '❌ FAIL - Cannot see all course projects'
  END as result
FROM projects;

-- ============================================================================
-- TEST 3: GLOBAL ADMIN ACCESS (Should see everything)
-- ============================================================================

SELECT '=== TESTING GLOBAL ADMIN ACCESS (Should see everything) ===' as test_section;

-- Simulate Global Admin login
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';

-- TEST 3A: Admin should see all users
SELECT 
  'TEST 3A: All Users' as test_name,
  count(*) as visible_users,
  CASE 
    WHEN count(*) >= 4 THEN '✅ PASS - Can see all users'
    ELSE '❌ FAIL - Cannot see all users'
  END as result
FROM users;

-- TEST 3B: Admin should see all chats
SELECT 
  'TEST 3B: All Chats' as test_name,
  count(*) as visible_chats,
  CASE 
    WHEN count(*) >= 2 THEN '✅ PASS - Can see all chats'
    ELSE '❌ FAIL - Cannot see all chats'
  END as result
FROM chats;

-- TEST 3C: Admin should see all PDFs
SELECT 
  'TEST 3C: All PDFs' as test_name,
  count(*) as visible_pdfs,
  CASE 
    WHEN count(*) >= 2 THEN '✅ PASS - Can see all PDFs'
    ELSE '❌ FAIL - Cannot see all PDFs'
  END as result
FROM pdf_attachments;

-- TEST 3D: Admin should see all instructor notes
SELECT 
  'TEST 3D: All Notes' as test_name,
  count(*) as visible_notes,
  CASE 
    WHEN count(*) >= 2 THEN '✅ PASS - Can see all notes'
    ELSE '❌ FAIL - Cannot see all notes'
  END as result
FROM instructor_notes;

-- TEST 3E: Admin should see all projects
SELECT 
  'TEST 3E: All Projects' as test_name,
  count(*) as visible_projects,
  CASE 
    WHEN count(*) >= 2 THEN '✅ PASS - Can see all projects'
    ELSE '❌ FAIL - Cannot see all projects'
  END as result
FROM projects;

-- ============================================================================
-- TEST 4: CROSS-COURSE ISOLATION (Create second course)
-- ============================================================================

SELECT '=== TESTING CROSS-COURSE ISOLATION ===' as test_section;

-- Create second course and instructor
INSERT INTO courses (id, name, course_code, created_by) VALUES
('00000000-0000-0000-0000-000000000101', 'Test Course 2', 'TEST-02', '00000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO users (id, name, email, is_global_admin) VALUES
('00000000-0000-0000-0000-000000000005', 'Test Instructor 2', 'instructor2@test.edu', false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO course_memberships (course_id, user_id, role, status) VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000005', 'instructor', 'approved')
ON CONFLICT (course_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- TEST 4A: Instructor 2 should NOT see Course 1 data
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000005';

SELECT 
  'TEST 4A: Cross-Course Chats' as test_name,
  count(*) as visible_chats,
  CASE 
    WHEN count(*) = 0 THEN '✅ PASS - Cannot see other course chats'
    ELSE '❌ FAIL - Can see other course chats'
  END as result
FROM chats;

SELECT 
  'TEST 4B: Cross-Course Projects' as test_name,
  count(*) as visible_projects,
  CASE 
    WHEN count(*) = 0 THEN '✅ PASS - Cannot see other course projects'
    ELSE '❌ FAIL - Can see other course projects'
  END as result
FROM projects;

-- ============================================================================
-- TEST 5: INSERT/UPDATE PERMISSIONS
-- ============================================================================

SELECT '=== TESTING INSERT/UPDATE PERMISSIONS ===' as test_section;

-- TEST 5A: Student can create their own chat
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

BEGIN;
  INSERT INTO chats (user_id, project_id, course_id, tool_used, prompt, response) 
  VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', 'GPT-4', 'Test insert', 'Test response');
  
  SELECT 
    'TEST 5A: Student Chat Insert' as test_name,
    '✅ PASS - Student can create own chat' as result;
ROLLBACK;

-- TEST 5B: Student cannot create chat for another user (should fail)
BEGIN;
  SELECT 
    'TEST 5B: Unauthorized Chat Insert' as test_name,
    CASE 
      WHEN (
        SELECT count(*) FROM (
          INSERT INTO chats (user_id, project_id, course_id, tool_used, prompt, response) 
          VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000100', 'GPT-4', 'Unauthorized', 'Should fail')
          RETURNING id
        ) unauthorized_insert
      ) = 0 THEN '✅ PASS - Student cannot create chat for others'
      ELSE '❌ FAIL - Student can create chat for others'
    END as result;
EXCEPTION 
  WHEN insufficient_privilege THEN
    SELECT 
      'TEST 5B: Unauthorized Chat Insert' as test_name,
      '✅ PASS - Student cannot create chat for others (blocked by RLS)' as result;
ROLLBACK;

-- ============================================================================
-- PERFORMANCE TEST
-- ============================================================================

SELECT '=== PERFORMANCE VALIDATION ===' as test_section;

-- Test query performance (should complete quickly)
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';

EXPLAIN ANALYZE 
SELECT c.*, u.name as student_name, p.title as project_title
FROM chats c
JOIN users u ON c.user_id = u.id
JOIN projects p ON c.project_id = p.id;

-- ============================================================================
-- CLEANUP & SUMMARY
-- ============================================================================

-- Reset session
RESET request.jwt.claim.sub;

-- Summary report
SELECT 
  '🔒 RLS POLICY TESTING COMPLETED 🔒' as status,
  NOW() as tested_at,
  'Check results above for any FAIL messages' as next_action,
  'All tests should show ✅ PASS for proper privacy protection' as expected_result;

-- Policy verification
SELECT 
  'Policy Status Check' as check_type,
  tablename,
  count(*) as policy_count,
  CASE 
    WHEN count(*) > 0 THEN '✅ Policies Active'
    ELSE '❌ No Policies Found'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
GROUP BY tablename
ORDER BY tablename;