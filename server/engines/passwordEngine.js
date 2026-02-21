import crypto from 'crypto';
import { commonPasswords, commonNames, keyboardPatterns, leetSpeakMap, commonSuffixes, hashExamples, generateMutations, buildExpandedDictionary, buildRainbowTable } from '../data/wordlists.js';

// ═══════════════════════════════════════════════════════════
// PRE-BUILT RAINBOW TABLES (built at server startup)
// ═══════════════════════════════════════════════════════════
console.log('🔨 Building rainbow tables...');
const expandedDict = buildExpandedDictionary();
console.log(`📖 Expanded dictionary: ${expandedDict.length} entries`);

const rainbowMD5 = buildRainbowTable(expandedDict, 'md5');
const rainbowSHA1 = buildRainbowTable(expandedDict, 'sha1');
const rainbowSHA256 = buildRainbowTable(expandedDict, 'sha256');
console.log(`🌈 Rainbow tables built: MD5(${Object.keys(rainbowMD5).length}), SHA1(${Object.keys(rainbowSHA1).length}), SHA256(${Object.keys(rainbowSHA256).length})`);

// ═══════════════════════════════════════════════════════════
// HASH IDENTIFICATION
// ═══════════════════════════════════════════════════════════
export function identifyHashType(hash) {
    const cleaned = hash.trim().toLowerCase();
    if (/^\$2[aby]?\$\d{2}\$/.test(cleaned)) return { type: 'bcrypt', length: cleaned.length, strength: 'Very Strong', algorithm: 'bcrypt' };
    if (/^\$6\$/.test(cleaned)) return { type: 'sha512crypt', length: cleaned.length, strength: 'Very Strong', algorithm: 'sha512crypt' };
    if (/^\$5\$/.test(cleaned)) return { type: 'sha256crypt', length: cleaned.length, strength: 'Strong', algorithm: 'sha256crypt' };
    if (/^\$1\$/.test(cleaned)) return { type: 'md5crypt', length: cleaned.length, strength: 'Weak', algorithm: 'md5crypt' };
    if (cleaned.length === 32 && /^[a-f0-9]+$/.test(cleaned)) return { type: 'MD5', length: 32, strength: 'Very Weak', algorithm: 'md5' };
    if (cleaned.length === 40 && /^[a-f0-9]+$/.test(cleaned)) return { type: 'SHA-1', length: 40, strength: 'Weak', algorithm: 'sha1' };
    if (cleaned.length === 64 && /^[a-f0-9]+$/.test(cleaned)) return { type: 'SHA-256', length: 64, strength: 'Moderate', algorithm: 'sha256' };
    if (cleaned.length === 128 && /^[a-f0-9]+$/.test(cleaned)) return { type: 'SHA-512', length: 128, strength: 'Strong', algorithm: 'sha512' };
    if (cleaned.length === 56 && /^[a-f0-9]+$/.test(cleaned)) return { type: 'SHA-224', length: 56, strength: 'Moderate', algorithm: 'sha224' };
    if (cleaned.length === 96 && /^[a-f0-9]+$/.test(cleaned)) return { type: 'SHA-384', length: 96, strength: 'Strong', algorithm: 'sha384' };
    return { type: 'Unknown', length: cleaned.length, strength: 'Unknown', algorithm: null };
}

// ═══════════════════════════════════════════════════════════
// REAL HASH CRACKING — Multi-method attack
// ═══════════════════════════════════════════════════════════
export function attemptHashCrack(hash) {
    const cleaned = hash.trim().toLowerCase();
    const hashInfo = identifyHashType(hash);
    const startTime = Date.now();
    const results = {
        hashType: hashInfo,
        crackedPassword: null,
        method: null,
        attempts: 0,
        timeTaken: 0,
        attackPhases: [],
    };

    const algMap = { 'MD5': 'md5', 'SHA-1': 'sha1', 'SHA-256': 'sha256', 'SHA-512': 'sha512', 'SHA-224': 'sha224', 'SHA-384': 'sha384' };
    const algo = algMap[hashInfo.type];
    if (!algo) {
        results.method = 'Unsupported hash type';
        results.timeTaken = Date.now() - startTime;
        return results;
    }

    // ── Phase 1: Rainbow Table Lookup ──
    const phase1Start = Date.now();
    const rainbowTables = { md5: rainbowMD5, sha1: rainbowSHA1, sha256: rainbowSHA256 };
    if (rainbowTables[algo]) {
        results.attempts += Object.keys(rainbowTables[algo]).length;
        if (rainbowTables[algo][cleaned]) {
            results.crackedPassword = rainbowTables[algo][cleaned];
            results.method = 'Rainbow Table Lookup';
            results.timeTaken = Date.now() - startTime;
            results.attackPhases.push({ phase: 'Rainbow Table', attempted: Object.keys(rainbowTables[algo]).length, success: true, time: Date.now() - phase1Start });
            return results;
        }
        results.attackPhases.push({ phase: 'Rainbow Table', attempted: Object.keys(rainbowTables[algo]).length, success: false, time: Date.now() - phase1Start });
    }

    // ── Phase 2: Direct Dictionary Attack ──
    const phase2Start = Date.now();
    let phase2Count = 0;
    for (const pwd of commonPasswords) {
        phase2Count++;
        results.attempts++;
        const hashed = crypto.createHash(algo).update(pwd).digest('hex');
        if (hashed === cleaned) {
            results.crackedPassword = pwd;
            results.method = 'Dictionary Attack (Direct)';
            results.timeTaken = Date.now() - startTime;
            results.attackPhases.push({ phase: 'Dictionary (Direct)', attempted: phase2Count, success: true, time: Date.now() - phase2Start });
            return results;
        }
    }
    results.attackPhases.push({ phase: 'Dictionary (Direct)', attempted: phase2Count, success: false, time: Date.now() - phase2Start });

    // ── Phase 3: Rule-Based Mutations Attack ──
    const phase3Start = Date.now();
    let phase3Count = 0;
    for (const pwd of commonPasswords.slice(0, 200)) { // top 200 words with full mutations
        const mutations = generateMutations(pwd);
        for (const mutated of mutations) {
            phase3Count++;
            results.attempts++;
            const hashed = crypto.createHash(algo).update(mutated).digest('hex');
            if (hashed === cleaned) {
                results.crackedPassword = mutated;
                results.method = `Rule-Based Attack (base: "${pwd}")`;
                results.timeTaken = Date.now() - startTime;
                results.attackPhases.push({ phase: 'Rule-Based Mutations', attempted: phase3Count, success: true, time: Date.now() - phase3Start, baseWord: pwd });
                return results;
            }
        }
    }
    results.attackPhases.push({ phase: 'Rule-Based Mutations', attempted: phase3Count, success: false, time: Date.now() - phase3Start });

    // ── Phase 4: Hybrid Attack (name + numbers/special) ──
    const phase4Start = Date.now();
    let phase4Count = 0;
    const hybridSuffixes = ['1', '12', '123', '1234', '!', '!!', '@', '#', '$', '2024', '2025', '2026', '01', '69', '99', '00', '007', '1!', '123!'];
    for (const name of commonNames) {
        for (const suffix of hybridSuffixes) {
            const candidates = [
                name + suffix,
                name.charAt(0).toUpperCase() + name.slice(1) + suffix,
                name.toUpperCase() + suffix,
            ];
            for (const candidate of candidates) {
                phase4Count++;
                results.attempts++;
                const hashed = crypto.createHash(algo).update(candidate).digest('hex');
                if (hashed === cleaned) {
                    results.crackedPassword = candidate;
                    results.method = `Hybrid Attack (name: "${name}" + suffix)`;
                    results.timeTaken = Date.now() - startTime;
                    results.attackPhases.push({ phase: 'Hybrid (Name+Suffix)', attempted: phase4Count, success: true, time: Date.now() - phase4Start });
                    return results;
                }
            }
        }
    }
    results.attackPhases.push({ phase: 'Hybrid (Name+Suffix)', attempted: phase4Count, success: false, time: Date.now() - phase4Start });

    // ── Phase 5: Incremental Brute-Force (short passwords only, up to 4 chars) ──
    const phase5Start = Date.now();
    let phase5Count = 0;
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const maxBruteLen = 4;

    for (let len = 1; len <= maxBruteLen; len++) {
        const total = Math.pow(charset.length, len);
        for (let i = 0; i < total; i++) {
            let candidate = '';
            let num = i;
            for (let j = 0; j < len; j++) {
                candidate = charset[num % charset.length] + candidate;
                num = Math.floor(num / charset.length);
            }
            phase5Count++;
            results.attempts++;
            const hashed = crypto.createHash(algo).update(candidate).digest('hex');
            if (hashed === cleaned) {
                results.crackedPassword = candidate;
                results.method = `Brute-Force Attack (${len} chars)`;
                results.timeTaken = Date.now() - startTime;
                results.attackPhases.push({ phase: `Brute-Force (1-${maxBruteLen} chars)`, attempted: phase5Count, success: true, time: Date.now() - phase5Start });
                return results;
            }
        }
    }
    results.attackPhases.push({ phase: `Brute-Force (1-${maxBruteLen} chars)`, attempted: phase5Count, success: false, time: Date.now() - phase5Start });

    results.method = 'Not cracked — exhausted all attack phases';
    results.timeTaken = Date.now() - startTime;
    results.hashesPerSecond = Math.round(results.attempts / (results.timeTaken / 1000));
    return results;
}

// ═══════════════════════════════════════════════════════════
// REAL-TIME BRUTE-FORCE CRACKER (async with progress callback)
// Used for streaming SSE endpoint
// ═══════════════════════════════════════════════════════════
export function* bruteForceGenerator(hash, algo, maxLen = 5) {
    const cleaned = hash.trim().toLowerCase();
    const charsets = {
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        alphanumeric: 'abcdefghijklmnopqrstuvwxyz0123456789',
        full: 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
    };
    const charset = charsets.alphanumeric;
    let totalAttempts = 0;
    const startTime = Date.now();

    for (let len = 1; len <= maxLen; len++) {
        const total = Math.pow(charset.length, len);
        for (let i = 0; i < total; i++) {
            let candidate = '';
            let num = i;
            for (let j = 0; j < len; j++) {
                candidate = charset[num % charset.length] + candidate;
                num = Math.floor(num / charset.length);
            }
            totalAttempts++;
            const hashed = crypto.createHash(algo).update(candidate).digest('hex');

            // Yield progress every 10000 attempts
            if (totalAttempts % 10000 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                yield {
                    type: 'progress',
                    currentLength: len,
                    candidate,
                    attempts: totalAttempts,
                    hashesPerSecond: Math.round(totalAttempts / elapsed),
                    elapsed: elapsed.toFixed(1),
                };
            }

            if (hashed === cleaned) {
                const elapsed = (Date.now() - startTime) / 1000;
                yield {
                    type: 'cracked',
                    password: candidate,
                    attempts: totalAttempts,
                    hashesPerSecond: Math.round(totalAttempts / elapsed),
                    elapsed: elapsed.toFixed(1),
                    method: `Brute-Force (${len} chars)`,
                };
                return;
            }
        }
        // Report phase completion
        yield {
            type: 'phase_complete',
            length: len,
            attempts: totalAttempts,
            elapsed: ((Date.now() - startTime) / 1000).toFixed(1),
        };
    }

    yield {
        type: 'exhausted',
        attempts: totalAttempts,
        elapsed: ((Date.now() - startTime) / 1000).toFixed(1),
        message: `Exhausted all combinations up to ${maxLen} characters`,
    };
}

// ═══════════════════════════════════════════════════════════
// DICTIONARY ATTACK
// ═══════════════════════════════════════════════════════════
export function dictionaryAttack(password) {
    const lower = password.toLowerCase();
    let found = false;
    let position = -1;
    let attempts = 0;
    let matchType = 'None';
    let matchedWord = null;

    // Exact match
    for (let i = 0; i < commonPasswords.length; i++) {
        attempts++;
        if (commonPasswords[i].toLowerCase() === lower) {
            found = true;
            position = i;
            matchType = 'Exact Match';
            matchedWord = commonPasswords[i];
            break;
        }
    }

    // With common suffixes
    if (!found) {
        for (const pwd of commonPasswords) {
            for (const suffix of commonSuffixes) {
                attempts++;
                if ((pwd + suffix).toLowerCase() === lower) {
                    found = true;
                    matchType = 'Dictionary + Suffix';
                    matchedWord = `${pwd} + "${suffix}"`;
                    break;
                }
            }
            if (found) break;
        }
    }

    // Leet speak deobfuscation
    if (!found) {
        let deLeeted = password.toLowerCase();
        for (const [letter, replacements] of Object.entries(leetSpeakMap)) {
            for (const rep of replacements) {
                deLeeted = deLeeted.replace(new RegExp(rep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), letter);
            }
        }
        if (deLeeted !== password.toLowerCase()) {
            for (const pwd of commonPasswords) {
                attempts++;
                if (pwd.toLowerCase() === deLeeted) {
                    found = true;
                    matchType = 'Leet Speak Deobfuscation';
                    matchedWord = `${deLeeted} (from "${password}")`;
                    break;
                }
            }
        }
    }

    // Reversed check
    if (!found) {
        const reversed = password.split('').reverse().join('').toLowerCase();
        for (const pwd of commonPasswords) {
            attempts++;
            if (pwd.toLowerCase() === reversed) {
                found = true;
                matchType = 'Reversed Dictionary Word';
                matchedWord = `${pwd} (reversed)`;
                break;
            }
        }
    }

    // Name-based
    if (!found) {
        for (const name of commonNames) {
            attempts++;
            if (lower.includes(name) && name.length >= 4) {
                found = true;
                matchType = 'Name-based Pattern';
                matchedWord = name;
                break;
            }
        }
    }

    return { found, position, attempts, matchType, matchedWord, totalDictSize: commonPasswords.length, expandedDictSize: expandedDict.length };
}

// ═══════════════════════════════════════════════════════════
// BRUTE FORCE TIME ESTIMATION
// ═══════════════════════════════════════════════════════════
export function estimateBruteForce(password) {
    let charsetSize = 0;
    const charsets = [];

    if (/[a-z]/.test(password)) { charsetSize += 26; charsets.push('lowercase'); }
    if (/[A-Z]/.test(password)) { charsetSize += 26; charsets.push('uppercase'); }
    if (/[0-9]/.test(password)) { charsetSize += 10; charsets.push('digits'); }
    if (/[^a-zA-Z0-9]/.test(password)) { charsetSize += 33; charsets.push('special'); }

    const combinations = Math.pow(charsetSize, password.length);
    const speeds = {
        'CPU (Intel i7)': 5e6,
        'GPU (RTX 4090)': 1e10,
        'GPU Cluster (8x RTX 4090)': 8e10,
        'ASIC Rig': 1e12,
        'Nation-state': 1e15,
    };

    const timeToCrack = {};
    for (const [device, speed] of Object.entries(speeds)) {
        const seconds = combinations / speed;
        timeToCrack[device] = { display: formatTime(seconds), seconds, speed: speed.toExponential(0) };
    }

    return {
        length: password.length,
        charsetSize,
        charsets,
        totalCombinations: combinations > 1e15 ? combinations.toExponential(2) : combinations.toLocaleString(),
        combinationsRaw: combinations,
        timeToCrack,
    };
}

function formatTime(seconds) {
    if (seconds < 0.001) return 'Instant';
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)} milliseconds`;
    if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
    if (seconds < 86400 * 365) return `${(seconds / 86400).toFixed(1)} days`;
    if (seconds < 86400 * 365 * 100) return `${(seconds / (86400 * 365)).toFixed(1)} years`;
    if (seconds < 86400 * 365 * 1e6) return `${(seconds / (86400 * 365 * 1000)).toFixed(0)} thousand years`;
    if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(0)} million years`;
    return `${(seconds / (86400 * 365 * 1e9)).toFixed(0)} billion years`;
}

// ═══════════════════════════════════════════════════════════
// AI PATTERN ANALYSIS
// ═══════════════════════════════════════════════════════════
export function analyzePatterns(password) {
    const patterns = [];
    const lower = password.toLowerCase();

    // Keyboard walk detection
    for (const kp of keyboardPatterns) {
        if (lower.includes(kp)) {
            patterns.push({ type: 'Keyboard Walk', pattern: kp, severity: 'High', description: `Contains keyboard walk pattern "${kp}"` });
        }
    }

    // Leet speak detection
    let deLeeted = password.toLowerCase();
    for (const [letter, replacements] of Object.entries(leetSpeakMap)) {
        for (const rep of replacements) {
            deLeeted = deLeeted.replace(new RegExp(rep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), letter);
        }
    }
    if (deLeeted !== password.toLowerCase()) {
        const dictCheck = dictionaryAttack(deLeeted);
        if (dictCheck.found) {
            patterns.push({ type: 'Leet Speak', pattern: `${password} → ${deLeeted}`, severity: 'High', description: `Leet speak substitution of dictionary word "${deLeeted}"` });
        }
    }

    // Date pattern detection  
    if (/\d{4}/.test(password)) {
        const year = password.match(/(\d{4})/)?.[1];
        if (year && parseInt(year) >= 1940 && parseInt(year) <= 2030) {
            patterns.push({ type: 'Date/Year', pattern: year, severity: 'Medium', description: `Contains year ${year} — commonly used in passwords` });
        }
    }
    if (/\d{2}\/\d{2}|\d{2}-\d{2}|\d{2}\.\d{2}/.test(password)) {
        patterns.push({ type: 'Date Format', pattern: password.match(/\d{2}[\/\-.]\d{2}/)?.[0], severity: 'Medium', description: 'Contains date-like pattern' });
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
        const match = password.match(/(.)\1{2,}/)?.[0];
        patterns.push({ type: 'Repeated Characters', pattern: match, severity: 'High', description: `Repeating character sequence "${match}"` });
    }

    // Sequential numbers
    if (/012|123|234|345|456|567|678|789|890/.test(password)) {
        patterns.push({ type: 'Sequential Numbers', pattern: password.match(/(012|123|234|345|456|567|678|789|890)+/)?.[0], severity: 'High', description: 'Contains sequential number pattern' });
    }

    // Sequential letters
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
        patterns.push({ type: 'Sequential Letters', pattern: 'Sequential alphabetic', severity: 'Medium', description: 'Contains sequential alphabetic pattern' });
    }

    // Common word as base
    const wordInPassword = commonPasswords.find(w => w.length >= 4 && lower.includes(w.toLowerCase()));
    if (wordInPassword) {
        patterns.push({ type: 'Dictionary Base', pattern: wordInPassword, severity: 'High', description: `Contains common password "${wordInPassword}" as a base` });
    }

    // Name detection
    const nameInPassword = commonNames.find(name => lower.includes(name) && name.length >= 4);
    if (nameInPassword) {
        patterns.push({ type: 'Personal Name', pattern: nameInPassword, severity: 'Medium', description: `Contains common name "${nameInPassword}"` });
    }

    // Palindrome
    const rev = password.split('').reverse().join('');
    if (rev === password && password.length > 2) {
        patterns.push({ type: 'Palindrome', pattern: password, severity: 'Medium', description: 'Password is a palindrome' });
    }

    // All same character type
    if (/^\d+$/.test(password)) patterns.push({ type: 'Digits Only', pattern: password, severity: 'High', description: 'Contains only digits — extremely weak' });
    if (/^[a-z]+$/.test(password)) patterns.push({ type: 'Lowercase Only', pattern: password, severity: 'High', description: 'Contains only lowercase letters — very weak' });

    return patterns;
}

// ═══════════════════════════════════════════════════════════
// PASSWORD ENTROPY
// ═══════════════════════════════════════════════════════════
export function calculateEntropy(password) {
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 33;
    const entropy = password.length * Math.log2(charsetSize || 1);
    return Math.round(entropy * 100) / 100;
}

// ═══════════════════════════════════════════════════════════
// COMPREHENSIVE PASSWORD SCORING
// ═══════════════════════════════════════════════════════════
export function scorePassword(password) {
    let score = 0;
    const feedback = [];
    const entropy = calculateEntropy(password);
    const dictionary = dictionaryAttack(password);
    const patterns = analyzePatterns(password);
    const bruteForce = estimateBruteForce(password);

    // Length scoring (0-25)
    if (password.length >= 16) { score += 25; }
    else if (password.length >= 12) { score += 20; }
    else if (password.length >= 10) { score += 15; }
    else if (password.length >= 8) { score += 10; }
    else { score += 5; feedback.push('Password is too short — use at least 12 characters'); }

    // Character diversity (0-25)
    const charTypes = bruteForce.charsets.length;
    score += charTypes * 6;
    if (charTypes < 3) feedback.push('Use a mix of uppercase, lowercase, numbers, and special characters');

    // Entropy scoring (0-25)
    if (entropy >= 60) score += 25;
    else if (entropy >= 45) score += 20;
    else if (entropy >= 30) score += 15;
    else if (entropy >= 20) score += 10;
    else { score += 5; feedback.push('Password entropy is very low — it is highly predictable'); }

    // Pattern penalties
    if (dictionary.found) {
        score -= 20;
        feedback.push(`Found in common password dictionary (${dictionary.matchType})`);
    }
    for (const p of patterns) {
        if (p.severity === 'High') { score -= 8; feedback.push(p.description); }
        else if (p.severity === 'Medium') { score -= 4; feedback.push(p.description); }
    }

    score = Math.max(0, Math.min(100, score));

    let rating;
    if (score >= 80) rating = 'Very Strong';
    else if (score >= 60) rating = 'Strong';
    else if (score >= 40) rating = 'Moderate';
    else if (score >= 20) rating = 'Weak';
    else rating = 'Very Weak';

    const recommendations = [];
    if (password.length < 12) recommendations.push('Increase password length to at least 12 characters');
    if (charTypes < 4) recommendations.push('Include symbols (!@#$%^&*) and mixed case');
    if (dictionary.found) recommendations.push('Avoid common words and passwords — use a passphrase instead');
    if (patterns.length > 0) recommendations.push('Avoid keyboard patterns, sequences, and personal information');
    recommendations.push('Consider using a password manager to generate random passwords');
    recommendations.push('Enable multi-factor authentication for additional security');

    return { score, rating, entropy, dictionary, patterns, bruteForce, feedback, recommendations };
}

// ═══════════════════════════════════════════════════════════
// FULL PASSWORD ANALYSIS
// ═══════════════════════════════════════════════════════════
export function analyzePassword(password) {
    const score = scorePassword(password);
    const hashValues = {
        md5: crypto.createHash('md5').update(password).digest('hex'),
        sha1: crypto.createHash('sha1').update(password).digest('hex'),
        sha256: crypto.createHash('sha256').update(password).digest('hex'),
        sha512: crypto.createHash('sha512').update(password).digest('hex'),
    };

    return {
        password: password.replace(/./g, (c, i) => i === 0 || i === password.length - 1 ? c : '*'),
        length: password.length,
        hashes: hashValues,
        ...score,
    };
}

// ═══════════════════════════════════════════════════════════
// REAL PASSWORD CRACKING — Hash a password then crack it
// Simulates a full attack pipeline end-to-end
// ═══════════════════════════════════════════════════════════
export function realCrackPassword(password, algorithm = 'md5') {
    const targetHash = crypto.createHash(algorithm).update(password).digest('hex');
    const result = attemptHashCrack(targetHash);
    return {
        originalPassword: password.replace(/./g, (c, i) => i === 0 || i === password.length - 1 ? c : '*'),
        algorithm, targetHash,
        crackResult: result,
        wasCompromised: result.crackedPassword !== null,
    };
}

// ═══════════════════════════════════════════════════════════════
// JOHN THE RIPPER — Style Hash Cracker
// Accepts a hash + custom wordlist, applies 30+ mangling rules
// and word combination attacks to recover the password.
// ═══════════════════════════════════════════════════════════════

// ─── JtR Mangling Rules ────────────────────────────────────────
// Each rule takes a word and returns an array of candidates
const JTR_RULES = [
    // === Case Rules ===
    { name: 'lowercase', fn: w => [w.toLowerCase()] },
    { name: 'uppercase', fn: w => [w.toUpperCase()] },
    { name: 'capitalize', fn: w => [w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()] },
    { name: 'invertCapitalize', fn: w => [w.charAt(0).toLowerCase() + w.slice(1).toUpperCase()] },
    { name: 'toggleCase', fn: w => [w.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('')] },
    { name: 'toggleCaseAlt', fn: w => [w.split('').map((c, i) => i % 2 === 1 ? c.toUpperCase() : c.toLowerCase()).join('')] },
    { name: 'swapCase', fn: w => [w.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')] },

    // === Leet Speak Rules ===
    { name: 'leetBasic', fn: w => [w.replace(/a/gi, '4').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0').replace(/s/gi, '5')] },
    { name: 'leetAdvanced', fn: w => [w.replace(/a/gi, '@').replace(/e/gi, '3').replace(/i/gi, '!').replace(/o/gi, '0').replace(/s/gi, '$').replace(/t/gi, '7')] },
    {
        name: 'leetPartial', fn: w => {
            const cands = [];
            const r = { a: '4', e: '3', o: '0', s: '5', i: '1' };
            for (const [from, to] of Object.entries(r)) {
                cands.push(w.replace(new RegExp(from, 'gi'), to));
            }
            return cands;
        }
    },

    // === Append/Prepend Rules ===
    {
        name: 'appendDigits', fn: w => {
            const cands = [];
            for (let i = 0; i <= 9; i++) cands.push(w + i);
            for (const s of ['00', '01', '10', '11', '12', '13', '21', '22', '23', '69', '77', '88', '99']) cands.push(w + s);
            for (const s of ['123', '234', '321', '456', '789', '000', '111', '007', '786']) cands.push(w + s);
            for (const s of ['1234', '2024', '2025', '2026', '1111', '1234', '4321', '9999']) cands.push(w + s);
            return cands;
        }
    },
    {
        name: 'prependDigits', fn: w => {
            const cands = [];
            for (let i = 0; i <= 9; i++) cands.push(i + w);
            for (const s of ['123', '007', '786', '99']) cands.push(s + w);
            return cands;
        }
    },
    { name: 'appendSpecial', fn: w => ['!', '@', '#', '$', '%', '&', '*', '.', '!!', '!@', '@#', '!@#', '123!', '1!'].map(s => w + s) },
    { name: 'prependSpecial', fn: w => ['!', '@', '#', '$', '*'].map(s => s + w) },

    // === Transform Rules ===
    { name: 'reverse', fn: w => [w.split('').reverse().join('')] },
    { name: 'duplicate', fn: w => [w + w] },
    { name: 'duplicateReverse', fn: w => [w + w.split('').reverse().join('')] },
    { name: 'reflect', fn: w => [w.split('').reverse().join('') + w] },

    // === Truncation & Substring Rules ===
    {
        name: 'truncate', fn: w => {
            const cands = [];
            if (w.length > 2) for (let i = 2; i < w.length; i++) cands.push(w.substring(0, i));
            return cands;
        }
    },
    { name: 'dropFirst', fn: w => w.length > 1 ? [w.substring(1)] : [] },
    { name: 'dropLast', fn: w => w.length > 1 ? [w.substring(0, w.length - 1)] : [] },
    { name: 'firstHalf', fn: w => w.length > 2 ? [w.substring(0, Math.ceil(w.length / 2))] : [] },
    { name: 'secondHalf', fn: w => w.length > 2 ? [w.substring(Math.floor(w.length / 2))] : [] },

    // === Insert/Replace Rules ===
    {
        name: 'insertMiddleDigit', fn: w => {
            if (w.length < 2) return [];
            const mid = Math.floor(w.length / 2);
            return ['0', '1', '2', '3', '4', '5'].map(d => w.substring(0, mid) + d + w.substring(mid));
        }
    },
    {
        name: 'insertMiddleSpecial', fn: w => {
            if (w.length < 2) return [];
            const mid = Math.floor(w.length / 2);
            return ['_', '-', '.', '@', '!'].map(s => w.substring(0, mid) + s + w.substring(mid));
        }
    },

    // === Year/Date Rules ===
    { name: 'appendYear', fn: w => ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005'].map(y => w + y) },

    // === Compound Rules (capitalize + append) ===
    {
        name: 'capitalAppendDigits', fn: w => {
            const cap = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            const cands = [];
            for (let i = 0; i <= 9; i++) cands.push(cap + i);
            for (const s of ['00', '01', '11', '12', '13', '21', '22', '23', '69', '99', '123', '1234', '786', '007']) cands.push(cap + s);
            for (const s of ['!', '@', '#', '$', '!!', '!@', '!@#', '123!']) cands.push(cap + s);
            return cands;
        }
    },
    {
        name: 'upperAppendDigits', fn: w => {
            const up = w.toUpperCase();
            const cands = [];
            for (let i = 0; i <= 9; i++) cands.push(up + i);
            for (const s of ['123', '1234', '!', '!!', '@']) cands.push(up + s);
            return cands;
        }
    },
    {
        name: 'leetAppendDigits', fn: w => {
            const l = w.replace(/a/gi, '4').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0').replace(/s/gi, '5');
            const cands = [l];
            for (let i = 0; i <= 9; i++) cands.push(l + i);
            for (const s of ['!', '@', '123', '!@#']) cands.push(l + s);
            return cands;
        }
    },
];

// ─── Word Combiner ─────────────────────────────────────────────
// Generates combinations of 2 or 3 words from the wordlist
function generateWordCombinations(words) {
    const combos = new Set();
    for (let i = 0; i < words.length; i++) {
        for (let j = 0; j < words.length; j++) {
            if (i === j) continue;
            const w1 = words[i].toLowerCase();
            const w2 = words[j].toLowerCase();
            // Direct concatenation
            combos.add(w1 + w2);
            // Capitalized
            combos.add(w1.charAt(0).toUpperCase() + w1.slice(1) + w2.charAt(0).toUpperCase() + w2.slice(1));
            combos.add(w1.charAt(0).toUpperCase() + w1.slice(1) + w2);
            // With separators
            combos.add(w1 + '_' + w2);
            combos.add(w1 + '-' + w2);
            combos.add(w1 + '.' + w2);
            combos.add(w1 + '@' + w2);
            // With digits between
            for (const d of ['1', '2', '12', '123', '0', '69', '99']) {
                combos.add(w1 + d + w2);
            }
            // 3-word combos (limit)
            if (words.length <= 10) {
                for (let k = 0; k < words.length; k++) {
                    if (k === i || k === j) continue;
                    const w3 = words[k].toLowerCase();
                    combos.add(w1 + w2 + w3);
                    combos.add(w1.charAt(0).toUpperCase() + w1.slice(1) + w2.charAt(0).toUpperCase() + w2.slice(1) + w3.charAt(0).toUpperCase() + w3.slice(1));
                }
            }
        }
    }
    return [...combos];
}

// ─── Main JtR Crack Function ───────────────────────────────────
export function jtrCrackHash(hash, algorithm, customWords = []) {
    const cleaned = hash.trim().toLowerCase();
    const algo = algorithm || identifyHashType(hash)?.algorithm || 'md5';
    const startTime = Date.now();
    let totalAttempts = 0;
    const phases = [];
    const log = [];

    // Helper: hash + check
    const tryCandidate = (candidate) => {
        totalAttempts++;
        const h = crypto.createHash(algo).update(candidate).digest('hex');
        return h === cleaned;
    };

    // Normalize custom words
    const userWords = customWords
        .map(w => w.trim())
        .filter(w => w.length > 0);

    // Build full wordlist = custom words + common passwords (prioritize custom)
    const allWords = [...new Set([...userWords, ...commonPasswords.slice(0, 300)])];

    // ═══ PHASE 1: Rainbow Table ═══
    const p1Start = Date.now();
    const rainbowTables = { md5: rainbowMD5, sha1: rainbowSHA1, sha256: rainbowSHA256 };
    if (rainbowTables[algo] && rainbowTables[algo][cleaned]) {
        const p = { phase: 'Phase 1: Rainbow Table', attempted: Object.keys(rainbowTables[algo]).length, success: true, time: Date.now() - p1Start, crackedWith: rainbowTables[algo][cleaned] };
        phases.push(p);
        log.push(`[CRACKED] Rainbow table hit: "${rainbowTables[algo][cleaned]}"`);
        totalAttempts += p.attempted;
        return buildResult(rainbowTables[algo][cleaned], 'Rainbow Table Lookup', totalAttempts, Date.now() - startTime, phases, log);
    }
    totalAttempts += rainbowTables[algo] ? Object.keys(rainbowTables[algo]).length : 0;
    phases.push({ phase: 'Phase 1: Rainbow Table', attempted: totalAttempts, success: false, time: Date.now() - p1Start });
    log.push(`[PHASE 1] Rainbow table: ${totalAttempts} entries checked — no match`);

    // ═══ PHASE 2: Direct Wordlist ═══
    const p2Start = Date.now();
    let p2Count = 0;
    for (const word of allWords) {
        p2Count++;
        if (tryCandidate(word)) {
            phases.push({ phase: 'Phase 2: Direct Wordlist', attempted: p2Count, success: true, time: Date.now() - p2Start, crackedWith: word });
            log.push(`[CRACKED] Direct wordlist match: "${word}"`);
            return buildResult(word, 'Direct Wordlist Match', totalAttempts, Date.now() - startTime, phases, log);
        }
    }
    phases.push({ phase: 'Phase 2: Direct Wordlist', attempted: p2Count, success: false, time: Date.now() - p2Start });
    log.push(`[PHASE 2] Direct wordlist: ${p2Count} words — no match`);

    // ═══ PHASE 3: JtR Mangling Rules ═══
    const p3Start = Date.now();
    let p3Count = 0;
    for (const word of allWords) {
        for (const rule of JTR_RULES) {
            const candidates = rule.fn(word);
            for (const candidate of candidates) {
                if (!candidate || candidate.length === 0 || candidate.length > 32) continue;
                p3Count++;
                if (tryCandidate(candidate)) {
                    phases.push({ phase: 'Phase 3: JtR Mangling Rules', attempted: p3Count, success: true, time: Date.now() - p3Start, crackedWith: candidate, rule: rule.name, baseWord: word });
                    log.push(`[CRACKED] Mangling rule "${rule.name}" on "${word}" → "${candidate}"`);
                    return buildResult(candidate, `JtR Rule: ${rule.name} (base: "${word}")`, totalAttempts, Date.now() - startTime, phases, log);
                }
            }
        }
    }
    phases.push({ phase: 'Phase 3: JtR Mangling Rules', attempted: p3Count, success: false, time: Date.now() - p3Start });
    log.push(`[PHASE 3] JtR mangling: ${p3Count} candidates from ${JTR_RULES.length} rules × ${allWords.length} words — no match`);

    // ═══ PHASE 4: Word Combinations ═══
    const p4Start = Date.now();
    let p4Count = 0;
    const combos = generateWordCombinations(userWords.length > 0 ? userWords : commonNames.slice(0, 20));
    for (const combo of combos) {
        p4Count++;
        if (tryCandidate(combo)) {
            phases.push({ phase: 'Phase 4: Word Combinations', attempted: p4Count, success: true, time: Date.now() - p4Start, crackedWith: combo });
            log.push(`[CRACKED] Word combination: "${combo}"`);
            return buildResult(combo, `Word Combination`, totalAttempts, Date.now() - startTime, phases, log);
        }
        // Also apply top mangling rules to combos
        for (const rule of JTR_RULES.slice(0, 8)) { // case rules + basic leet
            const candidates = rule.fn(combo);
            for (const c of candidates) {
                if (!c || c.length > 32) continue;
                p4Count++;
                if (tryCandidate(c)) {
                    phases.push({ phase: 'Phase 4: Word Combinations', attempted: p4Count, success: true, time: Date.now() - p4Start, crackedWith: c, rule: rule.name });
                    log.push(`[CRACKED] Combo "${combo}" + rule "${rule.name}" → "${c}"`);
                    return buildResult(c, `Word Combo + ${rule.name}`, totalAttempts, Date.now() - startTime, phases, log);
                }
            }
        }
    }
    phases.push({ phase: 'Phase 4: Word Combinations', attempted: p4Count, success: false, time: Date.now() - p4Start });
    log.push(`[PHASE 4] Word combinations: ${p4Count} candidates — no match`);

    // ═══ PHASE 5: Mangled Combos + Digits ═══
    const p5Start = Date.now();
    let p5Count = 0;
    const topCombos = combos.slice(0, 200);
    for (const combo of topCombos) {
        // appendDigits + appendSpecial + appendYear on the combos
        for (const rule of [JTR_RULES.find(r => r.name === 'appendDigits'), JTR_RULES.find(r => r.name === 'appendSpecial'), JTR_RULES.find(r => r.name === 'appendYear')]) {
            if (!rule) continue;
            const candidates = rule.fn(combo);
            for (const c of candidates) {
                if (!c || c.length > 32) continue;
                p5Count++;
                if (tryCandidate(c)) {
                    phases.push({ phase: 'Phase 5: Combo + Digits/Special', attempted: p5Count, success: true, time: Date.now() - p5Start, crackedWith: c, rule: rule.name });
                    log.push(`[CRACKED] "${combo}" + ${rule.name} → "${c}"`);
                    return buildResult(c, `Combo + ${rule.name}`, totalAttempts, Date.now() - startTime, phases, log);
                }
            }
        }
        // capitalized combo + digits
        const cap = combo.charAt(0).toUpperCase() + combo.slice(1);
        for (let d = 0; d <= 99; d++) {
            p5Count++;
            if (tryCandidate(cap + d)) {
                phases.push({ phase: 'Phase 5: Combo + Digits/Special', attempted: p5Count, success: true, time: Date.now() - p5Start, crackedWith: cap + d });
                log.push(`[CRACKED] "${cap}" + "${d}" → "${cap}${d}"`);
                return buildResult(cap + d, 'Capitalized Combo + Number', totalAttempts, Date.now() - startTime, phases, log);
            }
        }
    }
    phases.push({ phase: 'Phase 5: Combo + Digits/Special', attempted: p5Count, success: false, time: Date.now() - p5Start });
    log.push(`[PHASE 5] Combo + digits/special: ${p5Count} candidates — no match`);

    // ═══ PHASE 6: Incremental Brute-Force (up to 5 chars) ═══
    const p6Start = Date.now();
    let p6Count = 0;
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let len = 1; len <= 5; len++) {
        const total = Math.pow(charset.length, len);
        for (let i = 0; i < total; i++) {
            let candidate = '';
            let num = i;
            for (let j = 0; j < len; j++) { candidate = charset[num % charset.length] + candidate; num = Math.floor(num / charset.length); }
            p6Count++;
            if (tryCandidate(candidate)) {
                phases.push({ phase: 'Phase 6: Incremental Brute-Force', attempted: p6Count, success: true, time: Date.now() - p6Start, crackedWith: candidate });
                log.push(`[CRACKED] Brute-force: "${candidate}" (${len} chars)`);
                return buildResult(candidate, `Incremental Brute-Force (${len} chars)`, totalAttempts, Date.now() - startTime, phases, log);
            }
            // Time limit: 30 seconds max
            if (Date.now() - startTime > 30000) {
                phases.push({ phase: 'Phase 6: Incremental Brute-Force', attempted: p6Count, success: false, time: Date.now() - p6Start, note: 'Time limit reached' });
                log.push(`[PHASE 6] Brute-force: ${p6Count} candidates — time limit (30s)`);
                return buildResult(null, 'Not cracked — time limit reached', totalAttempts, Date.now() - startTime, phases, log);
            }
        }
        log.push(`[PHASE 6] Brute-force length ${len}: ${p6Count} total candidates so far`);
    }
    phases.push({ phase: 'Phase 6: Incremental Brute-Force', attempted: p6Count, success: false, time: Date.now() - p6Start });
    log.push(`[PHASE 6] Brute-force: ${p6Count} candidates — exhausted 1-5 chars`);

    return buildResult(null, 'Not cracked — all phases exhausted', totalAttempts, Date.now() - startTime, phases, log);
}

function buildResult(password, method, attempts, timeMs, phases, log) {
    return {
        cracked: password !== null,
        password,
        method,
        attempts,
        timeMs,
        hashesPerSecond: timeMs > 0 ? Math.round(attempts / (timeMs / 1000)) : 0,
        phases,
        log,
        rulesUsed: JTR_RULES.length,
        timestamp: new Date().toISOString(),
    };
}
