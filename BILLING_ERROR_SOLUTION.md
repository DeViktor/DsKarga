# 🚨 BILLING SYSTEM ERROR - SOLUTION GUIDE

## Problem Description
The billing system is showing the error: **"Erro ao salvar fatura no Supabase {}"**

## Root Cause Analysis
The error occurs because the `invoices` table does not exist in the Supabase database. The billing page tries to save invoice data to a non-existent table.

## ✅ Solution Steps

### Step 1: Apply Database Migration
**CRITICAL**: The `invoices` table must be created in your Supabase database.

#### Option A: Manual SQL Execution (Recommended)
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Copy and paste the contents of `CREATE_INVOICES_TABLE_MANUAL.sql`
5. Click **Run** to execute the SQL commands

#### Option B: Use Migration File
If you have direct database access or can run migrations:
```bash
# The migration file is located at:
supabase/migrations/create_invoices_table_complete.sql
```

### Step 2: Verify the Fix
After running the SQL commands, verify the table was created:

```sql
-- Test query to verify table exists
SELECT COUNT(*) as total_invoices FROM invoices;

-- Should return: total_invoices = 0 (empty table)
```

### Step 3: Test the Billing System
1. Go to the billing page: `/dashboard/billing`
2. Create a test invoice with some items
3. Click the save button (disk icon)
4. You should see: **"Fatura salva"** success message

## 📋 Table Structure Created

The `invoices` table includes these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `document_type` | TEXT | Fatura, Fatura Proforma, Orçamento, Nota de Crédito |
| `invoice_number` | TEXT | Unique invoice number |
| `client_id` | UUID | Reference to clients table |
| `client_name` | TEXT | Client name |
| `client_nif` | TEXT | Client tax ID |
| `client_address` | TEXT | Client address |
| `client_province` | TEXT | Client province |
| `issue_date` | TIMESTAMP | Invoice issue date |
| `due_date` | TIMESTAMP | Payment due date |
| `observations` | TEXT | Additional notes |
| `iva_rate` | DECIMAL | VAT rate (default 14%) |
| `apply_retention` | BOOLEAN | Whether to apply retention |
| `items` | JSONB | Array of invoice items |
| `subtotal` | DECIMAL | Subtotal amount |
| `tax_amount` | DECIMAL | Tax amount |
| `retention_amount` | DECIMAL | Retention amount |
| `total_amount` | DECIMAL | Total amount |
| `status` | TEXT | Emitida, Pago, Parcialmente Pago, Cancelada |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## 🔧 Enhanced Error Handling

The billing page now includes:
- ✅ Pre-flight table existence check
- ✅ Specific error messages for missing tables
- ✅ Detailed console logging for debugging
- ✅ User-friendly error notifications

## 🧪 Testing Checklist

- [ ] SQL migration executed successfully
- [ ] Table appears in Supabase dashboard
- [ ] Can create and save new invoices
- [ ] Dashboard shows revenue metrics correctly
- [ ] No more "Erro ao salvar fatura" messages

## 🆘 Still Having Issues?

If the problem persists after applying the migration:

1. **Check Supabase Console**: Look for any SQL execution errors
2. **Verify Permissions**: Ensure your Supabase anon/authenticated roles have proper access
3. **Check RLS Policies**: Row Level Security should be properly configured
4. **Console Logs**: Open browser dev tools (F12) and check the Console tab for detailed error messages
5. **Contact Support**: Provide the exact error message from the console

## 📁 Related Files

- `src/app/dashboard/billing/page.tsx` - Main billing page
- `src/app/dashboard/page.tsx` - Dashboard with revenue metrics
- `supabase/migrations/create_invoices_table_complete.sql` - Complete migration
- `CREATE_INVOICES_TABLE_MANUAL.sql` - Manual SQL execution script