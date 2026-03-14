// geminiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateContent = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is not defined in backend .env");
            return res.status(500).json({ error: "Server configuration error regarding AI. Missing API Key." });
        }

        const { contents, generationConfig } = req.body;
        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: "Missing or invalid 'contents' in request body." });
        }

        // Initialize the official Gemini SDK
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // As requested by user: Make sure we are strictly using the gemini 2 model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Extract the raw prompt text string. The frontend sends: contents: [{ parts: [{ text: "..." }] }]
        let promptText = '';
        for (const content of contents) {
            if (content.parts && Array.isArray(content.parts)) {
                for (const part of content.parts) {
                    if (part.text) promptText += part.text + '\n';
                }
            }
        }

        if (!promptText.trim()) {
            return res.status(400).json({ error: "Could not extract text prompt from contents." });
        }

        // Map frontend generationConfig parameters like temperature and responseMimeType
        const config = {
            temperature: generationConfig?.temperature || 0.1,
            maxOutputTokens: generationConfig?.maxOutputTokens || 2048,
        };

        if (generationConfig?.responseMimeType) {
            config.responseMimeType = generationConfig.responseMimeType;
        }

        console.log(`[Gemini Native] Calling gemini-2.0-flash...`);
        
        // Execute the native Gemini request
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: config
        });

        const responseText = result.response.text();

        console.log(`[Gemini Native] Response Length: ${responseText?.length || 0}`);
        
        // Normalize the response to the exact shape the frontend expects so no frontend changes are needed:
        // { candidates: [{ content: { parts: [{ text }] } }] }
        res.json({
            candidates: [{
                content: {
                    parts: [{ text: responseText }]
                }
            }]
        });

    } catch (error) {
        console.error("Error in geminiController:", error);
        res.status(500).json({ error: "Internal server error during Gemini API generation." });
    }
};

module.exports = {
    generateContent
};
