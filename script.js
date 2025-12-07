// script.js (Clean Version)

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    // Only one event listener needed now
    document.getElementById('save-btn').addEventListener('click', handleInput);
});

async function handleInput() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    if (!text) return;

    // UI Feedback
    const btn = document.getElementById('save-btn');
    const status = document.getElementById('status-bar');
    const originalText = btn.innerText;
    
    btn.innerText = "Thinking...";
    btn.disabled = true;
    status.textContent = "Analyzing content structure...";
    status.style.color = "#a0a0a0"; // Reset color

    try {
        // Send text to YOUR Vercel API (No key needed here)
        const aiResult = await classifyWithGemini(text);
        
        saveNote(aiResult);
        inputField.value = '';
        loadNotes();
        status.textContent = "Organized successfully!";
    } catch (error) {
        console.error(error);
        status.textContent = "Error: " + error.message;
        status.style.color = "#ff6b6b";
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function classifyWithGemini(text) {
    const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
        // If the server fails, try to read the error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

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
        const list = document.getElementById(`list-${id}`);
        if(list) list.innerHTML = '';
    });

    notes.forEach(note => {
        const category = ['read', 'tools', 'shop', 'other'].includes(note.category) ? note.category : 'other';
        const list = document.getElementById(`list-${category}`);
        
        if (list) {
            const li = document.createElement('li');
            li.className = 'card';
            
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
        }
    });
}

window.deleteNote = (id) => {
    const notes = JSON.parse(localStorage.getItem('mindscapeNotes') || "[]");
    const newNotes = notes.filter(n => n.id !== id);
    localStorage.setItem('mindscapeNotes', JSON.stringify(newNotes));
    loadNotes();
};