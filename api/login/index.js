const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('Login endpoint called');
    
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
    
    try {
        const { username, password } = req.body || {};
        
        // Log environment variables (for debugging)
        context.log('Environment check:', {
            hasServer: !!process.env.DB_SERVER,
            hasDatabase: !!process.env.DB_NAME,
            hasUser: !!process.env.DB_USER,
            hasPassword: !!process.env.DB_PASSWORD
        });
        
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
        
        // Test with mock user first (to isolate database issues)
        if (username === 'tenantbase@example.com' && password === 'password') {
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    user: {
                        id: 1,
                        username: 'tenantbase@example.com',
                        firstName: 'Tenant',
                        lastName: 'User',
                        email: 'tenantbase@example.com',
                        role: 'tenant',
                        organizationName: 'Test Property',
                        phoneNumber: '(555) 123-4567',
                        properties: 'Test Property Unit 101'
                    }
                }
            };
            return;
        }
        
        // If not mock user, return invalid credentials
        context.res = {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                message: 'Invalid credentials - use tenantbase@example.com / password for testing'
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
                message: 'Internal server error: ' + error.message
            }
        };
    }
};

