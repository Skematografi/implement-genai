const messagesContainer = document.getElementById('messagesContainer');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const attachButton = document.getElementById('attachButton');
const fileInput = document.getElementById('fileInput');
const attachmentPreview = document.getElementById('attachmentPreview');
const errorMessage = document.getElementById('errorMessage');
const clearChatButton = document.getElementById('clearChatButton');

let isWaiting = false;
let currentAttachment = null;

const placeholders = [
    "Ask me about the universe...",
    "What's on your mind?",
    "I'm here to help.",
    "Let's chat!",
    "Tell me something interesting..."
];

function setRandomPlaceholder() {
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    messageInput.placeholder = placeholders[randomIndex];
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

function validateFile(file) {
    const maxSize = 1 * 1024 * 1024; // 1MB
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mp3', 'audio/wav', 'audio/mpeg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (file.size > maxSize) {
        showError('File is too large! Maximum size is 1MB.');
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        showError('Unsupported file type! Please use images, audio, PDF, or documents.');
        return false;
    }

    return true;
}

function formatResponse(text) {
    return text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
               .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
               .replace(/\n/g, '<br>');
}

function addMessage(content, isUser = false, attachment = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'message-user' : 'message-bot'}`;

    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';

    let messageContent = isUser ? content : formatResponse(content);
    if (attachment) {
        const attachmentDiv = `<div class="file-attachment">${attachment.name}</div>`;
        messageContent = attachmentDiv + (content ? `<div class="mt-2">${messageContent}</div>` : '');
    }

    messageBubble.innerHTML = messageContent;
    messageDiv.appendChild(messageBubble);
    messages.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

function showThinking() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinking';
    thinkingDiv.className = 'message message-bot';
    thinkingDiv.innerHTML = `<div class="message-bubble message-thinking">Thinking...</div>`;
    messages.appendChild(thinkingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return thinkingDiv;
}

function removeThinking() {
    const thinkingDiv = document.getElementById('thinking');
    if (thinkingDiv) {
        thinkingDiv.remove();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if ((!message && !currentAttachment) || isWaiting) {
        if (!message && !currentAttachment) {
            showError('Please enter a message or attach a file.');
        }
        return;
    }

    addMessage(message, true, currentAttachment);
    messageInput.value = '';
    setRandomPlaceholder();

    const attachmentToSend = currentAttachment;
    currentAttachment = null;
    attachmentPreview.classList.add('hidden');
    attachmentPreview.innerHTML = '';
    fileInput.value = '';

    isWaiting = true;
    sendButton.disabled = true;

    const thinkingDiv = showThinking();

    try {
        const response = await sendMessageToAPI(message, attachmentToSend);
        removeThinking();
        addMessage(response);
    } catch (error) {
        removeThinking();
        addMessage('An error occurred. Please try again.');
    }

    isWaiting = false;
    sendButton.disabled = false;
    messageInput.focus();
}

async function sendMessageToAPI(message, attachment) {
    if (!message && !attachment) {
        return;
    }
    
    let endpoint = window.API_BASE_URL + 'api/v1/chat';
    endpoint = endpoint.replace('undefined', '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    const formData = new FormData();
    if (message) {
        formData.append('prompt', message);
    }
    if (attachment) {
        formData.append('attachment', attachment);
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData, // The browser will automatically set the 'Content-Type' to 'multipart/form-data'
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.result) {
            throw new Error('Invalid response format');
        }

        return data.result;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            return 'Request timed out. Please try again.';
        }
        console.error('Error sending message:', error.message);
        return `Error: ${error.message}`;
    }
}

function clearChat() {
    messages.innerHTML = '';
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isWaiting) {
        sendMessage();
    }
});

attachButton.addEventListener('click', () => fileInput.click());
clearChatButton.addEventListener('click', clearChat);

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    attachmentPreview.innerHTML = '';
    attachmentPreview.classList.add('hidden');

    if (file && validateFile(file)) {
        currentAttachment = file;
        
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = file.name;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-attachment';
        removeButton.innerHTML = '×';
        removeButton.title = 'Remove attachment';

        removeButton.addEventListener('click', () => {
            currentAttachment = null;
            attachmentPreview.classList.add('hidden');
            attachmentPreview.innerHTML = '';
            fileInput.value = '';
        });

        attachmentPreview.appendChild(fileNameSpan);
        attachmentPreview.appendChild(removeButton);
        attachmentPreview.classList.remove('hidden');
    } else {
        fileInput.value = '';
    }
});

// Initial setup
setRandomPlaceholder();
placeholderInterval = setInterval(setRandomPlaceholder, 3000);
messageInput.focus();