// ========================================
// FIXED AMAX WEBHOOK - SECURE & CLEAN
// Handles all widget communication with proper security
// ========================================

export default async function handler(req, res) {
    // ========================================
    // SECURITY HEADERS & CORS
    // ========================================
    
    // Set comprehensive CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-Real-IP, X-Forwarded-For'
    );
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('🔍 CORS preflight request handled');
        return res.status(200).json({ status: 'ok' });
    }

    // Only allow POST requests for actual webhook processing
    if (req.method !== 'POST') {
        console.log(`❌ Method ${req.method} not allowed`);
        return res.status(405).json({ 
            error: 'Method not allowed',
            allowedMethods: ['POST', 'OPTIONS']
        });
    }

    try {
        // ========================================
        // REQUEST VALIDATION & LOGGING
        // ========================================
        
        console.log('📥 Webhook request received');
        console.log('🌐 Request details:', {
            method: req.method,
            userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
            origin: req.headers.origin || 'unknown',
            referer: req.headers.referer || 'unknown',
            contentType: req.headers['content-type'],
            timestamp: new Date().toISOString()
        });

        // Header Analysis (for your reference)
        // X-Real-IP: unknown = Can't determine actual client IP (common with CDNs/proxies like Vercel)
        // X-Forwarded-For: unknown = No forwarding chain detected (typical in serverless environments)
        const realIP = req.headers['x-real-ip'] || 'unknown';
        const forwardedFor = req.headers['x-forwarded-for'] || 'unknown';
        
        console.log('🔍 Network headers:', {
            realIP: realIP,
            forwardedFor: forwardedFor,
            note: realIP === 'unknown' ? 'IP hidden by proxy/CDN (normal for Vercel)' : 'Direct IP available'
        });

        // Validate request body
        if (!req.body) {
            console.log('❌ No request body provided');
            return res.status(400).json({ 
                error: 'Request body is required',
                received: typeof req.body
            });
        }

        const { message, sessionId, threadId, userEmail, userRole, userName } = req.body;

        // Basic validation
        if (!message || typeof message !== 'string') {
            console.log('❌ Invalid or missing message');
            return res.status(400).json({ 
                error: 'Valid message is required',
                received: { message: typeof message }
            });
        }

        if (!sessionId || !threadId) {
            console.log('❌ Missing session or thread ID');
            return res.status(400).json({ 
                error: 'Session ID and Thread ID are required',
                received: { sessionId: !!sessionId, threadId: !!threadId }
            });
        }

        // AMAX User Validation
        if (userEmail && !userEmail.includes('@amaxinsurance.com') && !userEmail.includes('guest@')) {
            console.log('⚠️ Non-AMAX user detected:', userEmail);
            return res.status(403).json({ 
                error: 'Access restricted to AMAX Insurance users',
                contact: 'Please contact IT support for access'
            });
        }

        // ========================================
        // ENHANCED PAYLOAD PREPARATION
        // ========================================
        
        const enhancedPayload = {
            // Original message
            message: message.trim(),
            
            // Session management
            sessionId: sessionId,
            threadId: threadId,
            
            // User context
            userEmail: userEmail || 'guest@amaxinsurance.com',
            userRole: userRole || 'EMPLOYEE',
            userName: userName || 'Guest User',
            userId: userEmail ? userEmail.split('@')[0] : 'guest',
            
            // Request metadata
            timestamp: new Date().toISOString(),
            source: 'amax-widget',
            version: '2.1.0',
            
            // Enhanced context for n8n workflow
            conversationContext: {
                platform: 'web-widget',
                interface: 'amax-bi-assistant',
                domain: req.headers.origin || 'unknown',
                userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown'
            }
        };

        console.log('📦 Enhanced payload prepared:', {
            messageLength: enhancedPayload.message.length,
            sessionId: enhancedPayload.sessionId.substring(0, 15) + '...',
            userEmail: enhancedPayload.userEmail,
            userRole: enhancedPayload.userRole,
            source: enhancedPayload.source
        });

        // ========================================
        // FORWARD TO N8N WEBHOOK
        // ========================================
        
        const n8nWebhookUrl = 'http://3.239.79.74:5678/webhook/amax-genBi';
        
        console.log('🚀 Forwarding to n8n webhook...');
        console.log('🎯 Target URL:', n8nWebhookUrl);

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AMAX-Widget-Proxy/2.1.0',
                'X-Forwarded-For': req.headers['x-forwarded-for'] || 'unknown',
                'X-Real-IP': req.headers['x-real-ip'] || 'unknown',
                'X-Original-Origin': req.headers.origin || 'unknown'
            },
            body: JSON.stringify(enhancedPayload),
            timeout: 30000 // 30 second timeout
        });

        if (!n8nResponse.ok) {
            console.error('❌ n8n webhook failed:', n8nResponse.status, n8nResponse.statusText);
            return res.status(200).send(
                'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
            );
        }

        const responseText = await n8nResponse.text();
        console.log('📥 Raw n8n response received:', responseText.substring(0, 200) + '...');

        // ========================================
        // ENHANCED RESPONSE PROCESSING
        // ========================================
        
        try {
            // Parse the outer JSON first
            const outerJson = JSON.parse(responseText);
            console.log('🔍 Response structure:', Object.keys(outerJson));
            
            // Check if there's a nested JSON in the response field
            if (outerJson.response && typeof outerJson.response === 'string') {
                try {
                    // Try to parse the inner JSON string
                    const innerJson = JSON.parse(outerJson.response);
                    console.log('🔍 Inner response structure:', Object.keys(innerJson));
                    
                    // Extract the actual response content
                    if (innerJson.response) {
                        const finalResponse = innerJson.response;
                        console.log('✅ Extracted final response:', finalResponse.substring(0, 100) + '...');
                        return res.status(200).send(finalResponse);
                    } else if (innerJson.status && innerJson.status === 'success') {
                        // Sometimes the content might be in a different field
                        const content = innerJson.content || innerJson.message || 'Response received successfully.';
                        return res.status(200).send(content);
                    } else {
                        // Return the stringified inner JSON if no specific response field
                        return res.status(200).send(JSON.stringify(innerJson, null, 2));
                    }
                } catch (innerParseError) {
                    console.log('📝 Inner response is not JSON, returning as plain text');
                    return res.status(200).send(outerJson.response);
                }
            } else if (outerJson.response) {
                // Response field exists but isn't a string
                return res.status(200).send(String(outerJson.response));
            } else {
                // No response field, return the whole object as formatted text
                return res.status(200).send(JSON.stringify(outerJson, null, 2));
            }
            
        } catch (parseError) {
            console.log('📝 Response is not JSON, returning as plain text:', parseError.message);
            // If parsing fails, return the raw response
            return res.status(200).send(responseText);
        }

    } catch (error) {
        console.error('💥 Webhook processing error:', error);
        
        // Log additional error context
        console.error('🔍 Error context:', {
            message: error.message,
            stack: error.stack?.substring(0, 500),
            timestamp: new Date().toISOString(),
            requestBody: req.body ? Object.keys(req.body) : 'no body'
        });
        
        return res.status(200).send(
            'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
        );
    }
}
