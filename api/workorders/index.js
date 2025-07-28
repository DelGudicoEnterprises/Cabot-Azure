const { app } = require('@azure/functions');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { triggerWorkOrderCreated, triggerWorkOrderStatusUpdate, triggerWorkOrderCompletion } = require('../n8n-integration');

const JWT_SECRET = process.env.JWT_SECRET || 'cabot-property-management-secret-key-2024';

// Middleware to verify JWT token
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Get work orders for tenant
app.http('getWorkOrders', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'workorders',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            const user = verifyToken(authHeader);
            
            if (!user) {
                return {
                    status: 401,
                    jsonBody: { success: false, message: 'Unauthorized' }
                };
            }

            // Mock data for development
            const mockWorkOrders = [
                {
                    id: 1,
                    ticketNumber: 'WO-2024-001',
                    title: 'Kitchen Faucet Repair',
                    description: 'Kitchen faucet is leaking and needs repair',
                    problemCategory: 'Urgent (2-3 days)',
                    status: 'in_progress',
                    createdAt: '2024-01-15T10:30:00Z',
                    dueDate: '2024-01-17T17:00:00Z',
                    assignedTech: 'John Smith'
                },
                {
                    id: 2,
                    ticketNumber: 'WO-2024-002',
                    title: 'Bathroom Light Fixture',
                    description: 'Light fixture in master bathroom not working',
                    problemCategory: 'Standard (1 week)',
                    status: 'awaiting_approval',
                    createdAt: '2024-01-20T14:15:00Z',
                    dueDate: '2024-01-27T17:00:00Z',
                    assignedTech: null
                },
                {
                    id: 3,
                    ticketNumber: 'WO-2024-003',
                    title: 'HVAC Maintenance',
                    description: 'Annual HVAC system maintenance and filter replacement',
                    problemCategory: 'Routine (2 weeks)',
                    status: 'closed',
                    createdAt: '2024-01-10T09:00:00Z',
                    dueDate: '2024-01-24T17:00:00Z',
                    completedAt: '2024-01-22T16:30:00Z',
                    assignedTech: 'Mike Johnson'
                }
            ];

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    workOrders: mockWorkOrders
                }
            };

        } catch (error) {
            context.log('Get work orders error:', error);
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

// Create new work order
app.http('createWorkOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'workorders',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            const user = verifyToken(authHeader);
            
            if (!user) {
                return {
                    status: 401,
                    jsonBody: { success: false, message: 'Unauthorized' }
                };
            }

            const body = await request.json();
            const { title, description, problemCategory, urgency } = body;

            if (!title || !description || !problemCategory) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        message: 'Title, description, and problem category are required'
                    }
                };
            }

            // Generate ticket number
            const ticketNumber = `WO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

            // Mock work order creation
            const newWorkOrder = {
                id: Date.now(),
                ticketNumber,
                title,
                description,
                problemCategory,
                urgency: urgency || 'Standard',
                status: 'awaiting_approval',
                createdAt: new Date().toISOString(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                tenantId: user.userId,
                assignedTech: null
            };

            // Trigger n8n workflow for work order creation
            try {
                await triggerWorkOrderCreated(newWorkOrder, {
                    id: user.userId,
                    firstName: 'Tenant', // This would come from user data in production
                    lastName: 'Base',
                    email: user.email,
                    phone: null, // Would be populated from user profile
                    propertyId: 1
                }, context);
                
                context.log('n8n workflow triggered successfully for work order:', ticketNumber);
            } catch (n8nError) {
                context.log('n8n workflow trigger failed (work order still created):', n8nError.message);
                // Don't fail the work order creation if n8n fails
            }

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    message: 'Work order created successfully',
                    workOrder: newWorkOrder,
                    automationTriggered: true
                }
            };

        } catch (error) {
            context.log('Create work order error:', error);
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
