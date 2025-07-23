-- EMERGENCY ROLLBACK SCRIPT
-- Use this ONLY if RLS policies cause critical issues
-- This will DISABLE privacy protection - use with caution

-- ============================================================================
-- IMMEDIATE DISABLE (Run this section if app is broken)
-- ============================================================================

-- STEP 1: Disable RLS on all tables immediately
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;

SELECT '⚠️  EMERGENCY: RLS DISABLED - PRIVACY PROTECTION IS OFF ⚠️' as warning;

-- ============================================================================
-- COMPLETE ROLLBACK (Remove all policies)
-- ============================================================================

-- Drop all RLS policies we created
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on our tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
        AND policyname LIKE '%policy' OR policyname LIKE '%profile' OR policyname LIKE 'users_%' OR policyname LIKE 'chats_%' OR policyname LIKE 'pdf_%' OR policyname LIKE 'instructor_%' OR policyname LIKE 'projects_%' OR policyname LIKE 'course_%' OR policyname LIKE 'reflections_%'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'ROLLBACK: Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- ============================================================================
-- RESTORE ORIGINAL STATE
-- ============================================================================

-- Remove FORCE ROW LEVEL SECURITY (back to normal RLS)
ALTER TABLE users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE chats NO FORCE ROW LEVEL SECURITY;
ALTER TABLE pdf_attachments NO FORCE ROW LEVEL SECURITY;
ALTER TABLE instructor_notes NO FORCE ROW LEVEL SECURITY;
ALTER TABLE projects NO FORCE ROW LEVEL SECURITY;
ALTER TABLE course_memberships NO FORCE ROW LEVEL SECURITY;
ALTER TABLE reflections NO FORCE ROW LEVEL SECURITY;

-- Remove any RLS bypass grants (be more specific in production)
-- REVOKE BYPASS RLS ON ALL TABLES IN SCHEMA public FROM service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as remaining_policies
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes', 'projects', 'course_memberships', 'reflections')
ORDER BY tablename;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

-- Log the rollback event
INSERT INTO rls_audit_log (table_name, policy_name, action, notes) VALUES
('ALL_TABLES', 'emergency_rollback', 'disabled_rls', 'Emergency rollback executed - privacy protection temporarily disabled');

-- ============================================================================
-- FINAL WARNING
-- ============================================================================

SELECT 
  '🚨 ROLLBACK COMPLETE - PRIVACY PROTECTION IS DISABLED 🚨' as critical_warning,
  NOW() as rollback_time,
  'Student data is no longer protected by RLS policies' as impact,
  'Re-implement privacy policies as soon as possible' as urgent_action,
  'Check application functionality and then re-enable privacy' as next_steps;

-- ============================================================================
-- QUICK RE-ENABLE (Use after fixing issues)
-- ============================================================================

-- Once issues are resolved, you can quickly re-enable minimal protection:

-- Enable basic RLS (without complex policies)
-- ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "basic_chat_privacy" ON chats FOR SELECT USING (user_id = auth.uid());

-- ALTER TABLE pdf_attachments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "basic_pdf_privacy" ON pdf_attachments FOR SELECT USING (
--   chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid())
-- );

-- Uncomment and run the above when ready to restore minimal privacy