-- Create suppliers table for purchasing module
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    nif TEXT NOT NULL,
    contact_email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    postal_code TEXT,
    website TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT ON suppliers TO anon;
GRANT ALL ON suppliers TO authenticated;

-- Create index on name for better search performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- Create index on nif for unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_nif ON suppliers(nif);