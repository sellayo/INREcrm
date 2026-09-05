-- Create app_settings table to store global configurations
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  next_invoice_number INT NOT NULL DEFAULT 101,
  next_receipt_number INT NOT NULL DEFAULT 101,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize with default values if it doesn't exist
INSERT INTO app_settings (id, next_invoice_number, next_receipt_number) 
VALUES (1, 101, 101) 
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view app_settings" ON app_settings;
CREATE POLICY "Anyone can view app_settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can update app_settings" ON app_settings;
CREATE POLICY "Admin can update app_settings" ON app_settings FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Trigger function to assign document numbers sequentially and atomically
CREATE OR REPLACE FUNCTION assign_doc_number()
RETURNS TRIGGER AS $$
DECLARE
  v_next_no INT;
BEGIN
  IF TG_TABLE_NAME = 'invoices' THEN
    -- Get the current next number and lock the row to prevent race conditions
    SELECT next_invoice_number INTO v_next_no FROM app_settings WHERE id = 1 FOR UPDATE;
    -- Assign it to the new record
    NEW.invoice_no := v_next_no;
    -- Increment the setting
    UPDATE app_settings SET next_invoice_number = next_invoice_number + 1 WHERE id = 1;
  ELSIF TG_TABLE_NAME = 'receipts' THEN
    SELECT next_receipt_number INTO v_next_no FROM app_settings WHERE id = 1 FOR UPDATE;
    NEW.receipt_no := v_next_no;
    UPDATE app_settings SET next_receipt_number = next_receipt_number + 1 WHERE id = 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_invoice_no ON invoices;
CREATE TRIGGER set_invoice_no
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION assign_doc_number();

DROP TRIGGER IF EXISTS set_receipt_no ON receipts;
CREATE TRIGGER set_receipt_no
BEFORE INSERT ON receipts
FOR EACH ROW EXECUTE FUNCTION assign_doc_number();
