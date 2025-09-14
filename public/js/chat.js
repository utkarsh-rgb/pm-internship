const chatToggle = document.getElementById('chat-toggle');
const chatOverlay = document.getElementById('chat-overlay');
const chatClose = document.getElementById('chat-close');
const chatSend = document.getElementById('chat-send');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Toggle overlay
chatToggle.addEventListener('click', () => {
  chatOverlay.style.display = 'flex';
});

// Close overlay
chatClose.addEventListener('click', () => {
  chatOverlay.style.display = 'none';
});

// Send message
chatSend.addEventListener('click', () => {
  if(chatInput.value.trim() !== '') {
    const msg = document.createElement('div');
    msg.textContent = chatInput.value;
    msg.className = 'chat-message';
    chatMessages.appendChild(msg);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
