const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'cabot-property-management-secret-key-2024';

// Azure Functions export for Azure Static Web Apps
module.exports = async function (context, req) {
    context.log('Auth login endpoint called');
    
    // Set CORS headers
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };
    
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }
    
    if (req.method !== 'POST') {
        context.res = {
            status: 405,
            body: { success: false, message: 'Method not allowed' }
        };
        return;
    }
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    message: 'Email and password are required'
                }
            };
            return;
        }
        
        // Mock authentication for development
        if (email === 'tenantbase@example.com' && password === 'password') {
            const mockUser = {
                id: 1,
                email: 'tenantbase@example.com',
                firstName: 'Tenant',
                lastName: 'Base',
                role: 'tenant',
                propertyId: 1
            };
            
            const token = jwt.sign(
                { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            context.res = {
                status: 200,
                body: {
                    success: true,
                    message: 'Login successful',
                    token: token,
                    user: mockUser
                }
            };
            return;
        }
        
        // Invalid credentials
        context.res = {
            status: 401,
            body: {
                success: false,
                message: 'Invalid credentials'
            }
        };
        
    } catch (error) {
        context.log('Login error:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                message: 'Internal server error'
            }
        };
    }
};
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { email, password } = body;

            if (!email || !password) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: 'Email and password are required'
                    }
                };
            }

            // For development, use mock authentication
            if (email === 'tenantbase@example.com' && password === 'password') {
                const mockUser = {
                    id: 1,
                    email: 'tenantbase@example.com',
                    firstName: 'Tenant',
                    lastName: 'Base',
                    role: 'tenant',
                    propertyId: 1
                };

                const token = jwt.sign(
                    { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    status: 200,
                    jsonBody: {
                        success: true,
                        message: 'Login successful',
                        token: token,
                        user: mockUser
                    }
                };
            }

            // For production, connect to Azure SQL Database
            try {
                const pool = await sql.connect(sqlConfig);
                const result = await pool.request()
                    .input('email', sql.NVarChar, email)
                    .query('SELECT * FROM users WHERE email = @email');

                if (result.recordset.length === 0) {
                    return {
                        status: 401,
                        jsonBody: {
                            success: false,
                            message: 'Invalid credentials'
                        }
                    };
                }

                const user = result.recordset[0];
                const isValidPassword = await bcrypt.compare(password, user.passwordHash);

                if (!isValidPassword) {
                    return {
                        status: 401,
                        jsonBody: {
                            success: false,
                            message: 'Invalid credentials'
                        }
                    };
                }

                const token = jwt.sign(
                    { userId: user.id, email: user.email, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    status: 200,
                    jsonBody: {
                        success: true,
                        message: 'Login successful',
                        token: token,
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            propertyId: user.propertyId
                        }
                    }
                };

            } catch (dbError) {
                context.log('Database connection error:', dbError);
                // Fall back to mock authentication for development
                return {
                    status: 500,
                    jsonBody: {
                        success: false,
                        message: 'Database connection error - using mock authentication'
                    }
                };
            }

        } catch (error) {
            context.log('Login error:', error);
            return {
                status: 500,
                jsonBody: {
                    success: false,
                    message: 'Internal server error'
                }
            };
        }
    }
});

// Health check endpoint
app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: async (request, context) => {
        return {
            status: 200,
            jsonBody: {
                status: 'OK',
                message: 'Cabot Property Management API is running',
                timestamp: new Date().toISOString(),
                environment: 'Azure Static Web Apps'
            }
        };
    }
});
