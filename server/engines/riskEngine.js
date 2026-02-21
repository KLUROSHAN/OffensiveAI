// Risk assessment engine — aggregates data and produces risk reports

export class RiskEngine {
    constructor(db) {
        this.db = db;
    }

    // Generate comprehensive risk assessment
    generateRiskAssessment(sessionId) {
        const passwordData = this.db.prepare('SELECT * FROM password_analyses WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
        const socialData = this.db.prepare('SELECT * FROM social_analyses WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
        const phishingData = this.db.prepare('SELECT * FROM phishing_simulations WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
        const trainingData = this.db.prepare('SELECT * FROM training_sessions WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);

        // Password risk
        const passwordRisk = this.assessPasswordRisk(passwordData);
        // Social engineering risk
        const socialRisk = this.assessSocialRisk(socialData);
        // Phishing risk
        const phishingRisk = this.assessPhishingRisk(phishingData);
        // Training effectiveness
        const trainingEff = this.assessTrainingEffectiveness(trainingData);

        // Overall risk score (weighted average)
        const weights = { password: 0.3, social: 0.3, phishing: 0.25, training: 0.15 };
        const overallScore = Math.round(
            (passwordRisk.score * weights.password) +
            (socialRisk.score * weights.social) +
            (phishingRisk.score * weights.phishing) +
            ((100 - trainingEff.score) * weights.training)
        );

        let overallRating;
        if (overallScore >= 75) overallRating = 'Critical';
        else if (overallScore >= 50) overallRating = 'High';
        else if (overallScore >= 25) overallRating = 'Medium';
        else overallRating = 'Low';

        // Generate remediation plan
        const remediationSteps = [];
        if (passwordRisk.score >= 50) {
            remediationSteps.push({
                priority: 'High',
                area: 'Password Security',
                action: 'Implement mandatory password policy: minimum 12 characters, complexity requirements, and quarterly rotation',
                impact: 'Reduces credential-based attack surface by up to 80%',
            });
        }
        if (socialRisk.score >= 50) {
            remediationSteps.push({
                priority: 'High',
                area: 'Social Engineering Defense',
                action: 'Deploy mandatory security awareness training with monthly phishing simulations',
                impact: 'Reduces successful social engineering attacks by up to 70%',
            });
        }
        if (phishingRisk.score >= 50) {
            remediationSteps.push({
                priority: 'Critical',
                area: 'Phishing Prevention',
                action: 'Implement advanced email filtering, DMARC/DKIM/SPF, and enable reporting button for suspicious emails',
                impact: 'Blocks 95%+ of phishing emails before reaching users',
            });
        }
        remediationSteps.push({
            priority: 'Medium',
            area: 'Multi-Factor Authentication',
            action: 'Enable MFA for all accounts, preferring hardware keys or authenticator apps over SMS',
            impact: 'Prevents 99.9% of automated credential attacks',
        });
        remediationSteps.push({
            priority: 'Medium',
            area: 'Continuous Monitoring',
            action: 'Implement regular security assessments and adaptive training based on emerging threats',
            impact: 'Maintains security posture against evolving attack techniques',
        });

        return {
            sessionId,
            timestamp: new Date().toISOString(),
            overallRisk: {
                score: overallScore,
                rating: overallRating,
                description: this.getRiskDescription(overallRating),
            },
            categories: {
                password: passwordRisk,
                socialEngineering: socialRisk,
                phishing: phishingRisk,
                training: trainingEff,
            },
            remediationSteps,
            comparisonToBaseline: {
                industryAverage: 55,
                yourScore: overallScore,
                percentile: overallScore <= 55 ? `Better than ${Math.round((1 - overallScore / 100) * 100)}% of organizations` : `Needs improvement — above industry average risk`,
            },
        };
    }

    assessPasswordRisk(passwordData) {
        if (passwordData.length === 0) return { score: 50, rating: 'Unknown', details: 'No password analyses performed yet' };
        const avgScore = passwordData.reduce((sum, p) => sum + p.score, 0) / passwordData.length;
        const riskScore = Math.round(100 - avgScore); // Inverse — low password score = high risk
        const weakCount = passwordData.filter(p => p.score < 40).length;
        const dictCount = passwordData.filter(p => p.dict_found).length;

        return {
            score: riskScore,
            rating: this.getRating(riskScore),
            details: `${passwordData.length} passwords analyzed. Average strength: ${Math.round(avgScore)}/100. ${weakCount} weak passwords found. ${dictCount} dictionary matches.`,
            metrics: { totalAnalyzed: passwordData.length, avgStrength: Math.round(avgScore), weakPasswords: weakCount, dictionaryMatches: dictCount },
        };
    }

    assessSocialRisk(socialData) {
        if (socialData.length === 0) return { score: 50, rating: 'Unknown', details: 'No social engineering analyses performed yet' };
        const avgSusceptibility = socialData.reduce((sum, s) => sum + s.susceptibility_score, 0) / socialData.length;
        const highRiskCount = socialData.filter(s => s.risk_level === 'Critical' || s.risk_level === 'High').length;

        return {
            score: Math.round(avgSusceptibility),
            rating: this.getRating(Math.round(avgSusceptibility)),
            details: `${socialData.length} communications analyzed. Average susceptibility: ${Math.round(avgSusceptibility)}/100. ${highRiskCount} high-risk communications detected.`,
            metrics: { totalAnalyzed: socialData.length, avgSusceptibility: Math.round(avgSusceptibility), highRiskCommunications: highRiskCount },
        };
    }

    assessPhishingRisk(phishingData) {
        if (phishingData.length === 0) return { score: 50, rating: 'Unknown', details: 'No phishing simulations performed yet' };
        const detectionRate = (phishingData.filter(p => p.user_detected).length / phishingData.length) * 100;
        const riskScore = Math.round(100 - detectionRate);

        return {
            score: riskScore,
            rating: this.getRating(riskScore),
            details: `${phishingData.length} phishing simulations. Detection rate: ${Math.round(detectionRate)}%. Risk from undetected phishing: ${riskScore}%.`,
            metrics: { totalSimulations: phishingData.length, detectionRate: Math.round(detectionRate), missedPhishing: phishingData.filter(p => !p.user_detected).length },
        };
    }

    assessTrainingEffectiveness(trainingData) {
        if (trainingData.length === 0) return { score: 0, rating: 'Not Started', details: 'No training sessions completed yet' };
        const avgScore = trainingData.reduce((sum, t) => sum + t.score, 0) / trainingData.length;

        return {
            score: Math.round(avgScore),
            rating: avgScore >= 80 ? 'Excellent' : avgScore >= 60 ? 'Good' : avgScore >= 40 ? 'Needs Improvement' : 'Poor',
            details: `${trainingData.length} training sessions. Average score: ${Math.round(avgScore)}%.`,
            metrics: { totalSessions: trainingData.length, averageScore: Math.round(avgScore) },
        };
    }

    getRating(score) {
        if (score >= 75) return 'Critical';
        if (score >= 50) return 'High';
        if (score >= 25) return 'Medium';
        return 'Low';
    }

    getRiskDescription(rating) {
        const descriptions = {
            'Critical': 'Organization faces severe security risks. Immediate action required across multiple areas. High likelihood of successful attack.',
            'High': 'Significant vulnerabilities detected. Priority remediation steps should be implemented within 30 days.',
            'Medium': 'Moderate risk level. Some areas need improvement but basic security measures are in place.',
            'Low': 'Good security posture. Continue regular assessments and maintain current security practices.',
        };
        return descriptions[rating] || 'Risk assessment in progress.';
    }
}
