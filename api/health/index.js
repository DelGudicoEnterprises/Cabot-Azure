const { app } = require('@azure/functions');

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
                environment: 'Azure Static Web Apps',
                version: '1.0.0'
            }
        };
    }
});

module.exports = app;
