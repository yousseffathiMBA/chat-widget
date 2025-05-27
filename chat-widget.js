// Interactive Chat Widget for n8n
(function() {
    if (window.N8nChatWidgetLoaded) return;
    window.N8nChatWidgetLoaded = true;

    const fontElement = document.createElement('link');
    fontElement.rel = 'stylesheet';
    fontElement.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(fontElement);

    const widgetStyles = document.createElement('style');
    widgetStyles.textContent = `
        /* ...existing CSS unchanged... */
    `;
    document.head.appendChild(widgetStyles);

    const defaultSettings = {
        webhook: {
            url: '',
            route: ''
        },
        branding: {
            logo: '',
            name: '',
            welcomeText: '',
            responseTimeText: '',
            poweredBy: {
                text: 'مشغل بواسطة FathiShop',
                link: 'https://fathishop.store'
            }
        },
        style: {
            primaryColor: '#10b981',
            secondaryColor: '#059669',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#1f2937'
        },
        suggestedQuestions: []
    };

    const settings = window.ChatWidgetConfig ? 
        {
            webhook: { ...defaultSettings.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultSettings.branding, ...window.ChatWidgetConfig.branding },
            style: { 
                ...defaultSettings.style, 
                ...window.ChatWidgetConfig.style,
                primaryColor: window.ChatWidgetConfig.style?.primaryColor === '#854fff' ? '#10b981' : (window.ChatWidgetConfig.style?.primaryColor || '#10b981'),
                secondaryColor: window.ChatWidgetConfig.style?.secondaryColor === '#6b3fd4' ? '#059669' : (window.ChatWidgetConfig.style?.secondaryColor || '#059669')
            },
            suggestedQuestions: window.ChatWidgetConfig.suggestedQuestions || defaultSettings.suggestedQuestions
        } : defaultSettings;

    let conversationId = '';
    let isWaitingForResponse = false;

    const widgetRoot = document.createElement('div');
    widgetRoot.className = 'chat-assist-widget';
    widgetRoot.style.setProperty('--chat-widget-primary', settings.style.primaryColor);
    widgetRoot.style.setProperty('--chat-widget-secondary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-tertiary', settings.style.secondaryColor);
    widgetRoot.style.setProperty('--chat-widget-surface', settings.style.backgroundColor);
    widgetRoot.style.setProperty('--chat-widget-text', settings.style.fontColor);

    const chatWindow = document.createElement('div');
    chatWindow.className = `chat-window ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;

    // All phrases below are now in Arabic
    const welcomeScreenHTML = `
        <div class="chat-header">
            <img class="chat-header-logo" src="${settings.branding.logo}" alt="${settings.branding.name}">
            <span class="chat-header-title">${settings.branding.name}</span>
            <button class="chat-close-btn">×</button>
        </div>
        <div class="chat-welcome">
            <h2 class="chat-welcome-title">${settings.branding.welcomeText || 'مرحبًا بك في الدردشة'}</h2>
            <button class="chat-start-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                اضغط هنا للتحدث
            </button>
            <p class="chat-response-time">${settings.branding.responseTimeText || 'عادةً ما نرد خلال دقائق'}</p>
        </div>
        <div class="user-registration">
            <h2 class="registration-title">الرجاء إدخال التفاصيل الخاصة بك لبدء الدردشة</h2>
            <form class="registration-form">
                <div class="form-field">
                    <label class="form-label" for="chat-user-name">الاسم</label>
                    <input type="text" id="chat-user-name" class="form-input" placeholder="اكتب اسمك" required>
                    <div class="error-text" id="name-error"></div>
                </div>
                <div class="form-field">
                    <label class="form-label" for="chat-user-number">رقم الهاتف</label>
                    <input type="tel" id="chat-user-number" class="form-input" placeholder="اكتب رقم هاتفك" required>
                    <div class="error-text" id="number-error"></div>
                </div>
                <button type="submit" class="submit-registration">متابعة الدردشة</button>
            </form>
        </div>
    `;

    const chatInterfaceHTML = `
        <div class="chat-body">
            <div class="chat-messages"></div>
            <div class="chat-controls">
                <textarea class="chat-textarea" placeholder="اكتب رسالتك هنا..." rows="1"></textarea>
                <button class="chat-submit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                </button>
            </div>
            <div class="chat-footer">
                <a class="chat-footer-link" href="${settings.branding.poweredBy.link}" target="_blank">${settings.branding.poweredBy.text}</a>
            </div>
        </div>
    `;

    chatWindow.innerHTML = welcomeScreenHTML + chatInterfaceHTML;

    const launchButton = document.createElement('button');
    launchButton.className = `chat-launcher ${settings.style.position === 'left' ? 'left-side' : 'right-side'}`;
    launchButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <span class="chat-launcher-text">ابدأ محادثة</span>`;

    widgetRoot.appendChild(chatWindow);
    widgetRoot.appendChild(launchButton);
    document.body.appendChild(widgetRoot);

    const startChatButton = chatWindow.querySelector('.chat-start-btn');
    const chatBody = chatWindow.querySelector('.chat-body');
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    const messageTextarea = chatWindow.querySelector('.chat-textarea');
    const sendButton = chatWindow.querySelector('.chat-submit');

    const registrationForm = chatWindow.querySelector('.registration-form');
    const userRegistration = chatWindow.querySelector('.user-registration');
    const chatWelcome = chatWindow.querySelector('.chat-welcome');
    const nameInput = chatWindow.querySelector('#chat-user-name');
    const numberInput = chatWindow.querySelector('#chat-user-number');
    const nameError = chatWindow.querySelector('#name-error');
    const numberError = chatWindow.querySelector('#number-error');

    function createSessionId() {
        return crypto.randomUUID();
    }

    function createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        return indicator;
    }

    function linkifyText(text) {
        const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        return text.replace(urlPattern, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
        });
    }

    function showRegistrationForm() {
        chatWelcome.style.display = 'none';
        userRegistration.classList.add('active');
    }

    function isValidNumber(number) {
        return /^\d{8,}$/.test(number);
    }

    async function handleRegistration(event) {
        event.preventDefault();

        nameError.textContent = '';
        numberError.textContent = '';
        nameInput.classList.remove('error');
        numberInput.classList.remove('error');

        const name = nameInput.value.trim();
        const number = numberInput.value.trim();

        let isValid = true;

        if (!name) {
            nameError.textContent = 'يرجى إدخال اسمك';
            nameInput.classList.add('error');
            isValid = false;
        }

        if (!number) {
            numberError.textContent = 'يرجى إدخال رقم هاتفك';
            numberInput.classList.add('error');
            isValid = false;
        } else if (!isValidNumber(number)) {
            numberError.textContent = 'يرجى إدخال رقم هاتف صحيح (8 أرقام على الأقل)';
            numberInput.classList.add('error');
            isValid = false;
        }

        if (!isValid) return;

        conversationId = createSessionId();

        const sessionData = [{
            action: "loadPreviousSession",
            sessionId: conversationId,
            route: settings.webhook.route,
            metadata: {
                userId: number,
                userName: name
            }
        }];

        try {
            userRegistration.classList.remove('active');
            chatBody.classList.add('active');

            const typingIndicator = createTypingIndicator();
            messagesContainer.appendChild(typingIndicator);

            const sessionResponse = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });

            await sessionResponse.json();

            const userInfoMessage = `الاسم: ${name}\nرقم الهاتف: ${number}`;

            const userInfoData = {
                action: "sendMessage",
                sessionId: conversationId,
                route: settings.webhook.route,
                chatInput: userInfoMessage,
                metadata: {
                    userId: number,
                    userName: name,
                    isUserInfo: true
                }
            };

            const userInfoResponse = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userInfoData)
            });

            const userInfoResponseData = await userInfoResponse.json();

            messagesContainer.removeChild(typingIndicator);

            const botMessage = document.createElement('div');
            botMessage.className = 'chat-bubble bot-bubble';
            const messageText = Array.isArray(userInfoResponseData) ? 
                userInfoResponseData[0].output : userInfoResponseData.output;
            botMessage.innerHTML = linkifyText(messageText);
            messagesContainer.appendChild(botMessage);

            if (settings.suggestedQuestions && Array.isArray(settings.suggestedQuestions) && settings.suggestedQuestions.length > 0) {
                const suggestedQuestionsContainer = document.createElement('div');
                suggestedQuestionsContainer.className = 'suggested-questions';

                settings.suggestedQuestions.forEach(question => {
                    const questionButton = document.createElement('button');
                    questionButton.className = 'suggested-question-btn';
                    questionButton.textContent = question;
                    questionButton.addEventListener('click', () => {
                        submitMessage(question);
                        if (suggestedQuestionsContainer.parentNode) {
                            suggestedQuestionsContainer.parentNode.removeChild(suggestedQuestionsContainer);
                        }
                    });
                    suggestedQuestionsContainer.appendChild(questionButton);
                });

                messagesContainer.appendChild(suggestedQuestionsContainer);
            }

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Registration error:', error);

            const indicator = messagesContainer.querySelector('.typing-indicator');
            if (indicator) {
                messagesContainer.removeChild(indicator);
            }

            const errorMessage = document.createElement('div');
            errorMessage.className = 'chat-bubble bot-bubble';
            errorMessage.textContent = "عذراً، لم أتمكن من الاتصال بالخادم. يرجى المحاولة لاحقاً.";
            messagesContainer.appendChild(errorMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    async function submitMessage(messageText) {
        if (isWaitingForResponse) return;

        isWaitingForResponse = true;

        const name = nameInput ? nameInput.value.trim() : "";
        const number = numberInput ? numberInput.value.trim() : "";

        const requestData = {
            action: "sendMessage",
            sessionId: conversationId,
            route: settings.webhook.route,
            chatInput: messageText,
            metadata: {
                userId: number,
                userName: name
            }
        };

        const userMessage = document.createElement('div');
        userMessage.className = 'chat-bubble user-bubble';
        userMessage.textContent = messageText;
        messagesContainer.appendChild(userMessage);

        const typingIndicator = createTypingIndicator();
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(settings.webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const responseData = await response.json();

            messagesContainer.removeChild(typingIndicator);

            const botMessage = document.createElement('div');
            botMessage.className = 'chat-bubble bot-bubble';
            const responseText = Array.isArray(responseData) ? responseData[0].output : responseData.output;
            botMessage.innerHTML = linkifyText(responseText);
            messagesContainer.appendChild(botMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Message submission error:', error);

            messagesContainer.removeChild(typingIndicator);

            const errorMessage = document.createElement('div');
            errorMessage.className = 'chat-bubble bot-bubble';
            errorMessage.textContent = "عذراً، لم أتمكن من إرسال رسالتك. يرجى المحاولة مرة أخرى.";
            messagesContainer.appendChild(errorMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } finally {
            isWaitingForResponse = false;
        }
    }

    function autoResizeTextarea() {
        messageTextarea.style.height = 'auto';
        messageTextarea.style.height = (messageTextarea.scrollHeight > 120 ? 120 : messageTextarea.scrollHeight) + 'px';
    }

    startChatButton.addEventListener('click', showRegistrationForm);
    registrationForm.addEventListener('submit', handleRegistration);

    sendButton.addEventListener('click', () => {
        const messageText = messageTextarea.value.trim();
        if (messageText && !isWaitingForResponse) {
            submitMessage(messageText);
            messageTextarea.value = '';
            messageTextarea.style.height = 'auto';
        }
    });

    messageTextarea.addEventListener('input', autoResizeTextarea);

    messageTextarea.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const messageText = messageTextarea.value.trim();
            if (messageText && !isWaitingForResponse) {
                submitMessage(messageText);
                messageTextarea.value = '';
                messageTextarea.style.height = 'auto';
            }
        }
    });

    launchButton.addEventListener('click', () => {
        chatWindow.classList.toggle('visible');
    });

    const closeButtons = chatWindow.querySelectorAll('.chat-close-btn');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            chatWindow.classList.remove('visible');
        });
    });
})();
