import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiResponseSchema } from '../constants/schemas.js';
import { SCAM_DETECTION_SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from '../constants/prompts.js';
import { config } from '../config/env.js';
import { analyzeWithFallback } from './fallback.service.js';

let genAI = null;
if (config.geminiApiKey) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
}

/**
 * Multimodal scam detection service using Gemini Flash
 * Evaluates 10 signals, provides Hindi/English explanations, and enforces strict JSON schema.
 */
export async function analyzeScamInput({ text, file, sender = 'Unknown', language = 'en' }) {
  // If API key is missing, seamlessly use the Hackathon Resilience Fallback
  if (!genAI || !config.geminiApiKey) {
    console.warn('⚡ Zero-Crash Mode: No GEMINI_API_KEY set. Using heuristic analysis engine.');
    return analyzeWithFallback(text || 'Screenshot upload analysis (fallback engine)', sender);
  }

  try {
    const userParts = [];

    // Multimodal image processing: Gemini Flash inspects screenshots directly
    if (file && file.buffer) {
      userParts.push({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype || 'image/png',
        },
      });
      userParts.push({
        text: `Analyze this suspicious message/chat screenshot. First extract all text visible via native OCR, sender details, URLs, and phone numbers. Then thoroughly evaluate all 10 cybersecurity signals. Reported sender: ${sender}. Target regional language: ${language}.`,
      });
    } else {
      userParts.push({
        text: `Analyze this suspicious message:
"""
${text}
"""
Reported Sender: ${sender}
Preferred Language: ${language}

Evaluate all 10 signals and output strictly in JSON according to the schema.`,
      });
    }

    const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SCAM_DETECTION_SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: geminiResponseSchema,
            temperature: 0.1,
          },
        });

        const response = await model.generateContent({
          contents: [
            ...FEW_SHOT_EXAMPLES,
            {
              role: 'user',
              parts: userParts,
            },
          ],
        });

        const responseText = response.response.text();
        const structuredOutput = JSON.parse(responseText);
        structuredOutput.fallback_mode = false;
        structuredOutput.model_used = modelName;
        return structuredOutput;
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Model ${modelName} encountered: ${err.message}. Trying next candidate...`);
      }
    }

    throw lastError;
  } catch (error) {
    console.error('⚠️ Gemini Flash API call failed. Falling back gracefully:', error.message);
    const fallbackVerdict = analyzeWithFallback(
      text || 'Screenshot image analysis (fallback mode)',
      sender
    );
    fallbackVerdict.fallback_reason = error.message;
    return fallbackVerdict;
  }
}
