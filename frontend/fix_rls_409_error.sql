-- FIX FOR 409 ERROR: Row Level Security Policies
-- This error occurs because RLS is enabled but insert policy is missing

-- =====================================================
-- WASTE REPORTS TABLE - RLS POLICIES
-- =====================================================

-- First, let's check current RLS status (run this to verify)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'waste_reports';

-- Enable RLS (if not already enabled)
ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any - to start fresh)
DROP POLICY IF EXISTS "Anyone can view reports" ON public.waste_reports;
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.waste_reports;
DROP POLICY IF EXISTS "Anyone can update reports" ON public.waste_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.waste_reports;

-- =====================================================
-- CREATE NEW POLICIES
-- =====================================================

-- 1. ALLOW EVERYONE TO VIEW REPORTS (Public Read)
CREATE POLICY "Anyone can view reports"
  ON public.waste_reports
  FOR SELECT
  TO public
  USING (true);

-- 2. ALLOW ANYONE TO INSERT REPORTS (Including Anonymous)
-- This allows both logged-in and anonymous users to submit reports
CREATE POLICY "Anyone can insert reports"
  ON public.waste_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 3. ALLOW ANYONE TO UPDATE REPORTS (For upvotes)
-- This allows upvoting without authentication
CREATE POLICY "Anyone can update reports"
  ON public.waste_reports
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- 4. ALLOW ADMINS TO DELETE ANY REPORT
-- Only users with admin role can delete
CREATE POLICY "Admins can delete reports"
  ON public.waste_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- VERIFY POLICIES
-- =====================================================
-- Run this to check if policies were created:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'waste_reports';

-- =====================================================
-- ALTERNATIVE: MORE RESTRICTIVE POLICIES
-- =====================================================
-- If you want only authenticated users to submit reports:
/*
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.waste_reports;

CREATE POLICY "Authenticated users can insert reports"
  ON public.waste_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
*/
