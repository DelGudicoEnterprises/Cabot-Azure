module.exports = async function (context, req) {
    context.log('Login endpoint called - Hybrid authentication (DB + fallback)');
    
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
        const { username, password } = req.body || {};
        
        context.log('Login attempt for:', username);
        
        // Validate input
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
        
        // Database configuration
        const config = {
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            options: {
                encrypt: true,
                trustServerCertificate: false
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
        
        context.log('Connecting to Azure SQL Database...');
        
        // Connect to database
        const pool = await sql.connect(config);
        
        // Query user by email/username
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT 
                    id, 
                    email, 
                    password_hash, 
                    first_name, 
                    last_name, 
                    role, 
                    organization_name, 
                    phone_number,
                    properties,
                    created_at,
                    updated_at
                FROM users 
                WHERE email = @username OR username = @username
            `);
        
        if (result.recordset.length === 0) {
            context.log('User not found:', username);
            context.res = {
                status: 401,
                headers: corsHeaders,
                body: {
                    success: false,
                    message: 'Invalid credentials'
                }
            };
            return;
        }
        
        const user = result.recordset[0];
        context.log('User found, verifying password...');
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            context.log('Invalid password for user:', username);
            context.res = {
                status: 401,
                headers: corsHeaders,
                body: {
                    success: false,
                    message: 'Invalid credentials'
                }
            };
            return;
        }
        
        context.log('Authentication successful for:', username);
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // Return success response
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: {
                success: true,
                token: token,
                user: {
                    id: user.id,
                    username: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    role: user.role,
                    organizationName: user.organization_name,
                    phoneNumber: user.phone_number,
                    properties: user.properties
                }
            }
        };
        
        // Close database connection
        await pool.close();
        
    } catch (error) {
        context.log.error('Login error:', error);
        
        // Close any open connections
        try {
            await sql.close();
        } catch (closeError) {
            context.log.error('Error closing connection:', closeError);
        }
        
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: {
                success: false,
                message: 'Authentication service temporarily unavailable'
            }
        };
    }
};
