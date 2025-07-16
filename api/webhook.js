// api/webhook.js
// Vercel serverless proxy to forward HTTPS requests to HTTP n8n webhook

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Forward request to n8n webhook
        const n8nResponse = await fetch('http://3.239.79.74:5678/webhook/amax-genBi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n responded with status: ${n8nResponse.status}`);
        }

        const data = await n8nResponse.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Webhook proxy failed',
            details: error.message 
        });
    }
}
