import { phishingTemplates, vishingScripts, templateVariables } from '../data/phishingTemplates.js';

// Replace template variables in text
function fillTemplate(text, customVars = {}) {
    const vars = { ...templateVariables, ...customVars };
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

// Generate a phishing email from a template
export function generatePhishingEmail(templateId, customVars = {}) {
    const template = phishingTemplates.find(t => t.id === templateId);
    if (!template) return { error: 'Template not found', available: phishingTemplates.map(t => ({ id: t.id, name: t.name, category: t.category })) };

    return {
        id: template.id,
        category: template.category,
        name: template.name,
        difficulty: template.difficulty,
        indicators: template.indicators,
        email: {
            subject: fillTemplate(template.subject, customVars),
            from: fillTemplate(template.from, customVars),
            body: fillTemplate(template.body, customVars),
        },
        redFlags: template.redFlags,
        educationalNote: `This is a simulated ${template.category.toLowerCase()} attack. In a real scenario, this email would be designed to ${getAttackObjective(template.category)}.`,
    };
}

function getAttackObjective(category) {
    const objectives = {
        'Business Email Compromise': 'trick employees into transferring funds to attacker-controlled accounts',
        'IT Support Impersonation': 'harvest login credentials through fake password reset pages',
        'Prize/Reward Scam': 'collect personal and financial information under false pretenses',
        'Vendor Impersonation': 'redirect legitimate payments to fraudulent bank accounts',
        'MFA Bypass Attack': 'capture both passwords and MFA tokens to completely compromise accounts',
        'Credential Harvesting': 'steal login credentials through fake document sharing pages',
        'Voice Phishing (Vishing)': 'extract sensitive information through social pressure over a phone call',
        'Supply Chain Attack': 'install malware through fake software update packages',
    };
    return objectives[category] || 'deceive the target into revealing sensitive information';
}

// Get all available phishing templates
export function getPhishingTemplates() {
    return phishingTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        difficulty: t.difficulty,
        indicators: t.indicators,
    }));
}

// ═══════════════════════════════════════════════════════════
// TARGETED PHISHING — Generate custom attack based on target info
// ═══════════════════════════════════════════════════════════
export function generateTargetedPhishing(targetInfo) {
    const { name, email, company, role, interests, socialMedia } = targetInfo;
    const attacks = [];

    // Attack 1: Role-based spear phishing
    if (role) {
        const roleAttacks = {
            finance: {
                subject: `Urgent: ${company || 'Company'} Q1 Budget Revision — Action Required`,
                from: `CFO Office <cfo@${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com>`,
                body: `Hi ${name || 'there'},\n\nI need you to review the attached Q1 budget revision before our board meeting tomorrow. There are some discrepancies in the accounts payable section that need immediate attention.\n\nPlease download and review: https://${company?.toLowerCase().replace(/\s+/g, '') || 'company'}-sharepoint.com/budget-q1-revision.xlsx\n\nAlso, I need you to process the attached wire transfer for the consulting firm we just retained. Details are in the spreadsheet. Use the new account details — our bank recently migrated.\n\nThis is confidential. Please don't share with anyone outside the finance team.\n\nRegards,\nCFO Office`,
                tactics: ['Authority (CFO)', 'Urgency (board meeting tomorrow)', 'Secrecy', 'Role-specific language'],
            },
            it: {
                subject: `[CRITICAL] Security Incident Response — Your Credentials May Be Compromised`,
                from: `CISO <security-ops@${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com>`,
                body: `${name || 'Team Member'},\n\nWe have detected a potential credential breach affecting IT staff accounts. Your account ${email || ''} was flagged in our monitoring system.\n\nImmediate action required:\n1. Navigate to our secure remediation portal: https://security-${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com/remediate\n2. Verify your identity with current credentials\n3. Rotate all service account passwords you manage\n4. Submit your SSH keys for re-validation\n\nDo NOT use your compromised credentials on any other systems until this process is complete.\n\nIncident Ref: INC-2026-4891\nClassification: CONFIDENTIAL\n\nSecurity Operations Center`,
                tactics: ['Authority (CISO)', 'Fear (credential breach)', 'Technical jargon targeting IT', 'Incident reference number for legitimacy'],
            },
            hr: {
                subject: `Employee Complaint Filed Against Your Department — Immediate Review Required`,
                from: `Legal Compliance <legal@${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com>`,
                body: `Dear ${name || 'HR Manager'},\n\nA formal employee complaint has been filed that requires your immediate attention. Due to the sensitive nature of this matter, details are available only through our secure compliance portal.\n\nPlease review the complaint:\nhttps://compliance-${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com/case/EC-2026-0293\n\nYou will need to:\n- Log in with your corporate credentials\n- Review the complaint details\n- Submit your initial response within 24 hours\n\nFailure to respond within the deadline may result in escalation to the board.\n\nLegal Compliance Team\n${company || 'Company'}`,
                tactics: ['Authority (Legal)', 'Fear (complaint against department)', 'Urgency (24-hour deadline)', 'Threat of escalation'],
            },
            executive: {
                subject: `Confidential: Board Resolution on Strategic Acquisition`,
                from: `Board Secretary <board@${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com>`,
                body: `${name || 'Executive'},\n\nThe Board of Directors has passed a resolution regarding the proposed acquisition of TechVenture Inc. As a member of the executive team, you are required to review and digitally sign the confidential resolution document.\n\nAccess the secure document:\nhttps://board-${company?.toLowerCase().replace(/\s+/g, '') || 'company'}.com/resolution/BR-2026-017\n\nPlease sign before Friday's shareholder meeting. This information is strictly confidential and subject to insider trading regulations.\n\nBoard Secretary`,
                tactics: ['Authority (Board of Directors)', 'Insider knowledge bait', 'Legal compliance pressure', 'Confidentiality enforcement'],
            },
        };

        const roleKey = role.toLowerCase().includes('finance') || role.toLowerCase().includes('account') ? 'finance'
            : role.toLowerCase().includes('it') || role.toLowerCase().includes('tech') || role.toLowerCase().includes('engineer') ? 'it'
                : role.toLowerCase().includes('hr') || role.toLowerCase().includes('human') ? 'hr'
                    : 'executive';

        const attack = roleAttacks[roleKey];
        attacks.push({
            type: 'Spear Phishing (Role-Based)',
            difficulty: 'Hard',
            ...attack,
            redFlags: [
                'External domain mimicking company domain',
                'Requests credential entry on external site',
                'Creates urgency with tight deadline',
                'Requests confidentiality (prevents verification)',
            ],
        });
    }

    // Attack 2: Interest-based social engineering
    if (interests) {
        const interestStr = Array.isArray(interests) ? interests.join(', ') : interests;
        attacks.push({
            type: 'Social Engineering (Interest-Based)',
            difficulty: 'Expert',
            subject: `Exclusive Invitation: ${interestStr.split(',')[0]?.trim()} Industry Conference 2026`,
            from: `Conference Registration <registration@industry-summit-2026.com>`,
            body: `Dear ${name || 'Professional'},\n\nBased on your expertise in ${interestStr}, you have been nominated by a colleague to receive a complimentary VIP pass to the 2026 ${interestStr.split(',')[0]?.trim()} Global Summit.\n\n🎫 Registration includes:\n- 3-day VIP access ($2,500 value)\n- Private networking dinner with industry leaders\n- Exclusive keynote sessions\n\nRegister now: https://industry-summit-2026.com/vip/${email || 'register'}\n\nSpaces are limited. Registration closes in 48 hours.\n\nYou'll need to verify your professional identity to complete registration.\n\nBest regards,\nConference Committee`,
            tactics: ['Reciprocity (free VIP pass)', 'Social proof (nominated by colleague)', 'Interest targeting', 'Urgency (48 hours)'],
            redFlags: [
                'Unsolicited VIP invitation',
                'Third-party domain not associated with known conferences',
                'Requests identity verification on external site',
                'Too-good-to-be-true offer ($2,500 value free)',
            ],
        });
    }

    // Attack 3: Social media OSINT-based attack
    if (socialMedia) {
        attacks.push({
            type: 'OSINT-Based Attack (Social Media)',
            difficulty: 'Expert',
            subject: `Your recent post caught our attention — Partnership opportunity`,
            from: `${name ? name.split(' ')[0] : 'Alex'}'s Network <connect@professional-network-hub.com>`,
            body: `Hi ${name || 'there'},\n\nI noticed your recent activity on ${socialMedia} and I'm impressed by your work${company ? ` at ${company}` : ''}. I'm reaching out because we have a partnership opportunity that aligns perfectly with your background.\n\nI've put together a brief proposal customized for ${role ? `someone in a ${role} role` : 'your expertise'}:\n\nhttps://professional-network-hub.com/proposals/${(name || 'user').toLowerCase().replace(/\s+/g, '-')}\n\nWould love to schedule a quick call this week. Also, I noticed your password might have been compromised in a recent data breach — you can check here: https://breach-check-verified.com/lookup\n\nLooking forward to connecting!\n\nBest,\nMarketing Director`,
            tactics: ['Personalization from OSINT', 'Professional flattery', 'Embedded credential check scam', 'Multiple attack vectors in one email'],
            redFlags: [
                'Sender references social media activity (likely scraped)',
                'Links to unknown domains',
                'Embeds a "breach check" link (credential harvesting)',
                'Too familiar tone for first contact',
                'Multiple action requests',
            ],
            osintSources: [
                'Social media profile for name, role, company',
                'Recent posts for interests and current projects',
                'Professional network for connections and endorsements',
                'Company website for organizational structure',
            ],
        });
    }

    // Always add a pretexting phone call script
    attacks.push({
        type: 'Pretexting Call Script',
        difficulty: 'Hard',
        subject: 'Phone-based social engineering scenario',
        from: 'Attacker (voice call)',
        body: `[CALL SCRIPT]\n\nTarget: ${name || 'Unknown'}\nRole: ${role || 'Unknown'}\nCompany: ${company || 'Unknown'}\n\n---\n\nAttacker: "Hi ${name || 'there'}, this is Mark from ${company || 'your company'}'s vendor management team. We're conducting our annual security compliance audit and I need to verify some information about your department's access levels."\n\n[Target responds]\n\nAttacker: "Great, thanks. I've already spoken with ${role ? 'your manager' : 'several people in your department'} and they directed me to you. I just need to confirm a few things:\n\n1. Can you confirm your employee ID or badge number?\n2. What systems do you have admin access to?\n3. When was the last time you updated your primary password?\n4. Do you use any shared service accounts?\n\nThis is all part of our SOC 2 compliance audit. I'll send you a confirmation email after we're done."`,
        tactics: ['Authority (audit/compliance)', 'Social proof (spoke with manager)', 'Gradual escalation of requests', 'Promise of follow-up (builds trust)'],
        redFlags: [
            'Unsolicited call requesting access information',
            'Claims to have spoken with others (unverifiable)',
            'Requests credential and access details over phone',
            'Compliance audit should go through official channels',
        ],
    });

    return {
        targetProfile: { name, email, company, role, interests, socialMedia },
        attackVectors: attacks,
        totalAttacks: attacks.length,
        riskAssessment: `Based on the provided information, ${attacks.length} targeted attack vectors were generated. ${socialMedia ? 'Social media presence significantly increases attack surface.' : 'Limited public information reduces attack surface.'} ${role ? `The "${role}" role provides specific vectors for authority-based attacks.` : ''}`,
        mitigations: [
            'Implement security awareness training specific to role-based threats',
            'Reduce publicly available information on social media profiles',
            'Establish verification procedures for unsolicited requests',
            'Deploy email filters that detect domain spoofing patterns',
            'Enable multi-factor authentication on all accounts',
            'Create a reporting mechanism for suspicious communications',
        ],
    };
}

// Generate vishing scenario
export function generateVishingScenario(scriptId, customVars = {}) {
    const script = vishingScripts.find(s => s.id === scriptId);
    if (!script) return { error: 'Script not found', available: vishingScripts.map(s => ({ id: s.id, name: s.name, category: s.category })) };

    return {
        id: script.id,
        name: script.name,
        category: script.category,
        scenario: fillTemplate(script.scenario, customVars),
        script: script.script.map(line => ({
            ...line,
            line: fillTemplate(line.line, customVars),
        })),
        tactics: script.tactics,
        defenseAdvice: script.defenseAdvice,
    };
}

// Get all vishing scripts
export function getVishingScripts() {
    return vishingScripts.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        scenario: s.scenario,
    }));
}

// ═══════════════════════════════════════════════════════════
// INTERACTIVE PHISHING DETECTION SIMULATION
// ═══════════════════════════════════════════════════════════
export function runInteractivePhishingSim() {
    // Pick random templates for the quiz
    const shuffled = [...phishingTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const challenges = selected.map(template => ({
        id: template.id,
        category: template.category,
        difficulty: template.difficulty,
        email: {
            subject: fillTemplate(template.subject),
            from: fillTemplate(template.from),
            body: fillTemplate(template.body),
        },
        redFlags: template.redFlags,
        indicators: template.indicators,
        isPhishing: true, // all templates are phishing
    }));

    // Add some "legitimate" emails for contrast
    const legitimateEmails = [
        {
            id: 'legit_meeting',
            category: 'Legitimate',
            difficulty: 'Easy',
            email: {
                subject: 'Team Meeting — Wednesday 2PM',
                from: 'Sarah Mitchell <smitchell@nexustech.com>',
                body: `Hi team,\n\nJust a reminder about our weekly sync tomorrow at 2 PM in Conference Room B.\n\nAgenda:\n- Sprint review\n- Q1 planning updates\n- Open discussion\n\nDial-in: https://nexustech.zoom.us/j/84729103 (same link as always)\n\nSee you there!\nSarah`,
            },
            redFlags: [],
            indicators: [],
            isPhishing: false,
        },
        {
            id: 'legit_policy',
            category: 'Legitimate',
            difficulty: 'Medium',
            email: {
                subject: 'Updated PTO Policy — Effective March 1',
                from: 'HR Department <hr@nexustech.com>',
                body: `Dear Team,\n\nPlease be advised that the updated PTO policy will take effect on March 1, 2026. Key changes include:\n\n• Increased PTO accrual rate for employees with 5+ years of tenure\n• New rollover policy—up to 5 days can be carried forward\n• Updated request process through the HR portal\n\nFull policy document is available on the HR intranet: https://intranet.nexustech.com/hr/policies/pto-2026\n\nIf you have questions, please reach out to your HR Business Partner or email hr@nexustech.com.\n\nBest,\nHR Department`,
            },
            redFlags: [],
            indicators: [],
            isPhishing: false,
        },
    ];

    // Mix phishing and legitimate
    const allEmails = [...challenges, ...legitimateEmails].sort(() => Math.random() - 0.5);

    return {
        type: 'interactive_phishing_sim',
        totalEmails: allEmails.length,
        emails: allEmails.map(e => ({
            ...e,
            // Don't reveal if phishing until user guesses
            _isPhishing: e.isPhishing,
            _redFlags: e.redFlags,
            isPhishing: undefined,
            redFlags: undefined,
        })),
        instructions: 'Review each email and determine if it is a phishing attempt or legitimate. For phishing emails, identify as many red flags as possible.',
    };
}

// ═══════════════════════════════════════════════════════════
// COMMUNICATION ANALYZER — Full SE indicator detection
// ═══════════════════════════════════════════════════════════
export function analyzeCommunication(text) {
    const indicators = [];
    const lower = text.toLowerCase();

    // Urgency indicators
    const urgencyWords = ['urgent', 'immediately', 'right away', 'asap', 'time-sensitive', 'deadline', 'expires', 'act now', 'don\'t delay', 'within 24 hours', 'within 2 hours', 'today', 'before end of day', 'right now', 'last chance', 'final notice', 'overdue', 'time is running out'];
    for (const word of urgencyWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Urgency', keyword: word, severity: 'High', description: `Creates artificial time pressure with "${word}"` });
        }
    }

    // Authority indicators
    const authorityWords = ['ceo', 'cfo', 'cto', 'ciso', 'president', 'director', 'manager', 'executive', 'board', 'compliance', 'legal department', 'hr department', 'security team', 'it department', 'administrator', 'vice president', 'chief', 'officer'];
    for (const word of authorityWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Authority', keyword: word, severity: 'High', description: `Invokes authority figure or department: "${word}"` });
        }
    }

    // Fear/Threat indicators
    const fearWords = ['suspended', 'terminated', 'locked out', 'breach', 'compromised', 'unauthorized', 'fraud', 'violation', 'penalty', 'legal action', 'collections', 'service interruption', 'lose access', 'disabled', 'terminated', 'arrest', 'investigate', 'lawsuit', 'fine'];
    for (const word of fearWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Fear/Threat', keyword: word, severity: 'High', description: `Uses fear/threat tactic: "${word}"` });
        }
    }

    // Secrecy indicators
    const secrecyWords = ['confidential', 'do not share', 'do not discuss', 'keep this between us', 'private', 'secret', 'don\'t tell', 'nda', 'restricted', 'classified', 'eyes only'];
    for (const word of secrecyWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Secrecy', keyword: word, severity: 'Medium', description: `Requests secrecy: "${word}" — prevents verification` });
        }
    }

    // Financial indicators
    const financialWords = ['wire transfer', 'bank account', 'routing number', 'credit card', 'payment', 'invoice', 'bitcoin', 'gift card', 'ssn', 'social security', 'direct deposit', 'ach', 'swift code', 'cryptocurrency', 'venmo', 'paypal', 'zelle'];
    for (const word of financialWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Financial Request', keyword: word, severity: 'Critical', description: `Requests financial information: "${word}"` });
        }
    }

    // Credential harvesting indicators
    const credentialWords = ['password', 'login', 'credentials', 'verify your identity', 'confirm your', 'click here', 'click the link', 'reset your password', 'update your information', 'verify your account', 'enter your', 'log in', 'sign in', 'authentication'];
    for (const word of credentialWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Credential Harvesting', keyword: word, severity: 'Critical', description: `Attempts to harvest credentials: "${word}"` });
        }
    }

    // Reciprocity/reward indicators
    const rewardWords = ['congratulations', 'you\'ve won', 'selected', 'bonus', 'reward', 'prize', 'gift', 'free', 'exclusive offer', 'special promotion', 'limited time', 'you\'ve been chosen'];
    for (const word of rewardWords) {
        if (lower.includes(word)) {
            indicators.push({ type: 'Reciprocity/Reward', keyword: word, severity: 'Medium', description: `Uses reward/reciprocity tactic: "${word}"` });
        }
    }

    // Suspicious URL patterns
    const urlPatterns = text.match(/https?:\/\/[^\s<>"]+/gi) || [];
    for (const url of urlPatterns) {
        // Check for domain spoofing patterns
        if (url.match(/-[a-z]+\.(com|net|org|io)/i) || url.includes('login') || url.includes('verify') || url.includes('secure') || url.includes('account')) {
            indicators.push({ type: 'Suspicious URL', keyword: url, severity: 'High', description: `Potentially spoofed URL: "${url}"` });
        }
        // Check for IP addresses in URLs
        if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
            indicators.push({ type: 'IP-Based URL', keyword: url, severity: 'Critical', description: `URL uses IP address instead of domain — highly suspicious` });
        }
        // Check for unusual TLDs
        if (url.match(/\.(xyz|top|club|icu|buzz|tk|ml|ga|cf|gq)/i)) {
            indicators.push({ type: 'Suspicious TLD', keyword: url, severity: 'High', description: `URL uses suspicious top-level domain` });
        }
    }

    // Email header anomalies
    const fromMatch = text.match(/from:?\s*[<"]?([^>"]+)/i);
    if (fromMatch) {
        const fromAddr = fromMatch[1].trim();
        if (fromAddr.includes('-') && fromAddr.includes('.com')) {
            indicators.push({ type: 'Spoofed Sender', keyword: fromAddr, severity: 'High', description: `Sender address may be spoofed: "${fromAddr}"` });
        }
    }

    // Attachment indicators
    if (lower.includes('.exe') || lower.includes('.scr') || lower.includes('.bat') || lower.includes('.cmd') || lower.includes('.ps1') || lower.includes('.vbs') || lower.includes('.js ')) {
        indicators.push({ type: 'Dangerous Attachment', keyword: 'executable file', severity: 'Critical', description: 'References potentially dangerous executable file type' });
    }
    if (lower.includes('enable macros') || lower.includes('enable content') || lower.includes('enable editing')) {
        indicators.push({ type: 'Macro Enablement', keyword: 'enable macros/content', severity: 'Critical', description: 'Requests enabling macros — common malware vector' });
    }

    // Calculate susceptibility score
    let susceptibilityScore = 0;
    const severityWeights = { Critical: 25, High: 15, Medium: 8, Low: 3 };
    for (const ind of indicators) {
        susceptibilityScore += severityWeights[ind.severity] || 0;
    }
    susceptibilityScore = Math.min(100, susceptibilityScore);

    let riskLevel;
    if (susceptibilityScore >= 75) riskLevel = 'Critical';
    else if (susceptibilityScore >= 50) riskLevel = 'High';
    else if (susceptibilityScore >= 25) riskLevel = 'Medium';
    else if (susceptibilityScore > 0) riskLevel = 'Low';
    else riskLevel = 'None Detected';

    // Generate recommendations
    const recommendations = [];
    if (indicators.some(i => i.type === 'Urgency')) recommendations.push('Verify any urgent requests through a separate, trusted communication channel');
    if (indicators.some(i => i.type === 'Authority')) recommendations.push('Confirm requests from authority figures by contacting them directly');
    if (indicators.some(i => i.type === 'Financial Request')) recommendations.push('Never provide financial information based on unsolicited requests');
    if (indicators.some(i => i.type === 'Credential Harvesting')) recommendations.push('Never click links in suspicious emails — navigate to sites directly');
    if (indicators.some(i => i.type === 'Suspicious URL' || i.type === 'IP-Based URL')) recommendations.push('Carefully inspect URLs before clicking — look for misspellings and unusual domains');
    if (indicators.some(i => i.type === 'Secrecy')) recommendations.push('Legitimate requests never require secrecy — always verify independently');
    if (indicators.some(i => i.type === 'Dangerous Attachment')) recommendations.push('Never open executable attachments from unknown sources');
    if (indicators.some(i => i.type === 'Macro Enablement')) recommendations.push('Never enable macros in documents from untrusted sources');
    if (recommendations.length === 0) recommendations.push('This communication appears relatively safe, but always remain vigilant');

    // Detailed breakdown by category
    const breakdownByType = {};
    for (const ind of indicators) {
        if (!breakdownByType[ind.type]) breakdownByType[ind.type] = { count: 0, severity: ind.severity, items: [] };
        breakdownByType[ind.type].count++;
        breakdownByType[ind.type].items.push(ind.keyword);
    }

    return {
        totalIndicators: indicators.length,
        indicators,
        susceptibilityScore,
        riskLevel,
        recommendations,
        breakdownByType,
        analysisSummary: `Detected ${indicators.length} social engineering indicator(s). Risk level: ${riskLevel} (${susceptibilityScore}/100).`,
        attackProbability: susceptibilityScore >= 75 ? 'Very likely a social engineering attack' : susceptibilityScore >= 50 ? 'Strong signs of social engineering' : susceptibilityScore >= 25 ? 'Some suspicious indicators present' : susceptibilityScore > 0 ? 'Minor concerns detected' : 'No social engineering indicators found',
    };
}
