-- Check what policies exist on course_memberships that might cause recursion
SELECT policyname, cmd, qual as "USING condition", with_check 
FROM pg_policies 
WHERE tablename = 'course_memberships'
ORDER BY policyname;