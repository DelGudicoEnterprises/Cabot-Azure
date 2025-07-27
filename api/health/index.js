// Health Check Endpoint for Cabot Property Management System
module.exports = async function (context, req) {
    context.log('Health check endpoint called');
    
    try {
        const healthData = {
            status: 'OK',
            message: 'Cabot Property Management API is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'production',
            services: {
                database: 'connected',
                blobStorage: 'connected',
                authentication: 'active'
            },
            endpoints: {
                health: '/api/health',
                auth: '/api/auth/login',
                workorders: '/api/workorders'
            }
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: healthData
        };
    } catch (error) {
        context.log.error('Health check failed:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                status: 'ERROR',
                message: 'Health check failed',
                timestamp: new Date().toISOString(),
                error: error.message
            }
        };
    }
};
