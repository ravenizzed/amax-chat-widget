/*
 * AMAX Insurance BI Chat Widget v2.8
 * Fixed: Logo display, HTTPS compatibility, Clean design
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        webhookUrl: 'http://3.239.79.74:5678/webhook/amax-genBi',
        logoUrl: './assets/amax-insurance-logo.jpg',
        rateLimit: 2000,
        timeout: 30000,
        maxHistory: 10
    };

    // Sample questions
    const QUESTIONS = [
        "What was the total premium last quarter?",
        "Show me new business count by month for this year", 
        "Who are the top 5 agents by premium?",
        "Show total payments by payment method",
        "What is the policy renewal rate?",
        "Show me claims by policy type"
    ];

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
            overflow: hidden !important;
        }

        .amax-widget-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 15px 50px rgba(220,20,60,0.4) !important;
        }

        .amax-widget-btn img {
            width: 40px !important;
            height: 40px !important;
            object-fit: contain !important;
            border-radius: 6px !important;
            display: block !important;
        }

        .amax-widget-btn .fallback {
            color: white !important;
            font-size: 24px !important;
            font-weight: bold !important;
            display: none !important;
        }

        .amax-chat {
            position: fixed !important;
            bottom: 90px !important;
            right: 20px !important;
            width: 900px !important;
            height: 600px !important;
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
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .amax-header {
            background: #DC143C !important;
            color: white !important;
            padding: 15px 20px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }

        .amax-header .logo-section {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }

        .amax-header .logo-section img {
            width: 30px !important;
            height: 30px !important;
            object-fit: contain !important;
            background: white !important;
            padding: 4px !important;
            border-radius: 6px !important;
        }

        .amax-header h2 {
            font-size: 18px !important;
            font-weight: 600 !important;
            margin: 0 !important;
        }

        .amax-close {
            background: none !important;
            border: none !important;
            color: white !important;
            font-size: 24px !important;
            cursor: pointer !important;
            padding: 5px !important;
            width: 30px !important;
            height: 30px !important;
            border-radius: 50% !important;
            transition: background 0.2s !important;
        }

        .amax-close:hover {
            background: rgba(255,255,255,0.2) !important;
        }

        .amax-main {
            display: flex !important;
            flex: 1 !important;
            overflow: hidden !important;
        }

        .amax-sidebar {
            width: 250px !important;
            background: #f8f9fa !important;
            border-right: 1px solid #e0e0e0 !important;
            padding: 15px !important;
        }

        .amax-sidebar h3 {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: #666 !important;
            margin-bottom: 10px !important;
            text-transform: uppercase !important;
        }

        .amax-quick-question {
            display: block !important;
            width: 100% !important;
            text-align: left !important;
            padding: 8px 12px !important;
            margin-bottom: 6px !important;
            background: white !important;
            border: 1px solid #ddd !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            color: #333 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
        }

        .amax-quick-question:hover {
            background: #DC143C !important;
            color: white !important;
            border-color: #DC143C !important;
        }

        .amax-chat-area {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
        }

        .amax-messages {
            flex: 1 !important;
            padding: 20px !important;
            overflow-y: auto !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 15px !important;
        }

        .amax-msg {
            max-width: 75% !important;
            padding: 12px 16px !important;
            border-radius: 12px !important;
            font-size: 14px !important;
            line-height: 1.4 !important;
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
            border-bottom-right-radius: 4px !important;
        }

        .amax-msg.amax-bot {
            background: #f1f1f1 !important;
            color: #333 !important;
            align-self: flex-start !important;
            border-bottom-left-radius: 4px !important;
        }

        .amax-msg.amax-error {
            background: #fee !important;
            color: #d00 !important;
            border: 1px solid #fcc !important;
        }

        .amax-https-warning {
            background: #fff3cd !important;
            color: #856404 !important;
            border: 1px solid #ffeaa7 !important;
            padding: 12px 16px !important;
            border-radius: 8px !important;
            font-size: 13px !important;
            margin: 10px 0 !important;
        }

        .amax-input-area {
            padding: 15px 20px !important;
            border-top: 1px solid #e0e0e0 !important;
            display: flex !important;
            gap: 10px !important;
            align-items: center !important;
        }

        .amax-input {
            flex: 1 !important;
            padding: 12px 16px !important;
            border: 1px solid #ddd !important;
            border-radius: 20px !important;
            font-size: 14px !important;
            outline: none !important;
            font-family: inherit !important;
        }

        .amax-input:focus {
            border-color: #DC143C !important;
        }

        .amax-send {
            padding: 12px 20px !important;
            background: #DC143C !important;
            color: white !important;
            border: none !important;
            border-radius: 20px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            font-family: inherit !important;
            transition: background 0.2s !important;
        }

        .amax-send:hover:not(:disabled) {
            background: #b91c3c !important;
        }

        .amax-send:disabled {
            background: #ccc !important;
            cursor: not-allowed !important;
        }

        @media (max-width: 950px) {
            .amax-chat {
                width: 100vw !important;
                height: 100vh !important;
                bottom: 0 !important;
                right: 0 !important;
                border-radius: 0 !important;
            }
            .amax-sidebar { display: none !important; }
        }
    `;

    // State
    let history = [];
    let lastTime = 0;
    let processing = false;
    let httpsWarningShown = false;

    function injectStyles() {
        if (document.getElementById('amax-widget-styles')) return;
        const styleTag = document.createElement('style');
        styleTag.id = 'amax-widget-styles';
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);
    }

    function createWidget() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="amax-widget-btn" id="amaxWidgetBtn">
                <img src="${CONFIG.logoUrl}" alt="AMAX" id="amaxBtnImg">
                <div class="fallback" id="amaxBtnFallback">A</div>
            </div>
            <div class="amax-chat" id="amaxChat">
                <div class="amax-header">
                    <div class="logo-section">
                        <img src="${CONFIG.logoUrl}" alt="AMAX" id="amaxHeaderImg">
                        <h2>AMAX BI Assistant</h2>
                    </div>
                    <button class="amax-close" id="amaxClose">×</button>
                </div>
                <div class="amax-main">
                    <div class="amax-sidebar">
                        <h3>Quick Questions</h3>
                        <div id="amaxQuickQuestions"></div>
                        <h3 style="margin-top:20px;">History</h3>
                        <div id="amaxChatHistory"></div>
                    </div>
                    <div class="amax-chat-area">
                        <div class="amax-messages" id="amaxMessages">
                            <div class="amax-msg amax-bot">Welcome to AMAX! I'm your BI Assistant. How can I help with our insurance data today?</div>
                        </div>
                        <div class="amax-input-area">
                            <input type="text" class="amax-input" id="amaxInput" placeholder="Ask about premium, policies, agents..." autocomplete="off">
                            <button class="amax-send" id="amaxSend">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    function init() {
        injectStyles();
        createWidget();

        const widgetBtn = document.getElementById('amaxWidgetBtn');
        const chat = document.getElementById('amaxChat');
        const closeBtn = document.getElementById('amaxClose');
        const messages = document.getElementById('amaxMessages');
        const input = document.getElementById('amaxInput');
        const sendBtn = document.getElementById('amaxSend');
        const quickQuestions = document.getElementById('amaxQuickQuestions');
        const chatHistory = document.getElementById('amaxChatHistory');
        const btnImg = document.getElementById('amaxBtnImg');
        const btnFallback = document.getElementById('amaxBtnFallback');
        const headerImg = document.getElementById('amaxHeaderImg');

        // Handle logo loading
        btnImg.onload = function() {
            this.style.display = 'block';
            btnFallback.style.display = 'none';
        };
        
        btnImg.onerror = function() {
            this.style.display = 'none';
            btnFallback.style.display = 'block';
        };

        headerImg.onerror = function() {
            this.style.display = 'none';
        };

        // Populate questions
        QUESTIONS.forEach(q => {
            const btn = document.createElement('button');
            btn.className = 'amax-quick-question';
            btn.textContent = q;
            btn.onclick = () => sendMessage(q);
            quickQuestions.appendChild(btn);
        });

        widgetBtn.onclick = () => {
            chat.classList.add('open');
            input.focus();
        };

        closeBtn.onclick = () => chat.classList.remove('open');

        sendBtn.onclick = () => sendMessage();
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        };

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

        function addHistory(msg) {
            history.unshift(msg);
            if (history.length > CONFIG.maxHistory) history.pop();
            
            chatHistory.innerHTML = '';
            history.forEach(h => {
                const div = document.createElement('div');
                div.className = 'amax-quick-question';
                div.style.fontSize = '11px';
                div.textContent = h.length > 30 ? h.substring(0, 30) + '...' : h;
                div.onclick = () => sendMessage(h);
                chatHistory.appendChild(div);
            });
        }

        function showHttpsWarning() {
            if (httpsWarningShown) return;
            httpsWarningShown = true;
            
            const warning = document.createElement('div');
            warning.className = 'amax-https-warning';
            warning.innerHTML = `
                <strong>⚠️ Connection Issue:</strong><br>
                This page is served over HTTPS but trying to connect to HTTP endpoint.<br>
                <small>Contact your administrator to enable HTTPS for the webhook service.</small>
            `;
            messages.appendChild(warning);
            messages.scrollTop = messages.scrollHeight;
        }

        async function sendMessage(text) {
            const message = text || input.value.trim();
            if (!message || processing) return;

            const now = Date.now();
            if (now - lastTime < CONFIG.rateLimit) return;

            lastTime = now;
            processing = true;
            input.value = '';

            addMessage(message, true);
            addHistory(message);

            input.disabled = true;
            sendBtn.disabled = true;

            try {
                const response = await fetch(CONFIG.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: message,
                        sessionId: `amax_${Date.now()}`,
                        userId: `user_${Math.random().toString(36).substr(2, 9)}`
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                addMessage(data.response || 'Sorry, no response received.');

            } catch (error) {
                console.error('Connection error:', error);
                
                // Check if it's likely an HTTPS/HTTP mixed content error
                if (window.location.protocol === 'https:' && CONFIG.webhookUrl.startsWith('http:')) {
                    showHttpsWarning();
                } else {
                    addMessage('Connection error. Please try again.', false, true);
                }
            } finally {
                processing = false;
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
