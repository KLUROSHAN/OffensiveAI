import React, { useState, useEffect } from 'react';

export default function AwarenessTraining({ sessionId, API, onStatsUpdate }) {
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(0);
    const [quizComplete, setQuizComplete] = useState(false);
    const [moduleFilter, setModuleFilter] = useState('all');
    const [weakAreas, setWeakAreas] = useState([]);

    useEffect(() => {
        fetch(`${API}/training/questions`)
            .then(r => r.json())
            .then(data => setQuestions(data))
            .catch(() => { });
    }, []);

    const filteredQuestions = moduleFilter === 'all'
        ? questions
        : questions.filter(q => q.module === moduleFilter);

    const current = filteredQuestions[currentQ];

    const handleAnswer = (optionIdx) => {
        if (showExplanation) return;
        setSelectedAnswer(optionIdx);
        setShowExplanation(true);
        setAnswered(prev => prev + 1);
        if (optionIdx === current.correct) {
            setScore(prev => prev + 1);
        } else {
            setWeakAreas(prev => [...prev, current.module]);
        }
    };

    const nextQuestion = () => {
        if (currentQ + 1 >= filteredQuestions.length) {
            // Quiz complete
            setQuizComplete(true);
            const finalScore = Math.round((score / filteredQuestions.length) * 100);
            fetch(`${API}/training/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    module: moduleFilter,
                    score: finalScore,
                    totalQuestions: filteredQuestions.length,
                    correctAnswers: score,
                    weakAreas: [...new Set(weakAreas)],
                }),
            }).then(() => onStatsUpdate?.()).catch(() => { });
        } else {
            setCurrentQ(prev => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        }
    };

    const restartQuiz = () => {
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setScore(0);
        setAnswered(0);
        setQuizComplete(false);
        setWeakAreas([]);
    };

    const getModuleLabel = (module) => {
        const map = { password_security: '🔐 Password Security', phishing_detection: '🎣 Phishing Detection', social_engineering: '🎭 Social Engineering' };
        return map[module] || module;
    };

    const getDifficultyBadge = (diff) => {
        const map = { Easy: 'badge-low', Medium: 'badge-medium', Hard: 'badge-critical' };
        return map[diff] || 'badge-info';
    };

    if (filteredQuestions.length === 0) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <h2>🎓 Awareness Training</h2>
                    <p>Interactive security awareness quizzes and training modules</p>
                </div>
                <div className="card text-center" style={{ padding: 60 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
                    <p style={{ color: 'var(--text-muted)' }}>Loading training modules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>🎓 Awareness Training</h2>
                <p>Interactive security awareness quizzes and training modules</p>
            </div>

            {/* Module Filter */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        <button className={`btn btn-sm ${moduleFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setModuleFilter('all'); restartQuiz(); }}>All Topics</button>
                        <button className={`btn btn-sm ${moduleFilter === 'password_security' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setModuleFilter('password_security'); restartQuiz(); }}>🔐 Passwords</button>
                        <button className={`btn btn-sm ${moduleFilter === 'phishing_detection' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setModuleFilter('phishing_detection'); restartQuiz(); }}>🎣 Phishing</button>
                        <button className={`btn btn-sm ${moduleFilter === 'social_engineering' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setModuleFilter('social_engineering'); restartQuiz(); }}>🎭 Social Eng.</button>
                    </div>
                    <div className="flex items-center gap-sm">
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Score: <span className="mono text-cyan">{score}/{answered}</span>
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>|</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Question <span className="mono">{currentQ + 1}</span> of <span className="mono">{filteredQuestions.length}</span>
                        </span>
                    </div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{
                        height: '100%',
                        width: `${((currentQ + (showExplanation ? 1 : 0)) / filteredQuestions.length) * 100}%`,
                        background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
                        borderRadius: 2,
                        transition: 'width 0.5s ease',
                    }} />
                </div>
            </div>

            {/* Quiz Complete */}
            {quizComplete ? (
                <div className="card text-center fade-in" style={{ padding: 40 }}>
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>
                        {score / filteredQuestions.length >= 0.8 ? '🏆' : score / filteredQuestions.length >= 0.6 ? '👍' : '📖'}
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
                        Training Complete!
                    </h3>
                    <div className="progress-ring-container" style={{ margin: '20px auto' }}>
                        <div className="progress-ring">
                            <svg viewBox="0 0 80 80">
                                <circle className="bg" cx="40" cy="40" r="34" />
                                <circle
                                    className="fill"
                                    cx="40" cy="40" r="34"
                                    stroke={score / filteredQuestions.length >= 0.8 ? 'var(--neon-green)' : score / filteredQuestions.length >= 0.6 ? 'var(--neon-yellow)' : 'var(--neon-red)'}
                                    strokeDasharray={`${2 * Math.PI * 34}`}
                                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / filteredQuestions.length)}`}
                                />
                            </svg>
                            <div className="progress-ring-label" style={{ color: score / filteredQuestions.length >= 0.8 ? 'var(--neon-green)' : 'var(--neon-yellow)' }}>
                                {Math.round((score / filteredQuestions.length) * 100)}%
                            </div>
                        </div>
                    </div>
                    <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        You got <strong className="text-cyan">{score}</strong> out of <strong>{filteredQuestions.length}</strong> correct
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        {score / filteredQuestions.length >= 0.8
                            ? 'Excellent! You have strong security awareness.'
                            : score / filteredQuestions.length >= 0.6
                                ? 'Good effort, but there\'s room for improvement in some areas.'
                                : 'You should focus more on security awareness training. Review the modules and try again.'}
                    </p>

                    {weakAreas.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Areas needing improvement:</p>
                            <div className="flex gap-sm justify-center" style={{ flexWrap: 'wrap' }}>
                                {[...new Set(weakAreas)].map((area, i) => (
                                    <span key={i} className="badge badge-high">{getModuleLabel(area)}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button className="btn btn-primary" onClick={restartQuiz}>🔄 Restart Training</button>
                </div>
            ) : (
                <>
                    {/* Question Card */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="flex items-center gap-sm mb-md">
                            <span className={`badge ${getDifficultyBadge(current.difficulty)}`}>{current.difficulty}</span>
                            <span className="badge badge-info">{getModuleLabel(current.module)}</span>
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>
                            {current.question}
                        </h3>

                        {current.options.map((option, i) => {
                            let className = 'quiz-option';
                            if (showExplanation) {
                                if (i === current.correct) className += ' correct';
                                else if (i === selectedAnswer) className += ' incorrect';
                            } else if (i === selectedAnswer) {
                                className += ' selected';
                            }

                            return (
                                <div key={i} className={className} onClick={() => handleAnswer(i)}>
                                    <div className="quiz-option-letter" style={{
                                        background: showExplanation && i === current.correct ? 'var(--neon-green)' : showExplanation && i === selectedAnswer && i !== current.correct ? 'var(--neon-red)' : undefined,
                                        color: showExplanation && (i === current.correct || i === selectedAnswer) ? '#000' : undefined,
                                    }}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span>{option}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {showExplanation && (
                        <div className={`card fade-in ${selectedAnswer === current.correct ? 'card-glow-green' : 'card-glow-magenta'}`} style={{ marginBottom: 20 }}>
                            <div className="card-title" style={{ marginBottom: 12 }}>
                                <span className="icon">{selectedAnswer === current.correct ? '✅' : '❌'}</span>
                                {selectedAnswer === current.correct ? 'Correct!' : 'Incorrect'}
                            </div>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
                                {current.explanation}
                            </p>
                            <button className="btn btn-primary mt-md" onClick={nextQuestion}>
                                {currentQ + 1 >= filteredQuestions.length ? '🏁 Finish Quiz' : '➡️ Next Question'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Best Practices */}
            <div className="card mt-lg">
                <div className="card-title" style={{ marginBottom: 16 }}>
                    <span className="icon">📚</span> Security Best Practices
                </div>
                <div className="grid-3">
                    <div className="result-item severity-low">
                        <div className="result-item-title">🔐 Password Hygiene</div>
                        <div className="result-item-desc">Use unique passphrases for every account. Enable MFA everywhere. Never share passwords, even with IT.</div>
                    </div>
                    <div className="result-item severity-medium">
                        <div className="result-item-title">📧 Email Safety</div>
                        <div className="result-item-desc">Verify sender domains carefully. Never click links in unexpected emails. Report suspicious messages to IT security.</div>
                    </div>
                    <div className="result-item severity-high">
                        <div className="result-item-title">📞 Phone Verification</div>
                        <div className="result-item-desc">Never provide credentials or financial info over phone. Always verify callers by calling back on known numbers.</div>
                    </div>
                    <div className="result-item severity-low">
                        <div className="result-item-title">🔒 Physical Security</div>
                        <div className="result-item-desc">Lock your workstation when away. Never let strangers tailgate through secure doors. Shred sensitive documents.</div>
                    </div>
                    <div className="result-item severity-medium">
                        <div className="result-item-title">🌐 Web Browsing</div>
                        <div className="result-item-desc">Verify HTTPS and domain names. Avoid downloading files from untrusted sources. Use company VPN on public networks.</div>
                    </div>
                    <div className="result-item severity-high">
                        <div className="result-item-title">📱 Social Media</div>
                        <div className="result-item-desc">Limit personal information shared online. Attackers use social media for reconnaissance. Be cautious of connection requests.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
