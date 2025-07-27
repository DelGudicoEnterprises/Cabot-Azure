// Authentication Login Endpoint for Cabot Property Management System
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sql = require('mssql');

// Database configuration
const dbConfig = {
    server: process.env.AZURE_SQL_SERVER || 'cabot-sql-server.database.windows.net',
    database: process.env.AZURE_SQL_DATABASE || 'CabotPropertyDB',
    user: process.env.AZURE_SQL_USER || 'cabot-admin',
    password: process.env.AZURE_SQL_PASSWORD || 'CabotGroup2024!',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Mock user data for development/fallback
const mockUsers = [
    {
        id: 1,
        username: 'tenant1',
        email: 'tenant@cabot.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'tenant',
        organization_name: 'ABC Company',
        phone_number: '(585) 123-4567'
    },
    {
        id: 2,
        username: 'tech1',
        email: 'tech@cabot.com',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'technician',
        phone_number: '(585) 987-6543'
    },
    {
        id: 3,
        username: 'manager1',
        email: 'manager@cabot.com',
        first_name: 'Mike',
        last_name: 'Johnson',
        role: 'manager',
        phone_number: '(585) 555-0123'
    }
];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'cabot-property-management-secret-key-2024';

module.exports = async function (context, req) {
    context.log('Auth login endpoint called');
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
        return;
    }
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            context.res = {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: 'Username and password are required'
                }
            };
            return;
        }
        
        let user = null;
        
        // Try database first, fall back to mock data
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query(`
                    SELECT id, username, email, password_hash, first_name, last_name, 
                           role, organization_name, phone_number, is_active
                    FROM Users 
                    WHERE (username = @username OR email = @username) AND is_active = 1
                `);
            
            if (result.recordset.length > 0) {
                user = result.recordset[0];
            }
            
            await pool.close();
        } catch (dbError) {
            context.log.warn('Database connection failed, using mock data:', dbError.message);
            // Fall back to mock users
            user = mockUsers.find(u => u.username === username || u.email === username);
        }
        
        if (!user) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: 'Invalid credentials'
                }
            };
            return;
        }
        
        // Verify password
        let isValidPassword = false;
        
        if (user.password_hash) {
            // Use bcrypt for hashed passwords
            isValidPassword = await bcrypt.compare(password, user.password_hash);
        } else {
            // For demo purposes, accept 'password123' for all users
            isValidPassword = password === 'password123';
        }
        
        if (!isValidPassword) {
            context.res = {
                status: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: false,
                    message: 'Invalid credentials'
                }
            };
            return;
        }
        
        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return success response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role,
                    organizationName: user.organization_name,
                    phoneNumber: user.phone_number
                }
            }
        };
        
    } catch (error) {
        context.log.error('Login error:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Internal server error'
            }
        };
    }
};
