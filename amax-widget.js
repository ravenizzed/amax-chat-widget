// ========================================
// AMAX WIDGET WITH RESPONSE DISPLAY
// Version 2.2.0 - Fixed response formatting
// ========================================

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================
    const CONFIG = {
        version: '2.2.0', // Updated for response display
        webhookUrl: 'https://amax-chat-widget.vercel.app/api/webhook',
        
        // Security Configuration
        adminPassword: btoa('Amax@genBi25'),
        protectedPorts: ['3000', '5678'],
        
        // User Authentication
        defaultUser: {
            id: 'ufarooq',
            email: 'ufarooq@amaxinsurance.com',
            role: 'HOD',
            name: 'Umair Farooq'
        },
        
        // Widget Configuration
        widgetConfig: {
            width: 900,
            height: 750,
            position: 'bottom-right',
            logoUrl: './assets/amax-logo-A.png',
            title: 'AMAX BI Assistant',
            subtitle: 'Business Intelligence Chat'
        },
        
        // Random Questions
        randomQuestions: [
            "What are our top 5 performing insurance products this quarter?",
            "Show me the claims trend for the last 6 months",
            "Which regions have the highest customer satisfaction?",
            "What is our current loss ratio compared to industry average?",
            "Show me new policy acquisitions by month",
            "What are the most common claim types this year?",
            "Compare our premium growth year over year",
            "Which insurance products have the lowest claims?",
            "Show me customer retention rates by policy type",
            "What is our average claim processing time?"
        ]
    };

    console.log('🚀 AMAX Widget loading - Beautiful Display v' + CONFIG.version);

    // ========================================
    // AUTHENTICATION CLASSES (unchanged)
    // ========================================
    class JWTAuth {
        constructor() {
            console.log('🔐 JWT Auth system initialized');
        }

        async authenticateUser() {
            console.log('🔍 Starting user authentication process...');
            
            if (this.isProtectedPortAccess()) {
                if (!this.handleProtectedAccess()) {
                    return false;
                }
            }

            let user = this.extractUserFromParent() || 
                      this.extractUserFromDomain() || 
                      this.getGuestUser();

            const token = await this.generateJWT(user);
            
            if (token) {
                this.currentUser = user;
                this.currentToken = token;
                console.log('✅ JWT generated for:', user.email, 'Role:', user.role);
                return true;
            }
            
            return false;
        }

        isProtectedPortAccess() {
            const currentPort = window.location.port;
            const currentHost = window.location.hostname;
            
            return CONFIG.protectedPorts.includes(currentPort) && 
                   (currentHost.includes('3.239.79.74') || currentHost.includes('localhost'));
        }

        handleProtectedAccess() {
            const savedAuth = localStorage.getItem('amax_admin_auth');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(atob(savedAuth));
                    if (authData.authenticated && Date.now() < authData.expires) {
                        console.log('✅ Valid admin session found');
                        return true;
                    }
                } catch (e) {
                    localStorage.removeItem('amax_admin_auth');
                }
            }

            const password = prompt('🔐 Enter admin password to access AMAX services:');
            if (!password) {
                this.showAccessDeniedPage();
                return false;
            }

            if (btoa(password) === CONFIG.adminPassword) {
                const authToken = btoa(JSON.stringify({
                    authenticated: true,
                    timestamp: Date.now(),
                    expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
                }));
                localStorage.setItem('amax_admin_auth', authToken);
                console.log('✅ Admin authentication successful - unlimited session');
                return true;
            } else {
                this.showAccessDeniedPage();
                return false;
            }
        }

        showAccessDeniedPage() {
            document.body.innerHTML = `
                <div style="
                    padding: 60px 40px;
                    text-align: center;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background: #f8fafc;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                        max-width: 500px;
                        width: 100%;
                    ">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: #fee;
                            border-radius: 50%;
                            margin: 0 auto 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                        ">🔒</div>
                        <h1 style="color: #DC143C; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Access Denied</h1>
                        <p style="color: #64748b; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">Authentication required to access AMAX services.</p>
                        <button onclick="location.reload()" style="
                            background: #DC143C; color: white; border: none; padding: 12px 24px;
                            border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
                        ">Try Again</button>
                    </div>
                </div>
            `;
        }

        extractUserFromParent() {
            try {
                if (window.parent && window.parent !== window) {
                    const parentUser = window.parent.getCurrentUser?.();
                    if (parentUser && parentUser.email?.includes('@amaxinsurance.com')) {
                        return parentUser;
                    }
                }
            } catch (e) {
                console.log('Could not access parent window user');
            }
            return null;
        }

        extractUserFromDomain() {
            const hostname = window.location.hostname;
            if (hostname.includes('maxbi.amaxinsurance.com') || 
                hostname.includes('amaxinsurance.com')) {
                return CONFIG.defaultUser;
            }
            return null;
        }

        getGuestUser() {
            console.log('⚠️ No user authentication found, using guest user');
            return {
                id: 'guest',
                email: 'guest@amaxinsurance.com',
                role: 'EMPLOYEE',
                name: 'Guest User'
            };
        }

        async generateJWT(user) {
            const payload = {
                sub: user.id || user.email,
                email: user.email,
                role: user.role,
                name: user.name || user.email.split('@')[0],
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
                iss: 'amax-widget'
            };

            return btoa(JSON.stringify(payload));
        }

        getCurrentUser() {
            return this.currentUser;
        }

        getAuthToken() {
            return this.currentToken;
        }
    }

    // ========================================
    // SESSION MANAGER (unchanged)
    // ========================================
    class SessionManager {
        constructor(auth) {
            this.auth = auth;
            this.sessionData = this.loadOrCreateSession();
            console.log('📊 Session data:', this.sessionData);
            console.log('📝 Session Manager initialized');
        }

        loadOrCreateSession() {
            const user = this.auth.getCurrentUser();
            const now = Date.now();
            
            const sessionKey = `amax_session_${user.email}`;
            const existingSession = localStorage.getItem(sessionKey);
            
            if (existingSession) {
                try {
                    const session = JSON.parse(existingSession);
                    if (session.userEmail === user.email) {
                        console.log('✅ Using existing session:', session.sessionId.substring(0, 15) + '...');
                        
                        const threadKey = `amax_thread_${session.sessionId}`;
                        const existingThread = localStorage.getItem(threadKey);
                        if (existingThread) {
                            const thread = JSON.parse(existingThread);
                            console.log('✅ Using existing thread:', thread.threadId.substring(0, 15) + '...');
                            
                            const historyKey = `amax_history_${thread.threadId}`;
                            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
                            console.log('📚 Loaded conversation history:', history.length, 'items');
                            
                            return {
                                sessionId: session.sessionId,
                                threadId: thread.threadId,
                                userEmail: user.email,
                                userRole: user.role,
                                userName: user.name,
                                timestamp: now,
                                conversationHistory: history
                            };
                        }
                    }
                } catch (e) {
                    console.log('Invalid session found, creating new one');
                }
            }
            
            const sessionId = `amax_${now}`;
            const threadId = `thread_${now}`;
            
            const newSession = {
                sessionId, threadId,
                userEmail: user.email, userRole: user.role, userName: user.name,
                timestamp: now, conversationHistory: []
            };
            
            localStorage.setItem(sessionKey, JSON.stringify({
                sessionId, userEmail: user.email, timestamp: now
            }));
            localStorage.setItem(`amax_thread_${sessionId}`, JSON.stringify({
                threadId, sessionId, timestamp: now
            }));
            localStorage.setItem(`amax_history_${threadId}`, JSON.stringify([]));
            
            return newSession;
        }

        getSessionData() { return this.sessionData; }
        addToHistory(role, content) {
            const historyItem = { role, content, timestamp: Date.now() };
            this.sessionData.conversationHistory.push(historyItem);
            const historyKey = `amax_history_${this.sessionData.threadId}`;
            localStorage.setItem(historyKey, JSON.stringify(this.sessionData.conversationHistory));
        }
        getHistory() { return this.sessionData.conversationHistory || []; }
    }

    // ========================================
    // ENHANCED RESPONSE PARSER FOR YOUR WEBHOOK
    // ========================================
    class ResponseParser {
        static parseResponse(rawResponse) {
            try {
                console.log('📥 Parsing webhook response...');
                
                // Parse the JSON response from your webhook
                let data;
                if (typeof rawResponse === 'string') {
                    data = JSON.parse(rawResponse);
                } else {
                    data = rawResponse;
                }

                console.log('📊 Parsed data structure:', Object.keys(data));

                // Your webhook returns: status, question, sql, completed_at, sessionid, threadid, agentanalysis, chart_data
                return {
                    status: data.status,
                    question: data.question,
                    sql: data.sql,
                    completedAt: data.completed_at,
                    sessionId: data.sessionid,
                    threadId: data.threadid,
                    analysis: data.agentanalysis,
                    chartData: data.chart_data,
                    // For backward compatibility
                    response: data.agentanalysis,
                    chart_specification: data.chart_data
                };
            } catch (error) {
                console.error('❌ Response parsing error:', error);
                return {
                    response: 'Error parsing response',
                    error: true
                };
            }
        }
    }

    // ========================================
    // UPDATED ANALYSIS FORMATTER - FOR NEW RESPONSE FORMAT
    // ========================================
    class AnalysisFormatter {
        static formatAnalysis(analysisText) {
            if (!analysisText) return '';

            // Remove emojis and clean up the text
            let cleanedText = analysisText
                .replace(/🎯|🔍|💡|📊|✨|🚀|💼|📈|📉|🎨/g, '')
                .trim();

            // Split into sections
            const sections = cleanedText.split(/\n\n+/);
            let formattedHTML = '';

            sections.forEach(section => {
                section = section.trim();
                if (!section) return;

                // Check for ANSWER section
                if (section.includes('ANSWER:')) {
                    const content = section.replace(/ANSWER:?/i, '').trim();
                    formattedHTML += `
                        <div class="analysis-section direct-answer">
                            <div class="section-header">
                                <span class="section-icon">🎯</span>
                                <span class="section-title">DIRECT ANSWER</span>
                            </div>
                            <div class="section-content answer-content">${this.formatText(content)}</div>
                        </div>
                    `;
                }
                // Check for KEY INSIGHTS section
                else if (section.includes('KEY INSIGHTS:')) {
                    const content = section.replace(/KEY INSIGHTS:?/i, '').trim();
                    formattedHTML += `
                        <div class="analysis-section key-insights">
                            <div class="section-header">
                                <span class="section-icon">💡</span>
                                <span class="section-title">KEY INSIGHTS</span>
                            </div>
                            <div class="section-content insights-content">${this.formatInsights(content)}</div>
                        </div>
                    `;
                }
                // Check for FINCH'S TAKE section
                else if (section.includes("FINCH'S TAKE:")) {
                    const content = section.replace(/FINCH'S TAKE:?/i, '').trim();
                    formattedHTML += `
                        <div class="analysis-section finch-opinion">
                            <div class="section-header">
                                <span class="section-icon">🧠</span>
                                <span class="section-title">FINCH'S TAKE</span>
                            </div>
                            <div class="section-content opinion-content">${this.formatText(content)}</div>
                        </div>
                    `;
                }
                // Regular paragraph
                else {
                    formattedHTML += `<p class="analysis-paragraph">${this.formatText(section)}</p>`;
                }
            });

            return formattedHTML;
        }

        static formatText(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }

        static formatInsights(text) {
            // Handle bullet points in insights
            return text
                .replace(/•\s*(.*?)(?=\n|$)/g, '<div class="insight-bullet">• $1</div>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }
    }

    // ========================================
    // MAIN WIDGET UI - WITH BEAUTIFUL DISPLAY
    // ========================================
    class WidgetUI {
        constructor(sessionManager) {
            this.sessionManager = sessionManager;
            this.isOpen = false;
            this.processing = false;
            
            this.createWidget();
            this.setupEventListeners();
            console.log('✅ Widget UI setup complete');
        }

        createWidget() {
            this.injectStyles();
            console.log('🎨 Widget styles injected');
            
            this.createWidgetDOM();
            console.log('🎨 Creating widget DOM with logo:', CONFIG.widgetConfig.logoUrl);
            
            this.populateRandomQuestions();
            console.log('✅ Widget DOM created');
        }

        injectStyles() {
            const styles = `
                /* Enhanced typography and spacing */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }
                
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
                    z-index: 999998 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    box-shadow: 0 8px 32px rgba(220, 20, 60, 0.4) !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    pointer-events: auto !important;
                    user-select: none !important;
                }
                
                .amax-widget-button:hover {
                    transform: translateY(-3px) scale(1.05) !important;
                    box-shadow: 0 12px 40px rgba(220, 20, 60, 0.6) !important;
                }
                
                .amax-widget-button.widget-open {
                    display: none !important;
                }
                
                .amax-widget-button img {
                    width: 36px !important;
                    height: 36px !important;
                    object-fit: contain !important;
                    border-radius: 6px !important;
                    background: white !important;
                    padding: 4px !important;
                    pointer-events: none !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                }
                
                .amax-widget-button.no-logo {
                    color: white !important;
                    font-size: 24px !important;
                    font-weight: 600 !important;
                }
                
                /* Chat container */
                .amax-chat-container {
                    position: fixed !important;
                    bottom: 25px !important;
                    right: 25px !important;
                    width: ${CONFIG.widgetConfig.width}px !important;
                    height: ${CONFIG.widgetConfig.height}px !important;
                    background: white !important;
                    border-radius: 20px !important;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25) !important;
                    z-index: 999999 !important;
                    display: none !important;
                    flex-direction: column !important;
                    overflow: hidden !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    transform: translateY(20px) scale(0.95) !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                
                .amax-chat-container.widget-visible {
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    transform: translateY(0) scale(1) !important;
                }
                
                .amax-header {
                    background: linear-gradient(135deg, #DC143C 0%, #B91C1C 100%) !important;
                    color: white !important;
                    padding: 20px 24px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    border-radius: 20px 20px 0 0 !important;
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
                    letter-spacing: -0.3px !important;
                }
                
                .amax-close {
                    background: none !important;
                    border: none !important;
                    color: white !important;
                    font-size: 24px !important;
                    cursor: pointer !important;
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                    opacity: 0.8 !important;
                }
                
                .amax-close:hover {
                    background: rgba(255, 255, 255, 0.2) !important;
                    opacity: 1 !important;
                }
                
                .amax-main {
                    display: flex !important;
                    height: 100% !important;
                    min-height: 0 !important;
                }
                
                .amax-sidebar {
                    width: 280px !important;
                    background: #fafbfc !important;
                    border-right: 1px solid #e5e7eb !important;
                    padding: 20px !important;
                    overflow-y: auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                
                .amax-sidebar h3 {
                    margin: 0 0 12px 0 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #6b7280 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.6px !important;
                }
                
                .random-question-btn {
                    margin-bottom: 16px !important;
                    padding: 12px 16px !important;
                    background: #DC143C !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 8px !important;
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    letter-spacing: -0.2px !important;
                }
                
                .random-question-btn:hover {
                    background: #B91C1C !important;
                    transform: translateY(-1px) !important;
                }
                
                .quick-btn {
                    display: block !important;
                    width: 100% !important;
                    padding: 10px 12px !important;
                    margin: 4px 0 !important;
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 6px !important;
                    font-size: 12px !important;
                    color: #374151 !important;
                    cursor: pointer !important;
                    text-align: left !important;
                    transition: all 0.2s !important;
                    line-height: 1.5 !important;
                    font-weight: 400 !important;
                }
                
                .quick-btn:hover {
                    background: #f9fafb !important;
                    border-color: #DC143C !important;
                    transform: translateX(2px) !important;
                }
                
                .history-container {
                    flex: 1 !important;
                    min-height: 0 !important;
                    overflow-y: auto !important;
                }
                
                .history-item {
                    display: block !important;
                    width: 100% !important;
                    padding: 8px 12px !important;
                    margin: 3px 0 !important;
                    background: #f8f9fa !important;
                    border: 1px solid #e9ecef !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                    color: #495057 !important;
                    cursor: pointer !important;
                    text-align: left !important;
                    transition: all 0.2s !important;
                    line-height: 1.4 !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                }
                
                .history-item:hover {
                    background: #e9ecef !important;
                    border-color: #adb5bd !important;
                }
                
                .amax-chat {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    background: white !important;
                }
                
                .amax-messages {
                    flex: 1 !important;
                    padding: 24px !important;
                    overflow-y: auto !important;
                    background: #ffffff !important;
                }
                
                .message {
                    margin-bottom: 20px !important;
                    animation: fadeIn 0.3s ease-out !important;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .message.user {
                    text-align: right !important;
                }
                
                .message.user .message-content {
                    background: #DC143C !important;
                    color: white !important;
                    margin-left: auto !important;
                }
                
                .message.bot .message-content {
                    background: #f8fafc !important;
                    color: #1f2937 !important;
                    border: 1px solid #e5e7eb !important;
                }
                
                .message-content {
                    display: inline-block !important;
                    padding: 16px 20px !important;
                    border-radius: 16px !important;
                    max-width: 85% !important;
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                    font-weight: 400 !important;
                    letter-spacing: -0.1px !important;
                    word-wrap: break-word !important;
                }
                
                /* Beautiful Analysis Display Styles */
                .analysis-container {
                    padding: 0 !important;
                }
                
                .analysis-section {
                    margin: 8px 0 !important;
                    padding: 10px 12px !important;
                    border-radius: 8px !important;
                    border: 1px solid !important;
                    transition: all 0.2s !important;
                }
                
                .analysis-section:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
                }
                
                .section-header {
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    margin-bottom: 6px !important;
                }
                
                .section-icon {
                    font-size: 14px !important;
                }
                
                .section-title {
                    font-size: 10px !important;
                    font-weight: 600 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                }
                
                .section-content {
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                    color: #374151 !important;
                }

                /* Direct Answer Section */
                .direct-answer {
                    background: #f0f9ff !important;
                    border-color: #0ea5e9 !important;
                    border-left: 3px solid #0ea5e9 !important;
                }

                .direct-answer .section-title {
                    color: #0c4a6e !important;
                }

                .answer-content {
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    color: #0c4a6e !important;
                    background: #e0f2fe !important;
                    padding: 8px 10px !important;
                    border-radius: 6px !important;
                    margin-top: 4px !important;
                }

                /* Key Insights Section */
                .key-insights {
                    background: #fef3c7 !important;
                    border-color: #f59e0b !important;
                    border-left: 3px solid #eab308 !important;
                }

                .key-insights .section-title {
                    color: #a16207 !important;
                }

                .insights-content {
                    margin-top: 8px !important;
                }

                .insight-bullet {
                    margin: 3px 0 !important;
                    padding-left: 4px !important;
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                    color: #374151 !important;
                }

                /* Finch's Opinion Section */
                .finch-opinion {
                    background: #faf5ff !important;
                    border-color: #a855f7 !important;
                    border-left: 3px solid #a855f7 !important;
                }

                .finch-opinion .section-title {
                    color: #6b21a8 !important;
                }

                .opinion-content {
                    font-style: italic !important;
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                    color: #374151 !important;
                    background: #f3e8ff !important;
                    padding: 6px 8px !important;
                    border-radius: 4px !important;
                    margin-top: 4px !important;
                }
                
                .analysis-paragraph {
                    margin: 6px 0 !important;
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                    color: #374151 !important;
                }
                
                .metadata-toggle {
                    margin-top: 16px !important;
                    padding-top: 16px !important;
                    border-top: 1px solid #e5e7eb !important;
                    text-align: center !important;
                }
                
                .metadata-button {
                    background: none !important;
                    border: 1px solid #e5e7eb !important;
                    padding: 6px 12px !important;
                    border-radius: 6px !important;
                    cursor: pointer !important;
                    font-size: 11px !important;
                    color: #6b7280 !important;
                    transition: all 0.2s !important;
                }
                
                .metadata-button:hover {
                    background: #f9fafb !important;
                    border-color: #d1d5db !important;
                }
                
                .metadata-content {
                    display: none !important;
                    margin-top: 12px !important;
                    padding: 12px !important;
                    background: #f9fafb !important;
                    border-radius: 8px !important;
                    font-size: 11px !important;
                    color: #6b7280 !important;
                    text-align: left !important;
                }
                
                .metadata-content.show {
                    display: block !important;
                }
                
                .metadata-item {
                    margin: 6px 0 !important;
                    line-height: 1.4 !important;
                }
                
                .metadata-label {
                    font-weight: 600 !important;
                    color: #4b5563 !important;
                }
                
                .sql-query {
                    margin-top: 8px !important;
                    padding: 8px !important;
                    background: #1f2937 !important;
                    color: #f9fafb !important;
                    border-radius: 6px !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 10px !important;
                    overflow-x: auto !important;
                    white-space: pre-wrap !important;
                    word-break: break-all !important;
                }
                
                .amax-input-area {
                    padding: 20px 24px !important;
                    border-top: 1px solid #e5e7eb !important;
                    background: white !important;
                    border-radius: 0 0 20px 20px !important;
                }
                
                .amax-input-container {
                    position: relative !important;
                    display: flex !important;
                    align-items: flex-end !important;
                    gap: 12px !important;
                }
                
                .amax-input {
                    flex: 1 !important;
                    padding: 14px 18px !important;
                    border: 1px solid #d1d5db !important;
                    border-radius: 12px !important;
                    font-size: 14px !important;
                    resize: none !important;
                    outline: none !important;
                    transition: all 0.2s !important;
                    min-height: 44px !important;
                    max-height: 120px !important;
                    overflow-y: auto !important;
                    line-height: 1.5 !important;
                    letter-spacing: -0.05px !important;
                }
                
                .amax-input:focus {
                    border-color: #DC143C !important;
                    box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1) !important;
                }
                
                .amax-send {
                    padding: 12px 20px !important;
                    background: #DC143C !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 12px !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    letter-spacing: -0.1px !important;
                    min-width: 70px !important;
                }
                
                .amax-send:hover:not(:disabled) {
                    background: #B91C1C !important;
                    transform: translateY(-1px) !important;
                }
                
                .amax-send:disabled {
                    opacity: 0.6 !important;
                    cursor: not-allowed !important;
                }
                
                .typing-indicator {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    padding: 14px 18px !important;
                    background: #f8fafc !important;
                    border-radius: 16px !important;
                    max-width: 80px !important;
                    margin-bottom: 20px !important;
                }
                
                .typing-dot {
                    width: 6px !important;
                    height: 6px !important;
                    background: #9ca3af !important;
                    border-radius: 50% !important;
                    animation: typingPulse 1.4s ease-in-out infinite !important;
                }
                
                .typing-dot:nth-child(2) { animation-delay: 0.2s !important; }
                .typing-dot:nth-child(3) { animation-delay: 0.4s !important; }
                
                @keyframes typingPulse {
                    0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
                    30% { opacity: 1; transform: scale(1.2); }
                }

                /* Chart Container Styles */
                .chart-container {
                    margin: 16px 0 !important;
                    padding: 20px !important;
                    background: white !important;
                    border-radius: 12px !important;
                    border: 1px solid #e1e8ed !important;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
                    transition: all 0.3s ease !important;
                }
                .chart-container:hover {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
                }
                .chart-title {
                    font-weight: 500 !important;
                    margin-bottom: 10px !important;
                    color: #1f4e79 !important;
                    font-size: 14px !important;
                    text-align: center !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding-bottom: 6px !important;
                }
                .vega-chart {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    min-height: 250px !important;
                    border-radius: 6px !important;
                    background: #fafbfc !important;
                }
                .vega-chart canvas, .vega-chart svg {
                    border-radius: 8px !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                    max-width: 100% !important;
                    height: auto !important;
                }
                .vega-chart .loading {
                    color: #6c757d !important;
                    font-style: italic !important;
                    text-align: center !important;
                }
                .vega-chart .error {
                    color: #dc3545 !important;
                    text-align: center !important;
                    padding: 20px !important;
                    background: #f8d7da !important;
                    border-radius: 8px !important;
                    border: 1px solid #f5c6cb !important;
                }
                
                /* Timestamp style */
                .message-timestamp {
                    font-size: 10px !important;
                    color: #9ca3af !important;
                    margin-top: 4px !important;
                    font-style: italic !important;
                }
            `;

            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }

        createWidgetDOM() {
            // Create widget button
            const widgetButton = document.createElement('button');
            widgetButton.id = 'amaxWidgetBtn';
            widgetButton.className = 'amax-widget-button';
            widgetButton.setAttribute('type', 'button');
            widgetButton.innerHTML = `
                <img src="${CONFIG.widgetConfig.logoUrl}" 
                     alt="AMAX" 
                     onerror="this.style.display='none'; this.parentNode.classList.add('no-logo'); this.parentNode.innerHTML='A';">
            `;
            document.body.appendChild(widgetButton);

            // Create chat container
            const chatContainer = document.createElement('div');
            chatContainer.id = 'amaxChat';
            chatContainer.className = 'amax-chat-container';
            chatContainer.innerHTML = `
                <div class="amax-header">
                    <div class="logo">
                        <img src="${CONFIG.widgetConfig.logoUrl}" alt="AMAX" onerror="this.style.display='none';">
                        <div><h2>${CONFIG.widgetConfig.title}</h2></div>
                    </div>
                    <button class="amax-close" id="amaxClose">&times;</button>
                </div>
                <div class="amax-main">
                    <div class="amax-sidebar">
                        <button class="random-question-btn" id="randomQuestionBtn">🎲 Random Question</button>
                        <h3>Quick Questions</h3>
                        <div id="quickQuestions"></div>
                        <h3 style="margin-top: 20px;">History</h3>
                        <div class="history-container" id="historyContainer"></div>
                    </div>
                    <div class="amax-chat">
                        <div class="amax-messages" id="amaxMessages">
                            <div class="message bot">
                                <div class="message-content">
                                    Hi! I'm Anna, your AMAX BI Assistant. I can help you with business intelligence queries, data analysis, and generating insights from your insurance data. What would you like to know?
                                </div>
                            </div>
                        </div>
                        <div class="amax-input-area">
                            <div class="amax-input-container">
                                <textarea id="amaxInput" class="amax-input" placeholder="Ask me about your business data..." rows="1"></textarea>
                                <button id="amaxSend" class="amax-send">Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(chatContainer);

            console.log('✅ Widget DOM created');
        }

        setupEventListeners() {
            console.log('🔗 Setting up widget event listeners...');

            const widgetButton = document.getElementById('amaxWidgetBtn');
            const chatContainer = document.getElementById('amaxChat');
            const closeButton = document.getElementById('amaxClose');
            const sendButton = document.getElementById('amaxSend');
            const inputField = document.getElementById('amaxInput');
            const randomQuestionBtn = document.getElementById('randomQuestionBtn');

            if (widgetButton) {
                widgetButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔘 Widget button clicked');
                    this.openWidget();
                });
            }

            if (closeButton) {
                closeButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeWidget();
                });
            }

            if (sendButton && inputField) {
                sendButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.sendMessage();
                });

                inputField.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });

                inputField.addEventListener('input', () => {
                    inputField.style.height = 'auto';
                    inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
                });
            }

            if (randomQuestionBtn) {
                randomQuestionBtn.addEventListener('click', () => {
                    this.generateRandomQuestion();
                });
            }

            console.log('✅ All widget event listeners setup complete');
        }

        populateRandomQuestions() {
            const container = document.getElementById('quickQuestions');
            if (!container) return;

            const questionsToShow = CONFIG.randomQuestions.slice(0, 5);
            
            container.innerHTML = questionsToShow.map(question => 
                `<button class="quick-btn" onclick="window.widgetUI.askQuestion('${question.replace(/'/g, "\\'")}')">${question}</button>`
            ).join('');

            console.log('✅ Quick questions populated:', questionsToShow.length);
        }

        generateRandomQuestion() {
            const randomIndex = Math.floor(Math.random() * CONFIG.randomQuestions.length);
            const randomQuestion = CONFIG.randomQuestions[randomIndex];
            
            const inputField = document.getElementById('amaxInput');
            if (inputField) {
                inputField.value = randomQuestion;
                inputField.focus();
                inputField.style.height = 'auto';
                inputField.style.height = inputField.scrollHeight + 'px';
            }
        }

        askQuestion(question) {
            const inputField = document.getElementById('amaxInput');
            if (inputField) {
                inputField.value = question;
                this.sendMessage();
            }
        }

        openWidget() {
            console.log('🚀 Opening widget');
            const widgetButton = document.getElementById('amaxWidgetBtn');
            const chatContainer = document.getElementById('amaxChat');
            
            if (widgetButton && chatContainer) {
                widgetButton.classList.add('widget-open');
                chatContainer.classList.add('widget-visible');
                chatContainer.style.display = 'flex';
                chatContainer.style.visibility = 'visible';
                chatContainer.style.opacity = '1';
                chatContainer.style.transform = 'translateY(0) scale(1)';
                chatContainer.style.pointerEvents = 'auto';
                chatContainer.style.zIndex = '999999999';
                
                this.isOpen = true;
                
                setTimeout(() => {
                    const inputField = document.getElementById('amaxInput');
                    if (inputField) inputField.focus();
                }, 100);
                
                console.log('✅ Widget opened successfully');
            }
        }

        closeWidget() {
            const widgetButton = document.getElementById('amaxWidgetBtn');
            const chatContainer = document.getElementById('amaxChat');
            
            if (widgetButton && chatContainer) {
                widgetButton.classList.remove('widget-open');
                chatContainer.classList.remove('widget-visible');
                chatContainer.style.display = 'none';
                chatContainer.style.visibility = 'hidden';
                chatContainer.style.opacity = '0';
                this.isOpen = false;
                console.log('✅ Widget closed');
            }
        }

        showTypingIndicator() {
            const messagesContainer = document.getElementById('amaxMessages');
            if (messagesContainer) {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message bot';
                typingDiv.id = 'typingIndicator';
                typingDiv.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
                messagesContainer.appendChild(typingDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        hideTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();
        }

        // Enhanced message display for beautiful formatting
        addMessage(role, content, data = null) {
            const messagesContainer = document.getElementById('amaxMessages');
            if (!messagesContainer) return;

            if (role === 'bot' && data) {
                // Create a beautiful response with analysis and metadata
                this.createBeautifulResponse(data);
            } else {
                // Regular message display
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${role}`;
                messageDiv.innerHTML = `<div class="message-content">${this.formatMessage(content)}</div>`;
                messagesContainer.appendChild(messageDiv);
            }
            
            this.scrollToBottom();
        }

        createBeautifulResponse(data) {
            const messagesContainer = document.getElementById('amaxMessages');
            if (!messagesContainer) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot';
            
            // Format the analysis with beautiful sections
            const formattedAnalysis = AnalysisFormatter.formatAnalysis(data.analysis);
            
            // Create the message content with metadata toggle
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="analysis-container">
                        ${formattedAnalysis}
                    </div>
                    ${this.createMetadataToggle(data)}
                </div>
                ${data.completedAt ? `<div class="message-timestamp">${this.formatTimestamp(data.completedAt)}</div>` : ''}
            `;
            
            messagesContainer.appendChild(messageDiv);
            
            // Add click handler for metadata toggle
            const metadataBtn = messageDiv.querySelector('.metadata-button');
            if (metadataBtn) {
                metadataBtn.addEventListener('click', () => {
                    const metadataContent = messageDiv.querySelector('.metadata-content');
                    metadataContent.classList.toggle('show');
                    metadataBtn.textContent = metadataContent.classList.contains('show') 
                        ? '🔽 Hide Details' 
                        : '🔼 View Details';
                });
            }
        }

        createMetadataToggle(data) {
            return `
                <div class="metadata-toggle">
                    <button class="metadata-button">🔼 View Details</button>
                    <div class="metadata-content">
                        ${data.sessionId ? `<div class="metadata-item"><span class="metadata-label">Session:</span> ${data.sessionId}</div>` : ''}
                        ${data.threadId ? `<div class="metadata-item"><span class="metadata-label">Thread:</span> ${data.threadId}</div>` : ''}
                        ${data.sql ? `
                            <div class="metadata-item">
                                <span class="metadata-label">SQL Query:</span>
                                <div class="sql-query">${this.formatSQL(data.sql)}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        formatSQL(sql) {
            // Format SQL for better readability
            return sql
                .replace(/SELECT/gi, 'SELECT')
                .replace(/FROM/gi, '\nFROM')
                .replace(/WHERE/gi, '\nWHERE')
                .replace(/GROUP BY/gi, '\nGROUP BY')
                .replace(/ORDER BY/gi, '\nORDER BY')
                .replace(/LIMIT/gi, '\nLIMIT')
                .replace(/JOIN/gi, '\nJOIN')
                .replace(/AND/gi, '\n  AND')
                .replace(/OR/gi, '\n  OR');
        }

        formatTimestamp(timestamp) {
            try {
                const date = new Date(timestamp);
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return timestamp;
            }
        }

        formatMessage(content) {
            if (typeof content !== 'string') content = String(content);
            return content
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
        }

        updateHistory() {
            const historyContainer = document.getElementById('historyContainer');
            if (!historyContainer) return;
            const history = this.sessionManager.getHistory();
            const userQuestions = history.filter(item => item.role === 'user').slice(-10).reverse();
            historyContainer.innerHTML = userQuestions.map(item => 
                `<button class="history-item" onclick="window.widgetUI.askQuestion('${item.content.replace(/'/g, "\\'")}')">${
                    item.content.length > 40 ? item.content.substring(0, 40) + '...' : item.content
                }</button>`
            ).join('');
        }

        renderChart(chartSpec) {
            try {
                console.log('🎨 Rendering chart with spec:', chartSpec);
                        
                const chartContainer = document.createElement('div');
                chartContainer.className = 'chart-container';
                        
                const chartTitle = document.createElement('div');
                chartTitle.className = 'chart-title';
                chartTitle.textContent = chartSpec.title?.text || 'AMAX Business Intelligence Chart';
                        
                const chartDiv = document.createElement('div');
                chartDiv.id = `chart-${Date.now()}`;
                chartDiv.className = 'vega-chart';
                        
                chartContainer.appendChild(chartTitle);
                chartContainer.appendChild(chartDiv);
                
                // Add to messages area
                const messagesContainer = document.getElementById('amaxMessages');
                if (!messagesContainer) {
                    console.error('❌ Messages container not found');
                    return;
                }
                        
                messagesContainer.appendChild(chartContainer);

                // Render with Vega-Lite
                if (window.vegaEmbed) {
                    console.log('✅ Vega-Embed library found, rendering chart...');
                            
                    window.vegaEmbed(chartDiv, chartSpec, {
                        actions: false,
                        renderer: 'svg',
                        width: 450,
                        height: 300,
                        theme: 'quartz'
                    }).then(result => {
                        console.log('✅ Chart rendered successfully');
                        chartDiv.style.backgroundColor = '#ffffff';
                    }).catch(error => {
                        console.error('❌ Chart rendering failed:', error);
                        chartDiv.innerHTML = `
                            <div style="text-align: center; padding: 20px; color: #dc3545;">
                                <p>Chart rendering failed</p>
                                <small>${error.message}</small>
                            </div>
                        `;
                    });
                } else {
                    console.warn('⚠️ Vega-Embed library not loaded');
                    chartDiv.innerHTML = `
                        <div style="text-align: center; padding: 20px; color: #6c757d;">
                            <p>Chart visualization unavailable</p>
                        </div>
                    `;
                }
                this.scrollToBottom();
            } catch (error) {
                console.error('❌ Chart container creation failed:', error);
                this.addMessage('bot', 'Chart visualization temporarily unavailable.');
            }
        }

        scrollToBottom() {
            const messagesContainer = document.getElementById('amaxMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        async sendMessage() {
            if (this.processing) return;
            const inputField = document.getElementById('amaxInput');
            const sendButton = document.getElementById('amaxSend');
            if (!inputField || !sendButton) return;
            const message = inputField.value.trim();
            if (!message) return;

            this.processing = true;
            inputField.value = '';
            inputField.style.height = 'auto';
            sendButton.disabled = true;
            
            this.addMessage('user', message);
            this.showTypingIndicator();
            
            try {
                const rawResponse = await this.callWebhook(message);
                this.hideTypingIndicator();
                
                // Parse the response with our enhanced parser
                const parsedData = ResponseParser.parseResponse(rawResponse);
                
                if (parsedData.error) {
                    this.addMessage('bot', 'I apologize, but I encountered an error processing your request. Please try again.');
                } else {
                    // Display the beautiful formatted response
                    this.addMessage('bot', '', parsedData);
                    
                    // Render chart if available
                    if (parsedData.chartData) {
                        this.renderChart(parsedData.chartData);
                    }
                }
                
                this.sessionManager.addToHistory('user', message);
                this.sessionManager.addToHistory('assistant', parsedData.analysis || parsedData.response || 'Response processed');
                this.updateHistory();
                
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessage('bot', 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.');
                console.error('💥 Message sending error:', error);
            }
            
            sendButton.disabled = false;
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
            
            console.log('📡 Webhook payload:', {
                messageLength: message.length,
                sessionId: payload.sessionId.substring(0, 15) + '...',
                userEmail: payload.userEmail, 
                userRole: payload.userRole
            });
            
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        }
    }

    // ========================================
    // INITIALIZATION (unchanged)
    // ========================================
    
    async function initializeWidget() {
        try {
            console.log('🚀 Starting AMAX Widget initialization...');
            console.log('📋 Environment:', {
                userAgent: navigator.userAgent.substring(0, 50) + '...',
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                widgetVersion: CONFIG.version
            });
            
            const auth = new JWTAuth();
            const authResult = await auth.authenticateUser();
            
            if (!authResult) {
                console.error('❌ Authentication failed');
                return;
            }
            
            console.log('✅ Authentication successful');
            
            const sessionManager = new SessionManager(auth);
            const widgetUI = new WidgetUI(sessionManager);
            
            window.widgetUI = widgetUI;
            window.openWidget = () => {
                console.log('🌍 Global openWidget called');
                widgetUI.openWidget();
            };
            window.closeWidget = () => widgetUI.closeWidget();
            
            console.log('✅ AMAX Widget initialized successfully!');
            console.log('🎯 Widget is ready for user interaction');
            
        } catch (error) {
            console.error('💥 Widget initialization error:', error);
            document.body.innerHTML += `
                <div style="position: fixed; bottom: 100px; right: 25px; background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 12px; font-family: Inter, sans-serif; font-size: 12px; color: #c33; z-index: 999999;">
                    ⚠️ Widget initialization failed. Please refresh the page.
                </div>
            `;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
        console.log('⏳ Waiting for DOM to load...');
    } else {
        initializeWidget();
    }

    console.log('📋 AMAX Widget script loaded completely - Version', CONFIG.version);

})();
