-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies that restrict access to only the user's own data
CREATE POLICY "Users can only access their own conversations"
  ON conversations
  FOR ALL
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can only access their own preferences"
  ON user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Create audit logging table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT,
    resource_type TEXT,
    resource_id TEXT,
    timestamp TIMESTAMP DEFAULT now()
);

-- Function to log data access
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for audit logging
CREATE TRIGGER conversations_audit
  AFTER INSERT OR UPDATE OR DELETE ON conversations
  FOR EACH ROW EXECUTE FUNCTION log_data_access(); 