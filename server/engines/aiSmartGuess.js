import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════
// AI-GUIDED SMART PASSWORD GUESSER
//
// Takes personal information (name, DOB, phone, pet name, company)
// and uses behavioral pattern analysis to generate intelligent
// password guesses — mimicking how real people create passwords.
//
// Techniques:
//   1. Fragment extraction (first, last, initials, nicknames)
//   2. Date decomposition (year, month, day, short year)
//   3. Leet speak substitution (a→@, e→3, i→1, o→0, s→$)
//   4. Separator injection (@, #, !, _, ., -, &)
//   5. Suffix/prefix patterns (123, @123, !!, 2024, etc.)
//   6. Cross-field combination (name+year, pet+phone, etc.)
//   7. Behavioral heuristics (people use lowercase + digits most)
//   8. Ranked by real-world probability (most common patterns first)
// ═══════════════════════════════════════════════════════════════════

// ─── Common password patterns observed in real breaches ──────────
const SEPARATORS = ['', '@', '#', '!', '_', '.', '-', '&', '$', '*'];
const COMMON_SUFFIXES = [
    '', '1', '12', '123', '1234', '12345',
    '!', '!!', '!!!', '@', '#', '$',
    '@1', '@12', '@123', '@1234', '#1', '#123',
    '!1', '!12', '!123', '!@#',
    '*', '007', '99', '00', '01', '11', '69', '77', '88',
];
const COMMON_PREFIXES = ['', 'i', 'my', 'the', 'im', 'its', 'iam'];
const YEARS = [];
for (let y = 1970; y <= 2026; y++) YEARS.push(String(y));
const SHORT_YEARS = YEARS.map(y => y.slice(2));

// ─── Fragment Extraction ─────────────────────────────────────────

function extractFragments(profile) {
    const frags = new Set();
    const { name, dob, phone, petName, company } = profile;

    // Name fragments
    if (name) {
        const clean = name.trim();
        const lower = clean.toLowerCase();
        const parts = clean.split(/\s+/);

        frags.add(lower);                                     // roshan
        frags.add(clean);                                     // Roshan
        frags.add(lower.replace(/\s+/g, ''));                  // roshanvasani
        frags.add(clean.replace(/\s+/g, ''));                   // RoshanVasani

        for (const part of parts) {
            const p = part.toLowerCase();
            frags.add(p);                                       // roshan, vasani
            frags.add(part);                                    // Roshan, Vasani
            frags.add(p.charAt(0).toUpperCase() + p.slice(1));  // Roshan
            frags.add(p.toUpperCase());                         // ROSHAN
            // Truncated forms
            if (p.length > 3) {
                frags.add(p.slice(0, 3));                         // ros
                frags.add(p.slice(0, 4));                         // rosh
                frags.add(p.slice(0, 5));                         // rosha
            }
        }

        // Initials
        if (parts.length > 1) {
            frags.add(parts.map(p => p[0]).join('').toLowerCase());   // rv
            frags.add(parts.map(p => p[0]).join('').toUpperCase());   // RV
            frags.add(parts.map(p => p[0].toUpperCase() + p.slice(1).toLowerCase()).join('')); // RoshanVasani
        }
    }

    // DOB fragments
    if (dob) {
        const dateStr = dob.replace(/[^0-9]/g, '');
        const parts = dob.split(/[-/. ]+/);

        frags.add(dateStr);                                   // 15042004

        if (parts.length >= 3) {
            const [p1, p2, p3] = parts;
            // Try to identify year (4 digits or >31)
            let year, month, day;
            if (p1.length === 4) { year = p1; month = p2; day = p3; }
            else if (p3.length === 4) { year = p3; month = p1; day = p2; }
            else { year = p3.length === 2 ? (parseInt(p3) > 50 ? '19' + p3 : '20' + p3) : p3; month = p1; day = p2; }

            frags.add(year);                                    // 2004
            frags.add(year.slice(2));                           // 04
            frags.add(month.padStart(2, '0'));                   // 04
            frags.add(day.padStart(2, '0'));                     // 15
            frags.add(day + month);                             // 1504
            frags.add(month + day);                             // 0415
            frags.add(day + month + year);                      // 15042004
            frags.add(month + day + year);                      // 04152004
            frags.add(day + month + year.slice(2));             // 150404
            frags.add(month + year);                            // 042004
            frags.add(year + month);                            // 200404
        }
    }

    // Phone fragments
    if (phone) {
        const digits = phone.replace(/[^0-9]/g, '');
        frags.add(digits);
        if (digits.length >= 4) {
            frags.add(digits.slice(-4));                        // last 4
            frags.add(digits.slice(-6));                        // last 6
        }
        if (digits.length >= 10) {
            frags.add(digits.slice(-10));                       // last 10
        }
    }

    // Pet name fragments
    if (petName) {
        const clean = petName.trim();
        const lower = clean.toLowerCase();
        frags.add(lower);
        frags.add(clean);
        frags.add(lower.charAt(0).toUpperCase() + lower.slice(1));
        frags.add(lower.toUpperCase());
        if (lower.length > 3) {
            frags.add(lower.slice(0, 3));
            frags.add(lower.slice(0, 4));
        }
    }

    // Company fragments
    if (company) {
        const clean = company.trim();
        const lower = clean.toLowerCase().replace(/\s+/g, '');
        frags.add(lower);
        frags.add(clean);
        frags.add(clean.replace(/\s+/g, ''));
        frags.add(lower.charAt(0).toUpperCase() + lower.slice(1));
        const words = clean.split(/\s+/);
        if (words.length > 1) {
            frags.add(words.map(w => w[0]).join('').toLowerCase());
            frags.add(words.map(w => w[0]).join('').toUpperCase());
        }
        for (const w of words) {
            frags.add(w.toLowerCase());
        }
    }

    // Remove empty
    frags.delete('');
    return [...frags];
}

// ─── Leet Speak Transform ────────────────────────────────────────

const LEET_MAP = { a: '@', e: '3', i: '1', o: '0', s: '$', t: '7', l: '1', g: '9', b: '8' };
const LEET_MAP_HEAVY = { ...LEET_MAP, a: '4', i: '!', s: '5', z: '2' };

function leetSpeak(word, heavy = false) {
    const map = heavy ? LEET_MAP_HEAVY : LEET_MAP;
    return word.split('').map(c => map[c.toLowerCase()] || c).join('');
}

function leetVariants(word) {
    const results = [word];
    // Light leet
    const light = leetSpeak(word);
    if (light !== word) results.push(light);
    // Heavy leet
    const heavy = leetSpeak(word, true);
    if (heavy !== light && heavy !== word) results.push(heavy);
    // Partial leet (only first vowel)
    const partial = word.replace(/[aeiou]/i, m => LEET_MAP[m.toLowerCase()] || m);
    if (partial !== word && !results.includes(partial)) results.push(partial);
    return results;
}

// ─── Case Variants ───────────────────────────────────────────────

function caseVariants(word) {
    const lower = word.toLowerCase();
    const results = [lower];
    // Capitalized
    results.push(lower.charAt(0).toUpperCase() + lower.slice(1));
    // All upper
    results.push(lower.toUpperCase());
    // camelCase (if space-separated)
    if (lower.includes(' ')) {
        results.push(lower.split(' ').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''));
    }
    return [...new Set(results)];
}

// ─── Pattern Generation Engine ───────────────────────────────────
// Uses behavioral heuristics from real-world password studies

function generateGuesses(profile) {
    const startTime = Date.now();
    const candidates = new Map(); // password → { pattern, source, rank }
    const frags = extractFragments(profile);
    let rank = 0;

    const add = (pw, pattern, source) => {
        if (pw && pw.length >= 4 && pw.length <= 30 && !candidates.has(pw)) {
            candidates.set(pw, { password: pw, pattern, source, rank: rank++ });
        }
    };

    // ─── Phase 1: Direct personal info (most common pattern) ─────
    // People use their name/pet/company as-is or with simple suffix

    const nameFrags = [];
    if (profile.name) {
        const parts = profile.name.trim().split(/\s+/);
        for (const p of parts) {
            nameFrags.push(p.toLowerCase(), p, p.toLowerCase().charAt(0).toUpperCase() + p.toLowerCase().slice(1));
        }
        nameFrags.push(profile.name.toLowerCase().replace(/\s+/g, ''));
    }
    const petFrags = profile.petName ? [profile.petName.toLowerCase(), profile.petName.trim(), profile.petName.toLowerCase().charAt(0).toUpperCase() + profile.petName.toLowerCase().slice(1)] : [];
    const companyFrags = profile.company ? [profile.company.toLowerCase().replace(/\s+/g, ''), profile.company.trim()] : [];

    // Phase 1: name + common suffixes (roshan123, Roshan@123)
    const primaryWords = [...new Set([...nameFrags, ...petFrags, ...companyFrags])];
    for (const word of primaryWords) {
        for (const suffix of COMMON_SUFFIXES) {
            add(word + suffix, `word + "${suffix}"`, 'Primary Name/Pet/Company');
        }
    }

    // ─── Phase 2: Name + Year/DOB combos (roshan2004, roshan@2004) 
    const dateFrags = [];
    if (profile.dob) {
        const parts = profile.dob.split(/[-/. ]+/);
        if (parts.length >= 3) {
            let year;
            if (parts[0].length === 4) year = parts[0];
            else if (parts[2].length === 4) year = parts[2];
            else year = parts[2].length === 2 ? (parseInt(parts[2]) > 50 ? '19' + parts[2] : '20' + parts[2]) : parts[2];
            dateFrags.push(year, year.slice(2));
            const day = parts[parts[0].length === 4 ? 2 : 0].padStart(2, '0');
            const month = parts[parts[0].length === 4 ? 1 : 1].padStart(2, '0');
            dateFrags.push(day + month, month + day, day + month + year, day + month + year.slice(2));
        }
    }

    for (const word of primaryWords) {
        for (const sep of SEPARATORS.slice(0, 5)) { // Top 5 separators
            for (const date of dateFrags) {
                add(word + sep + date, `name + "${sep}" + date`, 'Name + DOB');
                add(date + sep + word, `date + "${sep}" + name`, 'DOB + Name');
            }
        }
    }

    // ─── Phase 3: Name + Phone fragments
    if (profile.phone) {
        const digits = profile.phone.replace(/[^0-9]/g, '');
        const phoneFrags = [digits.slice(-4), digits.slice(-6), digits];

        for (const word of primaryWords.slice(0, 6)) { // Top 6 words
            for (const sep of SEPARATORS.slice(0, 4)) {
                for (const ph of phoneFrags) {
                    if (ph) {
                        add(word + sep + ph, `name + "${sep}" + phone`, 'Name + Phone');
                        add(ph + sep + word, `phone + "${sep}" + name`, 'Phone + Name');
                    }
                }
            }
        }
    }

    // ─── Phase 4: Leet speak variants
    for (const word of primaryWords.slice(0, 8)) {
        for (const leet of leetVariants(word)) {
            if (leet !== word) {
                add(leet, 'leet transform', 'Leet Speak');
                for (const suffix of COMMON_SUFFIXES.slice(0, 10)) {
                    add(leet + suffix, `leet + "${suffix}"`, 'Leet + Suffix');
                }
                for (const date of dateFrags.slice(0, 4)) {
                    add(leet + date, 'leet + date', 'Leet + DOB');
                }
            }
        }
    }

    // ─── Phase 5: Cross-field combinations (pet+year, company+phone)
    const crossPairs = [];
    if (nameFrags.length && petFrags.length) {
        for (const n of nameFrags.slice(0, 3)) {
            for (const p of petFrags.slice(0, 2)) {
                crossPairs.push([n, p, 'Name + Pet']);
                crossPairs.push([p, n, 'Pet + Name']);
            }
        }
    }
    if (nameFrags.length && companyFrags.length) {
        for (const n of nameFrags.slice(0, 3)) {
            for (const c of companyFrags.slice(0, 2)) {
                crossPairs.push([n, c, 'Name + Company']);
                crossPairs.push([c, n, 'Company + Name']);
            }
        }
    }
    if (petFrags.length && dateFrags.length) {
        for (const p of petFrags.slice(0, 2)) {
            for (const d of dateFrags.slice(0, 3)) {
                crossPairs.push([p, d, 'Pet + DOB']);
            }
        }
    }
    if (companyFrags.length && dateFrags.length) {
        for (const c of companyFrags.slice(0, 2)) {
            for (const d of dateFrags.slice(0, 3)) {
                crossPairs.push([c, d, 'Company + DOB']);
            }
        }
    }

    for (const [a, b, source] of crossPairs) {
        for (const sep of SEPARATORS.slice(0, 5)) {
            add(a + sep + b, `cross: "${sep}" join`, source);
        }
    }

    // ─── Phase 6: Prefixed patterns (iloveroshan, myMotu, theking)
    for (const prefix of COMMON_PREFIXES) {
        if (!prefix) continue;
        for (const word of primaryWords.slice(0, 5)) {
            add(prefix + word, `"${prefix}" + word`, 'Prefix Pattern');
            for (const suffix of ['', '123', '!', '@123', '1']) {
                add(prefix + word + suffix, `"${prefix}" + word + "${suffix}"`, 'Prefix + Suffix');
            }
        }
    }

    // ─── Phase 7: Reverse patterns
    for (const word of primaryWords.slice(0, 5)) {
        const rev = word.split('').reverse().join('');
        add(rev, 'reverse', 'Reversed Name');
        add(rev + '123', 'reverse + "123"', 'Reversed + Suffix');
    }

    // ─── Phase 8: Duplicate/repeat patterns
    for (const word of primaryWords.slice(0, 5)) {
        add(word + word, 'duplicate', 'Repeated');
        if (word.length <= 6) add(word + word + word, 'triplicate', 'Repeated');
    }

    // ─── Phase 9: Keyboard walk appends
    const kbWalks = ['qwerty', 'asdf', 'zxcv', '1234', 'qwer', 'wasd'];
    for (const word of primaryWords.slice(0, 4)) {
        for (const kb of kbWalks) {
            add(word + kb, `word + "${kb}"`, 'Keyboard Walk');
        }
    }

    // ─── Phase 10: Year-centric (most common real-world pattern)
    for (const word of primaryWords.slice(0, 8)) {
        for (const y of [...YEARS.slice(-15), ...SHORT_YEARS.slice(-15)]) { // Last 15 years
            add(word + y, 'word + year', 'Recent Year');
            // With separators (sarojini@2026, roshan#2024)
            for (const sep of ['@', '#', '!', '_', '.']) {
                add(word + sep + y, `word + "${sep}" + year`, 'Recent Year');
            }
        }
    }

    const guesses = [...candidates.values()];

    return {
        totalGuesses: guesses.length,
        guesses, // Return all for cracking
        topGuesses: guesses.slice(0, 500), // Capped for display
        phases: [
            { name: 'Direct Name/Pet/Company + Suffix', description: 'Most common pattern: word + 123, !, @', count: guesses.filter(g => g.source.startsWith('Primary')).length },
            { name: 'Name + DOB', description: 'Personal dates combined with names', count: guesses.filter(g => g.source.includes('DOB')).length },
            { name: 'Name + Phone', description: 'Phone digits combined with names', count: guesses.filter(g => g.source.includes('Phone')).length },
            { name: 'Leet Speak', description: 'a→@, e→3, i→1, o→0, s→$', count: guesses.filter(g => g.source.includes('Leet')).length },
            { name: 'Cross-Field Combos', description: 'Name+Pet, Company+Year, etc.', count: guesses.filter(g => g.source.includes('+')).length },
            { name: 'Behavioral Patterns', description: 'Prefixes, reverses, keyboard walks, repeats', count: guesses.filter(g => ['Prefix', 'Reversed', 'Repeated', 'Keyboard', 'Recent'].some(k => g.source.includes(k))).length },
        ],
        timeMs: Date.now() - startTime,
        profileUsed: {
            name: !!profile.name,
            dob: !!profile.dob,
            phone: !!profile.phone,
            petName: !!profile.petName,
            company: !!profile.company,
        },
    };
}

// ─── Smart Attack: Generate + Hash-Match ─────────────────────────
// Takes profile + target hash, generates guesses and tries to crack

export function smartAttack(profile, targetHash, algorithm = 'md5') {
    const startTime = Date.now();
    const result = generateGuesses(profile);

    const hashFn = (pw) => crypto.createHash(algorithm).update(pw).digest('hex');

    let cracked = false;
    let crackedPassword = null;
    let crackedAt = null;
    let attempts = 0;

    for (const guess of result.guesses) {
        attempts++;
        const h = hashFn(guess.password);
        if (h === targetHash.toLowerCase()) {
            cracked = true;
            crackedPassword = guess.password;
            crackedAt = guess;
            break;
        }
    }

    const totalTime = Date.now() - startTime;

    return {
        cracked,
        password: crackedPassword,
        method: crackedAt ? `Smart Guess: ${crackedAt.pattern} (${crackedAt.source})` : null,
        ranking: crackedAt?.rank,
        attempts,
        totalCandidates: result.totalGuesses,
        timeMs: totalTime,
        hashesPerSecond: Math.round((attempts / (totalTime || 1)) * 1000),
        phases: result.phases,
        // Return top 50 guesses as preview (even if not cracking)
        topGuesses: result.topGuesses.slice(0, 50).map(g => ({
            password: g.password,
            pattern: g.pattern,
            source: g.source,
        })),
        profileUsed: result.profileUsed,
        aiModel: 'Behavioral Pattern Analysis',
        technique: 'Fragment extraction + cross-field combination + leet speak + date heuristics',
    };
}

// ─── Guess-Only Mode (no hash) ───────────────────────────────────
// Just generates the guesses for display

export function generateSmartGuesses(profile) {
    const result = generateGuesses(profile);
    return {
        totalGuesses: result.totalGuesses,
        guesses: result.topGuesses, // Only return top 500 for display
        phases: result.phases,
        timeMs: result.timeMs,
        profileUsed: result.profileUsed,
    };
}
