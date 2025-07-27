// Health Check Endpoint for Cabot Property Management System
module.exports = async function (context, req) {
    context.log('Health check endpoint called');
    
    try {
        const healthData = {
            status: 'OK',
            message: 'Cabot Property Management API is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'production'
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
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
                error: error.message
            }
        };
    }
};
