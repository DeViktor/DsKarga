-- Create activities table for tracking user activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_id UUID,
    user_avatar TEXT,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_target_type ON activities(target_type);

-- Grant permissions
GRANT SELECT ON activities TO anon;
GRANT ALL ON activities TO authenticated;

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view activities" ON activities
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create activities" ON activities
    FOR INSERT
    TO authenticated
    WITH CHECK (true);