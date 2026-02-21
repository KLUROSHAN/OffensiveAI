import React, { useState, useEffect } from 'react';

export default function SocialEngineering({ sessionId, API, onStatsUpdate }) {
    const [mode, setMode] = useState('phishing');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [phishingResult, setPhishingResult] = useState(null);
    const [communicationText, setCommunicationText] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [vishingScripts, setVishingScripts] = useState([]);
    const [selectedScript, setSelectedScript] = useState('');
    const [vishingResult, setVishingResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // AI Phishing Detector
    const [aiPhishText, setAiPhishText] = useState('');
    const [aiPhishResult, setAiPhishResult] = useState(null);
    const [aiPhishLoading, setAiPhishLoading] = useState(false);

    // Targeted phishing
    const [targetInfo, setTargetInfo] = useState({ name: '', email: '', company: '', role: '', interests: '', socialMedia: '' });
    const [targetedResult, setTargetedResult] = useState(null);

    // Interactive detection
    const [interactiveTest, setInteractiveTest] = useState(null);
    const [testAnswers, setTestAnswers] = useState({});
    const [testRevealed, setTestRevealed] = useState({});
    const [testScore, setTestScore] = useState(null);

    useEffect(() => {
        fetch(`${API}/social/templates`).then(r => r.json()).then(setTemplates).catch(() => { });
        fetch(`${API}/social/vishing`).then(r => r.json()).then(setVishingScripts).catch(() => { });
    }, []);

    const generatePhishing = async () => {
        if (!selectedTemplate) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/social/phishing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId: selectedTemplate, sessionId }),
            });
            setPhishingResult(await res.json());
            onStatsUpdate?.();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const launchTargetedAttack = async () => {
        if (!targetInfo.name && !targetInfo.company) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/social/targeted-phishing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetInfo, sessionId }),
            });
            setTargetedResult(await res.json());
            onStatsUpdate?.();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const analyzeCommunication = async () => {
        if (!communicationText) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/social/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: communicationText, sessionId }),
            });
            setAnalysisResult(await res.json());
            onStatsUpdate?.();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const startInteractiveTest = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/social/phishing-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            setInteractiveTest(data);
            setTestAnswers({});
            setTestRevealed({});
            setTestScore(null);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const submitTestAnswer = (emailId, userAnswer) => {
        setTestAnswers(prev => ({ ...prev, [emailId]: userAnswer }));
        setTestRevealed(prev => ({ ...prev, [emailId]: true }));
    };

    const calculateTestScore = () => {
        if (!interactiveTest) return;
        let correct = 0;
        for (const email of interactiveTest.emails) {
            if (testAnswers[email.id] === email._isPhishing) correct++;
        }
        setTestScore({ correct, total: interactiveTest.emails.length, percentage: Math.round((correct / interactiveTest.emails.length) * 100) });
    };

    const generateVishing = async () => {
        if (!selectedScript) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/social/vishing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scriptId: selectedScript }),
            });
            setVishingResult(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const getSeverityBadge = severity => {
        const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
        return map[severity] || 'badge-info';
    };

    const aiDetectPhishing = async () => {
        if (!aiPhishText) return;
        setAiPhishLoading(true); setAiPhishResult(null);
        try {
            const res = await fetch(`${API}/ai/detect-phishing`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiPhishText }),
            });
            setAiPhishResult(await res.json());
        } catch (e) { console.error(e); }
        setAiPhishLoading(false);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>🎭 Social Engineering Attack Suite</h2>
                <p>Real phishing generation, targeted OSINT attacks, communication analysis, and vishing simulation</p>
            </div>

            <div className="tabs">
                <button className={`tab ${mode === 'aiphish' ? 'active' : ''}`} onClick={() => setMode('aiphish')}>🧠 AI Phishing Detector</button>
                <button className={`tab ${mode === 'phishing' ? 'active' : ''}`} onClick={() => setMode('phishing')}>📧 Phishing Gen</button>
                <button className={`tab ${mode === 'targeted' ? 'active' : ''}`} onClick={() => setMode('targeted')}>🎯 Targeted</button>
                <button className={`tab ${mode === 'detect' ? 'active' : ''}`} onClick={() => setMode('detect')}>🛡️ Detection</button>
                <button className={`tab ${mode === 'analyze' ? 'active' : ''}`} onClick={() => setMode('analyze')}>📡 Scanner</button>
                <button className={`tab ${mode === 'vishing' ? 'active' : ''}`} onClick={() => setMode('vishing')}>📞 Vishing</button>
            </div>

            {/* ═══ AI PHISHING DETECTOR ═══ */}
            {mode === 'aiphish' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">🧠</span> AI NLP Phishing Detector</div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div>
                                <strong>Naive Bayes + TF-IDF Classifier</strong> — Trained on phishing vs. legitimate email corpus.
                                Analyzes text using <strong>NLP feature engineering</strong> across 9 categories (urgency, authority, fear, credential harvesting, etc.)
                                and outputs a probability score with feature-level explanations.
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Paste email/message text for AI analysis</label>
                            <textarea value={aiPhishText} onChange={e => setAiPhishText(e.target.value)}
                                placeholder={"Dear Customer,\n\nWe detected unusual activity on your account. Your password will expire in 24 hours. Click here immediately to verify your identity and restore access to your account.\n\nMicrosoft Security Team"}
                                style={{ minHeight: 180 }} />
                        </div>
                        <button className="btn btn-primary w-full" onClick={aiDetectPhishing} disabled={aiPhishLoading || !aiPhishText}>
                            {aiPhishLoading ? <><span className="loading-spinner"></span> Running NLP Analysis...</> : '🧠 Analyze with AI Phishing Detector'}
                        </button>
                    </div>

                    {aiPhishResult && !aiPhishResult.error && (
                        <div className="fade-in">
                            {/* Risk Banner */}
                            <div className={`card ${aiPhishResult.isPhishing ? 'card-glow-magenta' : 'card-glow-green'}`} style={{ marginBottom: 20 }}>
                                <div className="text-center" style={{ padding: 24 }}>
                                    <div style={{ fontSize: '4rem', marginBottom: 8 }}>{aiPhishResult.isPhishing ? '⚠️' : '✅'}</div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: aiPhishResult.riskColor }}>
                                        {aiPhishResult.riskLevel} — {aiPhishResult.phishingProbability}% Phishing Probability
                                    </h3>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                                        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 8, background: 'rgba(255,0,60,0.1)' }}>
                                            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-red)' }}>{aiPhishResult.bayesClassification?.phishingProb}%</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Bayes: Phishing</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 8, background: 'rgba(57,255,20,0.1)' }}>
                                            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-green)' }}>{aiPhishResult.bayesClassification?.legitimateProb}%</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Bayes: Legitimate</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 8, background: 'rgba(0,229,255,0.1)' }}>
                                            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>{aiPhishResult.featureScore}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Feature Score</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid-3" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{aiPhishResult.bayesClassification?.confidence}%</div><div className="metric-label">Bayes Confidence</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{aiPhishResult.tokenStats?.totalTokens}</div><div className="metric-label">Tokens Analyzed</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{aiPhishResult.analysisTimeMs}ms</div><div className="metric-label">Analysis Time</div></div></div>
                            </div>

                            {/* NLP Features */}
                            {aiPhishResult.features?.length > 0 && (
                                <div className="card" style={{ marginBottom: 20 }}>
                                    <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">🎯</span> NLP Feature Breakdown ({aiPhishResult.features.length} categories detected)</div>
                                    {aiPhishResult.features.map((f, i) => (
                                        <div key={i} className={`result-item severity-${f.severity === 'critical' ? 'critical' : f.severity}`}>
                                            <div className="result-item-title flex items-center justify-between">
                                                <span>{f.category}</span>
                                                <span className={`badge ${f.severity === 'critical' ? 'badge-critical' : f.severity === 'high' ? 'badge-high' : f.severity === 'medium' ? 'badge-medium' : 'badge-low'}`}>
                                                    Score: {f.score}
                                                </span>
                                            </div>
                                            <div className="result-item-desc">{f.description}</div>
                                            <div style={{ marginTop: 4 }}>
                                                {f.indicators?.map((ind, j) => (
                                                    <span key={j} className="badge badge-info" style={{ marginRight: 4, marginBottom: 2, fontSize: '0.68rem' }}>{ind}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid-2" style={{ marginBottom: 20 }}>
                                {/* TF-IDF Terms */}
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📊</span> Top TF-IDF Terms</div>
                                    {aiPhishResult.topTerms?.map((t, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                                            <span className="mono">{t.term}</span>
                                            <span className="mono text-cyan">{t.tfidfScore}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Model Info */}
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🧬</span> AI Model Details</div>
                                    <div style={{ fontSize: '0.82rem' }}>
                                        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Classifier</span><span className="mono text-cyan">{aiPhishResult.modelInfo?.classifier}</span></div>
                                        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Vectorizer</span><span className="mono">{aiPhishResult.modelInfo?.vectorizer}</span></div>
                                        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Training Size</span><span className="mono">{aiPhishResult.modelInfo?.trainingSize} docs</span></div>
                                        <div className="flex justify-between"><span>Vocabulary</span><span className="mono">{aiPhishResult.modelInfo?.vocabularySize} terms</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ PHISHING GENERATOR ═══ */}
            {mode === 'phishing' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">📧</span> Phishing Email Generator
                        </div>
                        <div className="input-group">
                            <label>Select attack scenario</label>
                            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                                <option value="">-- Choose a scenario --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>[{t.difficulty}] {t.name} — {t.category}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn btn-danger w-full" onClick={generatePhishing} disabled={loading || !selectedTemplate}>
                            {loading ? <><span className="loading-spinner"></span> Generating...</> : '🎯 Generate Phishing Email'}
                        </button>
                    </div>

                    {phishingResult && !phishingResult.error && (
                        <div className="grid-2 fade-in">
                            <div>
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📨</span> Generated Email</div>
                                    <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                                        <span className="badge badge-high">{phishingResult.category}</span>
                                        <span className="badge badge-info">{phishingResult.difficulty}</span>
                                    </div>
                                    <div className="email-preview">
                                        <div className="email-header">
                                            <div className="email-field"><span className="email-field-label">From:</span><span className="email-field-value">{phishingResult.email?.from}</span></div>
                                            <div className="email-field"><span className="email-field-label">Subject:</span><span className="email-field-value" style={{ color: 'var(--neon-yellow)' }}>{phishingResult.email?.subject}</span></div>
                                        </div>
                                        <div className="email-body">{phishingResult.email?.body}</div>
                                    </div>
                                </div>
                                <div className="alert alert-info"><span>🎓</span> {phishingResult.educationalNote}</div>
                            </div>
                            <div>
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🚩</span> Red Flags</div>
                                    {phishingResult.redFlags?.map((flag, i) => (
                                        <div key={i} className="result-item severity-high">
                                            <div className="result-item-desc"><span className="text-orange" style={{ fontWeight: 600 }}>#{i + 1}</span> — {flag}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="card mt-md">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🧠</span> Tactics Used</div>
                                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                        {phishingResult.indicators?.map((ind, i) => <span key={i} className="badge badge-critical">{ind}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TARGETED ATTACK ═══ */}
            {mode === 'targeted' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">🎯</span> Targeted Spear Phishing — OSINT Attack Generator</div>
                        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                            <span>🔴</span>
                            <div>
                                <strong>Advanced Attack Simulation</strong> — Provide target information and the system will generate customized, role-specific attack vectors based on OSINT techniques.
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="input-group"><label>Target Name</label>
                                <input value={targetInfo.name} onChange={e => setTargetInfo(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" /></div>
                            <div className="input-group"><label>Email Address</label>
                                <input value={targetInfo.email} onChange={e => setTargetInfo(p => ({ ...p, email: e.target.value }))} placeholder="john.smith@company.com" /></div>
                            <div className="input-group"><label>Company / Organization</label>
                                <input value={targetInfo.company} onChange={e => setTargetInfo(p => ({ ...p, company: e.target.value }))} placeholder="Acme Corp" /></div>
                            <div className="input-group"><label>Role / Department</label>
                                <input value={targetInfo.role} onChange={e => setTargetInfo(p => ({ ...p, role: e.target.value }))} placeholder="Finance Manager, IT Admin, HR Director, CTO..." /></div>
                            <div className="input-group"><label>Known Interests / Projects</label>
                                <input value={targetInfo.interests} onChange={e => setTargetInfo(p => ({ ...p, interests: e.target.value }))} placeholder="AI, cybersecurity, blockchain..." /></div>
                            <div className="input-group"><label>Social Media Presence</label>
                                <input value={targetInfo.socialMedia} onChange={e => setTargetInfo(p => ({ ...p, socialMedia: e.target.value }))} placeholder="LinkedIn, Twitter, etc." /></div>
                        </div>
                        <button className="btn btn-danger w-full" onClick={launchTargetedAttack} disabled={loading || (!targetInfo.name && !targetInfo.company)}>
                            {loading ? <><span className="loading-spinner"></span> Generating Attack Vectors...</> : '⚔️ Generate Targeted Attack Campaign'}
                        </button>
                    </div>

                    {targetedResult && (
                        <div className="fade-in">
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📊</span> Risk Assessment</div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{targetedResult.riskAssessment}</p>
                                <div className="badge badge-critical mt-sm">{targetedResult.totalAttacks} Attack Vectors Generated</div>
                            </div>

                            {targetedResult.attackVectors?.map((attack, i) => (
                                <div key={i} className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                                    <div className="flex items-center justify-between mb-md">
                                        <div className="card-title"><span className="icon">⚔️</span> Attack #{i + 1}: {attack.type}</div>
                                        <span className="badge badge-critical">{attack.difficulty}</span>
                                    </div>
                                    <div className="email-preview">
                                        <div className="email-header">
                                            <div className="email-field"><span className="email-field-label">From:</span><span className="email-field-value">{attack.from}</span></div>
                                            <div className="email-field"><span className="email-field-label">Subject:</span><span className="email-field-value" style={{ color: 'var(--neon-yellow)' }}>{attack.subject}</span></div>
                                        </div>
                                        <div className="email-body" style={{ whiteSpace: 'pre-wrap' }}>{attack.body}</div>
                                    </div>
                                    <div className="grid-2 mt-md">
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>TACTICS USED</div>
                                            {attack.tactics?.map((t, j) => (
                                                <div key={j} className="badge badge-critical" style={{ marginRight: 6, marginBottom: 6 }}>{t}</div>
                                            ))}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>RED FLAGS</div>
                                            {attack.redFlags?.map((f, j) => (
                                                <div key={j} style={{ fontSize: '0.78rem', color: 'var(--neon-orange)', marginBottom: 4 }}>⚠ {f}</div>
                                            ))}
                                        </div>
                                    </div>
                                    {attack.osintSources && (
                                        <div className="mt-md">
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>OSINT SOURCES USED</div>
                                            {attack.osintSources.map((src, j) => (
                                                <span key={j} className="badge badge-info" style={{ marginRight: 6, marginBottom: 4 }}>{src}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🛡️</span> Recommended Mitigations</div>
                                {targetedResult.mitigations?.map((m, i) => (
                                    <div key={i} className="alert alert-success" style={{ marginBottom: 6 }}><span>✓</span> {m}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ INTERACTIVE DETECTION TEST ═══ */}
            {mode === 'detect' && (
                <div>
                    {!interactiveTest ? (
                        <div className="card text-center" style={{ padding: 40 }}>
                            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛡️</div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>Phishing Detection Challenge</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 500, margin: '0 auto 20px' }}>
                                You'll be shown a mix of real phishing emails and legitimate emails. Can you identify which ones are attacks? Test your detection skills!
                            </p>
                            <button className="btn btn-primary" onClick={startInteractiveTest} disabled={loading}>
                                {loading ? <><span className="loading-spinner"></span> Generating...</> : '🚀 Start Detection Challenge'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            {testScore && (
                                <div className={`card ${testScore.percentage >= 80 ? 'card-glow-green' : 'card-glow-magenta'}`} style={{ marginBottom: 20, padding: 30, textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 8 }}>{testScore.percentage >= 80 ? '🏆' : testScore.percentage >= 60 ? '👍' : '📖'}</div>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: testScore.percentage >= 80 ? 'var(--neon-green)' : 'var(--neon-orange)' }}>
                                        Score: {testScore.correct}/{testScore.total} ({testScore.percentage}%)
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                                        {testScore.percentage >= 80 ? 'Excellent phishing detection skills!' : testScore.percentage >= 60 ? 'Good, but some attacks slipped through.' : 'Needs improvement — review the red flags below.'}
                                    </p>
                                    <button className="btn btn-primary mt-md" onClick={startInteractiveTest}>🔄 Try Again</button>
                                </div>
                            )}

                            {interactiveTest.emails?.map((email, i) => (
                                <div key={email.id} className="card" style={{ marginBottom: 16 }}>
                                    <div className="card-title" style={{ marginBottom: 12 }}>
                                        <span className="icon">📧</span> Email #{i + 1}
                                        {testRevealed[email.id] && (
                                            <span className={`badge ml-sm ${email._isPhishing ? 'badge-critical' : 'badge-low'}`}>
                                                {email._isPhishing ? '⚠ PHISHING' : '✅ LEGITIMATE'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="email-preview">
                                        <div className="email-header">
                                            <div className="email-field"><span className="email-field-label">From:</span><span className="email-field-value">{email.email?.from}</span></div>
                                            <div className="email-field"><span className="email-field-label">Subject:</span><span className="email-field-value">{email.email?.subject}</span></div>
                                        </div>
                                        <div className="email-body" style={{ whiteSpace: 'pre-wrap' }}>{email.email?.body}</div>
                                    </div>

                                    {!testRevealed[email.id] ? (
                                        <div className="flex gap-sm mt-md">
                                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => submitTestAnswer(email.id, true)}>⚠ Phishing</button>
                                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => submitTestAnswer(email.id, false)}>✅ Legitimate</button>
                                        </div>
                                    ) : (
                                        <div className="mt-md fade-in">
                                            <div className={`alert ${testAnswers[email.id] === email._isPhishing ? 'alert-success' : 'alert-danger'}`}>
                                                <span>{testAnswers[email.id] === email._isPhishing ? '✅' : '❌'}</span>
                                                <span>{testAnswers[email.id] === email._isPhishing ? 'Correct!' : `Incorrect — this was ${email._isPhishing ? 'a phishing attack' : 'a legitimate email'}`}</span>
                                            </div>
                                            {email._isPhishing && email._redFlags?.length > 0 && (
                                                <div style={{ marginTop: 8 }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>RED FLAGS:</div>
                                                    {email._redFlags.map((flag, j) => (
                                                        <div key={j} style={{ fontSize: '0.78rem', color: 'var(--neon-orange)', marginBottom: 2 }}>⚠ {flag}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {!testScore && Object.keys(testAnswers).length === interactiveTest.emails?.length && (
                                <div className="text-center mt-md">
                                    <button className="btn btn-primary" onClick={calculateTestScore}>📊 Calculate Score</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ COMMUNICATION ANALYZER ═══ */}
            {mode === 'analyze' && (
                <div className="grid-2">
                    <div className="card card-glow-cyan">
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📡</span> Advanced Email Scanner</div>
                        <div className="alert alert-info" style={{ marginBottom: 12 }}>
                            <span>🔍</span>
                            <div>Detects: urgency, authority abuse, fear tactics, financial/credential requests, suspicious URLs, dangerous attachments, macro requests, domain spoofing</div>
                        </div>
                        <div className="input-group">
                            <label>Paste email, message, or communication to analyze</label>
                            <textarea value={communicationText} onChange={e => setCommunicationText(e.target.value)}
                                placeholder="Paste suspicious email or message content here..." style={{ minHeight: 200 }} />
                        </div>
                        <button className="btn btn-primary w-full" onClick={analyzeCommunication} disabled={loading || !communicationText}>
                            {loading ? <><span className="loading-spinner"></span> Scanning...</> : '🔍 Deep Scan for SE Indicators'}
                        </button>
                    </div>

                    {analysisResult && (
                        <div className="flex flex-col gap-md fade-in">
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">⚡</span> Threat Assessment</div>
                                <div className="text-center">
                                    <div className="progress-ring-container">
                                        <div className="progress-ring">
                                            <svg viewBox="0 0 80 80">
                                                <circle className="bg" cx="40" cy="40" r="34" />
                                                <circle className="fill" cx="40" cy="40" r="34"
                                                    stroke={analysisResult.susceptibilityScore >= 75 ? 'var(--neon-red)' : analysisResult.susceptibilityScore >= 50 ? 'var(--neon-orange)' : analysisResult.susceptibilityScore >= 25 ? 'var(--neon-yellow)' : 'var(--neon-green)'}
                                                    strokeDasharray={`${2 * Math.PI * 34}`}
                                                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - analysisResult.susceptibilityScore / 100)}`} />
                                            </svg>
                                            <div className="progress-ring-label" style={{ color: analysisResult.susceptibilityScore >= 50 ? 'var(--neon-red)' : 'var(--neon-green)' }}>
                                                {analysisResult.susceptibilityScore}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`badge mt-sm ${analysisResult.riskLevel === 'Critical' ? 'badge-critical' : analysisResult.riskLevel === 'High' ? 'badge-high' : analysisResult.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                                        {analysisResult.riskLevel} Risk
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>{analysisResult.attackProbability}</p>
                                </div>
                            </div>

                            {analysisResult.indicators?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🎯</span> Indicators ({analysisResult.totalIndicators})</div>
                                    {analysisResult.indicators.map((ind, i) => (
                                        <div key={i} className={`result-item severity-${ind.severity === 'Critical' ? 'critical' : ind.severity?.toLowerCase()}`}>
                                            <div className="result-item-title">
                                                <span className={`badge ${getSeverityBadge(ind.severity)}`} style={{ marginRight: 8 }}>{ind.severity}</span>{ind.type}
                                            </div>
                                            <div className="result-item-desc">{ind.description}</div>
                                            <div style={{ marginTop: 4 }}><span className="mono" style={{ fontSize: '0.72rem', color: 'var(--neon-cyan)' }}>Keyword: "{ind.keyword}"</span></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {analysisResult.recommendations?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🛡️</span> Defenses</div>
                                    {analysisResult.recommendations.map((rec, i) => (
                                        <div key={i} className="alert alert-success" style={{ marginBottom: 6 }}><span>✓</span> {rec}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ VISHING SIMULATOR ═══ */}
            {mode === 'vishing' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📞</span> Voice Phishing (Vishing) Simulator</div>
                        <div className="input-group">
                            <label>Select vishing scenario</label>
                            <select value={selectedScript} onChange={e => setSelectedScript(e.target.value)}>
                                <option value="">-- Choose a scenario --</option>
                                {vishingScripts.map(s => <option key={s.id} value={s.id}>{s.name} — {s.category}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-danger w-full" onClick={generateVishing} disabled={loading || !selectedScript}>
                            {loading ? <><span className="loading-spinner"></span> Generating...</> : '📞 Generate Vishing Script'}
                        </button>
                    </div>

                    {vishingResult && !vishingResult.error && (
                        <div className="grid-2 fade-in">
                            <div>
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div className="card-title" style={{ marginBottom: 8 }}><span className="icon">🎬</span> {vishingResult.name}</div>
                                    <div className="badge badge-critical mb-md">{vishingResult.category}</div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}><strong>Scenario:</strong> {vishingResult.scenario}</p>
                                    {vishingResult.script?.map((line, i) => (
                                        <div key={i} className={`script-line role-${line.role}`}>
                                            <div className="script-role" style={{ color: line.role === 'attacker' ? 'var(--neon-red)' : 'var(--neon-yellow)' }}>
                                                {line.role === 'attacker' ? '🔴 Attacker' : '📝 Note'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{line.line}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-md">
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🎯</span> Tactics Used</div>
                                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                        {vishingResult.tactics?.map((t, i) => <span key={i} className="badge badge-critical">{t}</span>)}
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🛡️</span> Defense Advice</div>
                                    {vishingResult.defenseAdvice?.map((advice, i) => (
                                        <div key={i} className="alert alert-success" style={{ marginBottom: 6 }}><span>✓</span> {advice}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
