/**
 * FIXED AMAX Insurance BI Chat Widget
 * Properly handles nested JSON responses from webhook
 */
(function() {
    'use strict';

    console.log('🚀 AMAX Widget loading with fixed JSON parsing...');

    const CONFIG = {
        webhookUrl: 'https://amax-chat-widget.vercel.app/api/webhook',
        logoUrl: './assets/amax-logo-A.png',
        allowedDomain: 'amaxinsurance.com'
    };

    // ========================================
    // ENHANCED RESPONSE PARSER (CRITICAL FIX)
    // ========================================
    
    class ResponseParser {
        static parseResponse(rawResponse) {
            console.log('🔍 Parsing response:', rawResponse.substring(0, 200) + '...');
            
            try {
                // First, try to parse as JSON
                const parsed = JSON.parse(rawResponse);
                console.log('✅ Parsed as JSON, structure:', Object.keys(parsed));
                
                // Check if there's a nested response field
                if (parsed.response) {
                    if (typeof parsed.response === 'string') {
                        try {
                            // Try to parse the nested JSON
                            const nestedJson = JSON.parse(parsed.response);
                            console.log('🔍 Nested JSON found, structure:', Object.keys(nestedJson));
                            
                            // Extract the actual content
                            if (nestedJson.response) {
                                console.log('✅ Using nested response content');
                                return nestedJson.response;
                            } else if (nestedJson.status === 'success' && nestedJson.content) {
                                console.log('✅ Using nested content field');
                                return nestedJson.content;
                            } else {
                                console.log('📝 Using full nested JSON');
                                return JSON.stringify(nestedJson, null, 2);
                            }
                        } catch (nestedParseError) {
                            console.log('📝 Nested response is plain text');
                            return parsed.response;
                        }
                    } else {
                        // Response is not a string, return as is
                        return String(parsed.response);
                    }
                } else {
                    // No response field, return formatted JSON
                    return JSON.stringify(parsed, null, 2);
                }
                
            } catch (parseError) {
                console.log('📝 Response is plain text, returning as-is');
                return rawResponse;
            }
        }
    }

    // ========================================
    // SESSION MANAGEMENT
    // ========================================
    
    class SessionManager {
        constructor() {
            this.sessionId = null;
            this.threadId = null;
            this.conversationHistory = [];
            this.init();
        }
        
        init() {
            this.sessionId = this.getOrCreateSession();
            this.threadId = this.getOrCreateThread();
            this.loadConversationHistory();
            console.log('📊 Session:', this.sessionId.substring(0, 15) + '...');
        }
        
        getOrCreateSession() {
            let session = localStorage.getItem('amax_session_id');
            if (!session) {
                session = 'amax_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('amax_session_id', session);
            }
            return session;
        }
        
        getOrCreateThread() {
            let thread = localStorage.getItem('amax_thread_id');
            if (!thread) {
                thread = 'thread_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('amax_thread_id', thread);
            }
            return thread;
        }
        
        loadConversationHistory() {
            const history = localStorage.getItem('amax_conversation_history');
            if (history) {
                this.conversationHistory = JSON.parse(history);
            }
        }
        
        saveConversationHistory() {
            localStorage.setItem('amax_conversation_history', JSON.stringify(this.conversationHistory));
        }
        
        addToHistory(role, content) {
            this.conversationHistory.push({
                role,
                content,
                timestamp: Date.now(),
                sessionId: this.sessionId,
                threadId: this.threadId
            });
            this.saveConversationHistory();
        }
        
        getSessionData() {
            return {
                sessionId: this.sessionId,
                threadId: this.threadId,
                userEmail: 'guest@amaxinsurance.com',
                userRole: 'GUEST',
                userName: 'Guest User',
                timestamp: Date.now()
            };
        }
    }

    // ========================================
    // WIDGET UI
    // ========================================
    
    class WidgetUI {
        constructor(sessionManager) {
            this.sessionManager = sessionManager;
            this.isOpen = false;
            this.processing = false;
            this.init();
        }
        
        init() {
            this.injectStyles();
            this.createWidget();
            this.setupEventListeners();
            console.log('✅ Widget UI initialized');
        }
        
        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * { box-sizing: border-box; }
                
                .amax-widget-button {
                    position: fixed !important;
                    bottom: 25px !important;
                    right: 25px !important;
                    width: 65px !important;
                    height: 65px !important;
                    background: linear-gradient(135deg, #DC143C 0%, #B91C1C 100%) !important;
                    border: none !important;
                    border-radius: 50% !important;
                    cursor: pointer !important;
                    z-index: 999999 !important;
                    box-shadow: 0 8px 32px rgba(220, 20, 60, 0.4) !important;
                    transition: all 0.3s ease !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .amax-widget-button:hover {
                    transform: translateY(-2px) scale(1.05) !important;
                    box-shadow: 0 12px 40px rgba(220, 20, 60, 0.6) !important;
                }
                
                .amax-widget-button img {
                    width: 32px !important;
                    height: 32px !important;
                    object-fit: contain !important;
                    border-radius: 4px !important;
                }
                
                .amax-widget-button.no-logo {
                    color: white !important;
                    font-size: 24px !important;
                    font-weight: bold !important;
                }
                
                .amax-chat-container {
                    position: fixed !important;
                    bottom: 25px !important;
                    right: 25px !important;
                    width: 900px !important;
                    height: 750px !important;
                    background: white !important;
                    border-radius: 20px !important;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2) !important;
                    z-index: 999999 !important;
                    display: none !important;
                    flex-direction: column !important;
                    font-family: 'Inter', sans-serif !important;
                    overflow: hidden !important;
                }
                
                .amax-header {
                    background: linear-gradient(135deg, #DC143C 0%, #B91C1C 100%) !important;
                    color: white !important;
                    padding: 20px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                
                .amax-header .logo {
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                }
                
                .amax-header .logo img {
                    width: 40px !important;
                    height: 40px !important;
                    border-radius: 8px !important;
                    background: white !important;
                    padding: 4px !important;
                }
                
                .amax-header h2 {
                    margin: 0 !important;
                    font-size: 18px !important;
                    font-weight: 600 !important;
                }
                
                .amax-close {
                    background: none !important;
                    border: none !important;
                    color: white !important;
                    font-size: 24px !important;
                    cursor: pointer !important;
                    width: 30px !important;
                    height: 30px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: background 0.2s !important;
                }
                
                .amax-close:hover {
                    background: rgba(255, 255, 255, 0.2) !important;
                }
                
                .amax-content {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    padding: 20px !important;
                }
                
                .amax-messages {
                    flex: 1 !important;
                    overflow-y: auto !important;
                    margin-bottom: 20px !important;
                    padding: 20px !important;
                    background: #f8fafc !important;
                    border-radius: 12px !important;
                    min-height: 400px !important;
                }
                
                .amax-message {
                    margin: 15px 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .amax-message.user {
                    align-items: flex-end !important;
                }
                
                .amax-message.bot {
                    align-items: flex-start !important;
                }
                
                .message-content {
                    max-width: 80% !important;
                    padding: 15px 18px !important;
                    border-radius: 16px !important;
                    font-size: 14px !important;
                    line-height: 1.5 !important;
                    word-wrap: break-word !important;
                    white-space: pre-wrap !important;
                }
                
                .amax-message.user .message-content {
                    background: #DC143C !important;
                    color: white !important;
                    border-bottom-right-radius: 4px !important;
                }
                
                .amax-message.bot .message-content {
                    background: white !important;
                    color: #374151 !important;
                    border-bottom-left-radius: 4px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                
                .amax-input-container {
                    display: flex !important;
                    gap: 12px !important;
                    align-items: center !important;
                }
                
                .amax-input {
                    flex: 1 !important;
                    padding: 12px 16px !important;
                    border: 2px solid #e2e8f0 !important;
                    border-radius: 24px !important;
                    font-size: 14px !important;
                    outline: none !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .amax-input:focus {
                    border-color: #DC143C !important;
                    box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1) !important;
                }
                
                .amax-send {
                    background: #DC143C !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 16px !important;
                    border-radius: 50% !important;
                    cursor: pointer !important;
                    width: 45px !important;
                    height: 45px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                }
                
                .amax-send:hover {
                    background: #B91C1C !important;
                    transform: scale(1.05) !important;
                }
                
                .amax-send:disabled {
                    background: #9ca3af !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                }
                
                .typing-indicator {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    padding: 15px 18px !important;
                    background: white !important;
                    border-radius: 16px !important;
                    border-bottom-left-radius: 4px !important;
                    max-width: 100px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                
                .dot {
                    width: 6px !important;
                    height: 6px !important;
                    background: #DC143C !important;
                    border-radius: 50% !important;
                    animation: typing 1.4s infinite ease-in-out !important;
                }
                
                .dot:nth-child(1) { animation-delay: -0.32s !important; }
                .dot:nth-child(2) { animation-delay: -0.16s !important; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0) !important; }
                    40% { transform: scale(1) !important; }
                }
            `;
            document.head.appendChild(style);
        }
        
        createWidget() {
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="amax-widget-button" id="amaxWidgetBtn">
                    <img src="${CONFIG.logoUrl}" alt="AMAX" onerror="this.style.display='none'; this.parentNode.classList.add('no-logo'); this.parentNode.innerHTML='A';">
                </div>
                <div class="amax-chat-container" id="amaxChat">
                    <div class="amax-header">
                        <div class="logo">
                            <img src="${CONFIG.logoUrl}" alt="AMAX" onerror="this.style.display='none';">
                            <h2>AMAX BI Assistant</h2>
                        </div>
                        <button class="amax-close" id="amaxClose">×</button>
                    </div>
                    <div class="amax-content">
                        <div class="amax-messages" id="amaxMessages">
                            <div class="amax-message bot">
                                <div class="message-content">
                                    👋 Hello! I'm Anna, your AMAX BI Assistant. I can help you analyze business data, generate reports, and answer questions about policies, claims, and performance metrics. What would you like to know?
                                </div>
                            </div>
                        </div>
                        <div class="amax-input-container">
                            <input type="text" class="amax-input" id="amaxInput" placeholder="Ask me about AMAX business insights...">
                            <button class="amax-send" id="amaxSend">➤</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
            console.log('🎨 Widget DOM created');
        }
        
        setupEventListeners() {
            const widgetBtn = document.getElementById('amaxWidgetBtn');
            const closeBtn = document.getElementById('amaxClose');
            const sendBtn = document.getElementById('amaxSend');
            const input = document.getElementById('amaxInput');
            
            if (widgetBtn) {
                widgetBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Widget button clicked');
                    this.openWidget();
                });
                console.log('✅ Widget button event listener attached');
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeWidget());
            }
            
            if (sendBtn) {
                sendBtn.addEventListener('click', () => this.sendMessage());
            }
            
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
        }
        
        openWidget() {
            const widgetBtn = document.getElementById('amaxWidgetBtn');
            const chatContainer = document.getElementById('amaxChat');
            
            if (widgetBtn && chatContainer) {
                widgetBtn.style.display = 'none';
                chatContainer.style.display = 'flex';
                this.isOpen = true;
                console.log('✅ Widget opened');
                
                setTimeout(() => {
                    const input = document.getElementById('amaxInput');
                    if (input) input.focus();
                }, 100);
            }
        }
        
        closeWidget() {
            const widgetBtn = document.getElementById('amaxWidgetBtn');
            const chatContainer = document.getElementById('amaxChat');
            
            if (widgetBtn && chatContainer) {
                chatContainer.style.display = 'none';
                widgetBtn.style.display = 'flex';
                this.isOpen = false;
                console.log('✅ Widget closed');
            }
        }
        
        async sendMessage() {
            const input = document.getElementById('amaxInput');
            const message = input.value.trim();
            
            if (!message || this.processing) return;
            
            this.processing = true;
            input.value = '';
            
            this.addMessage('user', message);
            this.showTypingIndicator();
            
            try {
                const rawResponse = await this.callWebhook(message);
                this.hideTypingIndicator();
                
                // Use the enhanced response parser
                const parsedResponse = ResponseParser.parseResponse(rawResponse);
                
                this.addMessage('bot', parsedResponse);
                
                this.sessionManager.addToHistory('user', message);
                this.sessionManager.addToHistory('assistant', parsedResponse);
                
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessage('bot', 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.');
                console.error('💥 Webhook error:', error);
            }
            
            this.processing = false;
        }
        
        async callWebhook(message) {
            const sessionData = this.sessionManager.getSessionData();
            
            const payload = {
                message: message,
                sessionId: sessionData.sessionId,
                threadId: sessionData.threadId,
                userEmail: sessionData.userEmail,
                userRole: sessionData.userRole,
                userName: sessionData.userName,
                timestamp: sessionData.timestamp
            };
            
            console.log('📤 Sending to webhook:', {
                message: message.substring(0, 50) + '...',
                sessionId: payload.sessionId
            });
            
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.text();
            console.log('📥 Raw webhook response length:', result.length);
            return result;
        }
        
        addMessage(sender, content) {
            const messagesContainer = document.getElementById('amaxMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `amax-message ${sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = content; // Use textContent to prevent HTML injection
            
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        showTypingIndicator() {
            const messagesContainer = document.getElementById('amaxMessages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'amax-message bot';
            typingDiv.id = 'typingIndicator';
            
            typingDiv.innerHTML = `
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            `;
            
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        hideTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    
    function initializeWidget() {
        console.log('🚀 Initializing AMAX widget...');
        
        const sessionManager = new SessionManager();
        const widgetUI = new WidgetUI(sessionManager);
        
        // Make globally accessible for debugging
        window.widgetUI = widgetUI;
        window.openWidget = () => widgetUI.openWidget();
        
        console.log('✅ AMAX Widget initialized successfully');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
        initializeWidget();
    }
    
    // Backup initialization
    setTimeout(initializeWidget, 100);

    console.log('📋 AMAX Widget script loaded');

})();
