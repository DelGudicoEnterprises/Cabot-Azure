module.exports = async function (context, req) {
    context.log('Login endpoint called - simplified version');
    
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
    
    // Set CORS headers for all responses
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };
    
    try {
        context.log('Request method:', req.method);
        context.log('Request body:', req.body);
        
        const { username, password } = req.body || {};
        
        context.log('Login attempt:', { username, hasPassword: !!password });
        
        // Check for required fields
        if (!username || !password) {
            context.res = {
                status: 400,
                headers: corsHeaders,
                body: {
                    success: false,
                    message: 'Username and password are required'
                }
            };
            return;
        }
        
        // Mock authentication - simplified
        if (username === 'tenantbase@example.com' && password === 'password') {
            context.log('Mock authentication successful');
            context.res = {
                status: 200,
                headers: corsHeaders,
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
        
        // Invalid credentials
        context.log('Invalid credentials provided');
        context.res = {
            status: 401,
            headers: corsHeaders,
            body: {
                success: false,
                message: 'Invalid credentials. Use: tenantbase@example.com / password'
            }
        };
        
    } catch (error) {
        context.log.error('Login error:', error);
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                message: 'Server error: ' + (error.message || 'Unknown error')
            }
        };
    }
};

