-- Manual user fix - Run this in your Supabase SQL Editor

-- Insert the user that's causing the error
INSERT INTO users (id, email, name, role, created_at)
VALUES (
  'TJzSQdlPbGQbaLNCZemTFc4DMHp2',
  'your_email@example.com',  -- Replace with your actual email
  'Your Name',               -- Replace with your actual name
  'student',                 -- or 'instructor' if you're an instructor
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Verify the user was created
SELECT * FROM users WHERE id = 'TJzSQdlPbGQbaLNCZemTFc4DMHp2'; 