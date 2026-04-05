```sql
-- 1. Create the notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID DEFAULT NULL, -- NULL means it's for ADMINS. Set UUID means it's for a specific CLIENT.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to insert (so clients can notify admins, admins can notify clients)
CREATE POLICY "Allow public insert to notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view their own notifications
CREATE POLICY "Allow users to view own notifications" ON notifications FOR SELECT USING (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);

-- Note: we also need admins to be able to view their notifications where user_id IS NULL.
-- Since the admin dashboard relies on anon key, we'll allow selection for anon or authenticated where user_id IS NULL:
CREATE POLICY "Allow anyone to read admin notifications" ON notifications FOR SELECT USING (
  user_id IS NULL
);

-- Allow users to update their own notifications (to mark as read)
CREATE POLICY "Allow users to update own notifications" ON notifications FOR UPDATE USING (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);

-- Allow admins to update their notifications
CREATE POLICY "Allow anyone to update admin notifications" ON notifications FOR UPDATE USING (
  user_id IS NULL
);

-- 4. Enable Realtime triggers for the table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE notifications, reservations, inventory;
COMMIT;
```
