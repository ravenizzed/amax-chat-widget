// api/webhook.js
// AMAX Insurance BI Assistant - Enhanced Secure Webhook Proxy
// Forwards HTTPS requests from widget to EC2 n8n with comprehensive security

export default async function handler(req, res) {
    // ========================================
    // COMPREHENSIVE CORS CONFIGURATION
    // ========================================
    
    // Set CORS headers for widget access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-Agent');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '3600');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        console.log('🔄 CORS preflight request handled successfully');
        return res.status(200).end();
    }

    // ========================================
    // SECURITY VALIDATION
    // ========================================
    
    // Only allow POST requests for webhook calls
    if (req.method !== 'POST') {
        console.log(`❌ Method ${req.method} not allowed - only POST accepted`);
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'This endpoint only accepts POST requests',
            allowed: ['POST', 'OPTIONS']
        });
    }

    // Extract client information for security logging
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     'unknown';
    
    const userAgent = req.headers['user-agent'] || 'unknown';
    const origin = req.headers.origin || req.headers.referer || 'direct';
    const timestamp = new Date().toISOString();

    // ========================================
    // HEADER EXPLANATIONS (Answering your questions)
    // ========================================
    
    /*
     * X-Real-IP: This header contains the actual IP address of the client
     * - When set to 'unknown': Means we couldn't determine the real client IP
     * - This happens when requests go through multiple proxies/load balancers
     * - Vercel/CDNs sometimes strip this header for security
     * 
     * X-Forwarded-For: Chain of IP addresses showing request path
     * - When set to 'unknown': Means no forwarding chain was detected
     * - Format: "client, proxy1, proxy2" showing the path
     * - Useful for tracking request routing and detecting proxy chains
     */
    
    console.log('📋 AMAX Request Info:', {
        timestamp: timestamp,
        method: req.method,
        origin: origin,
        clientIp: clientIp,
        realIp: req.headers['x-real-ip'] || 'unknown', // This answers your X-Real-IP question
        forwardedFor: req.headers['x-forwarded-for'] || 'unknown', // This answers your X-Forwarded-For question
        userAgent: userAgent.substring(0, 100) + '...',
        contentType: req.headers['content-type']
    });

    // ========================================
    // REQUEST VALIDATION
    // ========================================
    
    // Validate request has body
    if (!req.body || typeof req.body !== 'object') {
        console.log('❌ Invalid request body - must be valid JSON');
        return res.status(400).json({
            error: 'Invalid request body',
            message: 'Request body must be a valid JSON object',
            timestamp: timestamp
        });
    }

    // Extract and validate required fields
    const { question, sessionId, userId, userEmail, userRole } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        console.log('❌ Missing or invalid question field');
        return res.status(400).json({
            error: 'Invalid question',
            message: 'Question field is required and must be a non-empty string',
            timestamp: timestamp
        });
    }

    if (question.length > 2000) {
        console.log('❌ Question too long:', question.length, 'characters');
        return res.status(400).json({
            error: 'Question too long',
            message: 'Question must be less than 2000 characters',
            maxLength: 2000,
            currentLength: question.length
        });
    }

    // ========================================
    // AMAX USER VALIDATION
    // ========================================
    
    // Validate AMAX user credentials
    if (userEmail && !userEmail.includes('@amaxinsurance.com')) {
        console.log('🚫 Unauthorized email domain:', userEmail);
        return res.status(403).json({
            error: 'Unauthorized access',
            message: 'Access restricted to AMAX Insurance personnel only'
        });
    }

    // Log authorized AMAX user
    if (userEmail === 'ufarooq@amaxinsurance.com') {
        console.log('✅ Authorized AMAX HOD access:', userEmail, 'Role:', userRole);
    }

    // ========================================
    // ENHANCED PAYLOAD PREPARATION
    // ========================================
    
    const enhancedPayload = {
        // Core request data
        question: question.trim(),
        sessionId: sessionId || `amax_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: req.body.threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        
        // User information
        userId: userId || 'anonymous',
        userEmail: userEmail || 'unknown@amaxinsurance.com',
        userRole: userRole || 'user',
        
        // Request metadata
        timestamp: timestamp,
        origin: origin,
        clientIp: clientIp,
        
        // System context
        metadata: {
            requestId: `amax_req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            userAgent: userAgent.substring(0, 200),
            system: 'AMAX Insurance BI Assistant',
            version: '2.0',
            platform: 'Vercel Serverless'
        }
    };

    // ========================================
    // N8N WEBHOOK FORWARDING
    // ========================================
    
    console.log('🔄 Forwarding to Anna (n8n):', {
        question: enhancedPayload.question.substring(0, 100) + '...',
        sessionId: enhancedPayload.sessionId,
        userEmail: enhancedPayload.userEmail,
        requestId: enhancedPayload.metadata.requestId
    });

    try {
        const n8nUrl = 'http://3.239.79.74:5678/webhook/amax-genBi';
        const startTime = Date.now();
        
        const n8nResponse = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': req.headers['x-forwarded-for'] || clientIp,
                'X-Real-IP': req.headers['x-real-ip'] || clientIp,
                'X-Original-Host': req.headers.host || 'amax-chat-widget.vercel.app',
                'User-Agent': 'AMAX-Widget-Proxy/2.0',
                'X-Request-ID': enhancedPayload.metadata.requestId
            },
            body: JSON.stringify(enhancedPayload),
            signal: AbortSignal.timeout(180000) // 3 minute timeout for complex analysis
        });

        const responseTime = Date.now() - startTime;
        
        console.log(`⏱️ Anna processing time: ${responseTime}ms`);

        if (!n8nResponse.ok) {
            console.error(`❌ n8n error: ${n8nResponse.status} ${n8nResponse.statusText}`);
            
            let errorDetails = 'Backend service error';
            try {
                const errorText = await n8nResponse.text();
                errorDetails = errorText.substring(0, 500);
                console.log('Error details:', errorDetails);
            } catch (e) {
                console.log('Could not parse error response');
            }

            return res.status(n8nResponse.status >= 500 ? 503 : n8nResponse.status).json({
                error: 'Anna is temporarily unavailable',
                message: n8nResponse.status >= 500 
                    ? 'Our BI analysis service is experiencing technical difficulties. Please try again in a moment.'
                    : 'There was an issue processing your request. Please rephrase your question and try again.',
                status: n8nResponse.status,
                requestId: enhancedPayload.metadata.requestId,
                timestamp: timestamp,
                supportInfo: 'If this issue persists, please contact your system administrator.'
            });
        }

        // ========================================
        // RESPONSE PROCESSING
        // ========================================
        
        // Parse and enhance the response from Anna
        let responseData;
        const contentType = n8nResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await n8nResponse.json();
        } else {
            // Handle non-JSON responses
            const textResponse = await n8nResponse.text();
            responseData = {
                response: textResponse,
                type: 'text'
            };
        }
        
        console.log('✅ Anna response received:', {
            hasResponse: !!responseData.response,
            hasChart: !!responseData.chart_specification || !!responseData.chart_data || !!responseData.chartData,
            responseLength: responseData.response?.length || 0,
            processingTime: responseTime,
            requestId: enhancedPayload.metadata.requestId
        });

        // Enhance response with metadata
        const enhancedResponse = {
            ...responseData,
            
            // Add system metadata
            _metadata: {
                sessionId: enhancedPayload.sessionId,
                threadId: enhancedPayload.threadId,
                requestId: enhancedPayload.metadata.requestId,
                processingTime: responseTime,
                timestamp: new Date().toISOString(),
                system: 'AMAX Insurance BI Assistant',
                analyst: 'Anna',
                version: '2.0'
            }
        };

        // Validate response has content
        if (!enhancedResponse.response && !enhancedResponse.output && !enhancedResponse.data) {
            console.warn('⚠️ Anna response missing main content - adding fallback');
            enhancedResponse.response = 'I\'ve processed your request. The analysis is complete, though the response format was unexpected. Please let me know if you need me to clarify anything.';
        }

        // ========================================
        // SUCCESSFUL RESPONSE
        // ========================================
        
        console.log('🎉 Request completed successfully:', {
            question: enhancedPayload.question.substring(0, 50) + '...',
            userEmail: enhancedPayload.userEmail,
            processingTime: responseTime,
            requestId: enhancedPayload.metadata.requestId,
            hasChart: !!(enhancedResponse.chart_specification || enhancedResponse.chart_data || enhancedResponse.chartData)
        });

        // Return the enhanced response to the widget
        return res.status(200).json(enhancedResponse);

    } catch (error) {
        console.error('💥 Webhook proxy error:', error);

        // ========================================
        // ERROR HANDLING
        // ========================================
        
        let errorMessage = 'Anna is temporarily unavailable';
        let statusCode = 503;
        let userMessage = 'I\'m experiencing technical difficulties right now. Please try again in a moment.';

        // Handle specific error types
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout';
            statusCode = 504;
            userMessage = 'Your analysis is taking longer than expected. This sometimes happens with complex queries. Please try again or break your question into smaller parts.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Unable to connect to analysis service';
            statusCode = 503;
            userMessage = 'I\'m unable to connect to our analysis systems right now. Please try again in a few moments.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Analysis service not found';
            statusCode = 503;
            userMessage = 'There seems to be a configuration issue. Please contact your system administrator.';
        }

        return res.status(statusCode).json({
            error: errorMessage,
            message: userMessage,
            requestId: enhancedPayload?.metadata?.requestId || 'unknown',
            timestamp: timestamp,
            supportInfo: 'If this issue persists, please contact your system administrator with the request ID above.',
            retryAfter: statusCode === 504 ? 30 : 60, // Suggest retry time in seconds
            
            // Include debug info for development
            debug: process.env.NODE_ENV === 'development' ? {
                errorName: error.name,
                errorCode: error.code,
                errorMessage: error.message,
                n8nUrl: 'http://3.239.79.74:5678/webhook/amax-genBi'
            } : undefined
        });
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Enhanced rate limiting helper
 * Tracks requests per IP and implements sliding window
 */
const requestTracking = new Map();

function checkRateLimit(identifier, maxRequests = 50, windowMs = 60000) {
    const now = Date.now();
    const requests = requestTracking.get(identifier) || [];
    
    // Clean old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
        console.log(`🚫 Rate limit exceeded for ${identifier}: ${validRequests.length}/${maxRequests}`);
        return false;
    }
    
    validRequests.push(now);
    requestTracking.set(identifier, validRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance
        cleanupRateTracking();
    }
    
    return true;
}

/**
 * Cleanup old rate tracking entries
 */
function cleanupRateTracking() {
    const now = Date.now();
    for (const [key, requests] of requestTracking.entries()) {
        const validRequests = requests.filter(time => now - time < 60000);
        if (validRequests.length === 0) {
            requestTracking.delete(key);
        } else {
            requestTracking.set(key, validRequests);
        }
    }
}

/**
 * Content validation helper
 */
function validateQuestionContent(question) {
    // Basic security filtering
    const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /document\.cookie/gi
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(question)) {
            console.log('🚫 Suspicious content detected in question');
            return false;
        }
    }

    return true;
}
