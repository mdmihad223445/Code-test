// Enhanced protection with animated emoji
const laughEmoji = document.createElement('img');
laughEmoji.src = 'laughing.gif';
laughEmoji.style.position = 'fixed';
laughEmoji.style.top = '50%';
laughEmoji.style.left = '50%';
laughEmoji.style.transform = 'translate(-50%, -50%)';
laughEmoji.style.zIndex = '99999';
laughEmoji.style.width = '200px';

function showLaughingEmoji(message) {
    const warning = document.createElement('div');
    warning.style.position = 'fixed';
    warning.style.top = '0';
    warning.style.left = '0';
    warning.style.width = '100%';
    warning.style.height = '100%';
    warning.style.backgroundColor = 'black';
    warning.style.color = 'red';
    warning.style.fontSize = '32px';
    warning.style.display = 'flex';
    warning.style.flexDirection = 'column';
    warning.style.justifyContent = 'center';
    warning.style.alignItems = 'center';
    warning.style.zIndex = '99998';
    warning.style.textAlign = 'center';
    
    const text = document.createElement('div');
    text.textContent = message;
    text.style.marginBottom = '20px';
    
    warning.appendChild(text);
    warning.appendChild(laughEmoji.cloneNode());
    document.body.appendChild(warning);
    
    setTimeout(() => {
        warning.remove();
    }, 3000);
}

// Block right-click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showLaughingEmoji('You Cant Inspect NOOB 😂');
});

// Block keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Block Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        showLaughingEmoji('You Cant Ctrl+U NOOB 😂');
    }
    // Block F12, Ctrl+Shift+I, Ctrl+Shift+J
    else if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J')) {
        e.preventDefault();
        showLaughingEmoji('Nice Try NOOB 😂');
    }
});

// Prevent iframe embedding
if (window.location !== window.parent.location) {
    document.body.innerHTML = '<h1 style="color:red;text-align:center;">This page cannot be embedded</h1>';
}

// Detect dev tools opening
const devtools = /./;
devtools.toString = function() {
    showLaughingEmoji('Dev Tools? Really? 😂');
    return '';
};
console.log('%c', devtools);

// Mutation observer to detect DOM changes
new MutationObserver(() => {
    showLaughingEmoji('Stop Trying to Mess With Me 😂');
}).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
});

// Block text selection
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});
