-- Cabot Property Management System - Seed Data
-- Azure SQL Database Compatible

-- Insert test users for authentication
INSERT INTO Users (username, email, password_hash, first_name, last_name, organization_name, phone_number, role, is_active) VALUES
('tenant1', 'tenant@cabot.com', '$2b$10$dummy.hash.for.password123', 'John', 'Doe', 'ABC Company', '(585) 123-4567', 'tenant', 1),
('tech1', 'tech@cabot.com', '$2b$10$dummy.hash.for.password123', 'Mike', 'Smith', 'Cabot Group', '(585) 234-5678', 'technician', 1),
('manager1', 'manager@cabot.com', '$2b$10$dummy.hash.for.password123', 'Sarah', 'Johnson', 'Cabot Group', '(585) 345-6789', 'manager', 1),
('admin1', 'admin@cabot.com', '$2b$10$dummy.hash.for.password123', 'David', 'Wilson', 'Cabot Group', '(585) 456-7890', 'admin', 1);

-- Insert sample properties
INSERT INTO Properties (name, address, city, state, zip_code, property_type) VALUES
('Riverside Apartments', '123 Main Street', 'Rochester', 'NY', '14607', 'Apartment Complex'),
('Downtown Condos', '456 State Street', 'Rochester', 'NY', '14608', 'Condominium'),
('Suburban Homes', '789 Oak Avenue', 'Brighton', 'NY', '14618', 'Single Family');

-- Insert sample units
INSERT INTO Units (property_id, unit_number, tenant_id) VALUES
(1, '101', 1),
(1, '102', NULL),
(2, 'A', NULL),
(3, '1', NULL);

-- Insert sample lease agreement for tenant1
INSERT INTO LeaseAgreements (tenant_id, unit_id, lease_pdf_url, start_date, end_date, monthly_rent, security_deposit) VALUES
(1, 1, '/documents/lease_tenant1_unit101.pdf', '2024-01-01', '2024-12-31', 1200.00, 1200.00);

-- Insert sample maintenance matrix items
INSERT INTO MaintenanceMatrix (tenant_id, item_name, description, frequency, last_completed, next_due) VALUES
(1, 'HVAC Filter Change', 'Replace air filter in unit', 'Monthly', '2024-01-15', '2024-02-15'),
(1, 'Smoke Detector Test', 'Test smoke detector batteries', 'Quarterly', '2024-01-01', '2024-04-01');

-- Insert sample work orders
INSERT INTO WorkOrders (
    ticket_number, tenant_id, unit_id, title, description, category, urgency, 
    status, created_at, assigned_technician_id
) VALUES
('WO-2024-001', 1, 1, 'Leaky Faucet', 'Kitchen faucet is dripping constantly', 'Plumbing', 'Standard', 'Open', GETDATE(), 2),
('WO-2024-002', 1, 1, 'Heating Issue', 'Heat not working properly in bedroom', 'HVAC', 'Urgent', 'In Progress', GETDATE(), 2);

PRINT 'Seed data inserted successfully for Cabot Property Management System';
