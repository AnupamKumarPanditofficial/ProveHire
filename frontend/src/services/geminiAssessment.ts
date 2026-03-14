import type { Question, AssessmentResult, Violation } from '../types/assessment.types';
import { ROLE_SKILLS_MAP, FALLBACK_SKILLS } from '../pages/candidate/SkillZone/predefinedSkills';

import { API_BASE_URL } from '../globalConfig';
const API_URL = `${API_BASE_URL}/api/gemini/generate`;

/**
 * Reads the JWT token from localStorage and returns headers
 * including the Authorization bearer token.
 * This is required because /api/gemini/generate is auth-protected.
 */
function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
        const raw = localStorage.getItem('PROVAHIRE_USER');
        if (raw) {
            const user = JSON.parse(raw);
            if (user?.token) {
                headers['Authorization'] = `Bearer ${user.token}`;
            }
        }
    } catch (e) {
        console.warn('[AstraEval] Could not read auth token from localStorage:', e);
    }
    return headers;
}
class AstraEvalError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AstraEvalError';
    }
}

/**
 * Fetch with retry logic — handles 429 rate limits with extended backoff
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    options.credentials = 'include';
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);

            // Handle 429 rate limit — wait and retry with longer backoff
            if (response.status === 429) {
                if (i === retries) {
                    throw new Error('AI service is temporarily busy. Please try again in a minute.');
                }
                const waitMs = Math.pow(2, i + 1) * 1000; // 2s, 4s, 8s, 16s
                console.warn(`[AstraEval] Rate limited (429). Retrying in ${waitMs / 1000}s... (attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i === retries) throw error;
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
    throw new Error('Unreachable code');
}

/**
 * Helper to repair potentially truncated JSON from AI
 */
function repairJson(text: string): string {
    let clean = text.trim();
    // Remove markdown blocks
    clean = clean.replace(/```json|```/g, '').trim();

    // Strategy: Find the start, then balance brackets
    const firstBrace = clean.indexOf('{');
    if (firstBrace === -1) return clean;
    clean = clean.substring(firstBrace);

    let stack: string[] = [];
    let insideString = false;
    let escapes = false;
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (escapes) { escapes = false; continue; }
        if (char === '\\') { escapes = true; continue; }
        if (char === '"') { insideString = !insideString; continue; }
        if (insideString) continue;

        if (char === '{' || char === '[') stack.push(char);
        else if (char === '}' || char === ']') {
            const last = stack[stack.length - 1];
            if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
                stack.pop();
                if (stack.length === 0) { /* valid object end */ }
            }
        }
    }

    if (stack.length > 0) {
        // It's truncated. Try to slice at the last valid comma-separated object
        // For simplicity in a 5-question batch, we just close the brackets
        let repaired = clean;
        if (insideString) repaired += '"';
        while (stack.length > 0) {
            const last = stack.pop();
            repaired += last === '{' ? '}' : ']';
        }
        return repaired;
    }

    return clean;
}

/**
 * Helper to parse raw JSON from AstraEval response
 */
function parseAstraEvalJson<T>(text: string): T {
    const repaired = repairJson(text);
    try {
        return JSON.parse(repaired) as T;
    } catch (e) {
        console.error("JSON Parse Failure. Repaired text:", repaired);
        throw new AstraEvalError("Failed to parse response from AstraEval Intelligence Engine as JSON.");
    }
}

/**
 * Extract the actual text content from a Gemini API response.
 * Handles thinking models where parts[0] may be chain-of-thought.
 */
function extractTextFromResponse(data: any): string | null {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) return null;

    // First: find a non-thought part with text
    for (const part of parts) {
        if (part.text && !part.thought) return part.text;
    }
    // Fallback: last part's text
    for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].text) return parts[i].text;
    }
    return null;
}

/**
 * Generates assessment questions (MCQ) based on role and experience.
 * count: number of questions to generate (e.g. 30 for skill test, 45 for main test)
 */
export async function generateAssessmentQuestions(role: string, experience: string, count: number = 30): Promise<Question[]> {
    const batchSize = 10; // Balanced batch size for speed and reliability
    const allQuestions: Question[] = [];
    const numBatches = Math.ceil(count / batchSize);

    for (let i = 0; i < numBatches; i++) {
        const currentBatchSize = Math.min(batchSize, count - (i * batchSize));
        const batchStart = i * batchSize + 1;

        // Optimized prompt: zero-shot, no fluff, strict schema
        const prompt = `Task: Generate exactly ${currentBatchSize} technical interview questions.
Role: ${role}, Experience: ${experience}.
Format: JSON only.
Schema: {"questions":[{"id":"string","type":"theory"|"code","question":"string","code":"string|null","options":["s","s","s","s"],"correctIndex":0..3,"topic":"string","difficulty":"easy"|"medium"|"hard","explanation":"string"}]}
Start from ID index ${batchStart}.
No markdown preamble.`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
                maxOutputTokens: 2048
            }
        };

        try {
            const response = await fetchWithRetry(API_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const textResponse = extractTextFromResponse(data);

            if (!textResponse) throw new Error("Empty AI response");

            const parsed = parseAstraEvalJson<{ questions: Question[] }>(textResponse);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                allQuestions.push(...parsed.questions);
                console.log(`[Assessment] Batch ${i + 1}/${numBatches} OK. Total: ${allQuestions.length}`);
            }
        } catch (error) {
            console.error(`[Assessment] Batch ${i + 1} failed:`, error);
            // If we have at least 5 questions, we can let the user take the test instead of total failure
            if (allQuestions.length >= 5) break;
            throw error;
        }
    }

    if (allQuestions.length === 0) throw new AstraEvalError("Failed to generate questions. Service temporary unavailable.");
    return allQuestions.slice(0, count);
}

/**
 * Send final assessment data to Gemini for deep evaluation and study plan.
 */
export async function evaluateAssessment(
    questions: Question[],
    answers: Map<number, number>,
    violations: Violation[],
    totalTime: number,
    role: string
): Promise<AssessmentResult> {

    const correctCount = questions.reduce((acc, q, idx) => {
        return acc + (answers.get(idx) === q.correctIndex ? 1 : 0);
    }, 0);
    const score = correctCount; // Strict markings out of total questions

    // Build topic tracking locally to feed the AI
    const topicMap = new Map<string, { correct: number, total: number }>();
    questions.forEach((q, idx) => {
        const t = topicMap.get(q.topic) || { correct: 0, total: 0 };
        t.total++;
        if (answers.get(idx) === q.correctIndex) t.correct++;
        topicMap.set(q.topic, t);
    });

    const topicBreakdownStr = Array.from(topicMap.entries())
        .map(([topic, stats]) => `- ${topic}: ${stats.correct}/${stats.total} correct (${Math.round(stats.correct / stats.total * 100)}%)`)
        .join('\n');

    const wrongAnswersOptions: string[] = [];
    questions.forEach((q, idx) => {
        const selectedIdx = answers.get(idx);
        if (selectedIdx !== undefined && selectedIdx !== q.correctIndex) {
            wrongAnswersOptions.push(`Q: "${q.question}" | Selected: "${q.options[selectedIdx]}" | Correct: "${q.options[q.correctIndex]}"`);
        }
    });
    const wrongAnswersDetailStr = wrongAnswersOptions.slice(0, 15).join('\n'); // limit size

    const prompt = `You are a Senior Engineering Hiring Manager at FAANG. Analyze this candidate assessment result.

Role: ${role}
Total Questions: ${questions.length}
Correct Answers: ${correctCount}
Raw Score: ${score}%
Time Taken: ${totalTime} seconds
Total Violations Flagged: ${violations.length}

Topic-wise performance:
${topicBreakdownStr}

Sample Wrong Answers:
${wrongAnswersDetailStr || "None"}

Generate comprehensive report as ONLY valid JSON matching this schema exactly:
{
  "testScore": number (exact matching Correct Answers integer out of ${questions.length}),
  "grade": "A+" | "A" | "B" | "C" | "D" | "F",
  "passed": boolean (>= ${Math.floor(questions.length * 0.7)} is pass),
  "topicWise": [
    {
      "topic": "String",
      "correct": number,
      "total": number,
      "percentage": number,
      "status": "Strong" | "Average" | "Weak"
    }
  ],
  "strengths": ["string array, 3-5 specific technical strengths"],
  "weaknesses": ["string array, 3-5 technical improvement areas"],
  "recommendation": "Hire" | "Maybe" | "Reject",
  "aiVerdict": "Brief 2-sentence summary of technical capability without motivational or educational filler.",
  "studyPlan": ["3 specific missing skills"],
  "integrityScore": number (0-100, deduct heavily for violations, full score is 100),
  "totalViolations": number
}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json"
        }
    };

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const textResponse = extractTextFromResponse(data);

        if (!textResponse) throw new AstraEvalError("Empty response from AstraEval Intelligence Engine.");

        return parseAstraEvalJson<AssessmentResult>(textResponse);
    } catch (error) {
        console.error("Error evaluating assessment:", error);
        throw error instanceof AstraEvalError ? error : new Error("Network error communicating with AstraEval Intelligence Engine.");
    }
}

export interface ResumeScore {
    total: number;
    breakdown: {
        roleAlignment: number;
        skillDepth: number;
        projectAuthenticity: number;
        githubVerification: number;
        modernTrends: number;
        structureGrammar: number;
    };
}

/**
 * Send the extracted text of the resume to Gemini for ATS evaluation.
 */
export async function evaluateResume(
    resumeText: string,
    role: string,
    experience: string
): Promise<ResumeScore> {

    const prompt = `You are an elite Tech Recruiter Applicant Tracking System (ATS).
Evaluate this candidate's resume based on strict criteria for a ${role} with ${experience} experience.

EVALUATION CRITERIA (Max 90 points):
- Role Alignment (Max 15)
- Skill Depth Proof (Max 15)
- Project Authenticity (Max 20): Penalize generic/tutorial projects
- GitHub/Portfolio Verification (Max 15): Estimate presence/quality based on text
- Modern Industry Trends (Max 15)
- Resume Structure & Grammar (Max 10)

RULES:
- Penalize keyword stuffing
- Penalize vague statements
- Generate the output strictly as JSON.

RETURN FORMAT:
{
    "total": number, // out of 90 (DO NOT convert to 100% scale here)
    "breakdown": {
        "roleAlignment": number,
        "skillDepth": number,
        "projectAuthenticity": number,
        "githubVerification": number,
        "modernTrends": number,
        "structureGrammar": number
    }
}

RESUME TEXT:
"""
${resumeText}
"""`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    };

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const textResponse = extractTextFromResponse(data);

        if (!textResponse) throw new AstraEvalError("Empty response from AstraEval Intelligence Engine.");

        const parsed = parseAstraEvalJson<ResumeScore>(textResponse);

        // Final normalization to percentage (out of 100)
        return {
            total: Math.round((parsed.total / 90) * 100),
            breakdown: parsed.breakdown
        };
    } catch (error) {
        console.error("Error evaluating resume:", error);
        throw error instanceof AstraEvalError ? error : new Error("Network error communicating with AstraEval Intelligence Engine.");
    }
}

/**
 * Analyzes a webcam frame to detect face presence/integrity issues
 */
export async function astraCheckFace(base64Image: string): Promise<{
    faceDetected: boolean;
    multipleFaces: boolean;
    lookingAway: boolean;
    suspicious: boolean;
    reason: string | null;
}> {

    const prompt = `Analyze this webcam image from an online exam. Return ONLY JSON matching this interface exactly:
{
  "faceDetected": boolean,
  "multipleFaces": boolean,
  "lookingAway": boolean,
  "suspicious": boolean,
  "reason": "string if suspicious else null"
}`;

    const payload = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    };

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        }, 1); // Only 1 retry for face checks to not block event loop too long

        const data = await response.json();
        const textResponse = extractTextFromResponse(data);

        if (!textResponse) throw new AstraEvalError("Empty response from AstraEval Intelligence Engine.");

        return parseAstraEvalJson(textResponse);
    } catch (error) {
        // Fallback silently so we don't crash the exam on a single failed image upload
        console.error("Error evaluating face:", error);
        return {
            faceDetected: true,
            multipleFaces: false,
            lookingAway: false,
            suspicious: false,
            reason: null
        };
    }
}

/**
 * Validates if the Gemini API key is working by sending a minimal ping request.
 */
export async function testGeminiConnection(): Promise<boolean> {

    const prompt = "Ping. Reply with exactly the word 'Pong'.";
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0 }
    };

    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        }, 1);

        if (!response.ok) return false;
        const data = await response.json();
        return !!extractTextFromResponse(data);
    } catch (e) {
        return false;
    }
}

export interface RecommendedSkill {
    name: string;
    importance: string;
    icon: string;
}

/**
 * Fetch top 5 required skills for the given role
 */
export async function fetchTopSkills(role: string): Promise<RecommendedSkill[]> {
    console.log(`[AstraEval] Fetching predefined skills for role: ${role}`);
    
    // Check if we have exact predefined skills for this role
    const predefinedSkills = ROLE_SKILLS_MAP[role];
    
    if (predefinedSkills && predefinedSkills.length > 0) {
        // Return a promise resolving to the static skills to maintain API compatibility
        return Promise.resolve(predefinedSkills);
    }
    
    // If exact role not found, return the generic fallback array
    console.warn(`[AstraEval] No predefined skills found for role: ${role}. Using fallback.`);
    return Promise.resolve(FALLBACK_SKILLS);
}
