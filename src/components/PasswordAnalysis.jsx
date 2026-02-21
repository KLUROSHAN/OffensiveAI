import React, { useState, useRef } from 'react';

export default function PasswordAnalysis({ sessionId, API, onStatsUpdate }) {
    const [mode, setMode] = useState('crack');
    const [password, setPassword] = useState('');
    const [hash, setHash] = useState('');
    const [batchPasswords, setBatchPasswords] = useState('');
    const [crackAlgo, setCrackAlgo] = useState('md5');
    const [result, setResult] = useState(null);
    const [crackResult, setCrackResult] = useState(null);
    const [hashResult, setHashResult] = useState(null);
    const [batchResult, setBatchResult] = useState(null);
    const [bruteForceLog, setBruteForceLog] = useState([]);
    const [bruteForceRunning, setBruteForceRunning] = useState(false);
    const [bruteForceResult, setBruteForceResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const eventSourceRef = useRef(null);

    // JtR state
    const [jtrHash, setJtrHash] = useState('');
    const [jtrAlgo, setJtrAlgo] = useState('md5');
    const [jtrWordlist, setJtrWordlist] = useState('');
    const [jtrResult, setJtrResult] = useState(null);
    const [jtrLoading, setJtrLoading] = useState(false);
    const [jtrGenHash, setJtrGenHash] = useState('');
    const [jtrGenAlgo, setJtrGenAlgo] = useState('md5');

    // AI state
    const [aiHash, setAiHash] = useState('');
    const [aiAlgo, setAiAlgo] = useState('md5');
    const [aiWordlist, setAiWordlist] = useState('');
    const [aiResult, setAiResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiGenPw, setAiGenPw] = useState('');
    const [nnPassword, setNnPassword] = useState('');
    const [nnResult, setNnResult] = useState(null);
    const [nnLoading, setNnLoading] = useState(false);

    // Smart Attack state
    const [smartProfile, setSmartProfile] = useState({ name: '', dob: '', phone: '', petName: '', company: '' });
    const [smartHash, setSmartHash] = useState('');
    const [smartAlgo, setSmartAlgo] = useState('md5');
    const [smartResult, setSmartResult] = useState(null);
    const [smartLoading, setSmartLoading] = useState(false);
    const [smartGenPw, setSmartGenPw] = useState('');

    // Gemini Crack state
    const [gemProfile, setGemProfile] = useState({ name: '', dob: '', phone: '', petName: '', company: '' });
    const [gemHash, setGemHash] = useState('');
    const [gemAlgo, setGemAlgo] = useState('md5');
    const [gemResult, setGemResult] = useState(null);
    const [gemLoading, setGemLoading] = useState(false);
    const [gemGenPw, setGemGenPw] = useState('');

    const analyzePassword = async () => {
        if (!password) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/password/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, sessionId }),
            });
            setResult(await res.json());
            onStatsUpdate?.();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // REAL password cracking — hash then crack
    const realCrack = async () => {
        if (!password) return;
        setLoading(true);
        setCrackResult(null);
        try {
            const res = await fetch(`${API}/password/crack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, algorithm: crackAlgo, sessionId }),
            });
            setCrackResult(await res.json());
            onStatsUpdate?.();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const analyzeHash = async () => {
        if (!hash) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/password/hash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hash }),
            });
            setHashResult(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Live brute-force via SSE
    const startBruteForce = () => {
        if (!hash) return;
        setBruteForceRunning(true);
        setBruteForceLog([]);
        setBruteForceResult(null);

        const es = new EventSource(`${API}/password/bruteforce?hash=${encodeURIComponent(hash)}&algorithm=md5&maxLen=4`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'progress') {
                setBruteForceLog(prev => [...prev.slice(-50), data]);
            } else if (data.type === 'cracked') {
                setBruteForceResult(data);
                setBruteForceRunning(false);
                es.close();
            } else if (data.type === 'exhausted' || data.type === 'complete') {
                setBruteForceResult(data);
                setBruteForceRunning(false);
                es.close();
            } else if (data.type === 'phase_complete') {
                setBruteForceLog(prev => [...prev, { ...data, isPhase: true }]);
            }
        };

        es.onerror = () => {
            setBruteForceRunning(false);
            es.close();
        };
    };

    const stopBruteForce = () => {
        if (eventSourceRef.current) eventSourceRef.current.close();
        setBruteForceRunning(false);
    };

    const analyzeBatch = async () => {
        const passwords = batchPasswords.split('\n').filter(p => p.trim());
        if (passwords.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/password/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passwords, sessionId }),
            });
            setBatchResult(await res.json());
            onStatsUpdate?.();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // JtR Hash Cracker
    const jtrCrack = async () => {
        if (!jtrHash) return;
        setJtrLoading(true);
        setJtrResult(null);
        try {
            const wordlist = jtrWordlist.split(/[,\n]/).map(w => w.trim()).filter(w => w.length > 0);
            const res = await fetch(`${API}/password/jtr-crack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hash: jtrHash, algorithm: jtrAlgo, wordlist, sessionId }),
            });
            setJtrResult(await res.json());
        } catch (e) { console.error(e); }
        setJtrLoading(false);
    };

    const jtrGenerateHash = async () => {
        if (!jtrGenHash) return;
        try {
            const res = await fetch(`${API}/password/generate-hash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: jtrGenHash, algorithm: jtrGenAlgo }),
            });
            const data = await res.json();
            if (data.hash) {
                setJtrHash(data.hash);
                setJtrAlgo(data.algorithm);
            }
        } catch (e) { console.error(e); }
    };

    // AI Markov Chain Cracker
    const aiCrack = async () => {
        if (!aiHash) return;
        setAiLoading(true); setAiResult(null);
        try {
            const wordlist = aiWordlist.split(/[,\n]/).map(w => w.trim()).filter(w => w.length > 0);
            const res = await fetch(`${API}/ai/crack-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hash: aiHash, algorithm: aiAlgo, wordlist }),
            });
            setAiResult(await res.json());
        } catch (e) { console.error(e); }
        setAiLoading(false);
    };

    const aiGenerateHash = async () => {
        if (!aiGenPw) return;
        try {
            const res = await fetch(`${API}/password/generate-hash`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: aiGenPw, algorithm: aiAlgo }),
            });
            const data = await res.json();
            if (data.hash) setAiHash(data.hash);
        } catch (e) { console.error(e); }
    };

    // AI Neural Network Strength Predictor
    const predictNN = async () => {
        if (!nnPassword) return;
        setNnLoading(true); setNnResult(null);
        try {
            const res = await fetch(`${API}/ai/predict-strength`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: nnPassword }),
            });
            setNnResult(await res.json());
        } catch (e) { console.error(e); }
        setNnLoading(false);
    };

    const getStrengthClass = rating => {
        const map = { 'Very Weak': 'very-weak', 'Weak': 'weak', 'Moderate': 'moderate', 'Strong': 'strong', 'Very Strong': 'very-strong' };
        return map[rating] || 'weak';
    };

    const getScoreColor = score => {
        if (score >= 80) return 'var(--neon-green)';
        if (score >= 60) return 'var(--neon-cyan)';
        if (score >= 40) return 'var(--neon-yellow)';
        if (score >= 20) return 'var(--neon-orange)';
        return 'var(--neon-red)';
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>🔐 Password Attack Engine</h2>
                <p>AI-powered password cracking with Markov Chain, Neural Network, Smart Guess, and rule-based attacks</p>
            </div>

            <div className="tabs">
                <button className={`tab ${mode === 'gemcrack' ? 'active' : ''}`} onClick={() => setMode('gemcrack')}>🤖 Gemini Crack</button>
                <button className={`tab ${mode === 'smart' ? 'active' : ''}`} onClick={() => setMode('smart')}>🧐 Smart Attack</button>
                <button className={`tab ${mode === 'aicrack' ? 'active' : ''}`} onClick={() => setMode('aicrack')}>🧠 AI Cracker</button>
                <button className={`tab ${mode === 'ainn' ? 'active' : ''}`} onClick={() => setMode('ainn')}>🎯 AI Strength</button>
                <button className={`tab ${mode === 'crack' ? 'active' : ''}`} onClick={() => setMode('crack')}>⚔️ Real Crack</button>
                <button className={`tab ${mode === 'jtr' ? 'active' : ''}`} onClick={() => setMode('jtr')}>🔨 JtR</button>
                <button className={`tab ${mode === 'hash' ? 'active' : ''}`} onClick={() => setMode('hash')}>🔓 Hash</button>
                <button className={`tab ${mode === 'batch' ? 'active' : ''}`} onClick={() => setMode('batch')}>📋 Batch</button>
            </div>

            {/* ═══ AI SMART ATTACK ═══ */}
            {mode === 'smart' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">🧐</span> AI-Guided Smart Password Guesser
                        </div>
                        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div>
                                <strong>Behavioral Pattern AI</strong> — Analyzes personal information and generates password guesses
                                based on <strong>real-world human behavior patterns</strong>. Uses fragment extraction, date decomposition,
                                leet speak, cross-field combinations, and 10+ heuristic attack phases.
                            </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neon-magenta)', marginBottom: 12 }}>👤 TARGET PROFILE</div>
                        <div className="grid-2" style={{ marginBottom: 12 }}>
                            <div className="input-group">
                                <label>Full Name *</label>
                                <input value={smartProfile.name} onChange={e => setSmartProfile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Roshan Vasani" />
                            </div>
                            <div className="input-group">
                                <label>Date of Birth</label>
                                <input value={smartProfile.dob} onChange={e => setSmartProfile(p => ({ ...p, dob: e.target.value }))} placeholder="e.g. 15/04/2004 or 2004-04-15" />
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input value={smartProfile.phone} onChange={e => setSmartProfile(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9876543210" />
                            </div>
                            <div className="input-group">
                                <label>Pet Name / Nickname</label>
                                <input value={smartProfile.petName} onChange={e => setSmartProfile(p => ({ ...p, petName: e.target.value }))} placeholder="e.g. Motu, Bruno" />
                            </div>
                            <div className="input-group">
                                <label>Company / School</label>
                                <input value={smartProfile.company} onChange={e => setSmartProfile(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Sarojini Univ" />
                            </div>
                        </div>

                        <div className="card" style={{ background: 'rgba(255,0,255,0.03)', border: '1px solid var(--border-subtle)', marginBottom: 16, padding: 16 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neon-cyan)', marginBottom: 8 }}>🎯 OPTIONAL: Target Hash (to crack)</div>
                            <div className="flex gap-sm items-end" style={{ marginBottom: 8 }}>
                                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                                    <input type="text" value={smartGenPw} onChange={e => setSmartGenPw(e.target.value)} placeholder="Generate hash from password..." />
                                </div>
                                <button className="btn btn-ghost" disabled={!smartGenPw} onClick={async () => {
                                    try {
                                        const res = await fetch(`${API}/password/generate-hash`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: smartGenPw, algorithm: smartAlgo }) });
                                        const data = await res.json(); if (data.hash) setSmartHash(data.hash);
                                    } catch (e) { console.error(e); }
                                }}>⬇️ Generate</button>
                            </div>
                            <div className="grid-2">
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <input value={smartHash} onChange={e => setSmartHash(e.target.value)} placeholder="Paste target hash (leave empty for guess-only mode)" />
                                </div>
                                <select value={smartAlgo} onChange={e => setSmartAlgo(e.target.value)} style={{ height: 42 }}>
                                    <option value="md5">MD5</option><option value="sha1">SHA-1</option><option value="sha256">SHA-256</option>
                                </select>
                            </div>
                        </div>

                        <button className="btn btn-primary w-full" disabled={smartLoading || !smartProfile.name} onClick={async () => {
                            setSmartLoading(true); setSmartResult(null);
                            try {
                                const body = { profile: smartProfile };
                                if (smartHash) { body.hash = smartHash; body.algorithm = smartAlgo; }
                                const res = await fetch(`${API}/ai/smart-attack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                                setSmartResult(await res.json());
                            } catch (e) { console.error(e); }
                            setSmartLoading(false);
                        }} style={{ fontSize: '1rem', padding: '14px 0' }}>
                            {smartLoading ? <><span className="loading-spinner"></span> AI Analyzing Patterns...</> : smartHash ? '🧐 Launch Smart Attack (Crack Hash)' : '🧐 Generate Smart Guesses'}
                        </button>
                    </div>

                    {smartResult && (
                        <div className="fade-in">
                            {/* Cracking result (if hash was provided) */}
                            {smartResult.cracked !== undefined && (
                                <div className={`card ${smartResult.cracked ? 'card-glow-magenta' : 'card-glow-green'}`} style={{ marginBottom: 20 }}>
                                    <div className="text-center" style={{ padding: 24 }}>
                                        <div style={{ fontSize: '4rem', marginBottom: 8 }}>{smartResult.cracked ? '💥' : '🛡️'}</div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: smartResult.cracked ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                                            {smartResult.cracked ? 'SMART ATTACK CRACKED IT!' : 'Hash Survived Smart Attack'}
                                        </h3>
                                        {smartResult.cracked && (
                                            <>
                                                <div className="mono" style={{ fontSize: '1.8rem', color: 'var(--neon-red)', marginTop: 12, background: 'rgba(255,0,60,0.1)', borderRadius: 8, padding: '8px 20px', display: 'inline-block' }}>
                                                    {smartResult.password}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12 }}>
                                                    Pattern: <span className="mono text-cyan">{smartResult.method}</span> | Rank: <span className="mono text-magenta">#{smartResult.ranking}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{(smartResult.totalGuesses || smartResult.totalCandidates || 0).toLocaleString()}</div><div className="metric-label">Guesses Generated</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{smartResult.attempts?.toLocaleString() || '-'}</div><div className="metric-label">Hash Attempts</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{smartResult.timeMs}ms</div><div className="metric-label">Time</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-orange">{smartResult.hashesPerSecond?.toLocaleString() || '-'}</div><div className="metric-label">H/s</div></div></div>
                            </div>

                            {/* Attack Phases */}
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📊</span> Attack Phase Breakdown</div>
                                {(smartResult.phases || []).map((phase, i) => (
                                    <div key={i} className="result-item severity-medium">
                                        <div className="result-item-title flex items-center justify-between">
                                            <span>🔹 {phase.name}</span>
                                            <span className="badge badge-info">{phase.count} candidates</span>
                                        </div>
                                        <div className="result-item-desc">{phase.description}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Top guesses table */}
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 16 }}>
                                    <span className="icon">🧐</span> Top AI-Generated Password Guesses
                                    <span className="badge badge-critical" style={{ marginLeft: 8 }}>{(smartResult.topGuesses || smartResult.guesses || []).length} shown</span>
                                </div>
                                <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    <table>
                                        <thead><tr><th>#</th><th>Password Guess</th><th>Pattern</th><th>Source</th></tr></thead>
                                        <tbody>
                                            {(smartResult.topGuesses || smartResult.guesses || []).slice(0, 100).map((g, i) => (
                                                <tr key={i} style={g.password === smartResult?.password ? { background: 'rgba(255,0,60,0.15)' } : {}}>
                                                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                                    <td className="mono" style={{ color: g.password === smartResult?.password ? 'var(--neon-red)' : 'var(--neon-cyan)', fontWeight: g.password === smartResult?.password ? 700 : 400 }}>
                                                        {g.password} {g.password === smartResult?.password && '💥'}
                                                    </td>
                                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{g.pattern}</td>
                                                    <td><span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>{g.source}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ GEMINI AI CRACK ═══ */}
            {mode === 'gemcrack' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">🤖</span> Gemini AI Password Cracker
                        </div>
                        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div>
                                <strong>Powered by Google Gemini LLM</strong> — The AI <strong>reasons</strong> about what passwords
                                a person would create based on their personal information. Gemini generates 150+ intelligent guesses,
                                which are then hashed and matched against your target hash.
                            </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neon-cyan)', marginBottom: 12 }}>👤 TARGET PROFILE</div>
                        <div className="grid-2" style={{ marginBottom: 12 }}>
                            <div className="input-group">
                                <label>Full Name *</label>
                                <input value={gemProfile.name} onChange={e => setGemProfile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Roshan Vasani" />
                            </div>
                            <div className="input-group">
                                <label>Date of Birth</label>
                                <input value={gemProfile.dob} onChange={e => setGemProfile(p => ({ ...p, dob: e.target.value }))} placeholder="e.g. 15/04/2004" />
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input value={gemProfile.phone} onChange={e => setGemProfile(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9876543210" />
                            </div>
                            <div className="input-group">
                                <label>Pet Name / Nickname</label>
                                <input value={gemProfile.petName} onChange={e => setGemProfile(p => ({ ...p, petName: e.target.value }))} placeholder="e.g. Motu" />
                            </div>
                            <div className="input-group">
                                <label>Company / School</label>
                                <input value={gemProfile.company} onChange={e => setGemProfile(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Sarojini Univ" />
                            </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neon-red)', marginBottom: 8 }}>🎯 TARGET HASH *</div>
                        <div className="flex gap-sm items-end" style={{ marginBottom: 8 }}>
                            <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                                <input value={gemGenPw} onChange={e => setGemGenPw(e.target.value)} placeholder="Generate hash from password..." />
                            </div>
                            <button className="btn btn-ghost" disabled={!gemGenPw} onClick={async () => {
                                try {
                                    const res = await fetch(`${API}/password/generate-hash`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: gemGenPw, algorithm: gemAlgo }) });
                                    const data = await res.json(); if (data.hash) setGemHash(data.hash);
                                } catch (e) { console.error(e); }
                            }}>⬇️ Generate</button>
                        </div>
                        <div className="grid-2" style={{ marginBottom: 16 }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <input value={gemHash} onChange={e => setGemHash(e.target.value)} placeholder="Paste target hash to crack..." />
                            </div>
                            <select value={gemAlgo} onChange={e => setGemAlgo(e.target.value)} style={{ height: 42 }}>
                                <option value="md5">MD5</option><option value="sha1">SHA-1</option><option value="sha256">SHA-256</option>
                            </select>
                        </div>

                        <button className="btn btn-primary w-full" disabled={gemLoading || !gemProfile.name || !gemHash} onClick={async () => {
                            setGemLoading(true); setGemResult(null);
                            try {
                                const res = await fetch(`${API}/gemini/crack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: gemProfile, hash: gemHash, algorithm: gemAlgo }) });
                                setGemResult(await res.json());
                            } catch (e) { setGemResult({ error: e.message }); }
                            setGemLoading(false);
                        }} style={{ fontSize: '1.1rem', padding: '16px 0', background: 'linear-gradient(135deg, #4285f4, #34a853)' }}>
                            {gemLoading ? <><span className="loading-spinner"></span> Gemini AI is thinking &amp; cracking...</> : '🤖 Crack Password with Gemini AI'}
                        </button>
                    </div>

                    {gemResult && !gemResult.error && (
                        <div className="fade-in">
                            {/* Crack result */}
                            <div className={`card ${gemResult.cracked ? 'card-glow-magenta' : 'card-glow-green'}`} style={{ marginBottom: 20 }}>
                                <div className="text-center" style={{ padding: 24 }}>
                                    <div style={{ fontSize: '4rem', marginBottom: 8 }}>{gemResult.cracked ? '💥' : '🛡️'}</div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: gemResult.cracked ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                                        {gemResult.cracked ? 'GEMINI AI CRACKED THE PASSWORD!' : 'Hash Survived Gemini AI Attack'}
                                    </h3>
                                    {gemResult.cracked && (
                                        <>
                                            <div className="mono" style={{ fontSize: '2rem', color: 'var(--neon-red)', marginTop: 12, background: 'rgba(255,0,60,0.1)', borderRadius: 8, padding: '10px 24px', display: 'inline-block' }}>
                                                {gemResult.password}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12 }}>
                                                AI Guess Rank: <span className="mono text-magenta">#{gemResult.ranking}</span> | Model: <span className="mono text-cyan">{gemResult.model}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{gemResult.totalGuesses}</div><div className="metric-label">AI Guesses</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{gemResult.attempts}</div><div className="metric-label">Hashes Tried</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{gemResult.aiTimeMs}ms</div><div className="metric-label">AI Think Time</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-orange">{gemResult.tokens?.total}</div><div className="metric-label">Tokens Used</div></div></div>
                            </div>

                            {/* AI-generated guesses */}
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 16 }}>
                                    <span className="icon">🤖</span> Gemini AI Generated Password Guesses
                                    <span className="badge badge-info" style={{ marginLeft: 8 }}>{gemResult.model}</span>
                                    <span className="badge badge-critical" style={{ marginLeft: 8 }}>{gemResult.totalGuesses} guesses</span>
                                </div>
                                <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    <table>
                                        <thead><tr><th>#</th><th>AI-Generated Password</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {(gemResult.guesses || []).map((g, i) => (
                                                <tr key={i} style={g.match ? { background: 'rgba(255,0,60,0.15)' } : {}}>
                                                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{g.rank}</td>
                                                    <td className="mono" style={{ color: g.match ? 'var(--neon-red)' : 'var(--neon-cyan)', fontWeight: g.match ? 700 : 400 }}>
                                                        {g.password} {g.match && '💥 CRACKED'}
                                                    </td>
                                                    <td>{g.match ? <span className="badge badge-critical">MATCH</span> : <span className="badge badge-low" style={{ opacity: 0.5 }}>Tried</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {gemResult?.error && (
                        <div className="card card-glow-magenta" style={{ padding: 20, textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
                            <p style={{ color: 'var(--neon-red)' }}>{gemResult.error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ AI MARKOV CHAIN CRACKER ═══ */}
            {mode === 'aicrack' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">🧠</span> AI Markov Chain Password Cracker
                        </div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div>
                                <strong>Markov Chain AI</strong> — Uses a probabilistic N-gram model trained on real password patterns.
                                Generates candidates ordered by <strong>statistical likelihood</strong> using beam search.
                                Same technique as <strong>OMEN</strong> and <strong>JtR Markov mode</strong>.
                            </div>
                        </div>
                        <div className="card" style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid var(--border-subtle)', marginBottom: 16, padding: 16 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neon-cyan)', marginBottom: 8 }}>🔧 Hash Generator</div>
                            <div className="flex gap-sm items-end">
                                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                                    <input type="text" value={aiGenPw} onChange={e => setAiGenPw(e.target.value)} placeholder="e.g. roshan123" />
                                </div>
                                <button className="btn btn-ghost" onClick={aiGenerateHash} disabled={!aiGenPw}>⬇️ Generate</button>
                            </div>
                        </div>
                        <div className="grid-2" style={{ marginBottom: 16 }}>
                            <div className="input-group">
                                <label>Target Hash</label>
                                <textarea value={aiHash} onChange={e => setAiHash(e.target.value)} placeholder="Paste hash here..." style={{ minHeight: 70 }} />
                            </div>
                            <div className="input-group">
                                <label>Custom Words (comma/newline separated)</label>
                                <textarea value={aiWordlist} onChange={e => setAiWordlist(e.target.value)} placeholder="roshan, rosh, prudhvi" style={{ minHeight: 70 }} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Algorithm</label>
                            <select value={aiAlgo} onChange={e => setAiAlgo(e.target.value)}>
                                <option value="md5">MD5</option><option value="sha1">SHA-1</option><option value="sha256">SHA-256</option>
                            </select>
                        </div>
                        <button className="btn btn-primary w-full" onClick={aiCrack} disabled={aiLoading || !aiHash} style={{ fontSize: '1rem', padding: '14px 0' }}>
                            {aiLoading ? <><span className="loading-spinner"></span> AI Markov Chain Cracking...</> : '🧠 Launch AI Markov Chain Attack'}
                        </button>
                    </div>
                    {aiResult && (
                        <div className="fade-in">
                            <div className={`card ${aiResult.cracked ? 'card-glow-magenta' : 'card-glow-green'}`} style={{ marginBottom: 20 }}>
                                <div className="text-center" style={{ padding: 24 }}>
                                    <div style={{ fontSize: '4rem', marginBottom: 8 }}>{aiResult.cracked ? '💥' : '🛡️'}</div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: aiResult.cracked ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                                        {aiResult.cracked ? 'AI CRACKED THE HASH!' : 'Hash Survived AI Attack'}
                                    </h3>
                                    {aiResult.cracked && (
                                        <div className="mono" style={{ fontSize: '1.6rem', color: 'var(--neon-red)', marginTop: 12, background: 'rgba(255,0,60,0.1)', borderRadius: 8, padding: '8px 16px', display: 'inline-block' }}>
                                            {aiResult.password}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12 }}>
                                        Method: <span className="mono text-cyan">{aiResult.method}</span> | AI Model: <span className="mono text-magenta">{aiResult.aiModel}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{aiResult.attempts?.toLocaleString()}</div><div className="metric-label">Attempts</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{aiResult.hashesPerSecond?.toLocaleString()}</div><div className="metric-label">H/s</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{aiResult.timeMs}ms</div><div className="metric-label">Time</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-orange">{aiResult.modelInfo?.contexts}</div><div className="metric-label">Markov Contexts</div></div></div>
                            </div>
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📊</span> AI Attack Phases</div>
                                {aiResult.phases?.map((phase, i) => (
                                    <div key={i} className={`result-item ${phase.success ? 'severity-critical' : 'severity-low'}`}>
                                        <div className="result-item-title flex items-center justify-between">
                                            <span>{phase.success ? '💥' : '✅'} {phase.phase}</span>
                                            <span className={`badge ${phase.success ? 'badge-critical' : 'badge-low'}`}>{phase.success ? 'CRACKED' : 'Survived'}</span>
                                        </div>
                                        <div className="result-item-desc">
                                            {phase.attempted?.toLocaleString()} candidates in {phase.time}ms
                                            {phase.technique && <span> | Technique: <span className="mono text-cyan">{phase.technique}</span></span>}
                                            {phase.crackedWith && <span> | Found: <span className="mono text-red">"{phase.crackedWith}"</span></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {aiResult.log?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📜</span> AI Attack Log</div>
                                    <div style={{ maxHeight: 250, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
                                        {aiResult.log.map((line, i) => (
                                            <div key={i} style={{ marginBottom: 3, color: line.includes('[CRACKED]') ? 'var(--neon-red)' : line.includes('[AI]') ? 'var(--neon-cyan)' : 'var(--text-secondary)' }}>{line}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ AI NEURAL NETWORK STRENGTH ═══ */}
            {mode === 'ainn' && (
                <div>
                    <div className="card card-glow-green" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">🎯</span> Neural Network Strength Predictor</div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div><strong>Feedforward Neural Network</strong> (15→32→16→4) — Extracts 15 features from your password and classifies strength using trained weights with ReLU activation and Softmax output.</div>
                        </div>
                        <div className="input-group">
                            <label>Enter password for AI analysis</label>
                            <input type="text" value={nnPassword} onChange={e => setNnPassword(e.target.value)} placeholder="Enter any password..." onKeyDown={e => e.key === 'Enter' && predictNN()} />
                        </div>
                        <button className="btn btn-primary w-full" onClick={predictNN} disabled={nnLoading || !nnPassword}>
                            {nnLoading ? <><span className="loading-spinner"></span> Running Neural Network...</> : '🎯 Predict with Neural Network'}
                        </button>
                    </div>
                    {nnResult && (
                        <div className="fade-in">
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="text-center" style={{ padding: 24 }}>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: nnResult.classColor }}>{nnResult.predictedClass}</div>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: 4 }}>Confidence: <span className="mono" style={{ color: nnResult.classColor }}>{nnResult.confidence}%</span></div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                                        {nnResult.classProbabilities?.map((cp, i) => (
                                            <div key={i} style={{ textAlign: 'center', padding: '8px 12px', borderRadius: 8, background: `${cp.color}15`, border: `1px solid ${cp.color}40` }}>
                                                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: cp.color }}>{cp.probability}%</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{cp.class}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid-2" style={{ marginBottom: 20 }}>
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">⏱️</span> AI Crack Time</div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                                        <span>Brute-Force</span><span className="mono text-cyan">{nnResult.crackTime?.bruteForce}</span>
                                    </div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem', marginBottom: 8 }}>
                                        <span>AI-Adjusted</span><span className="mono" style={{ color: 'var(--neon-red)' }}>{nnResult.crackTime?.aiAdjusted}</span>
                                    </div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem' }}>
                                        <span>GPU Speed</span><span className="mono">{nnResult.crackTime?.gpuSpeed}</span>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🧬</span> Network Info</div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem', marginBottom: 6 }}>
                                        <span>Architecture</span><span className="mono text-cyan">{nnResult.networkInfo?.architecture}</span>
                                    </div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem', marginBottom: 6 }}>
                                        <span>Parameters</span><span className="mono">{nnResult.networkInfo?.totalParameters?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem', marginBottom: 6 }}>
                                        <span>Training Loss</span><span className="mono">{nnResult.networkInfo?.trainingLoss}</span>
                                    </div>
                                    <div className="flex justify-between" style={{ fontSize: '0.82rem' }}>
                                        <span>Prediction Time</span><span className="mono text-green">{nnResult.predictionTimeMs}ms</span>
                                    </div>
                                </div>
                            </div>
                            {nnResult.vulnerabilities?.length > 0 && (
                                <div className="card" style={{ marginBottom: 20 }}>
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">⚠️</span> AI-Detected Vulnerabilities</div>
                                    {nnResult.vulnerabilities.map((v, i) => (
                                        <div key={i} className={`result-item severity-${v.severity === 'Critical' ? 'critical' : v.severity === 'High' ? 'high' : 'medium'}`}>
                                            <div className="result-item-title">{v.type}</div>
                                            <div className="result-item-desc">{v.detail}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📊</span> Feature Analysis (15 NN Inputs)</div>
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>Feature</th><th>Value</th><th>Impact</th></tr></thead>
                                        <tbody>
                                            {nnResult.features?.map((f, i) => (
                                                <tr key={i}>
                                                    <td>{f.name}</td>
                                                    <td className="mono">{f.value}</td>
                                                    <td><span className={`badge ${f.impact === 'critical_weakness' ? 'badge-critical' : f.impact === 'weakness' ? 'badge-high' : f.impact === 'strength' ? 'badge-low' : 'badge-medium'}`}>{f.impact}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ REAL CRACK MODE ═══ */}
            {mode === 'crack' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">⚔️</span> Real Password Cracking Pipeline
                        </div>
                        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                            <span>🔴</span>
                            <div>
                                <strong>Live Attack Simulation</strong> — The system will hash your password, then attempt to crack it using 5 real attack phases: Rainbow Table → Dictionary → Rule Mutations → Hybrid → Brute-Force
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="input-group">
                                <label>Password to crack</label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter any password..."
                                    onKeyDown={e => e.key === 'Enter' && realCrack()}
                                />
                            </div>
                            <div className="input-group">
                                <label>Hash Algorithm</label>
                                <select value={crackAlgo} onChange={e => setCrackAlgo(e.target.value)}>
                                    <option value="md5">MD5 (Fast, Weak)</option>
                                    <option value="sha1">SHA-1 (Moderate)</option>
                                    <option value="sha256">SHA-256 (Strong)</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-danger w-full" onClick={realCrack} disabled={loading || !password}>
                            {loading ? <><span className="loading-spinner"></span> Running 5-Phase Attack...</> : '💥 Launch Cracking Attack'}
                        </button>
                    </div>

                    {crackResult && (
                        <div className="fade-in">
                            {/* Result Banner */}
                            <div className={`card ${crackResult.wasCompromised ? 'card-glow-magenta' : 'card-glow-green'}`} style={{ marginBottom: 20 }}>
                                <div className="text-center" style={{ padding: 20 }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>{crackResult.wasCompromised ? '💥' : '🛡️'}</div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: crackResult.wasCompromised ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                                        {crackResult.wasCompromised ? 'PASSWORD CRACKED!' : 'Password Survived All Attacks'}
                                    </h3>
                                    {crackResult.wasCompromised && (
                                        <div className="mono" style={{ fontSize: '1.2rem', color: 'var(--neon-red)', marginTop: 8 }}>
                                            Recovered: <strong>{crackResult.crackResult?.crackedPassword}</strong>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                                        Method: {crackResult.crackResult?.method} | Attempts: {crackResult.crackResult?.attempts?.toLocaleString()} | Time: {crackResult.crackResult?.timeTaken}ms
                                    </div>
                                </div>
                            </div>

                            {/* Hash Info */}
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 12 }}>
                                    <span className="icon">#️⃣</span> Target Hash
                                </div>
                                <div className="hash-display">{crackResult.targetHash}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    Algorithm: {crackResult.algorithm.toUpperCase()} | Original: {crackResult.originalPassword}
                                </div>
                            </div>

                            {/* Attack Phases */}
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 16 }}>
                                    <span className="icon">📊</span> Attack Phase Breakdown
                                </div>
                                {crackResult.crackResult?.attackPhases?.map((phase, i) => (
                                    <div key={i} className={`result-item ${phase.success ? 'severity-critical' : 'severity-low'}`}>
                                        <div className="result-item-title flex items-center justify-between">
                                            <span>
                                                {phase.success ? '💥' : '✅'} Phase {i + 1}: {phase.phase}
                                            </span>
                                            <span className={`badge ${phase.success ? 'badge-critical' : 'badge-low'}`}>
                                                {phase.success ? 'CRACKED' : 'Survived'}
                                            </span>
                                        </div>
                                        <div className="result-item-desc">
                                            Attempted: <span className="mono text-cyan">{phase.attempted?.toLocaleString()}</span> combinations in <span className="mono">{phase.time}ms</span>
                                            {phase.baseWord && <span> | Base word: <span className="mono text-red">{phase.baseWord}</span></span>}
                                        </div>
                                    </div>
                                ))}
                                {crackResult.crackResult?.hashesPerSecond && (
                                    <div className="flex justify-between mt-md" style={{ fontSize: '0.82rem' }}>
                                        <span className="text-secondary">Performance</span>
                                        <span className="mono text-cyan">{crackResult.crackResult.hashesPerSecond.toLocaleString()} hashes/sec</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ JtR HASH CRACKER MODE ═══ */}
            {mode === 'jtr' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">🔨</span> John the Ripper — Hash Cracker
                        </div>
                        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                            <span>⚡</span>
                            <div>
                                <strong>JtR-Style Attack</strong> — Enter a hash + custom wordlist (names, words you suspect).
                                The engine applies <strong>30+ mangling rules</strong> (case, leet, digits, reverse, truncate, combine, year)
                                and tries all word combinations to crack it. Just like John the Ripper!
                            </div>
                        </div>

                        {/* Quick hash generator */}
                        <div className="card" style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid var(--border-subtle)', marginBottom: 16, padding: 16 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--neon-cyan)', marginBottom: 8 }}>🔧 Quick Hash Generator (for testing)</div>
                            <div className="flex gap-sm items-end">
                                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.72rem' }}>Password to hash</label>
                                    <input type="text" value={jtrGenHash} onChange={e => setJtrGenHash(e.target.value)} placeholder="e.g. roshan123" style={{ fontSize: '0.82rem' }} />
                                </div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.72rem' }}>Algorithm</label>
                                    <select value={jtrGenAlgo} onChange={e => setJtrGenAlgo(e.target.value)} style={{ fontSize: '0.82rem' }}>
                                        <option value="md5">MD5</option>
                                        <option value="sha1">SHA-1</option>
                                        <option value="sha256">SHA-256</option>
                                    </select>
                                </div>
                                <button className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }} onClick={jtrGenerateHash} disabled={!jtrGenHash}>⬇️ Generate & Fill</button>
                            </div>
                        </div>

                        <div className="grid-2" style={{ marginBottom: 16 }}>
                            <div className="input-group">
                                <label>Target Hash</label>
                                <textarea value={jtrHash} onChange={e => setJtrHash(e.target.value)}
                                    placeholder="Paste MD5, SHA-1, or SHA-256 hash here..." style={{ minHeight: 70 }} />
                            </div>
                            <div className="input-group">
                                <label>Custom Wordlist — words/names to try (comma or newline separated)</label>
                                <textarea value={jtrWordlist} onChange={e => setJtrWordlist(e.target.value)}
                                    placeholder={"roshan, rosh, prudhvi\npassword, admin, test\njohn, smith"} style={{ minHeight: 70 }} />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Hash Algorithm</label>
                            <select value={jtrAlgo} onChange={e => setJtrAlgo(e.target.value)}>
                                <option value="md5">MD5 (32 chars)</option>
                                <option value="sha1">SHA-1 (40 chars)</option>
                                <option value="sha256">SHA-256 (64 chars)</option>
                            </select>
                        </div>
                        <button className="btn btn-danger w-full" onClick={jtrCrack} disabled={jtrLoading || !jtrHash}
                            style={{ fontSize: '1rem', padding: '14px 0' }}>
                            {jtrLoading ? <><span className="loading-spinner"></span> Running 6-Phase JtR Attack (30+ rules × wordlist)...</> : '🔨 Launch John the Ripper Attack'}
                        </button>
                    </div>

                    {jtrResult && (
                        <div className="fade-in">
                            {/* Crack Result Banner */}
                            <div className={`card ${jtrResult.cracked ? 'card-glow-magenta' : 'card-glow-green'}`} style={{ marginBottom: 20 }}>
                                <div className="text-center" style={{ padding: 24 }}>
                                    <div style={{ fontSize: '4rem', marginBottom: 8 }}>{jtrResult.cracked ? '💥' : '🛡️'}</div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: jtrResult.cracked ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                                        {jtrResult.cracked ? 'HASH CRACKED!' : 'Hash Survived All Attacks'}
                                    </h3>
                                    {jtrResult.cracked && (
                                        <div className="mono" style={{ fontSize: '1.6rem', color: 'var(--neon-red)', marginTop: 12, background: 'rgba(255,0,60,0.1)', borderRadius: 8, padding: '8px 16px', display: 'inline-block' }}>
                                            {jtrResult.password}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 12 }}>
                                        Method: <span className="mono text-cyan">{jtrResult.method}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{jtrResult.attempts?.toLocaleString()}</div><div className="metric-label">Total Attempts</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{jtrResult.hashesPerSecond?.toLocaleString()}</div><div className="metric-label">Hashes/sec</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{jtrResult.timeMs}ms</div><div className="metric-label">Time</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-orange">{jtrResult.rulesUsed}</div><div className="metric-label">Rules Applied</div></div></div>
                            </div>

                            {/* Phase Breakdown */}
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📊</span> JtR Attack Phase Breakdown</div>
                                {jtrResult.phases?.map((phase, i) => (
                                    <div key={i} className={`result-item ${phase.success ? 'severity-critical' : 'severity-low'}`}>
                                        <div className="result-item-title flex items-center justify-between">
                                            <span>
                                                {phase.success ? '💥' : '✅'} {phase.phase}
                                            </span>
                                            <span className={`badge ${phase.success ? 'badge-critical' : 'badge-low'}`}>
                                                {phase.success ? 'CRACKED' : 'Survived'}
                                            </span>
                                        </div>
                                        <div className="result-item-desc">
                                            Attempted: <span className="mono text-cyan">{phase.attempted?.toLocaleString()}</span> candidates in <span className="mono">{phase.time}ms</span>
                                            {phase.baseWord && <span> | Base: <span className="mono text-red">"{phase.baseWord}"</span></span>}
                                            {phase.rule && <span> | Rule: <span className="mono text-orange">{phase.rule}</span></span>}
                                            {phase.crackedWith && <span> | Found: <span className="mono text-red">"{phase.crackedWith}"</span></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Attack Log */}
                            {jtrResult.log?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📜</span> Attack Log</div>
                                    <div style={{ maxHeight: 300, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
                                        {jtrResult.log.map((line, i) => (
                                            <div key={i} style={{ marginBottom: 3, color: line.includes('[CRACKED]') ? 'var(--neon-red)' : line.includes('[PHASE') ? 'var(--neon-yellow)' : 'var(--text-secondary)' }}>
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ STRENGTH ANALYSIS MODE ═══ */}
            {mode === 'analyze' && (
                <div className="grid-2">
                    <div className="card card-glow-cyan">
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">⌨️</span> Password Input
                        </div>
                        <div className="input-group">
                            <label>Enter password to analyze</label>
                            <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter a password..."
                                onKeyDown={e => e.key === 'Enter' && analyzePassword()} />
                        </div>
                        <button className="btn btn-primary w-full" onClick={analyzePassword} disabled={loading || !password}>
                            {loading ? <><span className="loading-spinner"></span> Analyzing...</> : '🔍 Analyze Password'}
                        </button>
                        {result && (
                            <div className="mt-lg">
                                <div className="text-center" style={{ marginBottom: 20 }}>
                                    <div className="progress-ring-container">
                                        <div className="progress-ring">
                                            <svg viewBox="0 0 80 80">
                                                <circle className="bg" cx="40" cy="40" r="34" />
                                                <circle className="fill" cx="40" cy="40" r="34" stroke={getScoreColor(result.score)}
                                                    strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - result.score / 100)}`} />
                                            </svg>
                                            <div className="progress-ring-label" style={{ color: getScoreColor(result.score) }}>{result.score}</div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: getScoreColor(result.score) }}>{result.rating}</div>
                                    </div>
                                </div>
                                <div className={`strength-meter strength-${getStrengthClass(result.rating)}`}>
                                    <div className="strength-meter-fill"></div>
                                </div>
                                <div className="flex justify-between mt-sm" style={{ fontSize: '0.78rem' }}>
                                    <span className="text-secondary">Entropy</span>
                                    <span className="mono text-cyan">{result.entropy} bits</span>
                                </div>
                                <div className="flex justify-between mt-sm" style={{ fontSize: '0.78rem' }}>
                                    <span className="text-secondary">Dict Size</span>
                                    <span className="mono">{result.dictionary?.expandedDictSize?.toLocaleString()} entries</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {result && (
                        <div className="flex flex-col gap-md">
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📖</span> Dictionary Attack</div>
                                <div className={`result-item ${result.dictionary?.found ? 'severity-critical' : 'severity-low'}`}>
                                    <div className="result-item-title">
                                        {result.dictionary?.found ? '⚠️ FOUND IN DICTIONARY!' : '✅ Not found in dictionary'}
                                    </div>
                                    <div className="result-item-desc">
                                        Match: {result.dictionary?.matchType || 'None'} {result.dictionary?.matchedWord ? `— "${result.dictionary.matchedWord}"` : ''} | Attempts: {result.dictionary?.attempts?.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">💪</span> Brute-Force Estimation</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                    Charset: {result.bruteForce?.charsets?.join(', ')} ({result.bruteForce?.charsetSize} chars)
                                </div>
                                <div style={{ fontSize: '0.78rem', marginBottom: 12 }}>
                                    Combinations: <span className="mono text-cyan">{result.bruteForce?.totalCombinations}</span>
                                </div>
                                {result.bruteForce?.timeToCrack && Object.entries(result.bruteForce.timeToCrack).map(([device, info]) => (
                                    <div key={device} className="flex justify-between" style={{ fontSize: '0.78rem', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{device}</span>
                                        <span className="mono" style={{ color: (info.display || info) === 'Instant' ? 'var(--neon-red)' : 'var(--neon-green)' }}>{info.display || info}</span>
                                    </div>
                                ))}
                            </div>
                            {result.patterns?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🧠</span> AI Pattern Analysis</div>
                                    {result.patterns.map((p, i) => (
                                        <div key={i} className={`result-item severity-${p.severity?.toLowerCase()}`}>
                                            <div className="result-item-title">{p.type}: <span className="mono">{p.pattern}</span></div>
                                            <div className="result-item-desc">{p.description}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {result.hashes && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">#️⃣</span> Hash Values</div>
                                    {Object.entries(result.hashes).map(([algo, hash]) => (
                                        <div key={algo} style={{ marginBottom: 8 }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{algo}</div>
                                            <div className="hash-display">{hash}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ HASH CRACKER MODE ═══ */}
            {mode === 'hash' && (
                <div>
                    <div className="grid-2" style={{ marginBottom: 20 }}>
                        <div className="card card-glow-magenta">
                            <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">#️⃣</span> Hash Cracker</div>
                            <div className="input-group">
                                <label>Enter a hash to crack</label>
                                <textarea value={hash} onChange={e => setHash(e.target.value)}
                                    placeholder="Paste MD5, SHA-1, or SHA-256 hash..." style={{ minHeight: 80 }} />
                            </div>
                            <div className="flex gap-sm">
                                <button className="btn btn-danger" style={{ flex: 1 }} onClick={analyzeHash} disabled={loading || !hash}>
                                    {loading ? <><span className="loading-spinner"></span> Cracking...</> : '🔓 Multi-Phase Crack'}
                                </button>
                                <button className={`btn ${bruteForceRunning ? 'btn-ghost' : 'btn-primary'}`} style={{ flex: 1 }}
                                    onClick={bruteForceRunning ? stopBruteForce : startBruteForce} disabled={!hash}>
                                    {bruteForceRunning ? '⏹ Stop' : '💪 Live Brute-Force'}
                                </button>
                            </div>
                            <div className="alert alert-warning mt-md">
                                <span>💡</span>
                                <div>
                                    <strong>Try these:</strong><br />
                                    <code style={{ fontSize: '0.7rem' }}>e10adc3949ba59abbe56e057f20f883e</code> (123456)<br />
                                    <code style={{ fontSize: '0.7rem' }}>5f4dcc3b5aa765d61d8327deb882cf99</code> (password)<br />
                                    <code style={{ fontSize: '0.7rem' }}>098f6bcd4621d373cade4e832627b4f6</code> (test)
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-md">
                            {hashResult && (
                                <>
                                    <div className="card">
                                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔍</span> Hash Identification</div>
                                        <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                                            <span>Algorithm</span><span className="mono text-cyan">{hashResult.hashInfo?.type}</span>
                                        </div>
                                        <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                                            <span>Length</span><span className="mono">{hashResult.hashInfo?.length} chars</span>
                                        </div>
                                        <div className="flex justify-between" style={{ fontSize: '0.85rem' }}>
                                            <span>Hash Strength</span>
                                            <span className={`badge ${hashResult.hashInfo?.strength === 'Very Weak' ? 'badge-critical' : hashResult.hashInfo?.strength === 'Weak' ? 'badge-high' : 'badge-low'}`}>
                                                {hashResult.hashInfo?.strength}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card">
                                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔓</span> Crack Result</div>
                                        {hashResult.crackResult?.crackedPassword ? (
                                            <div className="result-item severity-critical">
                                                <div className="result-item-title">💥 PASSWORD CRACKED!</div>
                                                <div className="result-item-desc">
                                                    Plaintext: <span className="mono text-red" style={{ fontSize: '1.1rem' }}>{hashResult.crackResult.crackedPassword}</span>
                                                </div>
                                                <div className="result-item-desc mt-sm">
                                                    Method: {hashResult.crackResult.method} | Attempts: {hashResult.crackResult.attempts?.toLocaleString()} | Time: {hashResult.crackResult.timeTaken}ms
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="result-item severity-low">
                                                <div className="result-item-title">✅ Not Cracked</div>
                                                <div className="result-item-desc">
                                                    Exhausted {hashResult.crackResult?.attempts?.toLocaleString()} attempts across all attack phases in {hashResult.crackResult?.timeTaken}ms
                                                </div>
                                            </div>
                                        )}
                                        {hashResult.crackResult?.attackPhases?.length > 0 && (
                                            <div className="mt-md">
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>ATTACK PHASES</div>
                                                {hashResult.crackResult.attackPhases.map((phase, i) => (
                                                    <div key={i} className="flex justify-between" style={{ fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                                        <span>{phase.success ? '💥' : '✓'} {phase.phase}</span>
                                                        <span className="mono">{phase.attempted?.toLocaleString()} tries / {phase.time}ms</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Live Brute-Force Log */}
                    {(bruteForceRunning || bruteForceResult || bruteForceLog.length > 0) && (
                        <div className="card card-glow-cyan">
                            <div className="card-header">
                                <div className="card-title">
                                    <span className="icon">💪</span> Live Brute-Force Attack {bruteForceRunning && <span className="loading-spinner" style={{ marginLeft: 8 }}></span>}
                                </div>
                                {bruteForceRunning && <span className="badge badge-critical">RUNNING</span>}
                            </div>
                            {bruteForceResult && (
                                <div className={`alert ${bruteForceResult.type === 'cracked' ? 'alert-danger' : 'alert-info'}`} style={{ marginBottom: 12 }}>
                                    <span>{bruteForceResult.type === 'cracked' ? '💥' : '✅'}</span>
                                    <div>
                                        {bruteForceResult.type === 'cracked' ? (
                                            <>Cracked! Password: <strong className="mono">{bruteForceResult.password}</strong> | {bruteForceResult.attempts?.toLocaleString()} attempts in {bruteForceResult.elapsed}s</>
                                        ) : (
                                            <>Exhausted {bruteForceResult.attempts?.toLocaleString()} combinations in {bruteForceResult.elapsed}s</>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div style={{ maxHeight: 300, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
                                {bruteForceLog.map((log, i) => (
                                    <div key={i} style={{ marginBottom: 2, color: log.isPhase ? 'var(--neon-yellow)' : 'var(--text-secondary)' }}>
                                        {log.isPhase
                                            ? `═══ Length ${log.length} complete | ${log.attempts?.toLocaleString()} total | ${log.elapsed}s ═══`
                                            : `[${log.elapsed}s] len=${log.currentLength} trying="${log.candidate}" | ${log.attempts?.toLocaleString()} attempts | ${log.hashesPerSecond?.toLocaleString()} H/s`
                                        }
                                    </div>
                                ))}
                                {bruteForceRunning && <div className="loading-bar"><div className="loading-bar-fill"></div></div>}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ BATCH MODE ═══ */}
            {mode === 'batch' && (
                <div>
                    <div className="card card-glow-green" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📋</span> Batch Password Cracking</div>
                        <div className="alert alert-danger" style={{ marginBottom: 12 }}>
                            <span>⚔️</span> Each password will be analyzed with full dictionary, pattern, and brute-force estimation. Up to 50 passwords.
                        </div>
                        <div className="input-group">
                            <label>Enter passwords (one per line)</label>
                            <textarea value={batchPasswords} onChange={e => setBatchPasswords(e.target.value)}
                                placeholder={"password123\nadmin\nMyS3cur3P@ss!\nqwerty\nCorrectHorseBatteryStaple\njohn2024\nP@$$w0rd"} style={{ minHeight: 140 }} />
                        </div>
                        <button className="btn btn-danger" onClick={analyzeBatch} disabled={loading || !batchPasswords}>
                            {loading ? <><span className="loading-spinner"></span> Attacking Batch...</> : '💥 Launch Batch Attack'}
                        </button>
                    </div>
                    {batchResult && (
                        <>
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{batchResult.summary?.total}</div><div className="metric-label">Total Analyzed</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value" style={{ color: getScoreColor(batchResult.summary?.averageScore) }}>{batchResult.summary?.averageScore}</div><div className="metric-label">Avg Score</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-red">{batchResult.summary?.weakCount}</div><div className="metric-label">Weak ({batchResult.summary?.dictionaryMatches} in dict)</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{batchResult.summary?.strongCount}</div><div className="metric-label">Strong</div></div></div>
                            </div>
                            <div className="card">
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>#</th><th>Password</th><th>Score</th><th>Rating</th><th>Entropy</th><th>Dictionary</th><th>Patterns</th></tr></thead>
                                        <tbody>
                                            {batchResult.results?.map((r, i) => (
                                                <tr key={i}>
                                                    <td className="mono">{i + 1}</td>
                                                    <td className="mono">{r.password}</td>
                                                    <td><span style={{ color: getScoreColor(r.score), fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{r.score}</span></td>
                                                    <td><span className={`badge ${r.score >= 70 ? 'badge-low' : r.score >= 40 ? 'badge-medium' : 'badge-critical'}`}>{r.rating}</span></td>
                                                    <td className="mono">{r.entropy}</td>
                                                    <td>{r.dictionary?.found ? <span className="text-red">⚠ {r.dictionary.matchType}</span> : <span className="text-green">✓ Safe</span>}</td>
                                                    <td className="mono">{r.patterns?.length || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
