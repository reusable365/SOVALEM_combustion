"use strict";
/**
 * SOVALEM Secure Gemini Proxy
 *
 * This Cloud Function acts as a secure proxy between the frontend and Vertex AI.
 * The API key never leaves the server, providing enhanced security.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiProxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const vertexai_1 = require("@google-cloud/vertexai");
const cors_1 = __importDefault(require("cors"));
// Initialize Vertex AI with the project from environment
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "sovalem-cadario-beta";
const LOCATION = "europe-west1"; // Closer to France for lower latency
const vertexAI = new vertexai_1.VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
});
// Use Gemini 2.0 Flash model
const generativeModel = vertexAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
});
// CORS middleware - Restrict to SOVALEM domains only
const ALLOWED_ORIGINS = [
    'https://sovalem-cadario-beta.web.app',
    'https://sovalem-cadario-beta.firebaseapp.com',
    'http://localhost:5173', // Development
    'http://localhost:4173', // Preview
];
const corsHandler = (0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
});
/**
 * Secure Gemini Proxy Function
 *
 * Accepts POST requests with:
 * - prompt: string (required)
 * - imageData: array of { base64, mimeType } (optional, for vision)
 */
exports.geminiProxy = (0, https_1.onRequest)({
    region: "europe-west1",
    cors: true,
    maxInstances: 10,
    timeoutSeconds: 60,
}, async (req, res) => {
    // Handle CORS preflight
    corsHandler(req, res, async () => {
        // Only allow POST
        if (req.method !== "POST") {
            res.status(405).json({ error: "Method not allowed" });
            return;
        }
        try {
            const body = req.body;
            if (!body.prompt) {
                res.status(400).json({ error: "Missing 'prompt' in request body" });
                return;
            }
            // Build the content parts
            const parts = [
                { text: body.prompt },
            ];
            // Add images if provided (for vision analysis)
            if (body.imageData && body.imageData.length > 0) {
                for (const img of body.imageData) {
                    parts.push({
                        inlineData: {
                            mimeType: img.mimeType,
                            data: img.base64,
                        },
                    });
                }
            }
            // Call Vertex AI
            const result = await generativeModel.generateContent({
                contents: [{ role: "user", parts }],
            });
            const response = result.response;
            const text = response.candidates?.[0]?.content?.parts?.[0];
            if (!text || !("text" in text)) {
                res.status(500).json({ error: "No response from model" });
                return;
            }
            // Return the response
            res.status(200).json({
                success: true,
                response: text.text,
            });
        }
        catch (error) {
            console.error("Gemini Proxy Error:", error);
            res.status(500).json({
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
});
//# sourceMappingURL=index.js.map