import React, { useState, useEffect } from 'react';

export default function CampaignManager({ sessionId, API }) {
    const [mode, setMode] = useState('dashboard');
    const [smtpConfig, setSmtpConfig] = useState({ host: '', port: 587, secure: false, user: '', pass: '', from_name: 'OffensiveAI', from_email: '' });
    const [smtpStatus, setSmtpStatus] = useState(null);
    const [smtpTesting, setSmtpTesting] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaignStats, setCampaignStats] = useState(null);
    const [newCampaign, setNewCampaign] = useState({ name: '', subject: '', body: '' });
    const [newTargets, setNewTargets] = useState('');
    const [loading, setLoading] = useState(false);
    const [launchResult, setLaunchResult] = useState(null);

    useEffect(() => {
        loadCampaigns();
        loadSMTPConfig();
    }, []);

    const loadCampaigns = async () => {
        try {
            const res = await fetch(`${API}/campaign/list`); setCampaigns(await res.json());
        } catch { }
    };

    const loadSMTPConfig = async () => {
        try {
            const res = await fetch(`${API}/campaign/smtp-config`);
            const data = await res.json();
            if (data.host) setSmtpStatus(data);
        } catch { }
    };

    const saveSMTP = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/campaign/smtp-config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(smtpConfig) });
            const data = await res.json();
            if (data.success) { setSmtpStatus({ ...smtpConfig, pass: '••••••••' }); }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const testSMTP = async () => {
        setSmtpTesting(true);
        try {
            const res = await fetch(`${API}/campaign/smtp-test`, { method: 'POST' });
            const data = await res.json();
            alert(data.success ? '✅ SMTP Connection Verified!' : `❌ SMTP Error: ${data.error}`);
        } catch (e) { alert('Connection failed'); }
        setSmtpTesting(false);
    };

    const createCampaign = async () => {
        if (!newCampaign.name || !newCampaign.subject) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/campaign/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCampaign) });
            const data = await res.json();
            await loadCampaigns();
            setNewCampaign({ name: '', subject: '', body: '' });
            setSelectedCampaign(data.id);
            setMode('targets');
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const addTargets = async () => {
        if (!selectedCampaign || !newTargets.trim()) return;
        const lines = newTargets.split('\n').filter(l => l.trim());
        const targets = lines.map(line => {
            const parts = line.split(',').map(p => p.trim());
            return { email: parts[0], name: parts[1] || '', department: parts[2] || '' };
        }).filter(t => t.email.includes('@'));

        if (targets.length === 0) return;
        setLoading(true);
        try {
            await fetch(`${API}/campaign/${selectedCampaign}/targets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targets }) });
            loadCampaignDetail(selectedCampaign);
            setNewTargets('');
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const launchCampaign = async () => {
        if (!selectedCampaign) return;
        if (!confirm('⚠️ This will send real phishing emails to all pending targets. Continue?')) return;
        setLoading(true);
        setLaunchResult(null);
        try {
            const res = await fetch(`${API}/campaign/${selectedCampaign}/launch`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            setLaunchResult(data);
            loadCampaignDetail(selectedCampaign);
        } catch (e) { setLaunchResult({ success: false, error: e.message }); }
        setLoading(false);
    };

    const loadCampaignDetail = async (id) => {
        try {
            const res = await fetch(`${API}/campaign/stats/${id}`);
            const data = await res.json();
            setCampaignStats(data);
        } catch { }
    };

    const deleteCampaign = async (id) => {
        if (!confirm('Delete this campaign and all associated data?')) return;
        try {
            await fetch(`${API}/campaign/${id}`, { method: 'DELETE' });
            loadCampaigns();
            if (selectedCampaign === id) { setSelectedCampaign(null); setCampaignStats(null); }
        } catch { }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>📬 Campaign Manager</h2>
                <p>Send phishing emails, track opens/clicks, collect target data via landing pages</p>
            </div>

            <div className="tabs">
                <button className={`tab ${mode === 'dashboard' ? 'active' : ''}`} onClick={() => setMode('dashboard')}>📊 Campaigns</button>
                <button className={`tab ${mode === 'create' ? 'active' : ''}`} onClick={() => setMode('create')}>➕ Create</button>
                <button className={`tab ${mode === 'targets' ? 'active' : ''}`} onClick={() => setMode('targets')}>🎯 Targets</button>
                <button className={`tab ${mode === 'results' ? 'active' : ''}`} onClick={() => setMode('results')}>📈 Results</button>
                <button className={`tab ${mode === 'smtp' ? 'active' : ''}`} onClick={() => setMode('smtp')}>⚙️ SMTP</button>
            </div>

            {/* ═══ SMTP CONFIG ═══ */}
            {mode === 'smtp' && (
                <div className="card card-glow-cyan">
                    <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">⚙️</span> SMTP Configuration</div>
                    {smtpStatus?.host && (
                        <div className="alert alert-success" style={{ marginBottom: 16 }}>
                            <span>✅</span> SMTP configured: {smtpStatus.host}:{smtpStatus.port} ({smtpStatus.user})
                        </div>
                    )}
                    <div className="grid-2">
                        <div className="input-group"><label>SMTP Host</label>
                            <input type="text" value={smtpConfig.host} onChange={e => setSmtpConfig(p => ({ ...p, host: e.target.value }))} placeholder="smtp.gmail.com" /></div>
                        <div className="input-group"><label>Port</label>
                            <input type="text" value={smtpConfig.port} onChange={e => setSmtpConfig(p => ({ ...p, port: parseInt(e.target.value) || 587 }))} placeholder="587" /></div>
                        <div className="input-group"><label>Username / Email</label>
                            <input type="text" value={smtpConfig.user} onChange={e => setSmtpConfig(p => ({ ...p, user: e.target.value }))} placeholder="your@email.com" /></div>
                        <div className="input-group"><label>Password / App Password</label>
                            <input type="password" value={smtpConfig.pass} onChange={e => setSmtpConfig(p => ({ ...p, pass: e.target.value }))} placeholder="App password" /></div>
                        <div className="input-group"><label>From Name</label>
                            <input type="text" value={smtpConfig.from_name} onChange={e => setSmtpConfig(p => ({ ...p, from_name: e.target.value }))} placeholder="IT Support" /></div>
                        <div className="input-group"><label>From Email</label>
                            <input type="text" value={smtpConfig.from_email} onChange={e => setSmtpConfig(p => ({ ...p, from_email: e.target.value }))} placeholder="itsupport@company.com" /></div>
                    </div>
                    <div className="flex gap-sm">
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveSMTP} disabled={loading || !smtpConfig.host || !smtpConfig.user}>
                            {loading ? <><span className="loading-spinner"></span> Saving...</> : '💾 Save SMTP Config'}
                        </button>
                        <button className="btn btn-ghost" onClick={testSMTP} disabled={smtpTesting || !smtpStatus?.host}>
                            {smtpTesting ? <><span className="loading-spinner"></span> Testing...</> : '🔌 Test Connection'}
                        </button>
                    </div>
                    <div className="alert alert-warning mt-md">
                        <span>💡</span>
                        <div>
                            <strong>Gmail:</strong> Use smtp.gmail.com:587, enable 2FA, and create an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" style={{ color: 'var(--neon-cyan)' }}>App Password</a>.<br />
                            <strong>Outlook:</strong> smtp-mail.outlook.com:587<br />
                            <strong>Testing:</strong> Use <a href="https://mailtrap.io" target="_blank" rel="noopener" style={{ color: 'var(--neon-cyan)' }}>Mailtrap.io</a> for safe testing
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CREATE CAMPAIGN ═══ */}
            {mode === 'create' && (
                <div className="card card-glow-magenta">
                    <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">📧</span> Create Phishing Campaign</div>
                    <div className="input-group"><label>Campaign Name</label>
                        <input type="text" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="Q1 Security Awareness Test" /></div>
                    <div className="input-group"><label>Email Subject</label>
                        <input type="text" value={newCampaign.subject} onChange={e => setNewCampaign(p => ({ ...p, subject: e.target.value }))} placeholder="Urgent: Your Account Requires Verification" /></div>
                    <div className="input-group"><label>Email Body (HTML supported, use {'{{name}}'} {'{{email}}'} {'{{tracking_url}}'} for personalization)</label>
                        <textarea value={newCampaign.body} onChange={e => setNewCampaign(p => ({ ...p, body: e.target.value }))} style={{ minHeight: 200 }}
                            placeholder={`Dear {{name}},\n\nWe've detected unusual activity on your account. Please verify your identity immediately by clicking the link below:\n\n{{tracking_url}}\n\nFailure to verify within 24 hours will result in account suspension.\n\nIT Security Team`} />
                    </div>
                    <button className="btn btn-danger w-full" onClick={createCampaign} disabled={loading || !newCampaign.name || !newCampaign.subject}>
                        {loading ? <><span className="loading-spinner"></span> Creating...</> : '🚀 Create Campaign'}
                    </button>
                </div>
            )}

            {/* ═══ ADD TARGETS ═══ */}
            {mode === 'targets' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 16 }}><span className="icon">🎯</span> Add Targets to Campaign</div>
                        <div className="input-group"><label>Select Campaign</label>
                            <select value={selectedCampaign || ''} onChange={e => { setSelectedCampaign(e.target.value); if (e.target.value) loadCampaignDetail(e.target.value); }}>
                                <option value="">-- Select Campaign --</option>
                                {campaigns.map(c => <option key={c.id} value={c.id}>[{c.status}] {c.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Add targets (one per line: email, name, department)</label>
                            <textarea value={newTargets} onChange={e => setNewTargets(e.target.value)} style={{ minHeight: 120 }}
                                placeholder={"john@company.com, John Smith, Finance\njane@company.com, Jane Doe, IT\nbob@company.com, Bob Wilson, HR"} />
                        </div>
                        <div className="flex gap-sm">
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={addTargets} disabled={loading || !selectedCampaign || !newTargets.trim()}>
                                ➕ Add Targets
                            </button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={launchCampaign} disabled={loading || !selectedCampaign || !smtpStatus?.host}>
                                {loading ? <><span className="loading-spinner"></span> Sending...</> : '🚀 Launch Campaign'}
                            </button>
                        </div>
                        {!smtpStatus?.host && (
                            <div className="alert alert-warning mt-md"><span>⚠️</span> Configure SMTP first in the ⚙️ SMTP tab before launching.</div>
                        )}
                    </div>

                    {launchResult && (
                        <div className={`card ${launchResult.success ? 'card-glow-green' : 'card-glow-magenta'}`} style={{ marginBottom: 20 }}>
                            <div className="text-center" style={{ padding: 20 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 8 }}>{launchResult.success ? '📨' : '❌'}</div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: launchResult.success ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                                    {launchResult.success ? `Campaign Launched — ${launchResult.sent} emails sent` : `Launch Failed: ${launchResult.error}`}
                                </h3>
                                {launchResult.failed > 0 && <p style={{ fontSize: '0.82rem', color: 'var(--neon-orange)', marginTop: 8 }}>{launchResult.failed} emails failed to send</p>}
                            </div>
                        </div>
                    )}

                    {campaignStats?.targets?.length > 0 && (
                        <div className="card">
                            <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">👥</span> Campaign Targets</div>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Email</th><th>Name</th><th>Dept</th><th>Status</th><th>Sent</th><th>Opened</th><th>Clicked</th><th>Data</th></tr></thead>
                                    <tbody>
                                        {campaignStats.targets.map(t => (
                                            <tr key={t.id}>
                                                <td className="mono" style={{ fontSize: '0.78rem' }}>{t.email}</td>
                                                <td>{t.name}</td>
                                                <td>{t.department}</td>
                                                <td><span className={`badge ${t.status === 'sent' ? 'badge-low' : t.status === 'failed' ? 'badge-critical' : 'badge-info'}`}>{t.status}</span></td>
                                                <td>{t.sent_at ? '✅' : '—'}</td>
                                                <td>{t.opened_at ? '👁️' : '—'}</td>
                                                <td>{t.clicked_at ? '🖱️' : '—'}</td>
                                                <td>{t.submitted_at ? '💥' : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ CAMPAIGN DASHBOARD ═══ */}
            {mode === 'dashboard' && (
                <div>
                    {campaigns.length === 0 ? (
                        <div className="card text-center" style={{ padding: 40 }}>
                            <div style={{ fontSize: '4rem', marginBottom: 16 }}>📬</div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>No Campaigns Yet</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>Create a campaign to start sending phishing emails and collecting data.</p>
                            <button className="btn btn-primary" onClick={() => setMode('create')}>➕ Create First Campaign</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-md">
                            {campaigns.map(c => (
                                <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedCampaign(c.id); loadCampaignDetail(c.id); setMode('results'); }}>
                                    <div className="flex items-center justify-between mb-sm">
                                        <div className="card-title"><span className="icon">📧</span> {c.name}</div>
                                        <div className="flex gap-sm items-center">
                                            <span className={`badge ${c.status === 'active' ? 'badge-low' : c.status === 'draft' ? 'badge-info' : 'badge-critical'}`}>{c.status}</span>
                                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deleteCampaign(c.id); }}>🗑️</button>
                                        </div>
                                    </div>
                                    <div className="grid-4">
                                        <div><div className="metric-card"><div className="metric-value text-cyan">{c.stats?.total || 0}</div><div className="metric-label">Targets</div></div></div>
                                        <div><div className="metric-card"><div className="metric-value text-green">{c.stats?.opened || 0}</div><div className="metric-label">Opened</div></div></div>
                                        <div><div className="metric-card"><div className="metric-value text-orange">{c.stats?.clicked || 0}</div><div className="metric-label">Clicked</div></div></div>
                                        <div><div className="metric-card"><div className="metric-value text-red">{c.stats?.submitted || 0}</div><div className="metric-label">Data Collected</div></div></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ RESULTS / STATS ═══ */}
            {mode === 'results' && (
                <div>
                    <div className="input-group">
                        <label>Select Campaign</label>
                        <select value={selectedCampaign || ''} onChange={e => { setSelectedCampaign(e.target.value); if (e.target.value) loadCampaignDetail(e.target.value); }}>
                            <option value="">-- Select Campaign --</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name} [{c.status}]</option>)}
                        </select>
                    </div>

                    {campaignStats && (
                        <div className="fade-in">
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{campaignStats.stats?.sent || 0}</div><div className="metric-label">Emails Sent</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{campaignStats.stats?.opened || 0} <span style={{ fontSize: '0.8rem' }}>({campaignStats.stats?.openRate}%)</span></div><div className="metric-label">Opened</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-orange">{campaignStats.stats?.clicked || 0} <span style={{ fontSize: '0.8rem' }}>({campaignStats.stats?.clickRate}%)</span></div><div className="metric-label">Clicked Link</div></div></div>
                                <div className="card card-glow-magenta"><div className="metric-card"><div className="metric-value text-red">{campaignStats.stats?.submitted || 0} <span style={{ fontSize: '0.8rem' }}>({campaignStats.stats?.submitRate}%)</span></div><div className="metric-label">Data Submitted</div></div></div>
                            </div>

                            {campaignStats.collectedData?.length > 0 && (
                                <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">💥</span> Collected Data</div>
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Time</th><th>Field</th><th>Value</th><th>IP</th></tr></thead>
                                            <tbody>
                                                {campaignStats.collectedData.map((d, i) => (
                                                    <tr key={i}>
                                                        <td style={{ fontSize: '0.75rem' }}>{d.created_at}</td>
                                                        <td className="mono">{d.field_name}</td>
                                                        <td className="mono text-red">{d.field_value}</td>
                                                        <td className="mono" style={{ fontSize: '0.75rem' }}>{d.ip_address}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {campaignStats.recentEvents?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📡</span> Event Feed</div>
                                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                        {campaignStats.recentEvents.map((evt, i) => (
                                            <div key={i} className={`result-item severity-${evt.event_type === 'submitted' ? 'critical' : evt.event_type === 'clicked' ? 'high' : evt.event_type === 'opened' ? 'medium' : 'low'}`}>
                                                <div className="result-item-title">
                                                    {evt.event_type === 'sent' ? '📤' : evt.event_type === 'opened' ? '👁️' : evt.event_type === 'clicked' ? '🖱️' : evt.event_type === 'submitted' ? '💥' : '⚠️'} {evt.event_type.toUpperCase()}
                                                </div>
                                                <div className="result-item-desc">{evt.tracking_id?.substring(0, 12)}... | {evt.ip_address} | {evt.created_at}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
