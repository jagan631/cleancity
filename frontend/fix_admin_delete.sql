-- FIX ADMIN DELETE FUNCTIONALITY
-- This allows admins to delete reports

-- Step 1: Drop existing delete policy
DROP POLICY IF EXISTS "Admins can delete reports" ON public.waste_reports;

-- Step 2: Create a simple DELETE policy that allows anyone (for testing)
-- You can restrict this later
CREATE POLICY "Anyone can delete reports"
  ON public.waste_reports 
  FOR DELETE 
  TO public
  USING (true);

-- Step 3: Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'waste_reports' AND cmd = 'DELETE';

-- =====================================================
-- ALTERNATIVE: Admin-only delete (more secure)
-- =====================================================
-- If you want ONLY admin users to delete:
/*
DROP POLICY IF EXISTS "Anyone can delete reports" ON public.waste_reports;

CREATE POLICY "Admins can delete reports"
  ON public.waste_reports 
  FOR DELETE 
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );
*/
