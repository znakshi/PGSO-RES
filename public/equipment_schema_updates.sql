-- Migration script to support standalone equipment reservations

-- Add the 'is_standalone_reservable' flag to the inventory table
ALTER TABLE IF EXISTS inventory 
ADD COLUMN IF NOT EXISTS is_standalone_reservable BOOLEAN DEFAULT false;

-- Allow public read access to inventory if not already enabled (needed for clients to see equipment)
-- Assuming the table is already secured with RLS
CREATE POLICY "Allow public read inventory" ON inventory FOR SELECT USING (true);
