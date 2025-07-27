// Login Endpoint for Cabot Property Management System
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
        
        // Simple authentication - accept tenant1/password123
        if (username === 'tenant1' && password === 'password123') {
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: {
                    success: true,
                    message: 'Login successful',
                    token: 'demo-jwt-token-12345',
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

