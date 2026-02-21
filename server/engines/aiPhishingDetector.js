// ═══════════════════════════════════════════════════════════════════
// NLP PHISHING DETECTOR — AI/ML Email Classifier
//
// Uses TF-IDF vectorization + Naive Bayes classifier trained on
// phishing vs. legitimate email patterns. Analyzes text for:
//   - Urgency indicators
//   - Suspicious URL patterns
//   - Authority impersonation
//   - Emotional manipulation
//   - Technical deception
//
// Training Data: 145 labeled emails from Nazario Phishing Corpus,
//   APWG, CSIC, and SecLists public datasets
//
// AI Techniques: TF-IDF, Naive Bayes, NLP Feature Engineering
// ═══════════════════════════════════════════════════════════════════

import { phishingCorpus } from '../data/phishingCorpus.js';

// ─── Training Data — merged built-in + large corpus ──────────────
const BUILTIN_CORPUS = [
    { text: 'Your account has been suspended please verify your identity immediately click here to restore access', label: 'phishing' },
    { text: 'URGENT action required your password will expire in 24 hours update now to avoid losing access', label: 'phishing' },
    { text: 'Congratulations you have won a free gift card claim your prize before it expires', label: 'phishing' },
    { text: 'Dear customer we detected unusual activity on your account please confirm your credentials', label: 'phishing' },
    { text: 'Your package could not be delivered please update your shipping information to receive your order', label: 'phishing' },
    { text: 'IT Security Alert your email account will be deactivated unless you verify within 12 hours', label: 'phishing' },
    { text: 'You have received a secure document from your bank click the link to view it now', label: 'phishing' },
    { text: 'Important notice your tax refund is pending submit your bank details to receive payment', label: 'phishing' },
    { text: 'Your Apple ID was used to sign in on a new device if this was not you click here immediately', label: 'phishing' },
    { text: 'Warning your computer has been infected with malware download our security software now', label: 'phishing' },
    { text: 'Dear employee please review the attached invoice and process payment by end of day', label: 'phishing' },
    { text: 'Exclusive offer limited time only get 90 percent off luxury items click here to shop now', label: 'phishing' },
    { text: 'Your Microsoft 365 subscription payment failed update your billing information to continue service', label: 'phishing' },
    { text: 'We noticed someone accessed your account from an unknown location verify your identity now', label: 'phishing' },
    { text: 'Urgent wire transfer request from CEO please process immediately confidential do not discuss', label: 'phishing' },
    { text: 'Your Netflix account has been locked due to billing issue click to update payment method', label: 'phishing' },
    { text: 'Free iPhone giveaway you have been selected as a winner claim before midnight tonight', label: 'phishing' },
    { text: 'Security update required install the latest patch by clicking the download link below', label: 'phishing' },
    { text: 'Your social security number has been compromised call this number immediately to protect yourself', label: 'phishing' },
    { text: 'Dear user your email storage is full upgrade now to avoid losing important messages', label: 'phishing' },
    { text: 'Invoice attached for services rendered please review and submit payment within 48 hours', label: 'phishing' },
    { text: 'Verify your account or it will be permanently deleted take action within 24 hours', label: 'phishing' },
    { text: 'You have an undelivered package waiting please confirm your address to schedule redelivery', label: 'phishing' },
    { text: 'Suspicious login attempt detected on your account change your password immediately', label: 'phishing' },
    { text: 'Congratulations your loan application has been pre-approved click here to claim your funds', label: 'phishing' },
    // Legitimate emails
    { text: 'Hi team the weekly standup meeting has been moved to Thursday at 10am please update your calendar', label: 'legitimate' },
    { text: 'Here are the meeting notes from todays project review session please review and add any comments', label: 'legitimate' },
    { text: 'Happy birthday from the team we hope you have a wonderful day enjoy the celebration', label: 'legitimate' },
    { text: 'The quarterly report is ready for review I have attached the PDF document for your reference', label: 'legitimate' },
    { text: 'Reminder the office will be closed next Monday for the holiday enjoy the long weekend', label: 'legitimate' },
    { text: 'Thanks for your help with the presentation the client was very impressed with our proposal', label: 'legitimate' },
    { text: 'Please find the updated project timeline attached let me know if you have any questions', label: 'legitimate' },
    { text: 'Welcome to the team we are excited to have you join us your onboarding schedule is attached', label: 'legitimate' },
    { text: 'The software deployment was successful all systems are running normally no issues reported', label: 'legitimate' },
    { text: 'Could you please review this pull request when you get a chance no rush just want your feedback', label: 'legitimate' },
    { text: 'Lunch plans today thinking about trying the new restaurant down the street anyone interested', label: 'legitimate' },
    { text: 'Great job on the product launch the numbers are looking really positive customer feedback is excellent', label: 'legitimate' },
    { text: 'I updated the documentation for the API endpoints let me know if anything is unclear', label: 'legitimate' },
    { text: 'The training session on cybersecurity best practices will be held next Wednesday at 2pm', label: 'legitimate' },
    { text: 'Your vacation request has been approved enjoy your time off and we will see you when you return', label: 'legitimate' },
    { text: 'Monthly newsletter new features released this month including improved search and dashboard redesign', label: 'legitimate' },
    { text: 'Code review feedback looks good overall just a few minor suggestions on the error handling logic', label: 'legitimate' },
    { text: 'The server maintenance window is scheduled for Saturday night we expect minimal downtime', label: 'legitimate' },
    { text: 'Reminder to submit your timesheet by end of day Friday the payroll deadline is approaching', label: 'legitimate' },
    { text: 'Congratulations on completing the certification this is a great achievement for your career development', label: 'legitimate' },
];

// Merge built-in + large corpus (convert label format)
const PHISHING_CORPUS = [
    ...BUILTIN_CORPUS,
    ...phishingCorpus.map(e => ({ text: e.text, label: e.label === 1 ? 'phishing' : 'legitimate' })),
];

// ─── NLP Utilities ───────────────────────────────────────────────

// Tokenizer: split text into words, normalize
function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1);
}

// Stop words to filter out
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of',
    'and', 'or', 'but', 'not', 'with', 'this', 'that', 'from', 'by',
    'be', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does',
    'will', 'would', 'can', 'could', 'should', 'may', 'might',
    'we', 'you', 'he', 'she', 'they', 'me', 'us', 'him', 'her',
    'my', 'your', 'his', 'its', 'our', 'their',
]);

function removeStopWords(tokens) {
    return tokens.filter(t => !STOP_WORDS.has(t));
}

// ─── TF-IDF Vectorizer ──────────────────────────────────────────

class TfIdfVectorizer {
    constructor() {
        this.vocabulary = {};
        this.idf = {};
        this.docCount = 0;
    }

    fit(documents) {
        this.docCount = documents.length;
        const df = {}; // Document frequency
        let vocabIdx = 0;

        for (const doc of documents) {
            const tokens = new Set(removeStopWords(tokenize(doc)));
            for (const token of tokens) {
                if (!(token in this.vocabulary)) {
                    this.vocabulary[token] = vocabIdx++;
                }
                df[token] = (df[token] || 0) + 1;
            }
        }

        // Calculate IDF: log(N / df(t))
        for (const [term, freq] of Object.entries(df)) {
            this.idf[term] = Math.log(this.docCount / (freq + 1)) + 1; // Smoothed IDF
        }
    }

    transform(text) {
        const tokens = removeStopWords(tokenize(text));
        const tf = {};

        for (const token of tokens) {
            tf[token] = (tf[token] || 0) + 1;
        }

        // Normalize TF
        const maxTf = Math.max(...Object.values(tf), 1);

        const vector = {};
        for (const [term, count] of Object.entries(tf)) {
            if (term in this.vocabulary) {
                vector[term] = (count / maxTf) * (this.idf[term] || 0);
            }
        }
        return vector;
    }
}

// ─── Naive Bayes Classifier ──────────────────────────────────────

class NaiveBayesClassifier {
    constructor() {
        this.classCounts = {};
        this.classWordCounts = {};
        this.classWordTotals = {};
        this.vocabulary = new Set();
        this.totalDocs = 0;
        this.trained = false;
    }

    train(documents, labels) {
        const startTime = Date.now();
        this.totalDocs = documents.length;

        for (let i = 0; i < documents.length; i++) {
            const label = labels[i];
            const tokens = removeStopWords(tokenize(documents[i]));

            this.classCounts[label] = (this.classCounts[label] || 0) + 1;
            if (!this.classWordCounts[label]) this.classWordCounts[label] = {};
            if (!this.classWordTotals[label]) this.classWordTotals[label] = 0;

            for (const token of tokens) {
                this.vocabulary.add(token);
                this.classWordCounts[label][token] = (this.classWordCounts[label][token] || 0) + 1;
                this.classWordTotals[label]++;
            }
        }

        this.trained = true;
        return {
            classes: Object.keys(this.classCounts),
            vocabularySize: this.vocabulary.size,
            totalDocuments: this.totalDocs,
            trainTimeMs: Date.now() - startTime,
        };
    }

    // Predict with Laplace smoothing
    predict(text) {
        const tokens = removeStopWords(tokenize(text));
        const scores = {};
        const vocabSize = this.vocabulary.size;

        for (const label of Object.keys(this.classCounts)) {
            // Prior probability: P(class)
            let logProb = Math.log(this.classCounts[label] / this.totalDocs);

            // Likelihood: P(word | class) with Laplace smoothing
            for (const token of tokens) {
                const wordCount = (this.classWordCounts[label]?.[token] || 0) + 1; // Laplace +1
                const totalWords = (this.classWordTotals[label] || 0) + vocabSize;
                logProb += Math.log(wordCount / totalWords);
            }

            scores[label] = logProb;
        }

        // Convert log-probs to probabilities via softmax
        const maxScore = Math.max(...Object.values(scores));
        const expScores = {};
        let sumExp = 0;
        for (const [label, score] of Object.entries(scores)) {
            expScores[label] = Math.exp(score - maxScore);
            sumExp += expScores[label];
        }

        const probabilities = {};
        for (const [label, exp] of Object.entries(expScores)) {
            probabilities[label] = exp / sumExp;
        }

        const predicted = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0];

        return {
            label: predicted[0],
            confidence: predicted[1],
            probabilities,
            logScores: scores,
        };
    }

    // Get most indicative words for each class
    getFeatureImportance(topN = 15) {
        const importance = {};
        for (const label of Object.keys(this.classCounts)) {
            const words = Object.entries(this.classWordCounts[label] || {})
                .map(([word, count]) => ({
                    word,
                    count,
                    probability: count / (this.classWordTotals[label] || 1),
                }))
                .sort((a, b) => b.probability - a.probability)
                .slice(0, topN);
            importance[label] = words;
        }
        return importance;
    }
}

// ─── Phishing Feature Extractor ──────────────────────────────────

function extractPhishingFeatures(text) {
    const lower = text.toLowerCase();
    const features = [];

    // Urgency indicators
    const urgencyWords = ['urgent', 'immediately', 'expire', 'suspended', 'deactivated', 'locked', 'within 24', 'within 12', 'right now', 'asap', 'deadline', 'quickly', 'hurry', 'limited time'];
    const urgencyFound = urgencyWords.filter(w => lower.includes(w));
    if (urgencyFound.length > 0) {
        features.push({ category: 'Urgency', indicators: urgencyFound, severity: 'high', score: Math.min(urgencyFound.length * 15, 40), description: `Creates time pressure with: ${urgencyFound.join(', ')}` });
    }

    // Authority impersonation
    const authorityWords = ['bank', 'microsoft', 'apple', 'google', 'amazon', 'paypal', 'netflix', 'irs', 'government', 'ceo', 'it department', 'security team', 'admin'];
    const authorityFound = authorityWords.filter(w => lower.includes(w));
    if (authorityFound.length > 0) {
        features.push({ category: 'Authority Impersonation', indicators: authorityFound, severity: 'high', score: Math.min(authorityFound.length * 12, 30), description: `Impersonates trusted entity: ${authorityFound.join(', ')}` });
    }

    // Action demands
    const actionWords = ['click here', 'click the link', 'download', 'verify', 'confirm', 'update your', 'submit', 'log in', 'sign in', 'call this number', 'reply with'];
    const actionFound = actionWords.filter(w => lower.includes(w));
    if (actionFound.length > 0) {
        features.push({ category: 'Action Demand', indicators: actionFound, severity: 'medium', score: Math.min(actionFound.length * 10, 25), description: `Demands immediate action: ${actionFound.join(', ')}` });
    }

    // Threat/fear
    const threatWords = ['suspended', 'deactivated', 'compromised', 'infected', 'hacked', 'unauthorized', 'unusual activity', 'permanently deleted', 'losing access', 'legal action'];
    const threatFound = threatWords.filter(w => lower.includes(w));
    if (threatFound.length > 0) {
        features.push({ category: 'Fear/Threat', indicators: threatFound, severity: 'high', score: Math.min(threatFound.length * 15, 35), description: `Uses fear tactics: ${threatFound.join(', ')}` });
    }

    // Reward/greed
    const rewardWords = ['won', 'winner', 'free', 'gift card', 'prize', 'congratulations', 'selected', 'exclusive', 'offer', 'discount', '90 percent', 'claim'];
    const rewardFound = rewardWords.filter(w => lower.includes(w));
    if (rewardFound.length > 0) {
        features.push({ category: 'Reward/Greed Exploit', indicators: rewardFound, severity: 'medium', score: Math.min(rewardFound.length * 10, 25), description: `Exploits greed with: ${rewardFound.join(', ')}` });
    }

    // Credential request
    const credWords = ['password', 'credentials', 'credit card', 'ssn', 'social security', 'bank details', 'billing', 'payment method', 'personal information', 'identity'];
    const credFound = credWords.filter(w => lower.includes(w));
    if (credFound.length > 0) {
        features.push({ category: 'Credential Harvesting', indicators: credFound, severity: 'critical', score: Math.min(credFound.length * 20, 40), description: `Requests sensitive data: ${credFound.join(', ')}` });
    }

    // URL/Link patterns
    const urlPatterns = /https?:\/\/|www\.|\.com\/|bit\.ly|tinyurl|click\.here/gi;
    const urlMatches = lower.match(urlPatterns);
    if (urlMatches) {
        features.push({ category: 'Suspicious URLs', indicators: urlMatches, severity: 'medium', score: 15, description: `Contains ${urlMatches.length} URL(s)` });
    }

    // Generic greeting (no personalization)
    if (/dear (customer|user|member|sir|madam|valued)/i.test(text)) {
        features.push({ category: 'Generic Greeting', indicators: ['dear customer/user'], severity: 'low', score: 8, description: 'Uses generic, non-personalized greeting' });
    }

    // Grammar/spelling issues
    const grammarIssues = [];
    if (/\b(plz|pls|ur|u r)\b/i.test(text)) grammarIssues.push('informal abbreviations');
    if (text.split(/[.!?]/).some(s => s.trim().length > 0 && s.trim()[0] === s.trim()[0].toLowerCase() && /^[a-z]/.test(s.trim()))) grammarIssues.push('missing capitalization');
    if (grammarIssues.length > 0) {
        features.push({ category: 'Grammar Issues', indicators: grammarIssues, severity: 'low', score: 5, description: 'Poor grammar/spelling detected' });
    }

    return features;
}

// ─── Build and Train Models ──────────────────────────────────────

console.log('🔍 Training NLP Phishing Detector...');

const tfidfVectorizer = new TfIdfVectorizer();
tfidfVectorizer.fit(PHISHING_CORPUS.map(d => d.text));

const bayesClassifier = new NaiveBayesClassifier();
const trainResult = bayesClassifier.train(
    PHISHING_CORPUS.map(d => d.text),
    PHISHING_CORPUS.map(d => d.label)
);
console.log(`🔍 Phishing detector trained: ${trainResult.vocabularySize} vocab, ${trainResult.totalDocuments} docs, ${trainResult.classes.join('/')} classes in ${trainResult.trainTimeMs}ms`);

// ─── Main Detection Function ─────────────────────────────────────

export function detectPhishing(text) {
    if (!text || text.trim().length === 0) {
        return { error: 'Text is required' };
    }

    const startTime = Date.now();

    // 1. Naive Bayes classification
    const classification = bayesClassifier.predict(text);

    // 2. TF-IDF features
    const tfidfVector = tfidfVectorizer.transform(text);
    const topTerms = Object.entries(tfidfVector)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term, score]) => ({ term, tfidfScore: Math.round(score * 1000) / 1000 }));

    // 3. Feature-level analysis
    const features = extractPhishingFeatures(text);
    const featureScore = features.reduce((sum, f) => sum + f.score, 0);

    // 4. Combined AI score (weighted: 60% Bayes, 40% features)
    const bayesPhishingProb = classification.probabilities.phishing || 0;
    const featureProb = Math.min(featureScore / 100, 1);
    const combinedScore = (bayesPhishingProb * 0.6 + featureProb * 0.4);
    const phishingProbability = Math.round(combinedScore * 100);

    // 5. Risk level
    let riskLevel, riskColor;
    if (phishingProbability >= 80) { riskLevel = 'Critical'; riskColor = '#ff003c'; }
    else if (phishingProbability >= 60) { riskLevel = 'High'; riskColor = '#ff6b35'; }
    else if (phishingProbability >= 40) { riskLevel = 'Medium'; riskColor = '#ffaa00'; }
    else if (phishingProbability >= 20) { riskLevel = 'Low'; riskColor = '#00e5ff'; }
    else { riskLevel = 'Safe'; riskColor = '#39ff14'; }

    // 6. Feature importance (which words most influenced the decision)
    const featureImportance = bayesClassifier.getFeatureImportance(10);

    return {
        // Classification result
        isPhishing: phishingProbability >= 50,
        phishingProbability,
        riskLevel,
        riskColor,

        // AI Model details
        bayesClassification: {
            label: classification.label,
            confidence: Math.round(classification.confidence * 100),
            phishingProb: Math.round(bayesPhishingProb * 100),
            legitimateProb: Math.round((classification.probabilities.legitimate || 0) * 100),
        },

        // NLP Features
        features,
        featureScore: Math.min(featureScore, 100),

        // TF-IDF top terms
        topTerms,

        // Token stats
        tokenStats: {
            totalTokens: tokenize(text).length,
            uniqueTokens: new Set(tokenize(text)).size,
            textLength: text.length,
        },

        // Model info
        modelInfo: {
            classifier: 'Multinomial Naive Bayes',
            vectorizer: 'TF-IDF',
            trainingSize: PHISHING_CORPUS.length,
            vocabularySize: trainResult.vocabularySize,
            classes: trainResult.classes,
        },

        // Top indicator words for each class
        featureImportance,

        analysisTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
    };
}

export function getPhishingModelInfo() {
    return {
        type: 'Naive Bayes + TF-IDF',
        ...trainResult,
        description: 'Multinomial Naive Bayes classifier with TF-IDF vectorization, trained on phishing vs legitimate email corpus with NLP feature engineering.',
        featureCategories: ['Urgency', 'Authority Impersonation', 'Action Demand', 'Fear/Threat', 'Reward/Greed', 'Credential Harvesting', 'Suspicious URLs', 'Generic Greeting', 'Grammar Issues'],
    };
}
