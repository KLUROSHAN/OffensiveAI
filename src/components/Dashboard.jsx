import React from 'react';

export default function Dashboard({ stats, sessionId, API }) {
    const totals = stats?.totals || {};
    const averages = stats?.averages || {};
    const recentActivity = stats?.recentActivity || [];

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>⚡ Command Center</h2>
                <p>Offensive AI — Adaptive Password & Social Engineering Simulator</p>
            </div>

            {/* Alert Banner */}
            <div className="alert alert-info" style={{ marginBottom: 24 }}>
                <span>🛡️</span>
                <div>
                    <strong>Ethical Use Only</strong> — This platform is designed for authorized security testing, red-team exercises, and cybersecurity education. All simulations are conducted locally using built-in datasets.
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                <div className="card card-glow-cyan">
                    <div className="metric-card">
                        <div className="metric-value text-cyan">{totals.totalOperations || 0}</div>
                        <div className="metric-label">Total Operations</div>
                        <div className="metric-change text-cyan">Across all modules</div>
                    </div>
                </div>
                <div className="card card-glow-magenta">
                    <div className="metric-card">
                        <div className="metric-value text-magenta">{totals.passwordAnalyses || 0}</div>
                        <div className="metric-label">Passwords Analyzed</div>
                        <div className="metric-change">
                            {averages.passwordScore ? `Avg score: ${averages.passwordScore}/100` : 'No data yet'}
                        </div>
                    </div>
                </div>
                <div className="card card-glow-green">
                    <div className="metric-card">
                        <div className="metric-value text-green">{totals.socialAnalyses || 0}</div>
                        <div className="metric-label">Communications Scanned</div>
                        <div className="metric-change">
                            {averages.susceptibilityScore ? `Susceptibility: ${averages.susceptibilityScore}%` : 'No data yet'}
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="metric-card">
                        <div className="metric-value text-orange">{totals.phishingSimulations || 0}</div>
                        <div className="metric-label">Phishing Simulations</div>
                        <div className="metric-change">
                            {averages.phishingDetectionRate != null ? `Detection: ${averages.phishingDetectionRate}%` : 'No data yet'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="card scan-line" style={{ cursor: 'default' }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>
                        <span className="icon">🔐</span> Password Cracking
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Simulate dictionary attacks, brute-force estimation, AI-guided pattern analysis, and hash cracking against real-world password datasets.
                    </p>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        <span className="badge badge-info">Dictionary</span>
                        <span className="badge badge-info">Brute-force</span>
                        <span className="badge badge-info">AI Pattern</span>
                        <span className="badge badge-info">Hash Crack</span>
                    </div>
                </div>

                <div className="card scan-line" style={{ cursor: 'default' }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>
                        <span className="icon">🎭</span> Social Engineering
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Generate realistic phishing emails, analyze communication for SE indicators, run vishing simulations, and assess susceptibility scores.
                    </p>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        <span className="badge badge-high">Phishing</span>
                        <span className="badge badge-high">Vishing</span>
                        <span className="badge badge-high">Analysis</span>
                        <span className="badge badge-high">Scoring</span>
                    </div>
                </div>

                <div className="card scan-line" style={{ cursor: 'default' }}>
                    <div className="card-title" style={{ marginBottom: 12 }}>
                        <span className="icon">🧠</span> Adaptive Learning
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                        AI tracks behavior patterns, refines attack strategies, builds user profiles, and delivers personalized training recommendations.
                    </p>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        <span className="badge badge-low">Profiling</span>
                        <span className="badge badge-low">Adaptation</span>
                        <span className="badge badge-low">Training</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        <span className="icon">📋</span> Recent Activity
                    </div>
                </div>
                {recentActivity.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
                        <p>No activity yet. Start by analyzing a password or running a social engineering simulation.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Detail</th>
                                    <th>Score/Result</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.map((item, i) => (
                                    <tr key={i}>
                                        <td>
                                            <span className="badge badge-info">{item.type}</span>
                                        </td>
                                        <td className="mono" style={{ fontSize: '0.78rem' }}>{item.detail}</td>
                                        <td>
                                            <span className={`badge ${item.value >= 70 ? 'badge-low' : item.value >= 40 ? 'badge-medium' : 'badge-critical'}`}>
                                                {item.label || item.value}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(item.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Comparison Section */}
            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <div className="card-title" style={{ marginBottom: 14 }}>
                        <span className="icon">⚔️</span> vs. Traditional Tools
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>OffensiveAI</th>
                                    <th>Hashcat / GoPhish</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Password + Social Eng.</td>
                                    <td><span className="text-green">✓ Unified</span></td>
                                    <td><span className="text-red">✗ Separate tools</span></td>
                                </tr>
                                <tr>
                                    <td>Adaptive Learning</td>
                                    <td><span className="text-green">✓ AI-driven</span></td>
                                    <td><span className="text-red">✗ Static</span></td>
                                </tr>
                                <tr>
                                    <td>Pattern Analysis</td>
                                    <td><span className="text-green">✓ Behavioral</span></td>
                                    <td><span className="text-yellow">~ Rule-based</span></td>
                                </tr>
                                <tr>
                                    <td>Training Integration</td>
                                    <td><span className="text-green">✓ Built-in</span></td>
                                    <td><span className="text-red">✗ External</span></td>
                                </tr>
                                <tr>
                                    <td>Risk Assessment</td>
                                    <td><span className="text-green">✓ Automated</span></td>
                                    <td><span className="text-red">✗ Manual</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <div className="card-title" style={{ marginBottom: 14 }}>
                        <span className="icon">🎯</span> Quick Actions
                    </div>
                    <div className="flex flex-col gap-sm">
                        <div className="result-item severity-high" style={{ cursor: 'default' }}>
                            <div className="result-item-title">🔐 Test Password Strength</div>
                            <div className="result-item-desc">Analyze passwords against AI-powered cracking simulations</div>
                        </div>
                        <div className="result-item severity-critical" style={{ cursor: 'default' }}>
                            <div className="result-item-title">🎭 Generate Phishing Email</div>
                            <div className="result-item-desc">Create realistic phishing scenarios for awareness training</div>
                        </div>
                        <div className="result-item severity-medium" style={{ cursor: 'default' }}>
                            <div className="result-item-title">📡 Analyze Communication</div>
                            <div className="result-item-desc">Scan emails or messages for social engineering indicators</div>
                        </div>
                        <div className="result-item severity-low" style={{ cursor: 'default' }}>
                            <div className="result-item-title">🎓 Start Training Module</div>
                            <div className="result-item-desc">Test your security awareness with interactive quizzes</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
