-- Create intern_daily_logs table for daily attendance tracking
CREATE TABLE IF NOT EXISTS intern_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES intern_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('present', 'absent', 'half_day', 'late', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intern_id, date)
);

-- Enable RLS
ALTER TABLE intern_daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_own_logs" ON intern_daily_logs FOR SELECT
  TO authenticated USING (
    intern_id IN (SELECT id FROM intern_profiles WHERE id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "insert_own_log" ON intern_daily_logs FOR INSERT
  TO authenticated WITH CHECK (
    intern_id IN (SELECT id FROM intern_profiles WHERE id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "update_own_log" ON intern_daily_logs FOR UPDATE
  TO authenticated USING (
    intern_id IN (SELECT id FROM intern_profiles WHERE id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Admin can manage all logs
CREATE POLICY "admin_all_logs" ON intern_daily_logs FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email IN ('admin@tekvora.com', 'vaibhav@tekvora.com'))
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_daily_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_log_update_timestamp
  BEFORE UPDATE ON intern_daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_timestamp();
