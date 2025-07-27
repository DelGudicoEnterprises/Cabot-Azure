const jwt = require('jsonwebtoken');

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
