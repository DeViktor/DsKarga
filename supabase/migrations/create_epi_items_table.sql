-- Create epi_items table for EPI inventory management
CREATE TABLE IF NOT EXISTS epi_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    expiry_date DATE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT ON epi_items TO anon;
GRANT ALL ON epi_items TO authenticated;

-- Create index on name for better search performance
CREATE INDEX IF NOT EXISTS idx_epi_items_name ON epi_items(name);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_epi_items_category ON epi_items(category);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_epi_items_updated_at 
    BEFORE UPDATE ON epi_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();