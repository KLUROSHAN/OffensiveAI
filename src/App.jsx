import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import PasswordAnalysis from './components/PasswordAnalysis';
import SocialEngineering from './components/SocialEngineering';
import AwarenessTraining from './components/AwarenessTraining';
import RiskReports from './components/RiskReports';
import CampaignManager from './components/CampaignManager';
import OsintRecon from './components/OsintRecon';
import GeminiAdvisor from './components/GeminiAdvisor';

const API = '/api';

const navItems = [
    { id: 'dashboard', icon: '⚡', label: 'Dashboard', section: 'overview' },
    { id: 'password', icon: '🔐', label: 'Password Analysis', section: 'attacks' },
    { id: 'social', icon: '🎭', label: 'Social Engineering', section: 'attacks' },
    { id: 'campaigns', icon: '📬', label: 'Campaigns', section: 'attacks' },
    { id: 'osint', icon: '🔎', label: 'OSINT Recon', section: 'attacks' },
    { id: 'gemini', icon: '🤖', label: 'Gemini AI', section: 'ai' },
    { id: 'training', icon: '🎓', label: 'Awareness Training', section: 'defense' },
    { id: 'reports', icon: '📊', label: 'Risk Reports', section: 'defense' },
];

export default function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const [sessionId, setSessionId] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetch(`${API}/session`, { method: 'POST' })
            .then(r => r.json())
            .then(data => setSessionId(data.sessionId))
            .catch(() => setSessionId('local-' + Date.now()));
        fetchStats();
    }, []);

    const fetchStats = () => {
        fetch(`${API}/adaptive/stats`)
            .then(r => r.json())
            .then(setStats)
            .catch(() => { });
    };

    const renderView = () => {
        const props = { sessionId, API, onStatsUpdate: fetchStats };
        switch (activeView) {
            case 'dashboard': return <Dashboard {...props} stats={stats} />;
            case 'password': return <PasswordAnalysis {...props} />;
            case 'social': return <SocialEngineering {...props} />;
            case 'campaigns': return <CampaignManager {...props} />;
            case 'osint': return <OsintRecon {...props} />;
            case 'gemini': return <GeminiAdvisor {...props} />;
            case 'training': return <AwarenessTraining {...props} />;
            case 'reports': return <RiskReports {...props} />;
            default: return <Dashboard {...props} stats={stats} />;
        }
    };

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h1>OffensiveAI</h1>
                    <div className="subtitle">Security Simulator</div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    {navItems.filter(n => n.section === 'overview').map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => setActiveView(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}

                    <div className="nav-section-label">Attack Simulation</div>
                    {navItems.filter(n => n.section === 'attacks').map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => setActiveView(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}

                    <div className="nav-section-label">AI Engine</div>
                    {navItems.filter(n => n.section === 'ai').map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => setActiveView(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}

                    <div className="nav-section-label">Defense & Training</div>
                    {navItems.filter(n => n.section === 'defense').map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                            onClick={() => setActiveView(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="session-badge">
                        <span className="session-dot"></span>
                        Session Active
                    </div>
                    {sessionId && (
                        <div className="session-badge" style={{ marginTop: 4, fontSize: '0.6rem' }}>
                            {sessionId.slice(0, 12)}...
                        </div>
                    )}
                </div>
            </aside>
            <main className="main-content">
                {renderView()}
            </main>
        </div>
    );
}
