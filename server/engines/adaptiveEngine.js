// Adaptive learning engine — tracks behavior, refines strategies, builds profiles

export class AdaptiveEngine {
    constructor(db) {
        this.db = db;
        this.initTables();
    }

    initTables() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS password_analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        password_masked TEXT,
        score INTEGER,
        rating TEXT,
        entropy REAL,
        dict_found INTEGER,
        patterns_found TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS social_analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        text_length INTEGER,
        indicators_count INTEGER,
        risk_level TEXT,
        susceptibility_score INTEGER,
        indicator_types TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS phishing_simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        template_id TEXT,
        category TEXT,
        difficulty TEXT,
        user_detected INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS training_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        module TEXT,
        score INTEGER,
        total_questions INTEGER,
        correct_answers INTEGER,
        weak_areas TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS behavior_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        profile_data TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    }

    // Record a password analysis
    recordPasswordAnalysis(sessionId, analysis) {
        const stmt = this.db.prepare(`
      INSERT INTO password_analyses (session_id, password_masked, score, rating, entropy, dict_found, patterns_found)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            sessionId,
            analysis.password,
            analysis.score,
            analysis.rating,
            analysis.entropy,
            analysis.dictionary?.found ? 1 : 0,
            JSON.stringify(analysis.patterns?.map(p => p.type) || [])
        );
    }

    // Record a social engineering analysis
    recordSocialAnalysis(sessionId, analysis) {
        const stmt = this.db.prepare(`
      INSERT INTO social_analyses (session_id, text_length, indicators_count, risk_level, susceptibility_score, indicator_types)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(
            sessionId,
            analysis.textLength || 0,
            analysis.totalIndicators,
            analysis.riskLevel,
            analysis.susceptibilityScore,
            JSON.stringify(analysis.indicators?.map(i => i.type) || [])
        );
    }

    // Record a phishing simulation
    recordPhishingSim(sessionId, templateId, category, difficulty, detected) {
        const stmt = this.db.prepare(`
      INSERT INTO phishing_simulations (session_id, template_id, category, difficulty, user_detected)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(sessionId, templateId, category, difficulty, detected ? 1 : 0);
    }

    // Record training session
    recordTraining(sessionId, module, score, totalQuestions, correctAnswers, weakAreas) {
        const stmt = this.db.prepare(`
      INSERT INTO training_sessions (session_id, module, score, total_questions, correct_answers, weak_areas)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(sessionId, module, score, totalQuestions, correctAnswers, JSON.stringify(weakAreas));
    }

    // Get behavioral profile for a session
    getBehaviorProfile(sessionId) {
        const passwordData = this.db.prepare('SELECT * FROM password_analyses WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
        const socialData = this.db.prepare('SELECT * FROM social_analyses WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
        const phishingData = this.db.prepare('SELECT * FROM phishing_simulations WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
        const trainingData = this.db.prepare('SELECT * FROM training_sessions WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);

        // Analyze password habits
        const avgPasswordScore = passwordData.length > 0
            ? Math.round(passwordData.reduce((sum, p) => sum + p.score, 0) / passwordData.length)
            : null;
        const dictMatchRate = passwordData.length > 0
            ? Math.round((passwordData.filter(p => p.dict_found).length / passwordData.length) * 100)
            : null;
        const commonPatterns = {};
        for (const p of passwordData) {
            const patterns = JSON.parse(p.patterns_found || '[]');
            for (const pat of patterns) {
                commonPatterns[pat] = (commonPatterns[pat] || 0) + 1;
            }
        }

        // Analyze social engineering vulnerability
        const avgSusceptibility = socialData.length > 0
            ? Math.round(socialData.reduce((sum, s) => sum + s.susceptibility_score, 0) / socialData.length)
            : null;
        const commonIndicators = {};
        for (const s of socialData) {
            const types = JSON.parse(s.indicator_types || '[]');
            for (const t of types) {
                commonIndicators[t] = (commonIndicators[t] || 0) + 1;
            }
        }

        // Phishing detection rate
        const phishingDetectionRate = phishingData.length > 0
            ? Math.round((phishingData.filter(p => p.user_detected).length / phishingData.length) * 100)
            : null;

        // Training progress
        const avgTrainingScore = trainingData.length > 0
            ? Math.round(trainingData.reduce((sum, t) => sum + t.score, 0) / trainingData.length)
            : null;

        // Generate adaptive recommendations
        const adaptiveRecommendations = [];
        if (avgPasswordScore !== null && avgPasswordScore < 50) {
            adaptiveRecommendations.push({ area: 'Password Strength', priority: 'High', recommendation: 'Focus on creating longer, more complex passwords. Your average score suggests a pattern of weak passwords.' });
        }
        if (dictMatchRate !== null && dictMatchRate > 30) {
            adaptiveRecommendations.push({ area: 'Dictionary Resistance', priority: 'Critical', recommendation: `${dictMatchRate}% of your passwords appear in common dictionaries. Use random passphrases instead.` });
        }
        if (avgSusceptibility !== null && avgSusceptibility > 40) {
            adaptiveRecommendations.push({ area: 'Phishing Awareness', priority: 'High', recommendation: 'Review social engineering indicators training. Focus on identifying urgency and authority tactics.' });
        }
        if (phishingDetectionRate !== null && phishingDetectionRate < 60) {
            adaptiveRecommendations.push({ area: 'Phishing Detection', priority: 'High', recommendation: `Your phishing detection rate is ${phishingDetectionRate}%. Practice identifying red flags in simulated emails.` });
        }

        // Suggest next attack strategies
        const suggestedStrategies = [];
        if (Object.keys(commonPatterns).length > 0) {
            const topPattern = Object.entries(commonPatterns).sort((a, b) => b[1] - a[1])[0];
            suggestedStrategies.push({ type: 'Password Attack', strategy: `Target ${topPattern[0]} patterns — user shows repeated usage of this pattern type` });
        }
        if (Object.keys(commonIndicators).length > 0) {
            const weakestArea = Object.entries(commonIndicators).sort((a, b) => b[1] - a[1])[0];
            suggestedStrategies.push({ type: 'Social Engineering', strategy: `${weakestArea[0]}-based attacks most effective — user frequently exposed to this indicator type` });
        }

        return {
            sessionId,
            passwordHabits: {
                totalAnalyzed: passwordData.length,
                averageScore: avgPasswordScore,
                dictionaryMatchRate: dictMatchRate,
                commonPatterns: Object.entries(commonPatterns).map(([k, v]) => ({ pattern: k, count: v })).sort((a, b) => b.count - a.count),
            },
            socialEngineeringVulnerability: {
                totalAnalyzed: socialData.length,
                averageSusceptibility: avgSusceptibility,
                commonIndicators: Object.entries(commonIndicators).map(([k, v]) => ({ indicator: k, count: v })).sort((a, b) => b.count - a.count),
            },
            phishingPerformance: {
                totalSimulations: phishingData.length,
                detectionRate: phishingDetectionRate,
            },
            trainingProgress: {
                totalSessions: trainingData.length,
                averageScore: avgTrainingScore,
            },
            adaptiveRecommendations,
            suggestedStrategies,
        };
    }

    // Get dashboard stats
    getDashboardStats() {
        const totalPasswordAnalyses = this.db.prepare('SELECT COUNT(*) as count FROM password_analyses').get().count;
        const totalSocialAnalyses = this.db.prepare('SELECT COUNT(*) as count FROM social_analyses').get().count;
        const totalPhishingSims = this.db.prepare('SELECT COUNT(*) as count FROM phishing_simulations').get().count;
        const totalTrainingSessions = this.db.prepare('SELECT COUNT(*) as count FROM training_sessions').get().count;

        const avgPasswordScore = this.db.prepare('SELECT AVG(score) as avg FROM password_analyses').get().avg;
        const avgSusceptibility = this.db.prepare('SELECT AVG(susceptibility_score) as avg FROM social_analyses').get().avg;
        const phishingDetectionRate = totalPhishingSims > 0
            ? this.db.prepare('SELECT AVG(user_detected) * 100 as rate FROM phishing_simulations').get().rate
            : null;

        const recentActivity = this.db.prepare(`
      SELECT 'password' as type, password_masked as detail, score as value, rating as label, timestamp
      FROM password_analyses
      UNION ALL
      SELECT 'social' as type, risk_level as detail, susceptibility_score as value, risk_level as label, timestamp
      FROM social_analyses
      UNION ALL
      SELECT 'phishing' as type, template_id as detail, user_detected as value, category as label, timestamp
      FROM phishing_simulations
      ORDER BY timestamp DESC LIMIT 10
    `).all();

        return {
            totals: {
                passwordAnalyses: totalPasswordAnalyses,
                socialAnalyses: totalSocialAnalyses,
                phishingSimulations: totalPhishingSims,
                trainingSessions: totalTrainingSessions,
                totalOperations: totalPasswordAnalyses + totalSocialAnalyses + totalPhishingSims + totalTrainingSessions,
            },
            averages: {
                passwordScore: avgPasswordScore ? Math.round(avgPasswordScore) : null,
                susceptibilityScore: avgSusceptibility ? Math.round(avgSusceptibility) : null,
                phishingDetectionRate: phishingDetectionRate ? Math.round(phishingDetectionRate) : null,
            },
            recentActivity,
        };
    }
}
