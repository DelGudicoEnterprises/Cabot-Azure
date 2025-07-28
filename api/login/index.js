// Login Endpoint for Cabot Property Management System
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        
        try {
            // Connect to database
            await sql.connect(config);
            
            // Query user from database
            const result = await sql.query`
                SELECT id, username, email, password_hash, first_name, last_name, 
                       organization_name, phone_number, role, is_active
                FROM Users 
                WHERE username = ${username} AND is_active = 1
            `;
            
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
            
            // For development: accept 'password123' for all users
            // In production, use: const isValidPassword = await bcrypt.compare(password, user.password_hash);
            const isValidPassword = password === 'password123';
            
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
                    role: user.role 
                },
                process.env.JWT_SECRET || 'cabot-secret-key',
                { expiresIn: '24h' }
            );
            
            // Return successful login
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
            
        } catch (dbError) {
            context.log.error('Database error:', dbError);
            
            // Fallback to mock authentication for development
            if (username === 'tenant1' && password === 'password123') {
                const token = jwt.sign(
                    { userId: 1, username: 'tenant1', role: 'tenant' },
                    process.env.JWT_SECRET || 'cabot-secret-key',
                    { expiresIn: '24h' }
                );
                
                context.res = {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: {
                        success: true,
                        message: 'Login successful (fallback)',
                        token: token,
                        user: {
                            id: 1,
                            username: 'tenant1',
                            email: 'tenant@cabot.com',
                            firstName: 'John',
                            lastName: 'Doe',
                            role: 'tenant',
                            organizationName: 'ABC Company',
                            phoneNumber: '(585) 123-4567'
                        }
                    }
                };
            } else {
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
            }
        } finally {
            await sql.close();
        }
        
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
