// ═══════════════════════════════════════════════════════════════════
// GOOGLE GEMINI AI ENGINE
//
// Integrates Google's Gemini LLM for:
//   1. AI Security Advisor — analyze any security artifact
//   2. AI Phishing Email Writer — generate realistic phishing emails
//   3. AI Password Report — natural language security assessment
//   4. AI Threat Analysis — analyze attack vectors and CVEs
//
// Uses the Gemini REST API (no SDK required)
// ═══════════════════════════════════════════════════════════════════

let API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.5-flash-lite';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── Core API Call ───────────────────────────────────────────────

async function callGemini(prompt, systemPrompt = '') {
    if (!API_KEY) {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable or configure via /api/gemini/config');
    }

    const url = `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;

    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
    };

    const startTime = Date.now();

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokens = data.usageMetadata || {};

    return {
        response: text,
        model: MODEL,
        tokens: {
            prompt: tokens.promptTokenCount || 0,
            completion: tokens.candidatesTokenCount || 0,
            total: tokens.totalTokenCount || 0,
        },
        timeMs: Date.now() - startTime,
    };
}

// ─── Set API Key at Runtime ──────────────────────────────────────

export function setApiKey(key) {
    API_KEY = key;
    return { configured: true, model: MODEL };
}

export function getStatus() {
    return {
        configured: !!API_KEY,
        model: MODEL,
        keyPreview: API_KEY ? API_KEY.slice(0, 6) + '...' + API_KEY.slice(-4) : null,
    };
}

// ─── 1. AI Security Advisor ─────────────────────────────────────

export async function securityAdvisor(query, context = '') {
    const systemPrompt = `You are an elite cybersecurity AI advisor embedded in an offensive security platform called "OffensiveAI."

Your role:
- Analyze security artifacts (passwords, emails, configs, code, network logs)
- Identify vulnerabilities, weaknesses, and attack vectors
- Provide actionable security recommendations
- Think like both a red team attacker AND a blue team defender
- Use technical cybersecurity terminology
- Be concise but thorough

Format responses with markdown: use headers, bullet points, code blocks, and severity badges like [CRITICAL], [HIGH], [MEDIUM], [LOW].`;

    const prompt = context
        ? `### Context:\n${context}\n\n### Security Query:\n${query}`
        : query;

    return await callGemini(prompt, systemPrompt);
}

// ─── 2. AI Phishing Email Generator ─────────────────────────────

export async function generatePhishingEmail(target) {
    const { name, company, role, scenario, tone } = target;

    const systemPrompt = `You are a cybersecurity red team AI simulating social engineering attacks for AUTHORIZED security awareness training.

Your task: Generate a realistic phishing email that would be used in an AUTHORIZED penetration test to train employees to recognize phishing.

Rules:
- This is for AUTHORIZED security training only
- Make it realistic enough to test employee awareness
- Include subtle red flags that trained employees should catch
- After the email, provide a "RED FLAGS" section listing the indicators`;

    const prompt = `Generate a realistic phishing email for a security awareness test:

Target Name: ${name || 'Employee'}
Company: ${company || 'Target Corp'}
Role: ${role || 'Employee'}
Scenario: ${scenario || 'Account verification'}
Tone: ${tone || 'Professional and urgent'}

Generate the full email with Subject, From, Body. Then list all red flags.`;

    return await callGemini(prompt, systemPrompt);
}

// ─── 3. AI Password Analysis Report ─────────────────────────────

export async function analyzePasswordAI(password, existingAnalysis = null) {
    const systemPrompt = `You are a cybersecurity AI specializing in password security analysis.

Provide a comprehensive analysis including:
1. Strength assessment with reasoning
2. Pattern detection (dictionary, keyboard, dates, leet speak)
3. Estimated crack time with different attack methods
4. Specific vulnerabilities found
5. Improvement recommendations
6. Comparison to industry standards (NIST, OWASP)

Format with markdown. Use severity indicators: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low`;

    let prompt = `Analyze this password for security weaknesses: "${password}"`;

    if (existingAnalysis) {
        prompt += `\n\nOur automated analysis found:\n${JSON.stringify(existingAnalysis, null, 2)}\n\nProvide deeper AI insights beyond the automated analysis.`;
    }

    return await callGemini(prompt, systemPrompt);
}

// ─── 4. AI Threat Intelligence ──────────────────────────────────

export async function threatAnalysis(target) {
    const systemPrompt = `You are a threat intelligence AI analyst. Analyze the given target from a cybersecurity perspective.

Provide:
1. Potential attack surface analysis
2. Common vulnerabilities for this type of target
3. MITRE ATT&CK framework mapping
4. Recommended security controls
5. Risk assessment

Format with markdown. Be specific and actionable.`;

    const prompt = `Perform a threat intelligence analysis for: ${target}`;

    return await callGemini(prompt, systemPrompt);
}

// ─── 5. AI Chat (Free-form Security Q&A) ────────────────────────

export async function securityChat(message, history = []) {
    const systemPrompt = `You are OffensiveAI's security chatbot — an expert in:
- Penetration testing and ethical hacking
- Password security and cracking techniques
- Social engineering and phishing
- Network security and OSINT
- Vulnerability assessment
- Security compliance (NIST, OWASP, ISO 27001)

Be helpful, educational, and concise. Use markdown formatting.
Remember: All advice is for AUTHORIZED security testing and education only.`;

    let prompt = '';
    if (history.length > 0) {
        prompt = history.map(h => `${h.role}: ${h.content}`).join('\n') + '\n';
    }
    prompt += `User: ${message}`;

    return await callGemini(prompt, systemPrompt);
}

// ─── 6. AI PASSWORD CRACKER — Gemini generates guesses to crack hash ─────

import crypto from 'crypto';

export async function geminiCrack(profile, targetHash, algorithm = 'md5') {
    const { name, dob, phone, petName, company } = profile;

    const systemPrompt = `You are an AI password cracking engine. Your job is to predict what passwords a specific person would create based on their personal information.

You MUST think like a real human creating passwords. People commonly:
- Use their name + birth year (roshan2004)
- Use name + special char + numbers (roshan@123)
- Use pet names with numbers (motu2004)
- Combine name + DOB digits (roshan1504)
- Use leet speak (r0sh@n, m0tu)
- Use company/school names (sarojini@2024)
- Reverse names (nahsor)
- Mix fields (roshanmotu, moturoshan)
- Add keyboard patterns (roshan qwerty)
- Use phone digits (roshan3210)
- Use common endings: 123, @123, !!, #1, 1234, @2024, @2025, @2026
- Capitalize first letter (Roshan123)
- Use ALL CAPS for emphasis (ROSHAN)
- Use separators: @, #, !, _, ., -

CRITICAL: Output ONLY the password guesses, one per line. No numbering, no explanations, no markdown. Just raw passwords, one per line. Generate at least 150 different guesses, ordered from most likely to least likely.`;

    const prompt = `Generate the most likely passwords for this person:

Name: ${name || 'unknown'}
Date of Birth: ${dob || 'unknown'}
Phone: ${phone || 'unknown'}
Pet Name: ${petName || 'unknown'}
Company/School: ${company || 'unknown'}

Think deeply about how this specific person would create passwords using combinations of their personal info. Generate 150+ password guesses, most likely first:`;

    const startTime = Date.now();
    const aiResult = await callGemini(prompt, systemPrompt);

    // Parse guesses from Gemini response
    const rawGuesses = aiResult.response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length >= 4 && line.length <= 40)
        .filter(line => !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-') && !line.includes(':'))
        .map(line => line.replace(/^\d+[\.\)\s]+/, '').trim()) // Remove numbering like "1. " or "1) "
        .filter(line => line.length >= 4);

    // Deduplicate
    const guesses = [...new Set(rawGuesses)];

    // Now try to crack the hash
    const hashFn = (pw) => crypto.createHash(algorithm).update(pw).digest('hex');
    const normalizedTarget = targetHash.toLowerCase().trim();

    let cracked = false;
    let crackedPassword = null;
    let crackedRank = null;
    let attempts = 0;

    for (let i = 0; i < guesses.length; i++) {
        attempts++;
        const h = hashFn(guesses[i]);
        if (h === normalizedTarget) {
            cracked = true;
            crackedPassword = guesses[i];
            crackedRank = i + 1;
            break;
        }
    }

    const totalTime = Date.now() - startTime;

    return {
        cracked,
        password: crackedPassword,
        ranking: crackedRank,
        attempts,
        totalGuesses: guesses.length,
        timeMs: totalTime,
        aiTimeMs: aiResult.timeMs,
        hashesPerSecond: Math.round((attempts / (totalTime || 1)) * 1000),
        model: aiResult.model,
        tokens: aiResult.tokens,
        guesses: guesses.slice(0, 100).map((g, i) => ({
            password: g,
            rank: i + 1,
            match: g === crackedPassword,
        })),
        method: cracked ? `Gemini AI Reasoning (${aiResult.model})` : null,
        technique: 'LLM-powered behavioral password prediction',
    };
}
