/**
 * SOVALEM Secure Gemini Proxy
 * 
 * This Cloud Function acts as a secure proxy between the frontend and Vertex AI.
 * The API key never leaves the server, providing enhanced security.
 */

import { onRequest } from "firebase-functions/v2/https";
import { VertexAI } from "@google-cloud/vertexai";
import cors from "cors";

// Initialize Vertex AI with the project from environment
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "sovalem-cadario-beta";
const LOCATION = "europe-west1"; // Closer to France for lower latency

const vertexAI = new VertexAI({
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

const corsHandler = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
});

/**
 * Request body interface
 */
interface GeminiProxyRequest {
    prompt: string;
    imageData?: {
        base64: string;
        mimeType: string;
    }[];
}

/**
 * Secure Gemini Proxy Function
 * 
 * Accepts POST requests with:
 * - prompt: string (required)
 * - imageData: array of { base64, mimeType } (optional, for vision)
 */
export const geminiProxy = onRequest(
    {
        region: "europe-west1",
        cors: true,
        maxInstances: 10,
        timeoutSeconds: 60,
    },
    async (req, res) => {
        // Handle CORS preflight
        corsHandler(req, res, async () => {
            // Only allow POST
            if (req.method !== "POST") {
                res.status(405).json({ error: "Method not allowed" });
                return;
            }

            try {
                const body = req.body as GeminiProxyRequest;

                if (!body.prompt) {
                    res.status(400).json({ error: "Missing 'prompt' in request body" });
                    return;
                }

                // Build the content parts
                const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
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

            } catch (error) {
                console.error("Gemini Proxy Error:", error);
                res.status(500).json({
                    error: "Internal server error",
                    details: error instanceof Error ? error.message : "Unknown error",
                });
            }
        });
    }
);
