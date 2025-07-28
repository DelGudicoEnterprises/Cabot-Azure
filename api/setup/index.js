// Database Setup Endpoint for Cabot Property Management System
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('Database setup endpoint called');
    
    try {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            context.res = {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            };
            return;
        }

        // Database configuration
        const config = {
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            options: {
                encrypt: true,
                trustServerCertificate: false
            }
        };

        context.log('Connecting to database...');
        const pool = await sql.connect(config);
        
        // Create Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
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
            )
        `);

        // Insert test user (tenant1)
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM Users WHERE username = 'tenant1')
            INSERT INTO Users (username, email, password_hash, first_name, last_name, organization_name, phone_number, role)
            VALUES ('tenant1', 'tenant@cabot.com', 'password123', 'John', 'Doe', 'ABC Company', '(585) 123-4567', 'tenant')
        `);

        await pool.close();

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: true,
                message: 'Database setup completed successfully',
                tablesCreated: ['Users'],
                testUserCreated: 'tenant1'
            }
        };

    } catch (error) {
        context.log.error('Database setup error:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: false,
                error: error.message,
                details: 'Database setup failed'
            }
        };
    }
};
