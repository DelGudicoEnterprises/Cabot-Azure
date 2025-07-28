const { app } = require('@azure/functions');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

// Azure SQL Database Configuration
const sqlConfig = {
    user: process.env.AZURE_SQL_USER || 'evangelgudico',
    password: process.env.AZURE_SQL_PASSWORD || 'Ironman45',
    database: process.env.AZURE_SQL_DATABASE || 'cabot-property-management',
    server: process.env.AZURE_SQL_SERVER || 'cabot-sql-server.database.windows.net',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'cabot-property-management-secret-key-2024';

// Login endpoint
app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/login',
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
