// n8n Webhook Integration for Cabot Property Management System
// This module handles all n8n workflow triggers for business automation

const https = require('https');
const http = require('http');

// n8n Configuration
const N8N_CONFIG = {
    baseUrl: process.env.N8N_BASE_URL || 'https://your-n8n-instance.com',
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || 'cabot-n8n-secret-2024'
};

// n8n Webhook URLs (to be configured in n8n)
const WEBHOOKS = {
    WORK_ORDER_CREATED: `${N8N_CONFIG.baseUrl}/webhook/work-order-created`,
    WORK_ORDER_UPDATED: `${N8N_CONFIG.baseUrl}/webhook/work-order-updated`,
    WORK_ORDER_COMPLETED: `${N8N_CONFIG.baseUrl}/webhook/work-order-completed`,
    TENANT_NOTIFICATION: `${N8N_CONFIG.baseUrl}/webhook/tenant-notification`,
    TECH_ASSIGNMENT: `${N8N_CONFIG.baseUrl}/webhook/tech-assignment`,
    MANAGER_ALERT: `${N8N_CONFIG.baseUrl}/webhook/manager-alert`,
    OVERLOAD_WARNING: `${N8N_CONFIG.baseUrl}/webhook/overload-warning`,
    WEEKLY_REPORT: `${N8N_CONFIG.baseUrl}/webhook/weekly-report`
};

// Generic webhook trigger function
async function triggerN8nWorkflow(webhookUrl, data, context = null) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
            source: 'cabot-property-management',
            secret: N8N_CONFIG.webhookSecret
        });

        const url = new URL(webhookUrl);
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'User-Agent': 'Cabot-Property-Management/1.0'
            }
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (context) {
                    context.log(`n8n webhook response (${res.statusCode}):`, responseData);
                }
                
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        data: responseData
                    });
                } else {
                    reject(new Error(`n8n webhook failed with status ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            if (context) {
                context.log('n8n webhook error:', error);
            }
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

// Specific workflow triggers for Property Management

// 1. Work Order Created - Triggers email notifications and tech assignment
async function triggerWorkOrderCreated(workOrder, tenant, context) {
    try {
        const result = await triggerN8nWorkflow(WEBHOOKS.WORK_ORDER_CREATED, {
            workOrder: workOrder,
            tenant: {
                id: tenant.id,
                firstName: tenant.firstName,
                lastName: tenant.lastName,
                email: tenant.email,
                phone: tenant.phone,
                propertyId: tenant.propertyId
            },
            actions: [
                'send_tenant_confirmation_email',
                'assign_technician',
                'send_tech_notification',
                'create_calendar_event',
                'update_dashboard'
            ]
        }, context);
        
        return result;
    } catch (error) {
        if (context) context.log('Work order creation workflow failed:', error);
        throw error;
    }
}

// 2. Work Order Status Update - Triggers status change notifications
async function triggerWorkOrderStatusUpdate(workOrder, oldStatus, newStatus, context) {
    try {
        const result = await triggerN8nWorkflow(WEBHOOKS.WORK_ORDER_UPDATED, {
            workOrder: workOrder,
            statusChange: {
                from: oldStatus,
                to: newStatus,
                timestamp: new Date().toISOString()
            },
            actions: [
                'send_status_update_email',
                'update_kanban_board',
                'log_status_change',
                'check_overdue_items'
            ]
        }, context);
        
        return result;
    } catch (error) {
        if (context) context.log('Work order status update workflow failed:', error);
        throw error;
    }
}

// 3. Work Order Completion - Triggers completion workflow with AI summary
async function triggerWorkOrderCompletion(workOrder, completionData, context) {
    try {
        const result = await triggerN8nWorkflow(WEBHOOKS.WORK_ORDER_COMPLETED, {
            workOrder: workOrder,
            completion: {
                completedAt: completionData.completedAt,
                completedBy: completionData.completedBy,
                notes: completionData.notes,
                materialCosts: completionData.materialCosts,
                laborHours: completionData.laborHours,
                contractorCosts: completionData.contractorCosts
            },
            actions: [
                'generate_ai_summary',
                'send_completion_email',
                'update_billing_system',
                'archive_work_order',
                'request_tenant_feedback'
            ]
        }, context);
        
        return result;
    } catch (error) {
        if (context) context.log('Work order completion workflow failed:', error);
        throw error;
    }
}

// 4. Technician Overload Alert - Triggers when tech has >50 open/in-progress tickets
async function triggerTechnicianOverloadAlert(technician, ticketCount, context) {
    try {
        const result = await triggerN8nWorkflow(WEBHOOKS.OVERLOAD_WARNING, {
            technician: technician,
            metrics: {
                openTickets: ticketCount.open,
                inProgressTickets: ticketCount.inProgress,
                totalActive: ticketCount.total,
                threshold: 50
            },
            actions: [
                'send_manager_alert',
                'suggest_reassignment',
                'create_capacity_report',
                'schedule_manager_review'
            ]
        }, context);
        
        return result;
    } catch (error) {
        if (context) context.log('Technician overload alert workflow failed:', error);
        throw error;
    }
}

// 5. Weekly Report Generation - Triggers automated weekly reports
async function triggerWeeklyReport(reportData, context) {
    try {
        const result = await triggerN8nWorkflow(WEBHOOKS.WEEKLY_REPORT, {
            reportPeriod: {
                startDate: reportData.startDate,
                endDate: reportData.endDate,
                week: reportData.weekNumber,
                year: reportData.year
            },
            metrics: reportData.metrics,
            actions: [
                'generate_report_pdf',
                'send_manager_email',
                'update_dashboard_charts',
                'archive_weekly_data',
                'schedule_next_report'
            ]
        }, context);
        
        return result;
    } catch (error) {
        if (context) context.log('Weekly report workflow failed:', error);
        throw error;
    }
}

// 6. Tenant Notification - General tenant communication workflow
async function triggerTenantNotification(tenant, notificationType, data, context) {
    try {
        const result = await triggerN8nWorkflow(WEBHOOKS.TENANT_NOTIFICATION, {
            tenant: tenant,
            notification: {
                type: notificationType,
                priority: data.priority || 'normal',
                subject: data.subject,
                message: data.message,
                attachments: data.attachments || []
            },
            actions: [
                'send_email',
                'send_sms_if_urgent',
                'log_communication',
                'update_tenant_history'
            ]
        }, context);
        
        return result;
    } catch (error) {
        if (context) context.log('Tenant notification workflow failed:', error);
        throw error;
    }
}

module.exports = {
    triggerWorkOrderCreated,
    triggerWorkOrderStatusUpdate,
    triggerWorkOrderCompletion,
    triggerTechnicianOverloadAlert,
    triggerWeeklyReport,
    triggerTenantNotification,
    triggerN8nWorkflow,
    WEBHOOKS
};
