/**
 * Fixed AMAX Webhook - Proper Response Parsing
 * Handles the nested JSON response format from n8n
 */

export default async function handler(req, res) {
    // ========================================
    // SECURITY HEADERS & CORS
    // ========================================
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed' 
        });
    }

    try {
        const { message, sessionId, threadId, userEmail, userRole, userName, timestamp } = req.body;
        
        // Basic validation
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid request - message required' 
            });
        }

        // Domain validation for AMAX users
        if (userEmail && !userEmail.includes('amaxinsurance.com')) {
            return res.status(403).json({ 
                error: 'Access denied - AMAX domain required' 
            });
        }

        // ========================================
        // PREPARE PAYLOAD FOR N8N
        // ========================================
        
        const n8nPayload = {
            message: message.trim(),
            sessionId: sessionId || `amax_${Date.now()}`,
            threadId: threadId || `thread_${Date.now()}`,
            userEmail: userEmail || 'guest@amaxinsurance.com',
            userRole: userRole || 'GUEST',
            userName: userName || 'Guest User',
            timestamp: timestamp || Date.now()
        };

        console.log('📤 Sending to n8n:', {
            message: message.substring(0, 50) + '...',
            sessionId: n8nPayload.sessionId,
            userEmail: n8nPayload.userEmail
        });

        // ========================================
        // FORWARD TO N8N WEBHOOK
        // ========================================
        
        const n8nResponse = await fetch('http://3.239.79.74:5678/webhook/amax-genBi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AMAX-Widget/1.0'
            },
            body: JSON.stringify(n8nPayload),
            timeout: 30000
        });

        if (!n8nResponse.ok) {
            console.error('❌ N8N error:', n8nResponse.status);
            return res.status(200).send('I\'m experiencing technical difficulties. Please try again in a moment.');
        }

        const responseText = await n8nResponse.text();
        console.log('📥 Raw n8n response:', responseText.substring(0, 200) + '...');

        // ========================================
        // PARSE NESTED JSON RESPONSE (CRITICAL FIX)
        // ========================================
        
        try {
            // Parse the outer JSON first
            const outerJson = JSON.parse(responseText);
            console.log('🔍 Outer JSON structure:', Object.keys(outerJson));
            
            // Check if there's a nested JSON in the response field
            if (outerJson.response && typeof outerJson.response === 'string') {
                try {
                    // Try to parse the inner JSON string
                    const innerJson = JSON.parse(outerJson.response);
                    console.log('🔍 Inner JSON structure:', Object.keys(innerJson));
                    
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
        
        return res.status(200).send(
            'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
        );
    }
}
