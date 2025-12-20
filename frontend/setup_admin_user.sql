-- Instructions to set up an admin user
-- Run this AFTER you have created a user in Supabase Authentication

-- STEP 1: Create user in Supabase Dashboard
-- Go to Authentication → Users → Add user
-- Email: admin@cleancity.com
-- Password: admin123 (or your choice)
-- Check "Auto Confirm User"
-- Copy the user's UUID after creation

-- STEP 2: Add admin role to user metadata
-- Go to Authentication → Users → Click on your admin user
-- In "User Metadata" section (or raw user data), add:
-- {
--   "role": "admin"
-- }

-- ALTERNATIVELY, you can update via SQL (replace YOUR_ADMIN_USER_ID):
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE id = 'YOUR_ADMIN_USER_ID';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify admin users:
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
