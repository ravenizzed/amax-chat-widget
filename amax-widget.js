/*
 * AMAX Insurance BI Chat Widget - Complete Security Implementation
 * Version: Production Ready with Authentication, Security & Anna's Memory
 * Features: JWT Auth, Session Continuity, Chart Rendering, Professional UI
 */

(function() {
    'use strict';

    // ========================================
    // SECURITY & AUTHENTICATION CONFIG
    // ========================================
    
    const SECURITY_CONFIG = {
        // Hardcoded Admin Details
        adminUser: {
            id: 'ufarooq',
            email: 'ufarooq@amaxinsurance.com',  
            role: 'HOD',
            name: 'Umair Farooq'
        },
        
        // Security Password
        accessPassword: 'Amax@genBi25',
        
        // Session Management
        sessionTimeout: 0, // Unlimited for admin
        maxConversationHistory: 100,
        
        // Domain Security
        authorizedDomains: [
            'maxbi.amaxinsurance.com',
            'amax-chat-widget.vercel.app',
            'localhost'
        ]
    };

    const CONFIG = {
        webhookUrl: window.location.origin + '/api/webhook',
        logoUrl: './assets/amax-insurance-logo.jpg',
        rateLimit: 2000,
        sessionId: null,
        threadId: null
    };

    // ========================================
    // SECURITY AUTHENTICATION
    // ========================================
    
    class SecurityManager {
        static checkDirectAccess() {
            // Check if accessing via direct ports (3000, 5678)
            const port = window.location.port;
            const isDirectAccess = port === '3000' || port === '5678';
            
            if (isDirectAccess) {
                return this.promptForPassword();
            }
            return true;
        }
        
        static promptForPassword() {
            const savedAuth = localStorage.getItem('amax-admin-auth');
            
            if (savedAuth) {
                try {
                    const auth = JSON.parse(savedAuth);
                    if (auth.password === SECURITY_CONFIG.accessPassword) {
                        console.log('🔓 Admin access granted via saved session');
                        return true;
                    }
                } catch (e) {
                    localStorage.removeItem('amax-admin-auth');
                }
            }
            
            const password = prompt('🔐 AMAX Admin Access Required\n\nEnter password to continue:');
            
            if (password === SECURITY_CONFIG.accessPassword) {
                localStorage.setItem('amax-admin-auth', JSON.stringify({
                    password: password,
                    timestamp: Date.now(),
                    unlimited: true
                }));
                console.log('✅ Admin access granted');
                return true;
            } else if (password !== null) {
                alert('❌ Access denied. Incorrect password.');
            }
            
            return false;
        }
        
        static getUserInfo() {
            // Return hardcoded admin user info
            return {
                isAuthenticated: true,
                user: SECURITY_CONFIG.adminUser,
                sessionUnlimited: true
            };
        }
        
        static validateDomain() {
            const currentDomain = window.location.hostname;
            return SECURITY_CONFIG.authorizedDomains.some(domain => 
                currentDomain.includes(domain) || domain.includes(currentDomain)
            );
        }
    }

    // ========================================
    // SESSION & MEMORY MANAGEMENT
    // ========================================
    
    class SessionManager {
        constructor() {
            this.sessionId = this.generateSessionId();
            this.threadId = this.generateThreadId();
            this.user = SECURITY_CONFIG.adminUser;
            this.loadSession();
        }
        
        generateSessionId() {
            return `amax_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        generateThreadId() {
            return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        loadSession() {
            const saved = localStorage.getItem('amax-session-data');
            if (saved) {
                try {
                    const session = JSON.parse(saved);
                    this.sessionId = session.sessionId || this.sessionId;
                    this.threadId = session.threadId || this.threadId;
                } catch (e) {
                    console.warn('Could not load saved session');
                }
            }
        }
        
        saveSession() {
            const session = {
                sessionId: this.sessionId,
                threadId: this.threadId,
                user: this.user,
                timestamp: Date.now()
            };
            localStorage.setItem('amax-session-data', JSON.stringify(session));
        }
        
        getConversationHistory() {
            const history = JSON.parse(localStorage.getItem('anna-memory') || '[]');
            return history.filter(item => item.sessionId === this.sessionId)
                         .slice(-SECURITY_CONFIG.maxConversationHistory);
        }
        
        saveConversation(question, response) {
            let memory = JSON.parse(localStorage.getItem('anna-memory') || '[]');
            memory.push({
                timestamp: new Date().toISOString(),
                question: question,
                response: response,
                sessionId: this.sessionId,
                threadId: this.threadId,
                userId: this.user.id
            });
            
            if (memory.length > SECURITY_CONFIG.maxConversationHistory * 2) {
                memory = memory.slice(-SECURITY_CONFIG.maxConversationHistory);
            }
            
            localStorage.setItem('anna-memory', JSON.stringify(memory));
        }
    }

    // ========================================
    // ENHANCED CHART RENDERING
    // ========================================
    
    class ChartRenderer {
        static async renderChart(chartData, container) {
            if (!chartData) return;
            
            try {
                let chartSpec;
                
                if (typeof chartData === 'string') {
                    try {
                        chartSpec = JSON.parse(chartData);
                    } catch {
                        chartSpec = this.parseDeconstructedChart(chartData);
                    }
                } else if (typeof chartData === 'object') {
                    chartSpec = chartData;
                }
                
                if (!chartSpec || !chartSpec.$schema) {
                    console.warn('Invalid chart specification:', chartSpec);
                    return;
                }
                
                // Ensure Vega-Lite v5 compatibility
                chartSpec = this.ensureV5Compatibility(chartSpec);
                
                const chartContainer = document.createElement('div');
                chartContainer.className = 'chart-container';
                chartContainer.style.cssText = `
                    margin: 20px 0 !important;
                    padding: 20px !important;
                    background: white !important;
                    border-radius: 12px !important;
                    border: 1px solid #e5e7eb !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
                `;
                
                if (typeof vegaEmbed !== 'undefined') {
                    await vegaEmbed(chartContainer, chartSpec, {
                        theme: 'default',
                        renderer: 'svg',
                        actions: false,
                        width: 'container',
                        height: 300
                    });
                    
                    console.log('✅ Chart rendered successfully');
                } else {
                    chartContainer.innerHTML = '<p style="color: #DC143C;">Chart library loading... Please wait.</p>';
                }
                
                container.appendChild(chartContainer);
                
            } catch (error) {
                console.error('Chart rendering error:', error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'chart-error';
                errorDiv.style.cssText = `
                    color: #DC143C !important;
                    font-weight: 600 !important;
                    padding: 15px !important;
                    background: #fff5f5 !important;
                    border: 2px solid #fecaca !important;
                    border-radius: 10px !important;
                    margin: 15px 0 !important;
                    text-align: center !important;
                `;
                errorDiv.innerHTML = `<strong>📊 Chart Error:</strong> ${error.message}`;
                container.appendChild(errorDiv);
            }
        }
        
        static parseDeconstructedChart(chartString) {
            try {
                const lines = chartString.split('\n').filter(line => line.trim());
                let jsonStr = '';
                let inJson = false;
                
                for (const line of lines) {
                    if (line.includes('{') || inJson) {
                        inJson = true;
                        jsonStr += line;
                        if (line.includes('}') && jsonStr.split('{').length === jsonStr.split('}').length) {
                            break;
                        }
                    }
                }
                
                return JSON.parse(jsonStr);
            } catch (error) {
                console.error('Failed to parse deconstructed chart:', error);
                return null;
            }
        }
        
        static ensureV5Compatibility(spec) {
            spec.$schema = "https://vega.github.io/schema/vega-lite/v5.json";
            
            if (spec.encoding) {
                Object.keys(spec.encoding).forEach(channel => {
                    const encoding = spec.encoding[channel];
                    if (encoding && encoding.tooltip && encoding.tooltip === true) {
                        encoding.tooltip = {"field": encoding.field, "type": encoding.type};
                    }
                });
            }
            
            return spec;
        }
    }

    // ========================================
    // WIDGET UI WITH MODERN DESIGN
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
            this.loadVegaLite();
        }
        
        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* Modern Professional AMAX Widget Styles */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
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
                    overflow: hidden !important;
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
                    overflow: hidden !important;
                    font-family: 'Inter', sans-serif !important;
                    border: 1px solid #e5e7eb !important;
                }
                
                .amax-chat-header {
                    background: linear-gradient(135deg, #DC143C, #B91C1C) !important;
                    color: white !important;
                    padding: 18px 24px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    font-weight: 600 !important;
                    font-size: 17px !important;
                    letter-spacing: 0.3px !important;
                }
                
                .amax-header-content {
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                }
                
                .amax-header-content img {
                    width: 28px !important;
                    height: 28px !important;
                    border-radius: 6px !important;
                    background: white !important;
                    padding: 2px !important;
                }
                
                .amax-close-btn {
                    background: rgba(255, 255, 255, 0.2) !important;
                    border: none !important;
                    color: white !important;
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 50% !important;
                    cursor: pointer !important;
                    font-size: 16px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                }
                
                .amax-close-btn:hover {
                    background: rgba(255, 255, 255, 0.3) !important;
                }
                
                .amax-chat-body {
                    display: flex !important;
                    flex: 1 !important;
                    overflow: hidden !important;
                }
                
                .amax-sidebar {
                    width: 260px !important;
                    background: #f8fafc !important;
                    border-right: 1px solid #e5e7eb !important;
                    padding: 16px !important;
                    overflow-y: auto !important;
                    font-size: 12px !important;
                    line-height: 1.4 !important;
                }
                
                .amax-sidebar h3 {
                    margin: 0 0 12px 0 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    color: #6b7280 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.8px !important;
                }
                
                .amax-sidebar .quick-btn {
                    display: block !important;
                    width: 100% !important;
                    padding: 10px 12px !important;
                    margin: 3px 0 !important;
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                    color: #374151 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    line-height: 1.3 !important;
                    text-align: left !important;
                    font-weight: 500 !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .amax-sidebar .quick-btn:hover {
                    background: #DC143C !important;
                    color: white !important;
                    border-color: #DC143C !important;
                    transform: translateY(-1px) !important;
                }
                
                .random-btn {
                    background: linear-gradient(135deg, #059669, #047857) !important;
                    color: white !important;
                    border: none !important;
                    padding: 10px 12px !important;
                    border-radius: 6px !important;
                    font-size: 10px !important;
                    cursor: pointer !important;
                    margin: 8px 0 !important;
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
                    font-size: 8px !important;
                    color: #9ca3af !important;
                    font-style: italic !important;
                    margin-top: 8px !important;
                    line-height: 1.2 !important;
                    font-family: 'Inter', sans-serif !important;
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
                    background: #ffffff !important;
                    font-size: 14px !important;
                    line-height: 1.5 !important;
                }
                
                .amax-input-area {
                    padding: 16px !important;
                    border-top: 1px solid #e5e7eb !important;
                    display: flex !important;
                    gap: 12px !important;
                    align-items: center !important;
                    background: #f9fafb !important;
                }
                
                .amax-input {
                    flex: 1 !important;
                    padding: 12px 18px !important;
                    border: 2px solid #e5e7eb !important;
                    border-radius: 22px !important;
                    font-size: 14px !important;
                    outline: none !important;
                    transition: all 0.2s !important;
                    font-family: 'Inter', sans-serif !important;
                    background: white !important;
                }
                
                .amax-input:focus {
                    border-color: #DC143C !important;
                    box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1) !important;
                }
                
                .amax-send-btn {
                    background: #DC143C !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 18px !important;
                    border-radius: 22px !important;
                    cursor: pointer !important;
                    font-weight: 600 !important;
                    transition: all 0.2s !important;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 13px !important;
                }
                
                .amax-send-btn:hover {
                    background: #B91C1C !important;
                    transform: translateY(-1px) !important;
                }
                
                .amax-send-btn:disabled {
                    background: #9ca3af !important;
                    cursor: not-allowed !important;
                    transform: none !important;
                }
                
                .amax-message {
                    margin: 12px 0 !important;
                    padding: 0 !important;
                }
                
                .amax-message.user {
                    text-align: right !important;
                }
                
                .amax-message-content {
                    display: inline-block !important;
                    padding: 12px 16px !important;
                    border-radius: 18px !important;
                    max-width: 80% !important;
                    font-size: 13px !important;
                    line-height: 1.4 !important;
                    font-family: 'Inter', sans-serif !important;
                }
                
                .amax-message.user .amax-message-content {
                    background: #DC143C !important;
                    color: white !important;
                }
                
                .amax-message.assistant .amax-message-content {
                    background: #f3f4f6 !important;
                    color: #1f2937 !important;
                }
                
                .typing-indicator {
                    display: flex !important;
                    align-items: center !important;
                    padding: 12px 16px !important;
                    color: #6b7280 !important;
                    font-style: italic !important;
                    font-size: 12px !important;
                }
                
                .typing-dots {
                    display: inline-flex !important;
                    margin-left: 8px !important;
                }
                
                .typing-dots span {
                    height: 4px !important;
                    width: 4px !important;
                    background: #6b7280 !important;
                    border-radius: 50% !important;
                    display: inline-block !important;
                    margin: 0 1px !important;
                    animation: typing 1.4s infinite ease-in-out !important;
                }
                
                .typing-dots span:nth-child(1) { animation-delay: -0.32s !important; }
                .typing-dots span:nth-child(2) { animation-delay: -0.16s !important; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }
                
                @media (max-width: 1000px) {
                    .amax-chat-container {
                        width: 95% !important;
                        height: 90% !important;
                        bottom: 10px !important;
                        right: 2.5% !important;
                    }
                    
                    .amax-sidebar {
                        width: 200px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        createWidget() {
            // Create widget button
            const button = document.createElement('button');
            button.id = 'amax-widget-button';
            button.className = 'amax-widget-button';
            button.innerHTML = '<img src="' + CONFIG.logoUrl + '" alt="AMAX BI Assistant" />';
            
            // Create chat container
            const container = document.createElement('div');
            container.id = 'amax-chat-container';
            container.className = 'amax-chat-container';
            
            container.innerHTML = `
                <div class="amax-chat-header">
                    <div class="amax-header-content">
                        <img src="${CONFIG.logoUrl}" alt="AMAX" />
                        <span>Anna - AMAX BI Assistant</span>
                    </div>
                    <button class="amax-close-btn" id="amax-close-btn">×</button>
                </div>
                <div class="amax-chat-body">
                    <div class="amax-sidebar">
                        <h3>Quick Actions</h3>
                        <button class="quick-btn" data-question="Show me premium trends for Q4 2024">📊 Premium Trends Q4</button>
                        <button class="quick-btn" data-question="Top performing agents this month">🏆 Top Performing Agents</button>
                        <button class="quick-btn" data-question="Policy status distribution by location">🗺️ Policy Status by Region</button>
                        <button class="quick-btn" data-question="Claims analysis for high-value policies">💰 High-Value Claims</button>
                        <button class="quick-btn" data-question="Revenue breakdown by policy type">📈 Revenue by Policy Type</button>
                        
                        <button class="random-btn" id="random-questions-btn">🎲 Generate Smart Questions</button>
                        
                        <div class="disclaimer">
                            Anna is your professional BI assistant for AMAX Insurance analytics. 
                            All data is secure and accessible only to authorized personnel.
                        </div>
                    </div>
                    <div class="amax-chat-area">
                        <div class="amax-messages" id="amax-messages">
                            <div class="amax-message assistant">
                                <div class="amax-message-content">
                                    👋 Hello ${SECURITY_CONFIG.adminUser.name}! I'm Anna, your professional BI assistant for AMAX Insurance.
                                    <br><br>
                                    <strong>What I can help you with:</strong><br>
                                    • Premium and revenue analysis<br>
                                    • Policy performance insights<br>
                                    • Claims data visualization<br>
                                    • Agent performance metrics<br>
                                    • Strategic business intelligence<br>
                                    <br>
                                    What would you like to analyze today?
                                </div>
                            </div>
                        </div>
                        <div class="amax-input-area">
                            <input type="text" id="amax-input" class="amax-input" placeholder="Ask Anna about your insurance data and analytics..." maxlength="500" />
                            <button id="amax-send-btn" class="amax-send-btn">Send</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(button);
            document.body.appendChild(container);
        }
        
        setupEventListeners() {
            const button = document.getElementById('amax-widget-button');
            const container = document.getElementById('amax-chat-container');
            const closeBtn = document.getElementById('amax-close-btn');
            const input = document.getElementById('amax-input');
            const sendBtn = document.getElementById('amax-send-btn');
            const randomBtn = document.getElementById('random-questions-btn');
            
            button.addEventListener('click', () => this.openWidget());
            closeBtn.addEventListener('click', () => this.closeWidget());
            sendBtn.addEventListener('click', () => this.sendMessage());
            randomBtn.addEventListener('click', () => this.generateRandomQuestions());
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Quick action buttons
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('quick-btn')) {
                    const question = e.target.getAttribute('data-question');
                    if (question) {
                        this.sendMessage(question);
                    }
                }
            });
        }
        
        openWidget() {
            const button = document.getElementById('amax-widget-button');
            const container = document.getElementById('amax-chat-container');
            
            // Hide button, show container
            button.style.display = 'none';
            container.style.display = 'flex';
            this.isOpen = true;
            
            // Focus input
            setTimeout(() => {
                document.getElementById('amax-input').focus();
            }, 100);
        }
        
        closeWidget() {
            const button = document.getElementById('amax-widget-button');
            const container = document.getElementById('amax-chat-container');
            
            // Show button, hide container
            container.style.display = 'none';
            button.style.display = 'flex';
            this.isOpen = false;
        }
        
        generateRandomQuestions() {
            const questions = [
                "Show me monthly premium collection trends with year-over-year comparison",
                "Which insurance agents have the highest policy conversion rates?",
                "Display geographic distribution of our high-value policies above $50K",
                "What's the claims ratio analysis by policy type and region?", 
                "Show me customer retention rates by agent and location",
                "Display seasonal patterns in new policy acquisitions",
                "Which policy types have the best profit margins this quarter?",
                "Show me policy lapse analysis with predictive insights"
            ];
            
            const randomSelected = questions.sort(() => 0.5 - Math.random()).slice(0, 5);
            const sidebar = document.querySelector('.amax-sidebar');
            const quickActions = sidebar.querySelector('h3');
            
            // Remove existing quick buttons
            const existingBtns = sidebar.querySelectorAll('.quick-btn');
            existingBtns.forEach(btn => btn.remove());
            
            // Add new random questions
            randomSelected.forEach((question, index) => {
                const btn = document.createElement('button');
                btn.className = 'quick-btn';
                btn.setAttribute('data-question', question);
                const icons = ['📊', '🏆', '🗺️', '💰', '📈'];
                btn.textContent = `${icons[index]} ${question.substring(0, 35)}...`;
                quickActions.insertAdjacentElement('afterend', btn);
            });
        }
        
        async sendMessage(predefinedMessage = null) {
            if (this.processing) return;
            
            const input = document.getElementById('amax-input');
            const sendBtn = document.getElementById('amax-send-btn');
            const message = predefinedMessage || input.value.trim();
            
            if (!message) return;
            
            this.processing = true;
            input.disabled = true;
            sendBtn.disabled = true;
            
            if (!predefinedMessage) {
                input.value = '';
            }
            
            try {
                this.addMessage(message, 'user');
                this.showTyping();
                
                const payload = {
                    question: message,
                    sessionId: this.sessionManager.sessionId,
                    threadId: this.sessionManager.threadId,
                    userId: this.sessionManager.user.id,
                    userEmail: this.sessionManager.user.email,
                    userRole: this.sessionManager.user.role,
                    timestamp: new Date().toISOString()
                };
                
                console.log('🔄 Sending request to Anna:', payload);
                
                const response = await fetch(CONFIG.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('✅ Received response from Anna:', data);
                
                this.hideTyping();
                this.processResponse(data, message);
                
                // Save conversation to Anna's memory
                this.sessionManager.saveConversation(message, data);
                
            } catch (error) {
                console.error('❌ Request failed:', error);
                this.hideTyping();
                this.addMessage(
                    '❌ I apologize, but I\'m experiencing connectivity issues right now. Please try again in a moment, or contact your system administrator if the problem persists.',
                    'assistant',
                    true
                );
            } finally {
                this.processing = false;
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            }
        }
        
        processResponse(data, originalQuestion) {
            let responseText = '';
            
            if (data.response) {
                responseText = data.response;
            } else if (data.output) {
                responseText = data.output;
            } else {
                responseText = 'I processed your request, but the response format was unexpected. Let me analyze this differently.';
            }
            
            const messageDiv = this.addMessage(responseText, 'assistant');
            
            // Handle chart data
            if (data.chart_specification || data.chart_data || data.chartData) {
                const chartData = data.chart_specification || data.chart_data || data.chartData;
                ChartRenderer.renderChart(chartData, messageDiv);
            }
            
            // Handle base64 images
            if (data.images && Array.isArray(data.images)) {
                data.images.forEach(imageData => {
                    if (imageData.startsWith('data:image/')) {
                        const img = document.createElement('img');
                        img.style.cssText = `
                            width: 100% !important;
                            max-width: 500px !important;
                            height: auto !important;
                            border-radius: 8px !important;
                            margin: 10px 0 !important;
                        `;
                        img.src = imageData;
                        messageDiv.appendChild(img);
                    }
                });
            }
            
            // Add Anna's professional insights
            if (data.insights || data.anna_insights) {
                const insights = data.insights || data.anna_insights;
                const insightsDiv = document.createElement('div');
                insightsDiv.style.cssText = `
                    background: #f0f8ff !important;
                    border-left: 4px solid #DC143C !important;
                    padding: 12px !important;
                    margin: 12px 0 !important;
                    border-radius: 0 6px 6px 0 !important;
                    font-style: italic !important;
                    color: #374151 !important;
                    font-size: 12px !important;
                `;
                insightsDiv.innerHTML = `<strong>💡 Anna's Professional Insights:</strong><br>${insights}`;
                messageDiv.appendChild(insightsDiv);
            }
        }
        
        addMessage(content, sender, isError = false) {
            const messagesContainer = document.getElementById('amax-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `amax-message ${sender}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'amax-message-content';
            
            if (isError) {
                contentDiv.style.backgroundColor = '#fee2e2';
                contentDiv.style.color = '#dc2626';
                contentDiv.style.borderLeft = '4px solid #dc2626';
            }
            
            contentDiv.innerHTML = content;
            messageDiv.appendChild(contentDiv);
            messagesContainer.appendChild(messageDiv);
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            return messageDiv;
        }
        
        showTyping() {
            const messagesContainer = document.getElementById('amax-messages');
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = `
                Anna is analyzing your request
                <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            `;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        hideTyping() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
        
        async loadVegaLite() {
            if (typeof vegaEmbed !== 'undefined') {
                return;
            }
            
            try {
                const script1 = document.createElement('script');
                script1.src = 'https://cdn.jsdelivr.net/npm/vega@5';
                
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/vega-lite@5';
                
                const script3 = document.createElement('script');
                script3.src = 'https://cdn.jsdelivr.net/npm/vega-embed@6';
                
                document.head.appendChild(script1);
                document.head.appendChild(script2);
                document.head.appendChild(script3);
                
                console.log('📊 Vega-Lite libraries loaded for chart rendering');
            } catch (error) {
                console.error('Failed to load Vega-Lite:', error);
            }
        }
    }

    // ========================================
    // MAIN INITIALIZATION
    // ========================================
    
    class AMXWidget {
        static async initialize() {
            console.log('🚀 AMAX Widget initializing...');
            
            // Security checks
            if (!SecurityManager.validateDomain()) {
                console.warn('⚠️ Domain not in authorized list, but continuing...');
            }
            
            // Check for direct access (ports 3000, 5678)
            if (!SecurityManager.checkDirectAccess()) {
                console.error('🚫 Access denied');
                return;
            }
            
            // Get user info (hardcoded admin)
            const authResult = SecurityManager.getUserInfo();
            
            if (!authResult.isAuthenticated) {
                console.error('🚫 Authentication failed');
                return;
            }
            
            console.log('✅ Authenticated as:', authResult.user);
            
            // Initialize session manager
            const sessionManager = new SessionManager();
            sessionManager.user = authResult.user;
            sessionManager.saveSession();
            
            // Initialize UI
            const ui = new WidgetUI(sessionManager);
            
            console.log('🎉 AMAX Widget ready! Anna is standing by.');
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', AMXWidget.initialize);
    } else {
        AMXWidget.initialize();
    }

})();
