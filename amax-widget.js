/**
 * COMPLETE AMAX Insurance BI Chat Widget - ALL FEATURES RESTORED
 * JWT Authentication, Session Continuity, Chart Processing, Security, Modern UI
 * 
 * Usage: <script src="https://amax-chat-widget.vercel.app/amax-widget.js"></script>
 */
(function() {
    'use strict';

    console.log('🚀 AMAX Widget starting with ALL features...');

    // ========================================
    // CONFIGURATION & SECURITY
    // ========================================
    
    const CONFIG = {
        webhookUrl: 'https://amax-chat-widget.vercel.app/api/webhook',
        logoUrl: './assets/amax-logo-A.png', // Using your specific logo file
        allowedDomain: 'amaxinsurance.com',
        jwtSecret: 'AMAX_BI_SECRET_2025',
        protectedPorts: ['3000', '5678'],
        adminPassword: 'QW1heEBnZW5CaTI1', // Base64 encoded "Amax@genBi25"
    };

    // ========================================
    // JWT AUTHENTICATION SYSTEM (RESTORED)
    // ========================================
    
    class JWTAuth {
        constructor() {
            this.currentUser = null;
            this.token = null;
            this.baseUsers = [
                {
                    email: 'ufarooq@amaxinsurance.com',
                    role: 'HOD',
                    name: 'Umair Farooq',
                    permissions: ['admin', 'bi_access', 'all_data']
                }
            ];
            console.log('🔐 JWT Auth system initialized');
        }

        async authenticateUser() {
            console.log('🔍 Starting user authentication...');
            const currentDomain = window.location.hostname;
            
            // Check if accessing protected ports directly
            if (this.isProtectedPortAccess()) {
                console.log('🚨 Protected port access detected');
                return this.handleProtectedAccess();
            }

            // For maxbi domain, extract user from parent window or prompt
            if (currentDomain.includes('maxbi') || currentDomain.includes('amaxinsurance')) {
                console.log('✅ AMAX domain detected');
                return this.extractUserFromParent();
            }

            // For iframe embedding, user should be passed via postMessage
            return this.waitForUserAuth();
        }

        generateJWT(userEmail) {
            const user = this.baseUsers.find(u => u.email === userEmail) || {
                email: userEmail,
                role: this.extractRoleFromEmail(userEmail),
                name: this.extractNameFromEmail(userEmail),
                permissions: ['basic_access']
            };

            const payload = {
                email: user.email,
                role: user.role,
                name: user.name,
                permissions: user.permissions,
                issued: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            const token = btoa(JSON.stringify(payload));
            this.token = token;
            this.currentUser = user;
            
            localStorage.setItem('amax_jwt_token', token);
            localStorage.setItem('amax_user_session', JSON.stringify(user));
            
            console.log('✅ JWT generated for:', user.email);
            return token;
        }

        validateJWT(token) {
            try {
                const payload = JSON.parse(atob(token));
                if (payload.expires < Date.now()) {
                    this.clearAuth();
                    return false;
                }
                this.currentUser = payload;
                return true;
            } catch (e) {
                this.clearAuth();
                return false;
            }
        }

        isProtectedPortAccess() {
            const currentPort = window.location.port;
            const currentHost = window.location.hostname;
            
            return CONFIG.protectedPorts.includes(currentPort) && 
                   (currentHost.includes('3.239.79.74') || currentHost.includes('localhost'));
        }

        handleProtectedAccess() {
            const savedAuth = localStorage.getItem('amax_admin_auth');
            if (savedAuth && this.validateAdminAuth(savedAuth)) {
                return true;
            }

            const password = prompt('Enter admin password to access this port:');
            if (!password) {
                document.body.innerHTML = '<h1>Access Denied</h1><p>Authentication required.</p>';
                return false;
            }

            if (btoa(password) === CONFIG.adminPassword) {
                const authToken = btoa(JSON.stringify({
                    authenticated: true,
                    timestamp: Date.now(),
                    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                }));
                localStorage.setItem('amax_admin_auth', authToken);
                return true;
            } else {
                document.body.innerHTML = '<h1>Access Denied</h1><p>Invalid password.</p>';
                return false;
            }
        }

        extractUserFromParent() {
            try {
                if (window.parent && window.parent !== window) {
                    const parentUser = window.parent.getCurrentUser?.();
                    if (parentUser && parentUser.email.includes(CONFIG.allowedDomain)) {
                        return this.generateJWT(parentUser.email);
                    }
                }
            } catch (e) {
                console.log('Could not access parent window user data');
            }

            const savedUser = localStorage.getItem('amax_user_session');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.email.includes(CONFIG.allowedDomain)) {
                    return this.generateJWT(user.email);
                }
            }

            return this.promptForUser();
        }

        promptForUser() {
            const email = prompt('Enter your AMAX email to access BI Assistant:');
            if (!email || !email.includes(CONFIG.allowedDomain)) {
                document.body.innerHTML = '<h1>Access Denied</h1><p>AMAX domain required.</p>';
                return false;
            }
            return this.generateJWT(email);
        }

        extractRoleFromEmail(email) {
            if (email.includes('ceo') || email.includes('president')) return 'EXECUTIVE';
            if (email.includes('manager') || email.includes('head') || email.includes('director')) return 'MANAGER';
            if (email.includes('agent') || email.includes('sales')) return 'AGENT';
            return 'EMPLOYEE';
        }

        extractNameFromEmail(email) {
            return email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        clearAuth() {
            this.currentUser = null;
            this.token = null;
            localStorage.removeItem('amax_jwt_token');
            localStorage.removeItem('amax_user_session');
        }

        getCurrentUser() {
            return this.currentUser;
        }

        validateAdminAuth(authToken) {
            try {
                const auth = JSON.parse(atob(authToken));
                return auth.authenticated && auth.expires > Date.now();
            } catch (e) {
                return false;
            }
        }

        waitForUserAuth() {
            // Wait for user data from parent window
            return new Promise((resolve) => {
                const checkForUser = () => {
                    const parentUser = localStorage.getItem('amax_parent_user');
                    if (parentUser) {
                        const user = JSON.parse(parentUser);
                        if (user.email && user.email.includes(CONFIG.allowedDomain)) {
                            resolve(this.generateJWT(user.email));
                            return;
                        }
                    }
                    
                    // Default to guest user for now
                    resolve(this.generateJWT('guest@amaxinsurance.com'));
                };
                
                setTimeout(checkForUser, 1000);
            });
        }
    }

    // ========================================
    // SESSION MANAGEMENT WITH CONTINUITY (RESTORED)
    // ========================================
    
    class SessionManager {
        constructor(auth) {
            this.auth = auth;
            this.sessionId = null;
            this.threadId = null;
            this.conversationHistory = [];
            this.init();
            console.log('📝 Session Manager initialized');
        }
        
        init() {
            this.sessionId = this.getOrCreateSession();
            this.threadId = this.getOrCreateThread();
            this.loadConversationHistory();
            console.log('📊 Session:', this.sessionId, 'Thread:', this.threadId);
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
                console.log('📚 Loaded', this.conversationHistory.length, 'conversation items');
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
            const user = this.auth.getCurrentUser();
            return {
                sessionId: this.sessionId,
                threadId: this.threadId,
                userEmail: user?.email || 'guest@amaxinsurance.com',
                userRole: user?.role || 'GUEST',
                userName: user?.name || 'Guest User',
                timestamp: Date.now()
            };
        }
    }

    // ========================================
    // ENHANCED CHART PROCESSOR (RESTORED)
    // ========================================
    
    class ChartProcessor {
        constructor() {
            this.vegaLoaded = false;
            this.loadVegaLite();
            console.log('📊 Chart Processor initialized');
        }
        
        async loadVegaLite() {
            if (window.vegaEmbed) {
                this.vegaLoaded = true;
                return;
            }
            
            try {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/vega-embed@6';
                script.onload = () => { 
                    this.vegaLoaded = true; 
                    console.log('📊 Vega-Lite loaded successfully');
                };
                document.head.appendChild(script);
            } catch (e) {
                console.error('Failed to load Vega-Lite:', e);
            }
        }
        
        async processChart(responseText) {
            if (!this.vegaLoaded) {
                await new Promise(resolve => {
                    const checkVega = setInterval(() => {
                        if (window.vegaEmbed) {
                            clearInterval(checkVega);
                            this.vegaLoaded = true;
                            resolve();
                        }
                    }, 100);
                });
            }
            
            try {
                const chartRegex = /\{[\s\S]*?["\']?\$schema["\']?\s*:\s*["\']https?:\/\/vega\.github\.io\/schema\/vega-lite\/v[0-9]+\.json["\'][\s\S]*?\}/g;
                const matches = responseText.match(chartRegex);
                
                if (matches && matches.length > 0) {
                    console.log('📊 Chart detected, rendering...');
                    const chartSpec = JSON.parse(matches[0]);
                    return await this.renderChart(chartSpec);
                }
                
                return null;
            } catch (e) {
                console.error('Chart processing error:', e);
                return null;
            }
        }
        
        async renderChart(spec) {
            try {
                const tempDiv = document.createElement('div');
                tempDiv.style.width = '400px';
                tempDiv.style.height = '300px';
                document.body.appendChild(tempDiv);
                
                spec = this.applyAmaxBranding(spec);
                
                const result = await vegaEmbed(tempDiv, spec, {
                    actions: false,
                    renderer: 'svg'
                });
                
                const svgElement = tempDiv.querySelector('svg');
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                return new Promise((resolve) => {
                    img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const base64 = canvas.toDataURL('image/png');
                        document.body.removeChild(tempDiv);
                        console.log('📊 Chart rendered successfully');
                        resolve(base64);
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                });
                
            } catch (e) {
                console.error('Chart rendering error:', e);
                return null;
            }
        }
        
        applyAmaxBranding(spec) {
            spec.config = spec.config || {};
            spec.config.background = '#ffffff';
            spec.config.title = spec.config.title || {};
            spec.config.title.color = '#DC143C';
            spec.config.title.fontSize = 16;
            spec.config.title.fontWeight = 'bold';
            
            if (spec.mark && spec.mark.color === undefined) {
                spec.mark.color = '#DC143C';
            }
            
            return spec;
        }
    }

    // ========================================
    // MODERN WIDGET UI (RESTORED WITH ALL FEATURES)
    // ========================================
    
    class WidgetUI {
        constructor(sessionManager, chartProcessor) {
            this.sessionManager = sessionManager;
            this.chartProcessor = chartProcessor;
            this.isOpen = false;
            this.processing = false;
            this.quickQuestions = [
                "How many policies were sold this quarter?",
                "Show me top performing agents this month",
                "What's our average claim processing time?",
                "Compare this year's premium collection vs last year",
                "Which products have the highest renewal rates?"
            ];
            this.init();
            console.log('🎨 Widget UI initialized with all features');
        }
        
        init() {
            this.injectStyles();
            this.createWidget();
            this.setupEventListeners();
            this.populateQuickQuestions();
            console.log('✅ Widget UI setup complete');
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
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
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
                    letter-spacing: -0.5px !important;
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
                
                .amax-main {
                    display: flex !important;
                    height: 100% !important;
                    min-height: 600px !important;
                }
                
                .amax-sidebar {
                    width: 280px !important;
                    background: #f8fafc !important;
                    border-right: 1px solid #e2e8f0 !important;
                    padding: 20px !important;
                    overflow-y: auto !important;
                }
                
                .amax-sidebar h3 {
                    margin: 0 0 15px 0 !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    color: #64748b !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.8px !important;
                }
                
                .quick-btn {
                    display: block !important;
                    width: 100% !important;
                    padding: 12px 14px !important;
                    margin: 4px 0 !important;
                    background: white !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    font-size: 12px !important;
                    color: #374151 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    line-height: 1.4 !important;
                    text-align: left !important;
                    font-weight: 500 !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .quick-btn:hover {
                    background: #DC143C !important;
                    color: white !important;
                    border-color: #DC143C !important;
                    transform: translateY(-1px) !important;
                }
                
                .random-btn {
                    background: linear-gradient(135deg, #059669, #047857) !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 14px !important;
                    border-radius: 8px !important;
                    font-size: 11px !important;
                    cursor: pointer !important;
                    margin: 10px 0 !important;
                    transition: all 0.2s !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    width: 100% !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .random-btn:hover {
                    background: linear-gradient(135deg, #047857, #065f46) !important;
                    transform: translateY(-1px) !important;
                }
                
                .disclaimer {
                    font-size: 9px !important;
                    color: #9ca3af !important;
                    text-align: center !important;
                    margin-top: 8px !important;
                    font-style: italic !important;
                }
                
                .history-section {
                    margin-top: 30px !important;
                }
                
                .history-container {
                    max-height: 300px !important;
                    overflow-y: auto !important;
                }
                
                .history-item {
                    padding: 10px 12px !important;
                    margin: 4px 0 !important;
                    background: white !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                    color: #4b5563 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    line-height: 1.3 !important;
                }
                
                .history-item:hover {
                    background: #f1f5f9 !important;
                    border-color: #cbd5e1 !important;
                }
                
                .amax-chat-area {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    background: white !important;
                }
                
                .amax-messages {
                    flex: 1 !important;
                    padding: 20px !important;
                    overflow-y: auto !important;
                    scroll-behavior: smooth !important;
                }
                
                .amax-message {
                    margin: 15px 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .amax-message.user {
                    align-items: flex-end !important;
                }
                
                .amax-message.bot {
                    align-items: flex-start !important;
                }
                
                .message-content {
                    max-width: 70% !important;
                    padding: 15px 18px !important;
                    border-radius: 16px !important;
                    font-size: 14px !important;
                    line-height: 1.5 !important;
                    word-wrap: break-word !important;
                }
                
                .amax-message.user .message-content {
                    background: #DC143C !important;
                    color: white !important;
                    border-bottom-right-radius: 4px !important;
                }
                
                .amax-message.bot .message-content {
                    background: #f1f5f9 !important;
                    color: #374151 !important;
                    border-bottom-left-radius: 4px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                
                .chart-container {
                    margin: 15px 0 !important;
                    padding: 20px !important;
                    background: white !important;
                    border-radius: 12px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                }
                
                .chart-container img {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 8px !important;
                }
                
                .amax-input-area {
                    padding: 20px !important;
                    border-top: 1px solid #e2e8f0 !important;
                    background: #f8fafc !important;
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
                    font-family: 'Inter', sans-serif !important;
                    outline: none !important;
                    transition: all 0.2s !important;
                    background: white !important;
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
                    transition: all 0.2s !important;
                    width: 45px !important;
                    height: 45px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 16px !important;
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
                    background: #f1f5f9 !important;
                    border-radius: 16px !important;
                    border-bottom-left-radius: 4px !important;
                    max-width: 100px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                
                .dot {
                    width: 6px !important;
                    height: 6px !important;
                    background: #9ca3af !important;
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
                    <img src="${CONFIG.logoUrl}" alt="AMAX BI Assistant" onerror="this.style.display='none'; this.parentNode.innerHTML='A'; this.parentNode.style.fontSize='24px'; this.parentNode.style.fontWeight='bold'; this.parentNode.style.color='white';">
                </div>
                <div class="amax-chat-container" id="amaxChat">
                    <div class="amax-header">
                        <div class="logo">
                            <img src="${CONFIG.logoUrl}" alt="AMAX" onerror="this.style.display='none';">
                            <h2>AMAX BI Assistant</h2>
                        </div>
                        <button class="amax-close" id="amaxClose">×</button>
                    </div>
                    <div class="amax-main">
                        <div class="amax-sidebar">
                            <div class="sidebar-section">
                                <h3>Quick Questions</h3>
                                <div id="amaxQuickQuestions"></div>
                                <button class="random-btn" id="randomBtn">🎲 Smart Question</button>
                                <div class="disclaimer">*AI-generated specific queries</div>
                            </div>
                            <div class="history-section">
                                <h3>History</h3>
                                <div class="history-container" id="amaxChatHistory"></div>
                            </div>
                        </div>
                        <div class="amax-chat-area">
                            <div class="amax-messages" id="amaxMessages">
                                <div class="amax-message bot">
                                    <div class="message-content">
                                        👋 Hello! I'm Anna, your AMAX BI Assistant. I can help you analyze business data, generate reports, and answer questions about policies, claims, and performance metrics. What would you like to know?
                                    </div>
                                </div>
                            </div>
                            <div class="amax-input-area">
                                <div class="amax-input-container">
                                    <input type="text" class="amax-input" id="amaxInput" placeholder="Ask me about AMAX business insights...">
                                    <button class="amax-send" id="amaxSend">➤</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
            console.log('🎨 Widget DOM created');
            
            // Verify button exists
            setTimeout(() => {
                const btn = document.getElementById('amaxWidgetBtn');
                if (btn) {
                    console.log('✅ Widget button confirmed in DOM');
                } else {
                    console.error('❌ Widget button NOT found in DOM');
                }
            }, 100);
        }
        
        setupEventListeners() {
            const widgetBtn = document.getElementById('amaxWidgetBtn');
            const chatContainer = document.getElementById('amaxChat');
            const closeBtn = document.getElementById('amaxClose');
            const sendBtn = document.getElementById('amaxSend');
            const input = document.getElementById('amaxInput');
            const randomBtn = document.getElementById('randomBtn');
            
            if (widgetBtn) {
                widgetBtn.addEventListener('click', () => {
                    console.log('🖱️ Widget button clicked');
                    this.openWidget();
                });
                console.log('✅ Widget button event listener attached');
            } else {
                console.error('❌ Widget button not found for event listener');
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeWidget());
            }
            
            if (sendBtn) {
                sendBtn.addEventListener('click', () => this.sendMessage());
            }
            
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
            
            if (randomBtn) {
                randomBtn.addEventListener('click', () => this.generateRandomQuestion());
            }
        }
        
        populateQuickQuestions() {
            const container = document.getElementById('amaxQuickQuestions');
            if (container) {
                this.quickQuestions.forEach(question => {
                    const btn = document.createElement('button');
                    btn.className = 'quick-btn';
                    btn.textContent = question;
                    btn.addEventListener('click', () => this.sendQuickQuestion(question));
                    container.appendChild(btn);
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
                const response = await this.callWebhook(message);
                this.hideTypingIndicator();
                
                const chartImage = await this.chartProcessor.processChart(response);
                
                if (chartImage) {
                    this.addChartMessage(response, chartImage);
                } else {
                    this.addMessage('bot', response);
                }
                
                this.sessionManager.addToHistory('user', message);
                this.sessionManager.addToHistory('assistant', response);
                this.updateHistory();
                
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessage('bot', 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.');
                console.error('Webhook error:', error);
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
            
            console.log('📤 Sending to webhook:', payload);
            
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
            console.log('📥 Webhook response received');
            return result;
        }
        
        sendQuickQuestion(question) {
            document.getElementById('amaxInput').value = question;
            this.sendMessage();
        }
        
        generateRandomQuestion() {
            const randomQuestions = [
                "What was our total premium collection last month?",
                "Show me the top 5 agents by policies sold",
                "How many claims were processed this week?",
                "Compare our renewal rates vs industry average",
                "What's the average processing time for auto claims?",
                "Show me quarterly revenue trends",
                "Which product lines have the highest profit margins?",
                "How many new policies were issued this quarter?"
            ];
            
            const randomQuestion = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];
            document.getElementById('amaxInput').value = randomQuestion;
            this.sendMessage();
        }
        
        addMessage(sender, content) {
            const messagesContainer = document.getElementById('amaxMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `amax-message ${sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = content.replace(/\n/g, '<br>');
            
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        addChartMessage(response, chartImage) {
            const messagesContainer = document.getElementById('amaxMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'amax-message bot';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            const cleanResponse = response.replace(/\{[\s\S]*?\$schema[\s\S]*?\}/g, '').trim();
            
            contentDiv.innerHTML = `
                ${cleanResponse.replace(/\n/g, '<br>')}
                <div class="chart-container">
                    <img src="${chartImage}" alt="Data Visualization">
                </div>
            `;
            
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
        
        updateHistory() {
            const historyContainer = document.getElementById('amaxChatHistory');
            if (historyContainer) {
                historyContainer.innerHTML = '';
                
                const recentHistory = this.sessionManager.conversationHistory
                    .filter(item => item.role === 'user')
                    .slice(-10)
                    .reverse();
                
                recentHistory.forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.textContent = item.content.substring(0, 60) + (item.content.length > 60 ? '...' : '');
                    historyItem.addEventListener('click', () => {
                        document.getElementById('amaxInput').value = item.content;
                    });
                    historyContainer.appendChild(historyItem);
                });
            }
        }
    }

    // ========================================
    // INITIALIZATION WITH ALL FEATURES
    // ========================================
    
    async function initializeWidget() {
        try {
            console.log('🚀 Starting AMAX Widget initialization...');
            
            const auth = new JWTAuth();
            const authResult = await auth.authenticateUser();
            
            if (!authResult) {
                console.error('❌ Authentication failed');
                return;
            }
            
            const sessionManager = new SessionManager(auth);
            const chartProcessor = new ChartProcessor();
            const widgetUI = new WidgetUI(sessionManager, chartProcessor);
            
            // Make globally accessible
            window.widgetUI = widgetUI;
            window.openWidget = () => widgetUI.openWidget();
            window.closeWidget = () => widgetUI.closeWidget();
            
            console.log('✅ AMAX Widget initialized successfully with ALL features!');
            
        } catch (error) {
            console.error('❌ Widget initialization error:', error);
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
        initializeWidget();
    }

    console.log('📋 AMAX Widget script loaded - ALL features included');

})();
