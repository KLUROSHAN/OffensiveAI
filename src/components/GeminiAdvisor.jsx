import React, { useState, useEffect } from 'react';

const API = '/api';

export default function GeminiAdvisor() {
    const [mode, setMode] = useState('chat');
    const [apiKey, setApiKeyInput] = useState('');
    const [configured, setConfigured] = useState(false);
    const [keyLoading, setKeyLoading] = useState(false);

    // Chat state
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);

    // Advisor state
    const [advisorQuery, setAdvisorQuery] = useState('');
    const [advisorCtx, setAdvisorCtx] = useState('');
    const [advisorResult, setAdvisorResult] = useState(null);
    const [advisorLoading, setAdvisorLoading] = useState(false);

    // Phishing state
    const [phishTarget, setPhishTarget] = useState({ name: '', company: '', role: '', scenario: 'Account verification', tone: 'Professional and urgent' });
    const [phishResult, setPhishResult] = useState(null);
    const [phishLoading, setPhishLoading] = useState(false);

    // Password report state
    const [reportPw, setReportPw] = useState('');
    const [reportResult, setReportResult] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // Check Gemini status
    useEffect(() => {
        fetch(`${API}/gemini/status`).then(r => r.json()).then(d => setConfigured(d.configured)).catch(() => { });
    }, []);

    const configureKey = async () => {
        setKeyLoading(true);
        try {
            const res = await fetch(`${API}/gemini/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: apiKey.trim() }) });
            const data = await res.json();
            if (data.configured) setConfigured(true);
        } catch (e) { console.error(e); }
        setKeyLoading(false);
    };

    const sendChat = async () => {
        if (!chatMsg.trim()) return;
        const msg = chatMsg.trim();
        setChatMsg('');
        setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
        setChatLoading(true);
        try {
            const res = await fetch(`${API}/gemini/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, history: chatHistory }) });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: 'ai', content: data.response, tokens: data.tokens, timeMs: data.timeMs }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: 'ai', content: '❌ Error: ' + e.message }]);
        }
        setChatLoading(false);
    };

    const askAdvisor = async () => {
        setAdvisorLoading(true); setAdvisorResult(null);
        try {
            const res = await fetch(`${API}/gemini/advisor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: advisorQuery, context: advisorCtx }) });
            setAdvisorResult(await res.json());
        } catch (e) { setAdvisorResult({ error: e.message }); }
        setAdvisorLoading(false);
    };

    const genPhishing = async () => {
        setPhishLoading(true); setPhishResult(null);
        try {
            const res = await fetch(`${API}/gemini/phishing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: phishTarget }) });
            setPhishResult(await res.json());
        } catch (e) { setPhishResult({ error: e.message }); }
        setPhishLoading(false);
    };

    const genReport = async () => {
        setReportLoading(true); setReportResult(null);
        try {
            const res = await fetch(`${API}/gemini/password-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: reportPw }) });
            setReportResult(await res.json());
        } catch (e) { setReportResult({ error: e.message }); }
        setReportLoading(false);
    };

    // Simple markdown renderer
    const renderMd = (text) => {
        if (!text) return '';
        return text
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
            .replace(/^### (.*$)/gm, '<h4 style="color:var(--neon-cyan);margin:12px 0 6px">$1</h4>')
            .replace(/^## (.*$)/gm, '<h3 style="color:var(--neon-magenta);margin:16px 0 8px">$1</h3>')
            .replace(/^# (.*$)/gm, '<h2 style="color:var(--neon-green);margin:20px 0 10px">$1</h2>')
            .replace(/^- (.*$)/gm, '<div style="padding-left:16px">• $1</div>')
            .replace(/^\d+\. (.*$)/gm, '<div style="padding-left:16px;margin:2px 0">$1</div>')
            .replace(/\[CRITICAL\]/g, '<span style="background:#ff003c;color:#fff;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:700">CRITICAL</span>')
            .replace(/\[HIGH\]/g, '<span style="background:#ff6b35;color:#fff;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:700">HIGH</span>')
            .replace(/\[MEDIUM\]/g, '<span style="background:#ffaa00;color:#000;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:700">MEDIUM</span>')
            .replace(/\[LOW\]/g, '<span style="background:#39ff14;color:#000;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:700">LOW</span>')
            .replace(/🔴/g, '<span style="color:#ff003c">🔴</span>')
            .replace(/🟠/g, '<span style="color:#ff6b35">🟠</span>')
            .replace(/🟡/g, '<span style="color:#ffaa00">🟡</span>')
            .replace(/🟢/g, '<span style="color:#39ff14">🟢</span>')
            .replace(/\n/g, '<br/>');
    };

    const tokenBadge = (data) => data?.tokens ? (
        <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
            <span>🤖 {data.model}</span>
            <span>📝 {data.tokens.total} tokens</span>
            <span>⚡ {data.timeMs}ms</span>
        </div>
    ) : null;

    // ─── Not Configured ──────────────────────────────────────
    if (!configured) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h2>🤖 Gemini AI Advisor</h2>
                    <p>LLM-powered security analysis, threat intelligence, and AI chat</p>
                </div>
                <div className="card card-glow-magenta" style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔑</div>
                    <h3 style={{ color: 'var(--neon-magenta)', marginBottom: 8 }}>Configure Gemini API Key</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.85rem' }}>
                        Get a free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-cyan)' }}>Google AI Studio</a> and paste it below.
                    </p>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <input type="password" value={apiKey} onChange={e => setApiKeyInput(e.target.value)} placeholder="Paste your Gemini API key..." style={{ textAlign: 'center' }} />
                    </div>
                    <button className="btn btn-primary w-full" disabled={!apiKey.trim() || keyLoading} onClick={configureKey}>
                        {keyLoading ? <><span className="loading-spinner"></span> Configuring...</> : '🔐 Activate Gemini AI'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Main UI ─────────────────────────────────────────────
    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>🤖 Gemini AI Advisor</h2>
                <p>Google Gemini LLM-powered security analysis, phishing generation, and AI chat</p>
            </div>

            <div className="tabs">
                <button className={`tab ${mode === 'chat' ? 'active' : ''}`} onClick={() => setMode('chat')}>💬 AI Chat</button>
                <button className={`tab ${mode === 'advisor' ? 'active' : ''}`} onClick={() => setMode('advisor')}>🛡️ Security Advisor</button>
                <button className={`tab ${mode === 'phishing' ? 'active' : ''}`} onClick={() => setMode('phishing')}>🎭 Phishing Writer</button>
                <button className={`tab ${mode === 'pwreport' ? 'active' : ''}`} onClick={() => setMode('pwreport')}>🔐 Password Report</button>
            </div>

            {/* ═══ AI CHAT ═══ */}
            {mode === 'chat' && (
                <div>
                    <div className="card" style={{ minHeight: 400, maxHeight: 500, overflowY: 'auto', marginBottom: 16, padding: 20 }}>
                        {chatHistory.length === 0 && (
                            <div className="text-center" style={{ padding: 60, color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🤖</div>
                                <p>Ask me anything about cybersecurity, and I'll answer using <strong style={{ color: 'var(--neon-cyan)' }}>Google Gemini AI</strong></p>
                                <div style={{ marginTop: 12, fontSize: '0.8rem' }}>Try: "How does SQL injection work?" or "Explain MITRE ATT&CK framework"</div>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} style={{ marginBottom: 16, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '80%', padding: '12px 16px', borderRadius: 12,
                                    background: msg.role === 'user' ? 'rgba(0,255,255,0.1)' : 'rgba(255,0,255,0.05)',
                                    border: `1px solid ${msg.role === 'user' ? 'var(--neon-cyan)' : 'var(--border-subtle)'}`,
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                        {msg.role === 'user' ? '👤 You' : '🤖 Gemini AI'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
                                    {msg.tokens && tokenBadge(msg)}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,0,255,0.05)', border: '1px solid var(--border-subtle)' }}>
                                    <span className="loading-spinner"></span> <span style={{ fontSize: '0.85rem' }}>Gemini is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-sm">
                        <input className="flex-1" value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Ask Gemini about cybersecurity..."
                            onKeyDown={e => e.key === 'Enter' && !chatLoading && sendChat()} style={{ fontSize: '0.9rem' }} />
                        <button className="btn btn-primary" disabled={chatLoading || !chatMsg.trim()} onClick={sendChat}>Send</button>
                    </div>
                </div>
            )}

            {/* ═══ SECURITY ADVISOR ═══ */}
            {mode === 'advisor' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🛡️</span> AI Security Advisor</div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div>Powered by <strong>Google Gemini</strong> — paste any security artifact (password, email, code, config, log) and get an AI-powered vulnerability analysis.</div>
                        </div>
                        <div className="input-group">
                            <label>Security Query</label>
                            <textarea rows={3} value={advisorQuery} onChange={e => setAdvisorQuery(e.target.value)} placeholder="e.g. Analyze this nginx config for vulnerabilities..." />
                        </div>
                        <div className="input-group">
                            <label>Context / Artifact (optional)</label>
                            <textarea rows={4} value={advisorCtx} onChange={e => setAdvisorCtx(e.target.value)} placeholder="Paste code, config, email, or logs here..." />
                        </div>
                        <button className="btn btn-primary w-full" disabled={advisorLoading || !advisorQuery.trim()} onClick={askAdvisor} style={{ fontSize: '1rem', padding: '14px 0' }}>
                            {advisorLoading ? <><span className="loading-spinner"></span> Gemini Analyzing...</> : '🛡️ Analyze with Gemini AI'}
                        </button>
                    </div>
                    {advisorResult && (
                        <div className="card fade-in" style={{ padding: 24 }}>
                            <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📋</span> AI Analysis Report</div>
                            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderMd(advisorResult.response || advisorResult.error) }} />
                            {tokenBadge(advisorResult)}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ PHISHING WRITER ═══ */}
            {mode === 'phishing' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🎭</span> AI Phishing Email Generator</div>
                        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                            <span>⚠️</span>
                            <div><strong>For authorized security awareness training only.</strong> Gemini generates realistic phishing emails with red flag indicators for employee training.</div>
                        </div>
                        <div className="grid-2">
                            <div className="input-group">
                                <label>Target Name</label>
                                <input value={phishTarget.name} onChange={e => setPhishTarget(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Smith" />
                            </div>
                            <div className="input-group">
                                <label>Company</label>
                                <input value={phishTarget.company} onChange={e => setPhishTarget(p => ({ ...p, company: e.target.value }))} placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="input-group">
                                <label>Role / Position</label>
                                <input value={phishTarget.role} onChange={e => setPhishTarget(p => ({ ...p, role: e.target.value }))} placeholder="e.g. IT Director" />
                            </div>
                            <div className="input-group">
                                <label>Scenario</label>
                                <select value={phishTarget.scenario} onChange={e => setPhishTarget(p => ({ ...p, scenario: e.target.value }))}>
                                    <option>Account verification</option>
                                    <option>Password reset</option>
                                    <option>Invoice payment</option>
                                    <option>HR policy update</option>
                                    <option>IT security alert</option>
                                    <option>Prize/reward notification</option>
                                    <option>Shared document</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary w-full" disabled={phishLoading} onClick={genPhishing} style={{ fontSize: '1rem', padding: '14px 0' }}>
                            {phishLoading ? <><span className="loading-spinner"></span> Gemini Generating...</> : '🎭 Generate Phishing Email with AI'}
                        </button>
                    </div>
                    {phishResult && (
                        <div className="card fade-in" style={{ padding: 24 }}>
                            <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📧</span> Generated Phishing Email</div>
                            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderMd(phishResult.response || phishResult.error) }} />
                            {tokenBadge(phishResult)}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ PASSWORD REPORT ═══ */}
            {mode === 'pwreport' && (
                <div>
                    <div className="card card-glow-green" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔐</span> AI Password Security Report</div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>🧠</span>
                            <div>Gemini AI generates a <strong>comprehensive natural-language security report</strong> for any password — including crack time estimates, pattern analysis, and NIST/OWASP compliance.</div>
                        </div>
                        <div className="input-group">
                            <label>Password to Analyze</label>
                            <input value={reportPw} onChange={e => setReportPw(e.target.value)} placeholder="Enter a password..." />
                        </div>
                        <button className="btn btn-primary w-full" disabled={reportLoading || !reportPw.trim()} onClick={genReport} style={{ fontSize: '1rem', padding: '14px 0' }}>
                            {reportLoading ? <><span className="loading-spinner"></span> Gemini Analyzing...</> : '🔐 Generate AI Security Report'}
                        </button>
                    </div>
                    {reportResult && (
                        <div className="card fade-in" style={{ padding: 24 }}>
                            <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📋</span> AI Password Report</div>
                            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderMd(reportResult.response || reportResult.error) }} />
                            {tokenBadge(reportResult)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
