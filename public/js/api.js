// Shared helpers used by both pages.

// Sends a request to our REST API and returns the JSON reply.
// If the server answers with an error status, throws an Error carrying
// the server's message so the page can show it to the user.
async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
}

// Creates a DOM element. Text is always set with textContent, so names typed
// by users can never be interpreted as HTML.
function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value);
    }
    for (const child of children) node.append(child);
    return node;
}

// Shows a message in the page's status area (role="status" / "alert").
function showMessage(text, isError = false) {
    const box = document.getElementById('message');
    box.textContent = text;
    box.className = isError ? 'message error' : 'message ok';
    box.setAttribute('role', isError ? 'alert' : 'status');
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
        box.textContent = '';
        box.className = 'message';
    }, 4000);
}

const fullName = (e) => `${e.firstName} ${e.lastName}`;
