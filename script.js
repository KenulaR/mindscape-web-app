const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
    checkApiKey();
});

function setupEventListeners() {
    // KEEP THIS LINE (It makes the main button work)
    document.getElementById('save-btn').addEventListener('click', handleInput);

    // DELETE everything else (Modal controls, settings-btn, save-settings-btn)
}

function checkApiKey() {
    const key = localStorage.getItem('geminiApiKey');
    const status = document.getElementById('status-bar');
    if (!key) {
        status.textContent = "⚠️ Missing API Key. Click Settings to configure.";
        status.style.color = "#ff6b6b";
    } else {
        status.textContent = "AI System Ready.";
        status.style.color = "#a0a0a0";
    }
}

async function handleInput() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    if (!text) return;

    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        alert("Please set your Gemini API Key in settings first.");
        return;
    }

    // UI Feedback
    const btn = document.getElementById('save-btn');
    const status = document.getElementById('status-bar');
    const originalText = btn.innerText;
    
    btn.innerText = "Thinking...";
    btn.disabled = true;
    status.textContent = "Analyzing content structure...";

    try {
        const aiResult = await classifyWithGemini(text, apiKey);
        saveNote(aiResult);
        inputField.value = '';
        loadNotes();
        status.textContent = "Organized successfully!";
        setTimeout(() => checkApiKey(), 2000);
    } catch (error) {
        console.error(error);
        status.textContent = "Error: " + error.message;
        alert("Failed to organize. Check your API key or internet connection.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function classifyWithGemini(text) {
    // We no longer need the API key here!
    // We send the text to OUR own secure API
    const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Server Error");
    }

    // The server returns the clean JSON note object directly
    return await response.json();
}

function saveNote(noteObj) {
    const notes = JSON.parse(localStorage.getItem('mindscapeNotes') || "[]");
    notes.push({ 
        ...noteObj, 
        id: Date.now(), 
        originalText: noteObj.url || noteObj.title 
    });
    localStorage.setItem('mindscapeNotes', JSON.stringify(notes));
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('mindscapeNotes') || "[]");
    
    // Clear lists
    ['read', 'tools', 'shop', 'other'].forEach(id => {
        document.getElementById(`list-${id}`).innerHTML = '';
    });

    notes.forEach(note => {
        const category = ['read', 'tools', 'shop', 'other'].includes(note.category) ? note.category : 'other';
        const list = document.getElementById(`list-${category}`);
        
        const li = document.createElement('li');
        li.className = 'card';
        
        // Determine if it's a clickable link or just text
        const contentHtml = note.url 
            ? `<a href="${note.url}" target="_blank"><span class="card-title">🔗 ${note.title}</span>` 
            : `<span class="card-title">📝 ${note.title}</span>`;

        li.innerHTML = `
            <div class="delete-btn" onclick="deleteNote(${note.id})">&times;</div>
            ${contentHtml}
            <div class="card-summary">${note.summary}</div>
            ${note.url ? '</a>' : ''}
        `;
        list.appendChild(li);
    });
}

// Global delete function
window.deleteNote = (id) => {
    const notes = JSON.parse(localStorage.getItem('mindscapeNotes') || "[]");
    const newNotes = notes.filter(n => n.id !== id);
    localStorage.setItem('mindscapeNotes', JSON.stringify(newNotes));
    loadNotes();
};