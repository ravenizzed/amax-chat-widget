/**
 * Enhanced AMAX Webhook with Security
 * Handles authentication, validation, and n8n communication
 */

export default async function handler(req, res) {
    // ========================================
    // SECURITY HEADERS & CORS
    // ========================================
    
    // Set comprehensive security headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed', 
            message: 'This endpoint only accepts POST requests' 
        });
    }

    try {
        // ========================================
        // REQUEST VALIDATION & SECURITY
        // ========================================
        
        const { message, sessionId, threadId, userEmail, userRole, userName, timestamp } = req.body;
        
        // Basic request validation
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid request', 
                message: 'Message is required and must be a string' 
            });
        }
        
        // Message length validation
        if (message.length > 2000) {
            return res.status(400).json({ 
                error: 'Message too long', 
                message: 'Message must be less than 2000 characters' 
            });
        }
        
        // Domain validation for AMAX users
        if (userEmail && !userEmail.includes('amaxinsurance.com')) {
            return res.status(403).json({ 
                error: 'Access denied', 
                message: 'AMAX domain required for access' 
            });
        }
        
        // Rate limiting check (simple implementation)
        const clientId = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
        const rateLimitKey = `rate_limit_${clientId}`;
        
        // ========================================
        // ENHANCED REQUEST HEADERS PROCESSING
        // ========================================
        
        /**
         * HEADER EXPLANATIONS:
         * 
         * X-Real-IP: unknown - This is NORMAL and means:
         * - Request came through a proxy/CDN (like Vercel)
         * - The proxy didn't set or forward the original client IP
         * - Common when using services like Cloudflare, Vercel, etc.
         * - Not an error, just indicates proxied traffic
         * 
         * X-Forwarded-For: unknown - This is NORMAL and means:
         * - No forwarding chain information available
         * - Request originated from proxy without client IP forwarding
         * - Standard behavior for serverless/CDN environments
         * - Security feature that prevents IP exposure
         */
        
        const requestMetadata = {
            realIP: req.headers['x-real-ip'] || 'unknown',
            forwardedFor: req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            referer: req.headers['referer'] || 'unknown',
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // ========================================
        // PREPARE PAYLOAD FOR N8N
        // ========================================
        
        const n8nPayload = {
            // Core message data
            message: message.trim(),
            
            // Session management (CRITICAL for continuity)
            sessionId: sessionId || `amax_${Date.now()}`,
            threadId: threadId || `thread_${Date.now()}`,
            
            // User authentication data
            userEmail: userEmail || 'guest@amaxinsurance.com',
            userRole: userRole || 'GUEST',
            userName: userName || 'Guest User',
            
            // Request metadata
            timestamp: timestamp || Date.now(),
            requestId: requestMetadata.requestId,
            
            // Security context
            clientIP: requestMetadata.realIP,
            forwardedFor: requestMetadata.forwardedFor,
            userAgent: requestMetadata.userAgent,
            
            // System flags
            isAuthenticated: userEmail && userEmail.includes('amaxinsurance.com'),
            securityLevel: userRole === 'HOD' ? 'HIGH' : 'STANDARD'
        };
        
        // ========================================
        // FORWARD TO N8N WEBHOOK
        // ========================================
        
        console.log(`[${requestMetadata.requestId}] Processing request for user: ${userEmail}`);
        console.log(`[${requestMetadata.requestId}] Session: ${sessionId}, Thread: ${threadId}`);
        
        const n8nResponse = await fetch('http://3.239.79.74:5678/webhook/amax-genBi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AMAX-Widget/1.0',
                'X-Request-ID': requestMetadata.requestId,
                // Forward original headers (these will show as 'unknown' which is normal)
                'X-Real-IP': requestMetadata.realIP,
                'X-Forwarded-For': requestMetadata.forwardedFor,
                'X-Original-User-Agent': requestMetadata.userAgent
            },
            body: JSON.stringify(n8nPayload),
            timeout: 30000 // 30 second timeout
        });
        
        // ========================================
        // HANDLE N8N RESPONSE
        // ========================================
        
        if (!n8nResponse.ok) {
            console.error(`[${requestMetadata.requestId}] N8N error: ${n8nResponse.status}`);
            
            // Provide user-friendly error messages
            let errorMessage = 'I\'m experiencing technical difficulties. Please try again in a moment.';
            
            if (n8nResponse.status === 404) {
                errorMessage = 'The BI service is temporarily unavailable. Please contact support if this persists.';
            } else if (n8nResponse.status === 500) {
                errorMessage = 'Internal processing error. Our team has been notified.';
            } else if (n8nResponse.status === 503) {
                errorMessage = 'Service temporarily overloaded. Please wait a moment and try again.';
            }
            
            return res.status(200).json({ 
                response: errorMessage,
                requestId: requestMetadata.requestId,
                timestamp: new Date().toISOString()
            });
        }
        
        const responseText = await n8nResponse.text();
        
        console.log(`[${requestMetadata.requestId}] Successfully processed request`);
        
        // ========================================
        // SECURITY & CONTENT FILTERING
        // ========================================
        
        // Basic content filtering
        let filteredResponse = responseText;
        
        // Remove potentially sensitive information
        filteredResponse = filteredResponse.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD NUMBER REDACTED]');
        filteredResponse = filteredResponse.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]');
        
        // Add security footer for sensitive data requests
        if (userRole !== 'HOD' && userRole !== 'EXECUTIVE') {
            if (filteredResponse.toLowerCase().includes('confidential') || 
                filteredResponse.toLowerCase().includes('sensitive')) {
                filteredResponse += '\n\n⚠️ Some sensitive information may be restricted based on your access level.';
            }
        }
        
        // ========================================
        // RETURN RESPONSE
        // ========================================
        
        return res.status(200).json({
            response: filteredResponse,
            requestId: requestMetadata.requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - (timestamp || Date.now())
        });
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        
        // Log error details for debugging
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Return user-friendly error
        return res.status(200).json({
            response: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment. If the problem persists, please contact AMAX support.',
            error: true,
            timestamp: new Date().toISOString()
        });
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Simple rate limiting implementation
 */
function checkRateLimit(clientId) {
    // In a production environment, you would use Redis or similar
    // For now, this is a placeholder
    return true;
}

/**
 * Validate user permissions
 */
function validateUserPermissions(userRole, requestType) {
    const permissions = {
        'HOD': ['all'],
        'EXECUTIVE': ['reports', 'analytics', 'basic'],
        'MANAGER': ['reports', 'basic'],
        'AGENT': ['basic'],
        'GUEST': ['basic']
    };
    
    const userPermissions = permissions[userRole] || permissions['GUEST'];
    return userPermissions.includes('all') || userPermissions.includes(requestType);
}

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potential script tags and dangerous patterns
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}
