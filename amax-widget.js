/*
 * AMAX Insurance BI Chat Widget v2.2
 * CORS Fixed Version
 * 
 * Usage: <script src="https://amax-chat-widget.vercel.app/amax-widget.js"></script>
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        // Your working EC2 endpoint
        webhookUrl: 'http://3.239.79.74:5678/webhook/amax-genBi',
        rateLimit: 2000,
        timeout: 30000,
        maxHistory: 10
    };
    
    // Load Vega-Lite for charts
    function loadVegaLite() {
        if (typeof vegaEmbed !== 'undefined') return Promise.resolve();
        
        return new Promise((resolve, reject) => {
            const scripts = [
                'https://cdn.jsdelivr.net/npm/vega@5',
                'https://cdn.jsdelivr.net/npm/vega-lite@5', 
                'https://cdn.jsdelivr.net/npm/vega-embed@6'
            ];
            
            let loaded = 0;
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    loaded++;
                    if (loaded === scripts.length) resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    }
    
    // CSS Styles
    const styles = `
        .amax-widget-btn {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: #DC143C !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
            transition: all 0.3s ease !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            border: none !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        
        .amax-widget-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 15px 50px rgba(220,20,60,0.4) !important;
        }
        
        .amax-chat {
            position: fixed !important;
            bottom: 90px !important;
            right: 20px !important;
            width: 900px !important;
            height: 700px !important;
            background: #ffffff !important;
            border-radius: 20px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
            display: none !important;
            overflow: hidden !important;
            z-index: 999998 !important;
            flex-direction: column !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        
        .amax-chat.open { 
            display: flex !important; 
            animation: amaxSlideIn 0.3s ease-out !important; 
        }
        
        @keyframes amaxSlideIn {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .amax-header {
            background: #DC143C !important;
            color: white !important;
            padding: 20px 25px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }
        
        .amax-header h2 {
            font-size: 22px !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin: 0 !important;
        }
        
        .amax-logo {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }
        
        .amax-logo-icon {
            background: white !important;
            color: #DC143C !important;
            width: 35px !important;
            height: 35px !important;
            border-radius: 8px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: bold !important;
            font-size: 18px !important;
        }
        
        .amax-close {
            background: none !important;
            border: none !important;
            color: white !important;
            font-size: 28px !important;
            cursor: pointer !important;
            padding: 5px !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: background 0.2s !important;
        }
        
        .amax-close:hover { background: rgba(255,255,255,0.2) !important; }
        
        .amax-main {
            display: flex !important;
            flex: 1 !important;
            overflow: hidden !important;
        }
        
        .amax-sidebar {
            width: 280px !important;
            background: #f5f5f5 !important;
            border-right: 1px solid #e0e0e0 !important;
            display: flex !important;
            flex-direction: column !important;
        }
        
        .amax-sidebar-section {
            padding: 20px !important;
            border-bottom: 1px solid #e0e0e0 !important;
        }
        
        .amax-sidebar-section h3 {
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #1a1a1a !important;
            margin-bottom: 15px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }
        
        .amax-quick-question {
            display: block !important;
            width: 100% !important;
            text-align: left !important;
            padding: 12px 15px !important;
            margin-bottom: 8px !important;
            background: white !important;
            border: 1px solid #ddd !important;
            border-radius: 10px !important;
            font-size: 13px !important;
            color: #1a1a1a !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
        }
        
        .amax-quick-question:hover {
            background: #DC143C !important;
            color: white !important;
            border-color: #DC143C !important;
            transform: translateX(5px) !important;
        }
        
        .amax-history-section {
            flex: 1 !important;
            overflow-y: auto !important;
            padding: 20px !important;
        }
        
        .amax-history-item {
            padding: 10px 15px !important;
            margin-bottom: 5px !important;
            background: white !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            color: #666 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        
        .amax-history-item:hover {
            background: #DC143C !important;
            color: white !important;
        }
        
        .amax-chat-area {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
        }
        
        .amax-messages {
            flex: 1 !important;
            padding: 30px !important;
            overflow-y: auto !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
        }
        
        .amax-msg {
            max-width: 70% !important;
            padding: 15px 20px !important;
            border-radius: 15px !important;
            font-size: 15px !important;
            line-height: 1.6 !important;
            animation: amaxMsgFade 0.3s ease !important;
        }
        
        @keyframes amaxMsgFade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .amax-msg.amax-user {
            background: #DC143C !important;
            color: white !important;
            align-self: flex-end !important;
            border-bottom-right-radius: 5px !important;
        }
        
        .amax-msg.amax-bot {
            background: #f5f5f5 !important;
            color: #1a1a1a !important;
            align-self: flex-start !important;
            border-bottom-left-radius: 5px !important;
        }
        
        .amax-msg.amax-error {
            background: #fee !important;
            color: #d00 !important;
            border: 1px solid #fcc !important;
        }
        
        .amax-chart-container {
            margin: 10px 0 !important;
            padding: 15px !important;
            background: white !important;
            border-radius: 10px !important;
            border: 1px solid #e0e0e0 !important;
        }
        
        .amax-typing {
            display: none !important;
            align-self: flex-start !important;
            padding: 15px 20px !important;
            background: #f5f5f5 !important;
            border-radius: 15px !important;
            border-bottom-left-radius: 5px !important;
        }
        
        .amax-typing-dots { display: flex !important; gap: 5px !important; }
        
        .amax-typing-dots span {
            width: 10px !important;
            height: 10px !important;
            background: #999 !important;
            border-radius: 50% !important;
            animation: amaxTypingDot 1.4s infinite ease-in-out !important;
        }
        
        .amax-typing-dots span:nth-child(2) { animation-delay: 0.2s !important; }
        .amax-typing-dots span:nth-child(3) { animation-delay: 0.4s !important; }
        
        @keyframes amaxTypingDot {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        
        .amax-input-area {
            padding: 20px 30px !important;
            border-top: 1px solid #e0e0e0 !important;
            background: white !important;
            display: flex !important;
            gap: 15px !important;
            align-items: center !important;
        }
        
        .amax-input {
            flex: 1 !important;
            padding: 15px 20px !important;
            border: 2px solid #e0e0e0 !important;
            border-radius: 25px !important;
            font-size: 15px !important;
            outline: none !important;
            transition: all 0.2s !important;
            font-family: inherit !important;
        }
        
        .amax-input:focus { border-color: #DC143C !important; }
        
        .amax-send {
            padding: 15px 30px !important;
            background: #DC143C !important;
            color: white !important;
            border: none !important;
            border-radius: 25px !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            white-space: nowrap !important;
            font-family: inherit !important;
        }
        
        .amax-send:hover:not(:disabled) {
            background: #b91c3c !important;
            transform: scale(1.05) !important;
        }
        
        .amax-send:disabled {
            background: #ccc !important;
            cursor: not-allowed !important;
        }
        
        .amax-rate-warning {
            display: none !important;
            padding: 10px !important;
            background: #fff3cd !important;
            color: #856404 !important;
            border-radius: 8px !important;
            font-size: 14px !important;
            margin-bottom: 10px !important;
        }
        
        .amax-connection-status {
            padding: 10px !important;
            background: #d4edda !important;
            color: #155724 !important;
            border-radius: 8px !important;
            font-size: 12px !important;
            margin-bottom: 10px !important;
            border: 1px solid #c3e6cb !important;
        }
        
        .amax-connection-status.error {
            background: #f8d7da !important;
            color: #721c24 !important;
            border: 1px solid #f5c6cb !important;
        }
        
        @media (max-width: 950px) {
            .amax-chat {
                width: 100vw !important;
                height: 100vh !important;
                bottom: 0 !important;
                right: 0 !important;
                left: 0 !important;
                top: 0 !important;
                border-radius: 0 !important;
            }
            
            .amax-sidebar { display: none !important; }
            .amax-widget-btn { bottom: 20px !important; right: 20px !important; z-index: 1000000 !important; }
            .amax-messages { padding: 20px !important; }
            .amax-msg { max-width: 85% !important; }
            .amax-input-area { 
                padding: 15px !important; 
                position: sticky !important; 
                bottom: 0 !important; 
                background: white !important; 
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1) !important; 
            }
            .amax-send { padding: 15px 20px !important; }
        }
    `;
    
    // Sample questions
    const QUESTIONS = [
        "What was the total premium last quarter?",
        "Show me new business count by month for this year", 
        "Who are the top 5 agents by premium?",
        "Show total payments by payment method",
        "What is the policy renewal rate?",
        "Show me claims by policy type"
    ];
    
    // State
    let history = [];
    let lastTime = 0;
    let processing = false;
    let connectionStatus = 'unknown';
    
    // Create AMAX Triangle Logo SVG
    function createAmaxLogo() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "30");
        svg.setAttribute("height", "30");
        svg.setAttribute("viewBox", "0 0 30 30");
        svg.innerHTML = `
            <polygon points="15,3 27,24 3,24" fill="white" stroke="white" stroke-width="1"/>
            <text x="15" y="20" text-anchor="middle" fill="#DC143C" font-family="Arial, sans-serif" font-size="14" font-weight="bold">A</text>
        `;
        return svg;
    }
    
    // Test connection
    async function testConnection() {
        try {
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: 'connection-test',
                    sessionId: 'test-' + Date.now()
                })
            });
            
            if (response.ok) {
                connectionStatus = 'connected';
                return true;
            } else {
                connectionStatus = 'error';
                return false;
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            connectionStatus = 'error';
            return false;
        }
    }
    
    // Inject styles
    function injectStyles() {
        if (document.getElementById('amax-widget-styles')) return;
        const styleTag = document.createElement('style');
        styleTag.id = 'amax-widget-styles';
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
    }
    
    // Create widget HTML
    function createWidget() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="amax-widget-btn" id="amaxWidgetBtn"></div>
            <div class="amax-chat" id="amaxChat">
                <div class="amax-header">
                    <div class="amax-logo">
                        <div class="amax-logo-icon">A</div>
                        <h2>AMAX BI Assistant</h2>
                    </div>
                    <button class="amax-close" id="amaxClose">×</button>
                </div>
                <div class="amax-main">
                    <div class="amax-sidebar">
                        <div class="amax-sidebar-section">
                            <h3>Quick Questions</h3>
                            <div id="amaxQuickQuestions"></div>
                        </div>
                        <div class="amax-history-section">
                            <h3>History</h3>
                            <div id="amaxChatHistory"></div>
                        </div>
                    </div>
                    <div class="amax-chat-area">
                        <div class="amax-messages" id="amaxMessages">
                            <div class="amax-msg amax-bot">Welcome to AMAX! I'm your BI Assistant. How can I help with our insurance data today?</div>
                            <div class="amax-connection-status" id="amaxConnectionStatus">🔄 Testing connection...</div>
                        </div>
                        <div class="amax-typing" id="amaxTyping">
                            <div class="amax-typing-dots"><span></span><span></span><span></span></div>
                        </div>
                        <div class="amax-rate-warning" id="amaxRateWarning">Please wait a moment before sending another message...</div>
                        <div class="amax-input-area">
                            <input type="text" class="amax-input" id="amaxInput" placeholder="Ask about premium, policies, agents..." autocomplete="off">
                            <button class="amax-send" id="amaxSend">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Add logo to button
        const btn = document.getElementById('amaxWidgetBtn');
        btn.appendChild(createAmaxLogo());
        
        return container;
    }
    
    // Initialize
    function init() {
        injectStyles();
        createWidget();
        
        const widgetBtn = document.getElementById('amaxWidgetBtn');
        const chat = document.getElementById('amaxChat');
        const closeBtn = document.getElementById('amaxClose');
        const messages = document.getElementById('amaxMessages');
        const input = document.getElementById('amaxInput');
        const sendBtn = document.getElementById('amaxSend');
        const typing = document.getElementById('amaxTyping');
        const quickQuestions = document.getElementById('amaxQuickQuestions');
        const chatHistory = document.getElementById('amaxChatHistory');
        const rateWarning = document.getElementById('amaxRateWarning');
        const connectionStatusEl = document.getElementById('amaxConnectionStatus');
        
        // Test connection on load
        testConnection().then(isConnected => {
            if (isConnected) {
                connectionStatusEl.textContent = '✅ Connected to AMAX BI system';
                connectionStatusEl.className = 'amax-connection-status';
            } else {
                connectionStatusEl.textContent = '❌ Connection failed. Please check server status.';
                connectionStatusEl.className = 'amax-connection-status error';
            }
        });
        
        // Populate quick questions
        QUESTIONS.forEach(q => {
            const btn = document.createElement('button');
            btn.className = 'amax-quick-question';
            btn.textContent = q;
            btn.onclick = () => sendMessage(q);
            quickQuestions.appendChild(btn);
        });
        
        // Event handlers
        widgetBtn.onclick = () => openChat();
        closeBtn.onclick = () => closeChat();
        sendBtn.onclick = () => sendMessage();
        input.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
        
        function openChat() {
            chat.classList.add('open');
            input.focus();
        }
        
        function closeChat() {
            chat.classList.remove('open');
        }
        
        function addHistory(msg) {
            history.unshift(msg);
            if (history.length > CONFIG.maxHistory) history.pop();
            
            chatHistory.innerHTML = '';
            history.forEach(h => {
                const div = document.createElement('div');
                div.className = 'amax-history-item';
                div.textContent = h;
                div.onclick = () => sendMessage(h);
                chatHistory.appendChild(div);
            });
        }
        
        function addMessage(content, isUser = false, isError = false) {
            const msg = document.createElement('div');
            msg.className = `amax-msg ${isUser ? 'amax-user' : isError ? 'amax-error' : 'amax-bot'}`;
            
            if (typeof content === 'string') {
                msg.innerHTML = content.replace(/\n/g, '<br>');
            } else {
                msg.appendChild(content);
            }
            
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function showTyping() {
            typing.style.display = 'block';
            messages.scrollTop = messages.scrollHeight;
        }
        
        function hideTyping() {
            typing.style.display = 'none';
        }
        
        function showRateLimit() {
            rateWarning.style.display = 'block';
            setTimeout(() => rateWarning.style.display = 'none', CONFIG.rateLimit);
        }
        
        async function renderChart(spec) {
            const wrapper = document.createElement('div');
            wrapper.className = 'amax-chart-container';
            const chartDiv = document.createElement('div');
            wrapper.appendChild(chartDiv);
            
            try {
                await vegaEmbed(chartDiv, spec, {
                    renderer: 'svg',
                    actions: false,
                    theme: 'latimes',
                    width: chartDiv.parentElement.offsetWidth > 400 ? 400 : chartDiv.parentElement.offsetWidth - 100
                });
            } catch (e) {
                console.error('Chart error:', e);
                wrapper.innerHTML = '<p style="color:#666;">Chart data received but cannot render.</p>';
            }
            
            return wrapper;
        }
        
        async function processResponse(data) {
            const container = document.createElement('div');
            let responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2);
            
            // Look for Vega-Lite chart specification
            const chartRegex = /\{[\s\S]*?\$schema.*?vega-lite.*?[\s\S]*?\}/;
            const match = responseText.match(chartRegex);
            
            if (match) {
                try {
                    const spec = JSON.parse(match[0]);
                    const before = responseText.substring(0, match.index);
                    const after = responseText.substring(match.index + match[0].length);
                    
                    if (before.trim()) {
                        const beforeDiv = document.createElement('div');
                        beforeDiv.innerHTML = before.replace(/\n/g, '<br>');
                        container.appendChild(beforeDiv);
                    }
                    
                    const chartContainer = await renderChart(spec);
                    container.appendChild(chartContainer);
                    
                    if (after.trim()) {
                        const afterDiv = document.createElement('div');
                        afterDiv.innerHTML = after.replace(/\n/g, '<br>');
                        container.appendChild(afterDiv);
                    }
                    
                    return container;
                } catch (e) {
                    console.error('Chart parsing error:', e);
                }
            }
            
            container.innerHTML = responseText.replace(/\n/g, '<br>');
            return container;
        }
        
        async function sendMessage(text) {
            const message = text || input.value.trim();
            if (!message) return;
            
            const now = Date.now();
            if (processing || now - lastTime < CONFIG.rateLimit) {
                showRateLimit();
                return;
            }
            
            lastTime = now;
            processing = true;
            input.value = '';
            
            addMessage(message, true);
            addHistory(message);
            
            input.disabled = true;
            sendBtn.disabled = true;
            showTyping();
            
            try {
                const response = await fetch(CONFIG.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question: message,
                        sessionId: `amax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        userId: `user_${Math.random().toString(36).substr(2, 9)}`
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();
                const content = await processResponse(data);
                addMessage(content, false);
                
            } catch (error) {
                console.error('Connection error:', error);
                
                let errorMsg = '';
                if (error.message.includes('Failed to fetch')) {
                    errorMsg = `❌ <strong>Connection Error:</strong> Cannot reach the AMAX BI server.<br><br>
                              <strong>Possible causes:</strong><br>
                              • Server is not running<br>
                              • CORS headers not configured<br>
                              • Network connectivity issues<br><br>
                              <strong>Endpoint:</strong> ${CONFIG.webhookUrl}`;
                } else {
                    errorMsg = `Connection error: ${error.message}`;
                }
                
                addMessage(errorMsg, false, true);
            } finally {
                hideTyping();
                processing = false;
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadVegaLite().then(init).catch(console.error);
        });
    } else {
        loadVegaLite().then(init).catch(console.error);
    }
    
})();
