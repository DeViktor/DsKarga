-- MANUAL SQL EXECUTION SCRIPT
-- This script should be run directly in the Supabase dashboard SQL editor
-- Go to: https://app.supabase.com/project/[your-project-id]/sql

-- Step 1: Create the invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_type TEXT NOT NULL, -- Fatura, Fatura Proforma, Orçamento, Nota de Crédito
    invoice_number TEXT NOT NULL,
    client_id UUID REFERENCES clients(id),
    client_name TEXT,
    client_nif TEXT,
    client_address TEXT,
    client_province TEXT,
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    observations TEXT,
    iva_rate DECIMAL(5,2) DEFAULT 14.00,
    apply_retention BOOLEAN DEFAULT FALSE,
    items JSONB NOT NULL DEFAULT '[]', -- Array of invoice items
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    retention_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Emitida', -- Emitida, Pago, Parcialmente Pago, Cancelada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
CREATE POLICY "Allow authenticated users to view all invoices" ON invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert invoices" ON invoices
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices" ON invoices
    FOR UPDATE TO authenticated USING (true);

-- Step 4: Grant Permissions
GRANT SELECT ON invoices TO anon;
GRANT ALL ON invoices TO authenticated;

-- Step 5: Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Step 6: Create Updated At Trigger
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verify the table was created (this should show the table structure)
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
ORDER BY ordinal_position;

-- Step 8: Test the table with a simple query
SELECT COUNT(*) as total_invoices FROM invoices;

-- If you see results from steps 7 and 8, the table was created successfully!
-- Now the billing page should work without errors.