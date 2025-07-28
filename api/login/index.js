// Login Endpoint for Cabot Property Management System
const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('Login endpoint called');
    
    try {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                }
            };
            return;
        }
        
        const { username, password } = req.body || {};
        
        context.log('Login attempt:', { username, hasPassword: !!password });
        
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
        
        // Azure SQL Database connection
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
        
        // Query user from database
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @username AND is_active = 1');
        
        await pool.close();
        
        if (result.recordset.length === 0) {
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
        
        const user = result.recordset[0];
        
        // Simple password check (in production, use bcrypt)
        if (password !== 'password') {
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
        
        // Return user data
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    role: user.role,
                    organizationName: user.organization_name,
                    phoneNumber: user.phone_number,
                    properties: user.properties
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
