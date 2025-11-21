-- Create invoices table for billing/financial documents
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

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to see all invoices (you can modify this to be more restrictive)
CREATE POLICY "Allow authenticated users to view all invoices" ON invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert invoices" ON invoices
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices" ON invoices
    FOR UPDATE TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON invoices TO anon;
GRANT ALL ON invoices TO authenticated;

-- Create index on invoice_number for better search performance
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Create index on client_id for filtering
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- Create index on issue_date for date range queries
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();