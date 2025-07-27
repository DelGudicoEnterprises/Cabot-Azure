-- Cabot Property Management System Database Schema
-- Azure SQL Database Compatible

-- Users table for authentication and basic info
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) UNIQUE NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    organization_name NVARCHAR(255),
    phone_number NVARCHAR(20),
    role NVARCHAR(50) NOT NULL DEFAULT 'tenant',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);

-- Properties table
CREATE TABLE Properties (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    state NVARCHAR(50) NOT NULL,
    zip_code NVARCHAR(10) NOT NULL,
    property_type NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Units table
CREATE TABLE Units (
    id INT IDENTITY(1,1) PRIMARY KEY,
    property_id INT NOT NULL,
    unit_number NVARCHAR(50) NOT NULL,
    tenant_id INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (tenant_id) REFERENCES Users(id)
);

-- Lease Agreements table
CREATE TABLE LeaseAgreements (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL,
    unit_id INT NOT NULL,
    lease_pdf_url NVARCHAR(1000),
    lease_pdf_blob_name NVARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tenant_id) REFERENCES Users(id),
    FOREIGN KEY (unit_id) REFERENCES Units(id)
);

-- Maintenance Matrix table
CREATE TABLE MaintenanceMatrix (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL,
    maintenance_item NVARCHAR(255) NOT NULL,
    tenant_responsibility BIT NOT NULL,
    property_manager_responsibility BIT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (tenant_id) REFERENCES Users(id)
);

-- Work Orders table
CREATE TABLE WorkOrders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_number NVARCHAR(50) UNIQUE NOT NULL,
    tenant_id INT NOT NULL,
    property_id INT NOT NULL,
    unit_id INT NOT NULL,
    issue_type NVARCHAR(100) NOT NULL,
    problem_description NTEXT NOT NULL,
    urgency_level NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'awaiting_approval',
    assigned_technician_id INT,
    due_date DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    completed_at DATETIME2,
    FOREIGN KEY (tenant_id) REFERENCES Users(id),
    FOREIGN KEY (property_id) REFERENCES Properties(id),
    FOREIGN KEY (unit_id) REFERENCES Units(id),
    FOREIGN KEY (assigned_technician_id) REFERENCES Users(id)
);

-- Work Order Images table
CREATE TABLE WorkOrderImages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,
    image_url NVARCHAR(1000) NOT NULL,
    image_blob_name NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (work_order_id) REFERENCES WorkOrders(id)
);

-- Work Order Notes table (for technician updates)
CREATE TABLE WorkOrderNotes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,
    user_id INT NOT NULL,
    note_text NTEXT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (work_order_id) REFERENCES WorkOrders(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Work Order Costs table (for finance tracking)
CREATE TABLE WorkOrderCosts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    work_order_id INT NOT NULL,
    cost_type NVARCHAR(100) NOT NULL, -- 'labor', 'materials', 'contractor', etc.
    amount DECIMAL(10,2) NOT NULL,
    cost_date DATE NOT NULL,
    description NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (work_order_id) REFERENCES WorkOrders(id)
);

-- Service Technicians table (extends Users for tech-specific info)
CREATE TABLE ServiceTechnicians (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    specialties NVARCHAR(500), -- JSON array of specialties
    hourly_rate DECIMAL(10,2),
    is_available BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Create indexes for performance
CREATE INDEX IX_Users_Username ON Users(username);
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_Role ON Users(role);
CREATE INDEX IX_WorkOrders_TenantId ON WorkOrders(tenant_id);
CREATE INDEX IX_WorkOrders_Status ON WorkOrders(status);
CREATE INDEX IX_WorkOrders_TicketNumber ON WorkOrders(ticket_number);
CREATE INDEX IX_WorkOrders_CreatedAt ON WorkOrders(created_at);
CREATE INDEX IX_Units_TenantId ON Units(tenant_id);
CREATE INDEX IX_LeaseAgreements_TenantId ON LeaseAgreements(tenant_id);
CREATE INDEX IX_MaintenanceMatrix_TenantId ON MaintenanceMatrix(tenant_id);
