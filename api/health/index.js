// Simple health check endpoint for Azure Static Web Apps
module.exports = async function (context, req) {
    context.log('Health check endpoint called');
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: {
            status: 'OK',
            message: 'Cabot Property Management API is running',
            timestamp: new Date().toISOString(),
            environment: 'Azure Static Web Apps',
            version: '1.0.0'
        }
    };
};
