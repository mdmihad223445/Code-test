// Anti-theft and protection measures
(function() {
    // Block right-click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showWarning();
    });

    // Block keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+J
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') || 
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'J')) {
            e.preventDefault();
            showWarning();
        }
    });

    // Detect iframe embedding
    if (window.location !== window.parent.location) {
        document.body.innerHTML = '<h1 style="color:red;text-align:center;">This page cannot be embedded</h1>';
    }

    // Detect dev tools
    let devtools = /./;
    devtools.toString = function() {
        showWarning();
        return '';
    };
    console.log('%c', devtools);

    function showWarning() {
        const warning = document.createElement('div');
        warning.style = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: black;
            color: red;
            font-size: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        warning.textContent = 'ACCESS DENIED - Inspection Not Allowed';
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 3000);
    }

    // Mutation observer to detect DOM changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                showWarning();
            }
        });
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();
