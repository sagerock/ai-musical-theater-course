-- Get clean table status
SELECT DISTINCT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'course_memberships', 'pdf_attachments', 'instructor_notes', 'reflections')
ORDER BY tablename, rowsecurity;