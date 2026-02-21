import React, { useState } from 'react';

export default function OsintRecon({ API }) {
    const [mode, setMode] = useState('whois');
    const [domain, setDomain] = useState('');
    const [target, setTarget] = useState('');
    const [names, setNames] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const runTool = async (endpoint, body) => {
        setLoading(true); setResult(null);
        try {
            const res = await fetch(`${API}/osint/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            setResult({ tool: endpoint, ...(await res.json()) });
        } catch (e) { setResult({ tool: endpoint, success: false, error: e.message }); }
        setLoading(false);
    };

    const getSeverityColor = s => {
        const map = { Critical: 'var(--neon-red)', High: 'var(--neon-orange)', Medium: 'var(--neon-yellow)', Low: 'var(--neon-green)', Info: 'var(--neon-cyan)' };
        return map[s] || 'var(--text-secondary)';
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>🔎 OSINT Reconnaissance</h2>
                <p>WHOIS lookup, DNS recon, subdomain enumeration, port scanning, HTTP fingerprinting, email harvesting</p>
            </div>

            <div className="tabs">
                <button className={`tab ${mode === 'whois' ? 'active' : ''}`} onClick={() => { setMode('whois'); setResult(null); }}>🌐 WHOIS</button>
                <button className={`tab ${mode === 'dns' ? 'active' : ''}`} onClick={() => { setMode('dns'); setResult(null); }}>📡 DNS Recon</button>
                <button className={`tab ${mode === 'subdomains' ? 'active' : ''}`} onClick={() => { setMode('subdomains'); setResult(null); }}>🔍 Subdomains</button>
                <button className={`tab ${mode === 'portscan' ? 'active' : ''}`} onClick={() => { setMode('portscan'); setResult(null); }}>🔌 Port Scan</button>
                <button className={`tab ${mode === 'headers' ? 'active' : ''}`} onClick={() => { setMode('headers'); setResult(null); }}>🔓 HTTP Headers</button>
                <button className={`tab ${mode === 'harvest' ? 'active' : ''}`} onClick={() => { setMode('harvest'); setResult(null); }}>📧 Email Harvest</button>
            </div>

            {/* ═══ WHOIS ═══ */}
            {mode === 'whois' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🌐</span> WHOIS Lookup</div>
                        <div className="input-group"><label>Domain</label>
                            <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" onKeyDown={e => e.key === 'Enter' && runTool('whois', { domain })} /></div>
                        <button className="btn btn-primary w-full" onClick={() => runTool('whois', { domain })} disabled={loading || !domain}>
                            {loading ? <><span className="loading-spinner"></span> Looking up...</> : '🔍 Lookup WHOIS'}
                        </button>
                    </div>
                    {result?.tool === 'whois' && result.success && (
                        <div className="grid-2 fade-in">
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📋</span> Parsed Info</div>
                                {Object.entries(result.parsed || {}).filter(([, v]) => v && (!Array.isArray(v) || v.length > 0)).map(([key, val]) => (
                                    <div key={key} className="flex justify-between" style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="mono text-cyan" style={{ maxWidth: '60%', textAlign: 'right', wordBreak: 'break-all' }}>{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📄</span> Raw Output</div>
                                <div style={{ maxHeight: 400, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                    {result.raw}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ DNS RECON ═══ */}
            {mode === 'dns' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📡</span> DNS Reconnaissance</div>
                        <div className="input-group"><label>Domain</label>
                            <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" onKeyDown={e => e.key === 'Enter' && runTool('dns', { domain })} /></div>
                        <button className="btn btn-primary w-full" onClick={() => runTool('dns', { domain })} disabled={loading || !domain}>
                            {loading ? <><span className="loading-spinner"></span> Querying DNS...</> : '📡 Run DNS Recon'}
                        </button>
                    </div>
                    {result?.tool === 'dns' && result.success && (
                        <div className="fade-in">
                            <div className="grid-2" style={{ marginBottom: 20 }}>
                                {Object.entries(result.records || {}).map(([type, records]) => {
                                    if (!records || (Array.isArray(records) && records.length === 0)) return null;
                                    return (
                                        <div key={type} className="card">
                                            <div className="card-title" style={{ marginBottom: 8 }}><span className="badge badge-info">{type}</span> Records</div>
                                            {Array.isArray(records) ? records.map((r, i) => (
                                                <div key={i} className="mono" style={{ fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', color: 'var(--neon-cyan)', wordBreak: 'break-all' }}>
                                                    {typeof r === 'object' ? JSON.stringify(r) : r}
                                                </div>
                                            )) : (
                                                <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)' }}>{JSON.stringify(records, null, 2)}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {result.securityNotes?.length > 0 && (
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🛡️</span> Email Security</div>
                                    {result.securityNotes.map((note, i) => (
                                        <div key={i} className={`result-item ${note.status === 'Missing' ? 'severity-critical' : 'severity-low'}`}>
                                            <div className="result-item-title">{note.status === 'Found' ? '✅' : '⚠️'} {note.type}: {note.status}</div>
                                            <div className="result-item-desc">{note.detail}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ SUBDOMAINS ═══ */}
            {mode === 'subdomains' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔍</span> Subdomain Enumeration</div>
                        <div className="alert alert-info" style={{ marginBottom: 12 }}><span>🔍</span> Brute-forces 90+ common subdomain names against DNS</div>
                        <div className="input-group"><label>Target Domain</label>
                            <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" onKeyDown={e => e.key === 'Enter' && runTool('subdomains', { domain })} /></div>
                        <button className="btn btn-danger w-full" onClick={() => runTool('subdomains', { domain })} disabled={loading || !domain}>
                            {loading ? <><span className="loading-spinner"></span> Enumerating...</> : '🔍 Enumerate Subdomains'}
                        </button>
                    </div>
                    {result?.tool === 'subdomains' && result.success && (
                        <div className="fade-in">
                            <div className="card" style={{ marginBottom: 20 }}>
                                <div className="card-title" style={{ marginBottom: 8 }}><span className="icon">📊</span> Results</div>
                                <div className="flex gap-md items-center mb-md">
                                    <span className="badge badge-low">{result.found?.length} discovered</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{result.summary}</span>
                                </div>
                            </div>
                            {result.found?.length > 0 && (
                                <div className="card">
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Subdomain</th><th>FQDN</th><th>IP Address(es)</th><th>Category</th></tr></thead>
                                            <tbody>
                                                {result.found.map((s, i) => (
                                                    <tr key={i}>
                                                        <td className="mono text-cyan">{s.subdomain}</td>
                                                        <td className="mono">{s.fqdn}</td>
                                                        <td className="mono" style={{ fontSize: '0.78rem' }}>{s.ips?.join(', ')}</td>
                                                        <td><span className="badge badge-info">{s.type}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ PORT SCAN ═══ */}
            {mode === 'portscan' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔌</span> TCP Port Scanner</div>
                        <div className="alert alert-danger" style={{ marginBottom: 12 }}><span>⚡</span> Scans 23 common ports via TCP connect. Only scan targets you have authorization for.</div>
                        <div className="input-group"><label>Target (domain or IP)</label>
                            <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="example.com or 93.184.216.34" onKeyDown={e => e.key === 'Enter' && runTool('portscan', { target })} /></div>
                        <button className="btn btn-danger w-full" onClick={() => runTool('portscan', { target })} disabled={loading || !target}>
                            {loading ? <><span className="loading-spinner"></span> Scanning Ports...</> : '🔌 Launch Port Scan'}
                        </button>
                    </div>
                    {result?.tool === 'portscan' && result.success && (
                        <div className="fade-in">
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{result.totalScanned}</div><div className="metric-label">Ports Scanned</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{result.openPorts}</div><div className="metric-label">Open</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{result.ip}</div><div className="metric-label">Target IP</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{result.scanTime}</div><div className="metric-label">Scan Time</div></div></div>
                            </div>
                            <div className="grid-2">
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔌</span> Port Results</div>
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Port</th><th>Service</th><th>State</th></tr></thead>
                                            <tbody>
                                                {result.results?.filter(r => r.state !== 'closed').map((r, i) => (
                                                    <tr key={i}>
                                                        <td className="mono text-cyan">{r.port}</td>
                                                        <td>{r.service}</td>
                                                        <td><span className={`badge ${r.state === 'open' ? 'badge-low' : 'badge-medium'}`}>{r.state}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">⚠️</span> Risk Notes</div>
                                    {result.riskNotes?.map((note, i) => (
                                        <div key={i} className={`result-item severity-${note.severity?.toLowerCase()}`}>
                                            <div className="result-item-desc" style={{ color: getSeverityColor(note.severity) }}>{note.note}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ HTTP HEADERS ═══ */}
            {mode === 'headers' && (
                <div>
                    <div className="card card-glow-cyan" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔓</span> HTTP Security Header Analysis</div>
                        <div className="input-group"><label>URL</label>
                            <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="https://example.com" onKeyDown={e => e.key === 'Enter' && runTool('headers', { url: target })} /></div>
                        <button className="btn btn-primary w-full" onClick={() => runTool('headers', { url: target })} disabled={loading || !target}>
                            {loading ? <><span className="loading-spinner"></span> Analyzing...</> : '🔓 Analyze Headers'}
                        </button>
                    </div>
                    {result?.tool === 'headers' && result.success && (
                        <div className="fade-in">
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{result.statusCode}</div><div className="metric-label">HTTP Status</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value" style={{ color: result.security?.score >= 60 ? 'var(--neon-green)' : 'var(--neon-red)' }}>{result.security?.grade}</div><div className="metric-label">Security Grade</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{result.security?.present?.length}</div><div className="metric-label">Headers Present</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-red">{result.security?.missing?.length}</div><div className="metric-label">Missing</div></div></div>
                            </div>
                            <div className="grid-2">
                                <div className="card">
                                    <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">✅</span> Present Security Headers</div>
                                    {result.security?.present?.map((h, i) => (
                                        <div key={i} className="result-item severity-low">
                                            <div className="result-item-title">✅ {h.name}</div>
                                            <div className="result-item-desc mono" style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{h.value}</div>
                                        </div>
                                    ))}
                                    {result.security?.present?.length === 0 && <p className="text-secondary" style={{ fontSize: '0.82rem' }}>No security headers found</p>}
                                </div>
                                <div className="flex flex-col gap-md">
                                    <div className="card">
                                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">❌</span> Missing Headers</div>
                                        {result.security?.missing?.map((h, i) => (
                                            <div key={i} className="result-item severity-high">
                                                <div className="result-item-title">⚠️ {h.name} <span className="badge badge-high ml-sm">{h.importance}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                    {result.techStack?.length > 0 && (
                                        <div className="card">
                                            <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🖥️</span> Tech Stack</div>
                                            {result.techStack.map((t, i) => (
                                                <div key={i} className="flex justify-between" style={{ fontSize: '0.82rem', padding: '4px 0' }}>
                                                    <span className="text-secondary">{t.type}</span><span className="mono text-cyan">{t.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {result.informationLeakage?.length > 0 && (
                                        <div className="card">
                                            <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">🔓</span> Info Leaks</div>
                                            {result.informationLeakage.map((l, i) => (
                                                <div key={i} className="result-item severity-high">
                                                    <div className="result-item-desc">{l.detail}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ EMAIL HARVESTER ═══ */}
            {mode === 'harvest' && (
                <div>
                    <div className="card card-glow-magenta" style={{ marginBottom: 20 }}>
                        <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📧</span> Email Address Harvester</div>
                        <div className="grid-2">
                            <div className="input-group"><label>Target Domain</label>
                                <input type="text" value={domain} onChange={e => setDomain(e.target.value)} placeholder="company.com" /></div>
                            <div className="input-group"><label>Known Employee Names (one per line)</label>
                                <textarea value={names} onChange={e => setNames(e.target.value)} placeholder={"John Smith\nJane Doe\nBob Wilson"} style={{ minHeight: 80 }} /></div>
                        </div>
                        <button className="btn btn-danger w-full" onClick={() => runTool('harvest-emails', { domain, names: names.split('\n').filter(n => n.trim()) })} disabled={loading || !domain}>
                            {loading ? <><span className="loading-spinner"></span> Harvesting...</> : '📧 Harvest Emails'}
                        </button>
                    </div>
                    {result?.tool === 'harvest-emails' && result.success && (
                        <div className="fade-in">
                            <div className="grid-4" style={{ marginBottom: 20 }}>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{result.totalGenerated}</div><div className="metric-label">Total Generated</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-magenta">{result.personalEmails}</div><div className="metric-label">Personal</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-green">{result.roleEmails}</div><div className="metric-label">Role-Based</div></div></div>
                                <div className="card"><div className="metric-card"><div className="metric-value text-cyan">{result.domain}</div><div className="metric-label">Domain</div></div></div>
                            </div>
                            <div className="card">
                                <div className="card-title" style={{ marginBottom: 12 }}><span className="icon">📋</span> Generated Emails</div>
                                <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    <table>
                                        <thead><tr><th>Email</th><th>Name</th><th>Pattern</th><th>Type</th></tr></thead>
                                        <tbody>
                                            {result.emails?.map((e, i) => (
                                                <tr key={i}>
                                                    <td className="mono text-cyan" style={{ fontSize: '0.78rem' }}>{e.email}</td>
                                                    <td>{e.name}</td>
                                                    <td className="mono" style={{ fontSize: '0.72rem' }}>{e.pattern}</td>
                                                    <td><span className={`badge ${e.type === 'personal' ? 'badge-high' : 'badge-info'}`}>{e.type}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="alert alert-warning mt-md"><span>💡</span> {result.note}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error display */}
            {result && !result.success && result.error && (
                <div className="card card-glow-magenta fade-in">
                    <div className="alert alert-danger"><span>❌</span> {result.error}</div>
                </div>
            )}
        </div>
    );
}
