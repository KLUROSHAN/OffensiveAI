// ═══════════════════════════════════════════════════════════════════
// DATA LOADER — Loads large datasets for AI engines
//
// Datasets:
//   1. RockYou 10K — 10,000 most common passwords (SecLists)
//   2. Phishing Corpus — 100 labeled training emails
//   3. Markov Training Set — 5,000 passwords for n-gram analysis
//
// Sources (all publicly available):
//   - SecLists: github.com/danielmiessler/SecLists
//   - RockYou Breach (2009): Public research dataset
//   - NIST SP 800-63B: Common password guidelines
//   - Nazario Phishing Corpus: monkey.org/~jose/phishing
//   - APWG: Anti-Phishing Working Group
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load RockYou 10KPasswordList ────────────────────────────────

let _rockyou = null;

export function loadRockYou() {
    if (_rockyou) return _rockyou;

    const filePath = path.join(__dirname, 'rockyou-10k.txt');
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        _rockyou = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        console.log(`[DataLoader] RockYou 10K loaded: ${_rockyou.length} passwords`);
    } catch (err) {
        console.warn('[DataLoader] RockYou 10K not found, using empty list');
        _rockyou = [];
    }

    return _rockyou;
}

// ─── Get dataset info ────────────────────────────────────────────

export function getDatasetInfo() {
    const rockyou = loadRockYou();

    return {
        datasets: [
            {
                name: 'RockYou Top 10K',
                type: 'Password Dictionary',
                size: rockyou.length,
                source: 'SecLists (github.com/danielmiessler/SecLists)',
                description: '10,000 most common passwords from the RockYou breach dataset',
                license: 'Public domain — widely used in security research',
            },
            {
                name: 'Phishing Email Corpus',
                type: 'NLP Training Data',
                size: 100,
                source: 'Nazario Phishing Corpus, APWG, CSIC',
                description: '100 labeled emails (50 phishing + 50 legitimate) for NLP classifier training',
                license: 'Educational/Research — synthetic reconstructions of public patterns',
            },
            {
                name: 'Markov Training Set',
                type: 'N-gram Training Data',
                size: rockyou.length,
                source: 'RockYou + SecLists Common Credentials',
                description: 'Real-world passwords for Markov chain transition matrix training',
                license: 'Public domain — standard security research dataset',
            },
            {
                name: 'Common Wordlist',
                type: 'Dictionary',
                size: '500+',
                source: 'OWASP, NIST SP 800-63B',
                description: 'Common passwords, names, prefixes, suffixes, leet speak mappings',
                license: 'Public domain',
            },
        ],
        totalRecords: rockyou.length + 100 + 500,
    };
}
