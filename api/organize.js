export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server Misconfigured: No GEMINI_API_KEY found.' });
    }

    // FIX: Using a model CONFIRMED to be in your available list
    // 'gemini-2.0-flash-001' is fast, capable, and stable.
    const MODEL_NAME = "gemini-2.0-flash-001"; 

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this input: "${text}". 
                        Categorize into exactly one: "read", "tools", "shop", "other".
                        Create a short title and 1-sentence summary.
                        Return strictly valid JSON: { "category": "...", "title": "...", "summary": "...", "url": "..." (or null) }`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Google Gemini API Error:", JSON.stringify(errorData, null, 2));
            return res.status(response.status).json({ 
                error: `Google Error: ${errorData.error?.message || response.statusText}` 
            });
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
             return res.status(500).json({ error: "AI returned no results." });
        }

        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json|```/g, '').trim();
        const jsonResult = JSON.parse(rawText);

        res.status(200).json(jsonResult);

    } catch (error) {
        console.error("Server Crash:", error);
        res.status(500).json({ error: `Server Crash: ${error.message}` });
    }
}