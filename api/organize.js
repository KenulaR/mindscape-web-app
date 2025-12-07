// api/organize.js
export default async function handler(req, res) {
    // 1. Check if the request is valid
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // This grabs the key from the secure vault

    if (!apiKey) {
        return res.status(500).json({ error: 'Server misconfigured: No API Key' });
    }

    try {
        // 2. Call Google Gemini (Server to Server)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

        const data = await response.json();

        // 3. Clean the response and send it back to your frontend
        let rawText = data.candidates[0].content.parts[0].text;
        rawText = rawText.replace(/```json|```/g, '').trim();
        const jsonResult = JSON.parse(rawText);

        res.status(200).json(jsonResult);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'AI processing failed' });
    }
}