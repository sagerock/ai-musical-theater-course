# RLS Implementation Strategy for AI Engagement Hub

## ⚠️ Critical Privacy Principle
**Student AI interactions and personal data MUST be protected. Privacy is non-negotiable.**

## 🎯 Implementation Phases

### Phase 1: Foundation (Start Here)
1. **Drop existing broken policies** - Clean slate approach
2. **Implement core user authentication** - Ensure `auth.uid()` works correctly  
3. **Enable RLS on most critical table first**: `chats` (AI interactions)
4. **Test thoroughly** before proceeding

### Phase 2: Core Privacy Protection
1. `pdf_attachments` - Student documents
2. `instructor_notes` - Private instructor notes
3. `users` - Personal information

### Phase 3: Project & Course Data
1. `projects` - Student projects
2. `course_memberships` - Enrollment data
3. `reflections` - Student reflections

## 🔧 Technical Solutions for Common Issues

### Issue 1: Service Role Operations Failing
**Problem**: Backend operations need to bypass RLS for legitimate admin functions

**Solution**: 
```sql
-- Grant service role explicit bypass for backend operations
GRANT BYPASS RLS ON ALL TABLES IN SCHEMA public TO service_role;
```

**Alternative**: Use service role client only for admin operations, regular client for user operations

### Issue 2: Complex Join Queries Failing  
**Problem**: Multi-table joins with RLS cause permission errors

**Solution**: 
```sql
-- Create security definer functions for complex queries
CREATE OR REPLACE FUNCTION get_user_course_data(target_user_id UUID)
RETURNS TABLE(user_data JSON) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function runs with elevated privileges
  RETURN QUERY 
  SELECT row_to_json(combined_data) 
  FROM (
    SELECT u.*, array_agg(cm.course_id) as courses
    FROM users u
    LEFT JOIN course_memberships cm ON u.id = cm.user_id
    WHERE u.id = target_user_id
    GROUP BY u.id
  ) combined_data;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_course_data(UUID) TO authenticated;
```

### Issue 3: Frontend Authentication Context
**Problem**: Frontend operations don't have proper user context

**Solution**: Ensure Firebase UID is properly mapped to Supabase auth:
```javascript
// In supabaseApi.js - ensure proper auth context
const ensureAuthContext = async () => {
  const firebaseUid = getCurrentFirebaseUID();
  if (!firebaseUid) {
    throw new Error('No authenticated user');
  }
  
  // Set Supabase auth context
  await supabase.auth.setUser({
    id: firebaseUid,
    // other required fields
  });
};
```

## 📋 Pre-Implementation Checklist

- [ ] **Backup current database** - Essential before making changes

- [ ] **Identify service vs user operations** - Separate admin/backend from user operations
- [ ] **Create testing plan** - Test all three user roles (student/instructor/admin)
- [ ] **Plan rollback strategy** - Be able to quickly disable RLS if needed

## 🚀 Implementation Commands

### Step 1: Clean Slate
```sql
-- Drop all existing RLS policies (fresh start)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
-- ... drop all existing policies ...

-- Disable RLS temporarily for setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
-- ... all tables ...
```

### Step 2: Implement Core Protection
```bash
# Apply the privacy-first policies
psql -h your-supabase-host -U postgres -d postgres -f privacy_first_rls_policies.sql
```

### Step 3: Test & Validate
```sql
-- Test as student
SET ROLE authenticated;
SET request.jwt.claim.sub TO 'student-uuid';
SELECT * FROM chats; -- Should only show their chats

-- Test as instructor  
SET request.jwt.claim.sub TO 'instructor-uuid';
SELECT * FROM chats WHERE course_id = 'their-course-uuid'; -- Should show course chats

-- Test as admin
SET request.jwt.claim.sub TO 'admin-uuid';
SELECT * FROM chats; -- Should show all chats
```

## ⚡ Quick Rollback Plan

If RLS causes issues, immediately run:
```sql
-- EMERGENCY: Disable all RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;  
ALTER TABLE pdf_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
```

## 🔍 Monitoring & Validation

### Daily Monitoring Queries:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'chats', 'pdf_attachments', 'instructor_notes');

-- Verify policies exist
SELECT tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check for access violations in logs
SELECT * FROM rls_audit_log WHERE changed_at > NOW() - INTERVAL '24 hours';
```

### Privacy Validation Tests:
1. **Cross-Student Privacy**: Student A cannot see Student B's chats
2. **Course Isolation**: Instructor from Course A cannot see Course B data  
3. **Service Operations**: Backend functions still work for admin tasks
4. **Performance**: No significant query performance degradation

## 📚 Key Privacy Principles Applied:

1. **Students own their data** - Can only see their own AI interactions
2. **Instructors see course data only** - Limited to their assigned courses
3. **Global admins have full access** - For platform management
4. **Service role bypasses for backend** - Legitimate admin operations
5. **Audit trail maintained** - All policy changes logged
6. **Performance preserved** - Efficient policy design

## ⚠️ Production Considerations:

- **Test thoroughly in staging first**
- **Monitor query performance after deployment** 
- **Have rollback plan ready**
- **Communicate changes to team**
- **Document any custom functions created**
- **Regular security audits**

---

**Remember**: Privacy protection is worth the complexity. Student trust is paramount in educational tools.