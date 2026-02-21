import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(10, 14, 23, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#e8eaf0',
            borderColor: 'rgba(0, 240, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
        },
    },
    scales: {
        x: { ticks: { color: '#5a6378', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#5a6378', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, max: 100 },
    },
};

const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(10, 14, 23, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#e8eaf0',
            borderColor: 'rgba(0, 240, 255, 0.2)',
            borderWidth: 1,
        },
    },
    scales: {
        r: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#5a6378', backdropColor: 'transparent', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: '#8a94a6', font: { size: 11, weight: 500 } },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
        },
    },
};

export default function RiskReports({ sessionId, API }) {
    const [report, setReport] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const [reportRes, profileRes] = await Promise.all([
                fetch(`${API}/risk/assessment/${sessionId}`),
                fetch(`${API}/adaptive/profile/${sessionId}`),
            ]);
            setReport(await reportRes.json());
            setProfile(await profileRes.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchReport(); }, [sessionId]);

    const getOverallColor = score => {
        if (score >= 75) return 'var(--neon-red)';
        if (score >= 50) return 'var(--neon-orange)';
        if (score >= 25) return 'var(--neon-yellow)';
        return 'var(--neon-green)';
    };

    const getRatingBadge = rating => {
        const map = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low', Unknown: 'badge-info', 'Not Started': 'badge-info', Excellent: 'badge-low', Good: 'badge-low', 'Needs Improvement': 'badge-medium', Poor: 'badge-critical' };
        return map[rating] || 'badge-info';
    };

    if (!report) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h2>📊 Risk Assessment Reports</h2>
                    <p>Comprehensive risk analysis and remediation planning</p>
                </div>
                <div className="card text-center" style={{ padding: 60 }}>
                    {loading ? (
                        <>
                            <span className="loading-spinner" style={{ width: 40, height: 40 }}></span>
                            <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Generating risk assessment...</p>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                                Run password analyses and social engineering simulations to generate your risk report.
                            </p>
                            <button className="btn btn-primary" onClick={fetchReport}>🔄 Generate Report</button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const radarData = {
        labels: ['Password Risk', 'Social Eng. Risk', 'Phishing Risk', 'Training Score'],
        datasets: [{
            data: [
                report.categories?.password?.score || 0,
                report.categories?.socialEngineering?.score || 0,
                report.categories?.phishing?.score || 0,
                report.categories?.training?.score || 0,
            ],
            backgroundColor: 'rgba(0, 240, 255, 0.15)',
            borderColor: 'rgba(0, 240, 255, 0.6)',
            borderWidth: 2,
            pointBackgroundColor: 'var(--neon-cyan)',
            pointBorderColor: 'var(--neon-cyan)',
            pointRadius: 4,
        }],
    };

    const barData = {
        labels: ['Password', 'Social Eng.', 'Phishing', 'Training'],
        datasets: [{
            data: [
                report.categories?.password?.score || 0,
                report.categories?.socialEngineering?.score || 0,
                report.categories?.phishing?.score || 0,
                report.categories?.training?.score || 0,
            ],
            backgroundColor: [
                'rgba(0, 240, 255, 0.6)',
                'rgba(255, 0, 229, 0.6)',
                'rgba(255, 107, 53, 0.6)',
                'rgba(57, 255, 20, 0.6)',
            ],
            borderColor: [
                'rgba(0, 240, 255, 0.8)',
                'rgba(255, 0, 229, 0.8)',
                'rgba(255, 107, 53, 0.8)',
                'rgba(57, 255, 20, 0.8)',
            ],
            borderWidth: 1,
            borderRadius: 6,
        }],
    };

    const doughnutData = {
        labels: ['Risk Score', 'Remaining'],
        datasets: [{
            data: [report.overallRisk?.score || 0, 100 - (report.overallRisk?.score || 0)],
            backgroundColor: [getOverallColor(report.overallRisk?.score || 0), 'rgba(255,255,255,0.04)'],
            borderWidth: 0,
            cutout: '75%',
        }],
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>📊 Risk Assessment Reports</h2>
                <p>Comprehensive risk analysis and remediation planning</p>
            </div>

            {/* Overall Risk */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-title" style={{ marginBottom: 16 }}>
                        <span className="icon">🎯</span> Overall Risk
                    </div>
                    <div className="chart-container" style={{ height: 180 }}>
                        <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}>
                            <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: getOverallColor(report.overallRisk?.score) }}>
                                {report.overallRisk?.score}
                            </div>
                            <div className={`badge ${getRatingBadge(report.overallRisk?.rating)}`}>
                                {report.overallRisk?.rating}
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
                        {report.overallRisk?.description}
                    </p>
                </div>

                <div className="card">
                    <div className="card-title" style={{ marginBottom: 16 }}>
                        <span className="icon">📡</span> Risk Radar
                    </div>
                    <div className="chart-container" style={{ height: 220 }}>
                        <Radar data={radarData} options={radarOptions} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-title" style={{ marginBottom: 16 }}>
                        <span className="icon">📊</span> Risk by Category
                    </div>
                    <div className="chart-container" style={{ height: 220 }}>
                        <Bar data={barData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Category Details */}
            <div className="grid-2" style={{ marginBottom: 24 }}>
                {report.categories && Object.entries(report.categories).map(([key, cat]) => (
                    <div className="card" key={key}>
                        <div className="flex items-center justify-between mb-md">
                            <div className="card-title">
                                <span className="icon">{key === 'password' ? '🔐' : key === 'socialEngineering' ? '🎭' : key === 'phishing' ? '🎣' : '🎓'}</span>
                                {key === 'password' ? 'Password' : key === 'socialEngineering' ? 'Social Engineering' : key === 'phishing' ? 'Phishing' : 'Training'}
                            </div>
                            <span className={`badge ${getRatingBadge(cat.rating)}`}>{cat.rating}</span>
                        </div>
                        <div className="flex items-center gap-md mb-md">
                            <div className="mono" style={{ fontSize: '2rem', fontWeight: 700, color: getOverallColor(cat.score) }}>{cat.score}</div>
                            <div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{key === 'training' ? 'Effectiveness Score' : 'Risk Score'}</div>
                                <div style={{ height: 4, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 6 }}>
                                    <div style={{ height: '100%', width: `${cat.score}%`, background: getOverallColor(cat.score), borderRadius: 2, transition: 'width 0.5s' }}></div>
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cat.details}</p>
                    </div>
                ))}
            </div>

            {/* Remediation Plan */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title" style={{ marginBottom: 16 }}>
                    <span className="icon">🛠️</span> Remediation Plan
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Priority</th>
                                <th>Area</th>
                                <th>Action</th>
                                <th>Expected Impact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.remediationSteps?.map((step, i) => (
                                <tr key={i}>
                                    <td><span className={`badge ${step.priority === 'Critical' ? 'badge-critical' : step.priority === 'High' ? 'badge-high' : 'badge-medium'}`}>{step.priority}</span></td>
                                    <td style={{ fontWeight: 600 }}>{step.area}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{step.action}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--neon-green)' }}>{step.impact}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adaptive Profile */}
            {profile && (
                <div className="grid-2" style={{ marginBottom: 24 }}>
                    <div className="card">
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">🧠</span> Adaptive Learning Profile
                        </div>
                        {profile.adaptiveRecommendations?.length > 0 ? (
                            profile.adaptiveRecommendations.map((rec, i) => (
                                <div key={i} className={`result-item severity-${rec.priority === 'Critical' ? 'critical' : rec.priority?.toLowerCase()}`}>
                                    <div className="result-item-title">
                                        <span className={`badge ${rec.priority === 'Critical' ? 'badge-critical' : rec.priority === 'High' ? 'badge-high' : 'badge-medium'}`} style={{ marginRight: 8 }}>{rec.priority}</span>
                                        {rec.area}
                                    </div>
                                    <div className="result-item-desc">{rec.recommendation}</div>
                                </div>
                            ))
                        ) : (
                            <div className="alert alert-info">
                                <span>💡</span> Continue using the platform to build your behavioral profile and receive personalized recommendations.
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-title" style={{ marginBottom: 16 }}>
                            <span className="icon">⚔️</span> Suggested Attack Strategies
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                            Based on behavioral analysis, these strategies would be most effective:
                        </p>
                        {profile.suggestedStrategies?.length > 0 ? (
                            profile.suggestedStrategies.map((strat, i) => (
                                <div key={i} className="result-item severity-critical">
                                    <div className="result-item-title">
                                        <span className="badge badge-critical" style={{ marginRight: 8 }}>{strat.type}</span>
                                    </div>
                                    <div className="result-item-desc">{strat.strategy}</div>
                                </div>
                            ))
                        ) : (
                            <div className="alert alert-info">
                                <span>🎯</span> More data needed. Run additional simulations to generate targeted attack strategies.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Industry Comparison */}
            {report.comparisonToBaseline && (
                <div className="card">
                    <div className="card-title" style={{ marginBottom: 16 }}>
                        <span className="icon">📈</span> Industry Comparison
                    </div>
                    <div className="flex items-center gap-lg" style={{ flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Your Risk Score</div>
                            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: getOverallColor(report.comparisonToBaseline.yourScore) }}>
                                {report.comparisonToBaseline.yourScore}
                            </div>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>vs</div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Industry Average</div>
                            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--neon-yellow)' }}>
                                {report.comparisonToBaseline.industryAverage}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{report.comparisonToBaseline.percentile}</p>
                        </div>
                        <button className="btn btn-primary" onClick={fetchReport}>🔄 Refresh Report</button>
                    </div>
                </div>
            )}
        </div>
    );
}
