-- FIX FOR FOREIGN KEY CONSTRAINT ERROR (23503)
-- This error occurs because user_id is required but we're inserting null for anonymous users

-- =====================================================
-- SOLUTION: Make user_id column NULLABLE
-- =====================================================

-- Option 1: Allow NULL user_id (recommended for public reporting)
ALTER TABLE public.waste_reports 
ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'waste_reports' AND column_name = 'user_id';

-- =====================================================
-- ALTERNATIVE SOLUTION: Drop the foreign key entirely
-- =====================================================
-- If you want to completely remove the user_id requirement:
/*
-- First, find the constraint name
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'waste_reports' 
AND constraint_type = 'FOREIGN KEY';

-- Then drop it (replace with actual constraint name from above query)
ALTER TABLE public.waste_reports 
DROP CONSTRAINT waste_reports_user_id_fkey;
*/

-- =====================================================
-- EXPLANATION
-- =====================================================
-- The waste_reports table was created with user_id as a required field
-- (NOT NULL constraint) that must reference a valid user in auth.users.
-- 
-- When anonymous users (not logged in) submit reports, user_id is NULL,
-- which violates both:
-- 1. The NOT NULL constraint
-- 2. The foreign key constraint (if it doesn't allow NULL)
--
-- By making the column nullable, we allow:
-- - Logged-in users: user_id = their actual user ID
-- - Anonymous users: user_id = NULL
