document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    // Keep AI button listener just in case you use it later
    document.getElementById('save-btn').addEventListener('click', handleInput);
    
    // Enable "Enter" key for manual inputs
    ['tools', 'shop', 'other'].forEach(category => {
        document.getElementById(`input-${category}`).addEventListener('keypress', function (e) {
            if (e.key === 'Enter') manualAdd(category);
        });
    });
});

// --- NEW MANUAL FUNCTION ---
function manualAdd(category) {
    const inputId = `input-${category}`;
    const inputElement = document.getElementById(inputId);
    const text = inputElement.value.trim();
    
    if (!text) return;

    // Create a simple note object (No AI summary, just the text)
    const newNote = {
        category: category,
        title: text,
        summary: "Manual Entry",
        url: text.startsWith('http') ? text : null
    };

    saveNote(newNote);
    inputElement.value = ''; // Clear box
    loadNotes(); // Refresh UI
}
// ---------------------------

async function handleInput() {
    const inputField = document.getElementById('user-input');
    const text = inputField.value.trim();
    if (!text) return;

    const status = document.getElementById('status-bar');
    status.textContent = "AI is thinking... (If this fails, use manual boxes)";

    try {
        const aiResult = await classifyWithGemini(text);
        saveNote(aiResult);
        inputField.value = '';
        loadNotes();
        status.textContent = "Organized!";
    } catch (error) {
        console.error(error);
        status.textContent = "AI Error. Please use manual inputs below.";
    }
}

async function classifyWithGemini(text) {
    const response = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
    });
    if (!response.ok) throw new Error("Server Error");
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
    ['tools', 'shop', 'other'].forEach(id => {
        const list = document.getElementById(`list-${id}`);
        if(list) list.innerHTML = '';
    });

    notes.forEach(note => {
        // Map old 'read' category to 'other' so we don't lose data
        let category = note.category;
        if (category === 'read') category = 'other';
        if (!['tools', 'shop', 'other'].includes(category)) category = 'other';

        const list = document.getElementById(`list-${category}`);
        
        if (list) {
            const li = document.createElement('li');
            li.className = 'card';
            
            const contentHtml = note.url 
                ? `<a href="${note.url}" target="_blank">🔗 ${note.title}</a>` 
                : `<span>📝 ${note.title}</span>`;

            li.innerHTML = `
                <div class="delete-btn" onclick="deleteNote(${note.id})">&times;</div>
                ${contentHtml}
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