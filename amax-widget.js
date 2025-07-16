/*
 * amax-widget.js — AMAX Insurance BI Chat Widget
 * Complete fix with improved fonts and better chart debugging
 */
(function() {
    'use strict';

    const CONFIG = {
        webhookUrl: '/api/webhook',
        logoUrl: 'https://raw.githubusercontent.com/ravenizzed/amax-chat-widget/main/assets/amax-insurance-logo.jpg',
        rateLimit: 2000,
        timeout: 30000
    };

    let vegaEmbed = null;
    
    async function loadVegaLite() {
        if (window.vegaEmbed) {
            vegaEmbed = window.vegaEmbed;
            return;
        }
        
        return new Promise((resolve, reject) => {
            const script1 = document.createElement('script');
            script1.src = 'https://cdn.jsdelivr.net/npm/vega@5';
            script1.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://cdn.jsdelivr.net/npm/vega-lite@5';
                script2.onload = () => {
                    const script3 = document.createElement('script');
                    script3.src = 'https://cdn.jsdelivr.net/npm/vega-embed@6';
                    script3.onload = () => {
                        vegaEmbed = window.vegaEmbed;
                        resolve();
                    };
                    script3.onerror = reject;
                    document.head.appendChild(script3);
                };
                script2.onerror = reject;
                document.head.appendChild(script2);
            };
            script1.onerror = reject;
            document.head.appendChild(script1);
        });
    }

    const styles = `
        body {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: hidden !important;
        }

        .amax-widget-btn {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            background: #DC143C !important;
            border: none !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            box-shadow: 0 4px 20px rgba(220, 20, 60, 0.3) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
        }

        .amax-widget-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 6px 30px rgba(220, 20, 60, 0.4) !important;
        }

        .amax-widget-btn img {
            width: 32px !important;
            height: 32px !important;
            object-fit: contain !important;
            border-radius: 6px !important;
            background: white !important;
            padding: 2px !important;
        }

        .amax-chat {
            position: fixed !important;
            bottom: 10px !important;
            right: 10px !important;
            width: 750px !important;
            height: 800px !important;
            background: white !important;
            border-radius: 20px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
            display: none !important;
            overflow: hidden !important;
            z-index: 999998 !important;
            flex-direction: column !important;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
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
            background: linear-gradient(135deg, #DC143C, #B91C3C) !important;
            color: white !important;
            padding: 20px 25px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-shadow: 0 2px 15px rgba(0,0,0,0.1) !important;
        }

        .amax-header .logo {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }

        .amax-header .logo-icon {
            background: white !important;
            color: #DC143C !important;
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: bold !important;
            font-size: 18px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }

        .amax-header .logo-icon img {
            width: 28px !important;
            height: 28px !important;
            object-fit: contain !important;
        }

        .amax-header h2 {
            font-size: 22px !important;
            font-weight: 600 !important;
            margin: 0 !important;
            letter-spacing: 0.5px !important;
        }

        .amax-close {
            background: rgba(255,255,255,0.1) !important;
            border: none !important;
            color: white !important;
            font-size: 24px !important;
            cursor: pointer !important;
            padding: 8px !important;
            border-radius: 50% !important;
            width: 38px !important;
            height: 38px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.2s !important;
        }

        .amax-close:hover {
            background: rgba(255,255,255,0.2) !important;
            transform: scale(1.1) !important;
        }

        .amax-main {
            display: flex !important;
            height: calc(100% - 82px) !important;
        }

        .amax-sidebar {
            width: 160px !important;
            background: linear-gradient(180deg, #f8f9fa, #f1f3f4) !important;
            border-right: 1px solid #e9ecef !important;
            padding: 15px 10px !important;
            overflow-y: auto !important;
            font-size: 12px !important;
        }

        .amax-sidebar h3 {
            margin: 0 0 10px 0 !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #666 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
        }

        .amax-sidebar .quick-btn {
            display: block !important;
            width: 100% !important;
            padding: 10px 8px !important;
            margin: 4px 0 !important;
            background: white !important;
            border: 1px solid #e9ecef !important;
            border-radius: 6px !important;
            font-size: 11px !important;
            color: #495057 !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
            line-height: 1.3 !important;
            text-align: left !important;
            font-weight: 500 !important;
        }

        .amax-sidebar .quick-btn:hover {
            background: #DC143C !important;
            color: white !important;
            border-color: #DC143C !important;
            transform: translateY(-1px) !important;
        }

        .random-btn {
            background: linear-gradient(135deg, #28a745, #20c997) !important;
            color: white !important;
            border: none !important;
            padding: 10px 8px !important;
            border-radius: 6px !important;
            font-size: 10px !important;
            cursor: pointer !important;
            margin: 8px 0 !important;
            transition: all 0.2s !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            width: 100% !important;
        }

        .random-btn:hover {
            background: linear-gradient(135deg, #218838, #1e7e34) !important;
            transform: translateY(-1px) !important;
        }

        .disclaimer {
            font-size: 8px !important;
            color: #999 !important;
            font-style: italic !important;
            margin-top: 5px !important;
            line-height: 1.2 !important;
        }

        .history-section {
            margin-top: 20px !important;
        }

        .history-container {
            max-height: 150px !important;
            overflow-y: auto !important;
        }

        .history-item {
            padding: 8px 6px !important;
            margin: 3px 0 !important;
            background: white !important;
            border-radius: 4px !important;
            font-size: 10px !important;
            color: #666 !important;
            cursor: pointer !important;
            border: 1px solid #e9ecef !important;
            line-height: 1.3 !important;
            font-weight: 500 !important;
        }

        .history-item:hover {
            background: #f0f0f0 !important;
        }

        .amax-chat-area {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            width: 590px !important;
        }

        .amax-messages {
            flex: 1 !important;
            padding: 25px !important;
            overflow-y: auto !important;
            font-size: 16px !important;
            line-height: 1.6 !important;
            background: #fafbfc !important;
        }

        .amax-msg {
            margin: 15px 0 !important;
            padding: 16px 20px !important;
            border-radius: 20px !important;
            max-width: 80% !important;
            word-wrap: break-word !important;
            line-height: 1.6 !important;
            font-size: 16px !important;
            font-weight: 400 !important;
        }

        .amax-msg.user {
            background: linear-gradient(135deg, #DC143C, #B91C3C) !important;
            color: white !important;
            margin-left: auto !important;
            border-bottom-right-radius: 6px !important;
            font-weight: 500 !important;
            box-shadow: 0 2px 10px rgba(220, 20, 60, 0.2) !important;
        }

        .amax-msg.bot {
            background: white !important;
            color: #333 !important;
            margin-right: auto !important;
            border-bottom-left-radius: 6px !important;
            border: 1px solid #e9ecef !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
        }

        .amax-msg.error {
            background: #fee !important;
            color: #c33 !important;
            border: 1px solid #fcc !important;
        }

        .chart-container {
            margin: 20px 0 !important;
            padding: 20px !important;
            background: white !important;
            border-radius: 12px !important;
            border: 1px solid #e9ecef !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
        }

        .chart-error {
            color: #DC143C !important;
            font-weight: 600 !important;
            padding: 15px !important;
            background: #fff5f5 !important;
            border: 2px solid #fecaca !important;
            border-radius: 10px !important;
            margin: 15px 0 !important;
            text-align: center !important;
        }

        .debug-info {
            background: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
            border-radius: 6px !important;
            padding: 10px !important;
            margin: 10px 0 !important;
            font-size: 12px !important;
            color: #6c757d !important;
            font-family: monospace !important;
        }

        .amax-input-area {
            padding: 20px !important;
            border-top: 1px solid #e9ecef !important;
            display: flex !important;
            gap: 15px !important;
            align-items: center !important;
            background: white !important;
        }

        .amax-input {
            flex: 1 !important;
            padding: 14px 20px !important;
            border: 2px solid #e9ecef !important;
            border-radius: 25px !important;
            font-size: 16px !important;
            outline: none !important;
            font-family: inherit !important;
            background: #fafbfc !important;
            transition: all 0.2s !important;
        }

        .amax-input:focus {
            border-color: #DC143C !important;
            box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1) !important;
            background: white !important;
        }

        .amax-send {
            background: linear-gradient(135deg, #DC143C, #B91C3C) !important;
            border: none !important;
            color: white !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            transition: all 0.2s !important;
            font-weight: bold !important;
            box-shadow: 0 4px 12px rgba(220, 20, 60, 0.3) !important;
        }

        .amax-send:hover {
            background: linear-gradient(135deg, #B91C3C, #991b3b) !important;
            transform: scale(1.05) !important;
        }

        .amax-send:disabled {
            background: #ccc !important;
            cursor: not-allowed !important;
            transform: none !important;
        }

        .amax-typing {
            padding: 16px 20px !important;
            color: #666 !important;
            font-style: italic !important;
            font-size: 15px !important;
            display: none !important;
            background: #f8f9fa !important;
            margin: 0 25px !important;
            border-radius: 12px !important;
        }

        .amax-typing.show {
            display: block !important;
        }

        @media (max-width: 800px) {
            .amax-chat {
                width: 100vw !important;
                height: 100vh !important;
                bottom: 0 !important;
                right: 0 !important;
                border-radius: 0 !important;
            }
            .amax-sidebar { 
                width: 140px !important; 
            }
            .amax-chat-area {
                width: calc(100vw - 140px) !important;
            }
        }
    `;

    // State
    let history = [];
    let lastTime = 0;
    let processing = false;

    const quickQuestions = [
        "Total premium July 2024?",
        "Monthly trends chart",
        "Top location by premium?",
        "Revenue report Q3",
        "State breakdown"
    ];

    // Improved specific random questions
    const randomQuestions = [
        "Show me total premiums for Insurance Pro vs Insurance Pro Alpha last 6 months",
        "What are the exact policy counts by location for July 2024?",
        "Compare monthly premium trends between 2023 and 2024",
        "Which agent wrote the most policies in Q2 2024?",
        "Show me premium breakdown by policy type for this year",
        "What's the average premium per policy by location?",
        "Generate chart showing top 5 locations by total premium",
        "Compare claim ratios between different product lines",
        "Show policy renewal rates by customer age group",
        "What's the monthly growth rate in premium collection?"
    ];

    function generateRandomQuestion() {
        const randomIndex = Math.floor(Math.random() * randomQuestions.length);
        return randomQuestions[randomIndex];
    }

    // Enhanced chart data parsing with detailed debugging
    function parseChartData(responseText) {
        console.log('🔍 DETAILED CHART PARSING:', {
            responseLength: responseText.length,
            containsChart: responseText.includes('[CHART'),
            containsSchema: responseText.includes('$schema:'),
            firstLines: responseText.split('\n').slice(0, 5)
        });
        
        if (responseText.includes('[CHART]') || responseText.includes('[CHART:')) {
            console.log('❌ Found [CHART] placeholder - n8n workflow issue');
            console.log('🔧 Fix needed: Update BI Reporter prompt to not use placeholders');
            return 'placeholder';
        }
        
        const lines = responseText.split('\n').map(line => line.trim()).filter(line => line);
        const schemaIndex = lines.findIndex(line => line.includes('$schema:'));
        
        if (schemaIndex === -1) {
            console.log('❌ No chart data found. Possible causes:');
            console.log('   - generate_chart_tool not called');
            console.log('   - Chart data not passed to BI Reporter');
            console.log('   - Question not classified as chart request');
            return null;
        }
        
        try {
            const chartObj = {};
            
            for (let i = schemaIndex; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.includes('$schema:')) {
                    chartObj['$schema'] = line.split('$schema:')[1];
                } else if (line === 'config') {
                    chartObj.config = {};
                } else if (line === 'mark') {
                    chartObj.mark = 'bar';
                } else if (line.includes('title:')) {
                    chartObj.title = line.split('title:')[1];
                } else if (line === 'data') {
                    chartObj.data = { values: [] };
                } else if (line === 'values') {
                    // Skip
                } else if (line.match(/^\d+$/)) {
                    const dataObj = {};
                    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                        const dataLine = lines[j];
                        if (dataLine.includes(':') && !dataLine.match(/^\d+$/)) {
                            const [key, value] = dataLine.split(':');
                            if (key && value) {
                                const numValue = parseFloat(value);
                                dataObj[key] = isNaN(numValue) ? value : numValue;
                            }
                        } else if (dataLine.match(/^\d+$/)) {
                            break;
                        }
                    }
                    if (Object.keys(dataObj).length > 0) {
                        chartObj.data.values.push(dataObj);
                    }
                }
            }
            
            if (chartObj.data && chartObj.data.values.length > 0) {
                const firstRow = chartObj.data.values[0];
                const fields = Object.keys(firstRow);
                
                chartObj.encoding = {
                    x: { field: fields[0] || 'x', type: 'ordinal' },
                    y: { field: fields[fields.length - 1] || 'y', type: 'quantitative' }
                };
                
                chartObj.mark = { type: 'bar', color: '#DC143C' };
            }
            
            console.log('✅ SUCCESSFULLY PARSED CHART:', chartObj);
            return chartObj;
            
        } catch (e) {
            console.error('❌ Chart parsing error:', e);
            return null;
        }
    }

    async function renderChart(spec) {
        if (!vegaEmbed) {
            console.error('Vega-Lite not loaded');
            return document.createTextNode('[Chart loading failed]');
        }

        const container = document.createElement('div');
        container.className = 'chart-container';
        
        try {
            await vegaEmbed(container, spec, {
                width: 400,
                height: 250,
                padding: { left: 60, right: 30, top: 40, bottom: 60 }
            });
            return container;
        } catch (error) {
            console.error('Chart rendering error:', error);
            container.innerHTML = '<div class="chart-error">❌ Chart visualization failed</div>';
            return container;
        }
    }

    async function processResponse(data) {
        const container = document.createElement('div');
        const responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2);
        
        console.log('🔄 PROCESSING RESPONSE:', {
            type: typeof data.response,
            length: responseText.length,
            preview: responseText.substring(0, 200)
        });
        
        const chartSpec = parseChartData(responseText);
        
        if (chartSpec === 'placeholder') {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'debug-info';
            debugInfo.innerHTML = '🔧 Debug: Backend returned [CHART] placeholder. Check n8n BI Reporter configuration.';
            
            const textDiv = document.createElement('div');
            textDiv.innerHTML = responseText.replace(/\[CHART[^\]]*\]/g, '<div class="chart-error">❌ Chart placeholder detected - fix n8n workflow</div>').replace(/\n/g, '<br>');
            
            container.appendChild(debugInfo);
            container.appendChild(textDiv);
            return container;
        }
        
        if (chartSpec && chartSpec.data && chartSpec.data.values.length > 0) {
            const textWithoutChart = responseText.replace(/\$schema:[\s\S]*?(?=\n\n|\n[A-Z]|$)/g, '').trim();
            
            if (textWithoutChart) {
                const textDiv = document.createElement('div');
                textDiv.innerHTML = textWithoutChart.replace(/\n/g, '<br>');
                container.appendChild(textDiv);
            }
            
            const chartContainer = await renderChart(chartSpec);
            container.appendChild(chartContainer);
            return container;
        }
        
        if (responseText.toLowerCase().includes('chart') || responseText.toLowerCase().includes('visualization')) {
            const debugInfo = document.createElement('div');
            debugInfo.className = 'debug-info';
            debugInfo.innerHTML = '🔧 Debug: Chart mentioned but no data. Check if generate_chart_tool was called.';
            
            const textDiv = document.createElement('div');
            textDiv.innerHTML = responseText.replace(/\n/g, '<br>') + '<div class="chart-error">❌ Chart requested but no data from backend</div>';
            
            container.appendChild(debugInfo);
            container.appendChild(textDiv);
            return container;
        }
        
        container.innerHTML = responseText.replace(/\n/g, '<br>');
        return container;
    }

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
                <img src="${CONFIG.logoUrl}" alt="AMAX BI Assistant">
            </div>
            <div class="amax-chat" id="amaxChat">
                <div class="amax-header">
                    <div class="logo">
                        <div class="logo-icon">
                            <img src="${CONFIG.logoUrl}" alt="AMAX">
                        </div>
                        <h2>AMAX BI Assistant</h2>
                    </div>
                    <button class="amax-close" id="amaxClose">×</button>
                </div>
                <div class="amax-main">
                    <div class="amax-sidebar">
                        <div class="sidebar-section">
                            <h3>Quick Q's</h3>
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
                            <div class="amax-msg bot">Welcome to AMAX! I'm your BI Assistant ready to help with insurance analytics and detailed reports.</div>
                        </div>
                        <div class="amax-typing" id="amaxTyping">Assistant is typing...</div>
                        <div class="amax-input-area">
                            <input type="text" class="amax-input" id="amaxInput" placeholder="Ask about premiums, trends, reports...">
                            <button class="amax-send" id="amaxSend">→</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        return container;
    }

    function setupEventListeners() {
        const widgetBtn = document.getElementById('amaxWidgetBtn');
        const chat = document.getElementById('amaxChat');
        const closeBtn = document.getElementById('amaxClose');
        const input = document.getElementById('amaxInput');
        const sendBtn = document.getElementById('amaxSend');
        const randomBtn = document.getElementById('randomBtn');

        widgetBtn.addEventListener('click', () => {
            chat.classList.toggle('open');
            if (chat.classList.contains('open')) {
                input.focus();
            }
        });

        closeBtn.addEventListener('click', () => {
            chat.classList.remove('open');
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !processing) {
                sendMessage();
            }
        });

        sendBtn.addEventListener('click', () => {
            if (!processing) {
                sendMessage();
            }
        });

        randomBtn.addEventListener('click', () => {
            const randomQuestion = generateRandomQuestion();
            sendMessage(randomQuestion);
        });

        setupQuickQuestions();
        setupHistory();
    }

    function setupQuickQuestions() {
        const container = document.getElementById('amaxQuickQuestions');
        quickQuestions.forEach(question => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = question;
            btn.onclick = () => sendMessage(question);
            container.appendChild(btn);
        });
    }

    function setupHistory() {
        updateHistory();
    }

    function addToHistory(message) {
        history.unshift(message);
        if (history.length > 10) history.pop();
        updateHistory();
    }

    function updateHistory() {
        const container = document.getElementById('amaxChatHistory');
        container.innerHTML = '';
        
        history.slice(0, 5).forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = item.length > 25 ? item.substring(0, 25) + '...' : item;
            div.onclick = () => sendMessage(item);
            container.appendChild(div);
        });
    }

    function addMessage(content, isUser = false, isError = false) {
        const messages = document.getElementById('amaxMessages');
        const msg = document.createElement('div');
        msg.className = `amax-msg ${isUser ? 'user' : isError ? 'error' : 'bot'}`;
        
        if (typeof content === 'string') {
            msg.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            msg.appendChild(content);
        }
        
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const typing = document.getElementById('amaxTyping');
        typing.classList.add('show');
        const messages = document.getElementById('amaxMessages');
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('amaxTyping');
        typing.classList.remove('show');
    }

    async function sendMessage(text) {
        const input = document.getElementById('amaxInput');
        const sendBtn = document.getElementById('amaxSend');
        
        const message = text || input.value.trim();
        if (!message) return;

        const now = Date.now();
        if (processing || now - lastTime < CONFIG.rateLimit) return;

        lastTime = now;
        processing = true;
        input.value = '';

        addMessage(message, true);
        addToHistory(message);

        input.disabled = true;
        sendBtn.disabled = true;
        showTyping();

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
            console.log('🔍 RAW BACKEND RESPONSE:', data);
            const content = await processResponse(data);
            addMessage(content, false);

        } catch (error) {
            console.error('Connection error:', error);
            addMessage('Connection error. Please try again.', false, true);
        } finally {
            hideTyping();
            processing = false;
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    function init() {
        injectStyles();
        createWidget();
        setupEventListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadVegaLite().then(init).catch(console.error);
        });
    } else {
        loadVegaLite().then(init).catch(console.error);
    }

})();
