-- Enable Row Level Security (RLS) on the table (if valid, though usually verified by the error)
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone (anon) to VIEW reports
CREATE POLICY "Enable read access for all users" 
ON waste_reports FOR SELECT 
USING (true);

-- Policy to allow anyone (anon) to INSERT reports
CREATE POLICY "Enable insert access for all users" 
ON waste_reports FOR INSERT 
WITH CHECK (true);

-- Policy to allow anyone (anon) to UPDATE reports (for upvotes)
CREATE POLICY "Enable update access for all users" 
ON waste_reports FOR UPDATE 
USING (true);

-- Repeat for recycling_centers if needed
ALTER TABLE recycling_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for recycling centers" 
ON recycling_centers FOR SELECT 
USING (true);
