-- Create the venues table if it does not exist
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- e.g. "Auditorium", "Sports Complex", "Conference Hall"
    description TEXT,
    capacity INTEGER NOT NULL,
    price_first_4_hours NUMERIC,
    price_succeeding_hour NUMERIC,
    price_daily NUMERIC,
    security_deposit NUMERIC DEFAULT 3000,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Allow public read access to venues so that clients can see facility information
CREATE POLICY "Allow public read venues" ON venues FOR SELECT USING (true);

-- Allow authenticated and admin-like operations for inserting, updating, and deleting venues
-- For simplicity and alignment with other tables, we check checking true or session
CREATE POLICY "Allow write venues for everyone" ON venues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update venues for everyone" ON venues FOR UPDATE USING (true);
CREATE POLICY "Allow delete venues for everyone" ON venues FOR DELETE USING (true);
