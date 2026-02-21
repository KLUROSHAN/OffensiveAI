// Phishing email templates for educational social engineering simulation
export const phishingTemplates = [
    {
        id: 'ceo_fraud',
        category: 'Business Email Compromise',
        name: 'CEO Wire Transfer Request',
        difficulty: 'Medium',
        indicators: ['urgency', 'authority', 'secrecy'],
        subject: 'URGENT: Wire Transfer Needed Today',
        from: '{{ceo_name}} <{{ceo_name_lower}}@{{company_domain}}>',
        body: `Hi {{target_name}},

I need you to process an urgent wire transfer today. I'm currently in a meeting and can't make calls, so please handle this via email.

Transfer Amount: $47,500.00
Recipient: GlobalTech Solutions Ltd.
Account Number: 2847391056
Routing: 021000089
Reference: INV-2026-0847

This is time-sensitive and needs to go out before 3 PM today. Please confirm once completed. Do not discuss this with anyone else until the transfer is complete — it's related to a confidential acquisition.

Thanks,
{{ceo_name}}
CEO, {{company_name}}

Sent from my iPhone`,
        redFlags: [
            'Unusual urgency and time pressure',
            'Request to keep transaction secret',
            'CEO communicating via email instead of normal channels',
            'Sent from mobile device (common excuse for informal communication)',
            'No prior context or purchase order reference',
            'Request bypasses normal approval processes',
        ]
    },
    {
        id: 'it_support',
        category: 'IT Support Impersonation',
        name: 'Password Reset Required',
        difficulty: 'Easy',
        indicators: ['authority', 'urgency', 'technical_jargon'],
        subject: 'ACTION REQUIRED: Immediate Password Reset — Security Breach Detected',
        from: 'IT Security Team <security@{{company_domain}}>',
        body: `Dear {{target_name}},

Our security monitoring systems have detected suspicious login activity on your account. As a precautionary measure, we require all affected users to reset their passwords immediately.

Please click the link below to verify your identity and reset your password:

🔗 https://{{company_domain}}-security.com/reset?user={{target_email}}&token=a8f2e1

⚠️ IMPORTANT: Your account will be temporarily suspended if you do not complete this process within 2 hours.

If you have any questions, please contact the IT Help Desk at ext. 4500.

Best regards,
IT Security Operations
{{company_name}}`,
        redFlags: [
            'Creates artificial urgency with 2-hour deadline',
            'Link domain is subtly different from company domain',
            'Threatens account suspension',
            'Generic greeting style',
            'URL contains user email (potential tracking)',
            'Does not specify what suspicious activity was detected',
        ]
    },
    {
        id: 'prize_scam',
        category: 'Prize/Reward Scam',
        name: 'Employee Reward Notification',
        difficulty: 'Easy',
        indicators: ['reciprocity', 'excitement', 'social_proof'],
        subject: '🎉 Congratulations! You\'ve Been Selected for the Q1 Employee Bonus',
        from: 'HR Rewards Program <rewards@{{company_domain}}>',
        body: `Dear {{target_name}},

Congratulations! Based on your outstanding performance this quarter, you have been selected to receive a special bonus of $2,500 as part of our Employee Excellence Program.

To claim your bonus, please fill out the direct deposit verification form:

📋 https://{{company_domain}}-rewards.com/claim/{{target_email}}

You'll need to provide:
• Full legal name
• Employee ID
• Bank account details for deposit
• Social Security Number (for tax purposes)

Please complete this within 48 hours to ensure your bonus is processed with this pay cycle.

Join the 847 other employees who have already claimed their rewards!

Best,
Human Resources Department
{{company_name}}`,
        redFlags: [
            'Requests sensitive personal information (SSN, bank details)',
            'External link instead of internal HR system',
            'Uses social proof ("847 other employees")',
            'Unsolicited reward notification',
            'Creates urgency with 48-hour deadline',
            'No employee ID or reference number provided',
        ]
    },
    {
        id: 'vendor_invoice',
        category: 'Vendor Impersonation',
        name: 'Overdue Invoice Payment',
        difficulty: 'Hard',
        indicators: ['authority', 'urgency', 'fear'],
        subject: 'OVERDUE: Invoice #INV-2026-3847 — Service Interruption Warning',
        from: '{{vendor_name}} Billing <billing@{{vendor_domain}}>',
        body: `Dear Accounts Payable,

This is a final reminder regarding the overdue payment for Invoice #INV-2026-3847.

Invoice Details:
━━━━━━━━━━━━━━━━━━
Invoice Number: INV-2026-3847
Amount Due: $12,840.00
Original Due Date: February 5, 2026
Days Overdue: 16 days
━━━━━━━━━━━━━━━━━━

Please note that our updated banking details are as follows (our bank recently migrated systems):

Bank: First National Bank
Account: {{vendor_name}} LLC
Account #: 7291038456
Routing #: 026009593

If payment is not received within 48 hours, we will be forced to:
1. Suspend all active services
2. Apply a 15% late payment penalty
3. Escalate to our collections department

To avoid service disruption, please process payment immediately.

Regards,
{{vendor_name}} Billing Department
accounts@{{vendor_domain}}`,
        redFlags: [
            'Changed banking details with a plausible excuse',
            'Threatens service disruption',
            'Applies financial penalties to create pressure',
            'No specific contact person named',
            'Does not reference specific services or contract',
            'Sent to generic "Accounts Payable" not a named person',
        ]
    },
    {
        id: 'mfa_bypass',
        category: 'MFA Bypass Attack',
        name: 'Multi-Factor Authentication Update',
        difficulty: 'Hard',
        indicators: ['authority', 'technical_jargon', 'urgency'],
        subject: 'Mandatory: Multi-Factor Authentication Migration Required',
        from: 'Security Operations Center <soc@{{company_domain}}>',
        body: `{{target_name}},

As part of our ongoing security infrastructure upgrade, we are migrating all employees to our new multi-factor authentication (MFA) system by February 28, 2026.

Current Status: ❌ Migration Incomplete

To complete your migration:
1. Visit our secure portal: https://mfa-migration.{{company_domain}}.net/enroll
2. Log in with your current credentials
3. Scan the QR code with your authenticator app
4. Enter the 6-digit verification code from your CURRENT authenticator

⚠️ Employees who do not complete migration by the deadline will lose access to all company systems, including email, VPN, and internal applications.

Need help? Contact the Security Operations Center:
📧 soc@{{company_domain}}
📞 Internal: ext. 6100

This migration is mandatory per IT Security Policy SEC-2026-004.

Security Operations Center
{{company_name}}`,
        redFlags: [
            'Requests current MFA code (never required for legitimate migrations)',
            'External domain (.net) instead of company domain',
            'Threatens complete system access loss',
            'Policy reference adds false legitimacy',
            'Captures both password and MFA token',
            'URL mimics company domain but is different',
        ]
    },
    {
        id: 'shared_document',
        category: 'Credential Harvesting',
        name: 'Shared Document Notification',
        difficulty: 'Medium',
        indicators: ['curiosity', 'social_proof', 'authority'],
        subject: '{{sender_name}} shared "Q1 Layoff Plans - Confidential.docx" with you',
        from: 'Microsoft 365 <notifications@microsoft365-docs.com>',
        body: `{{sender_name}} has shared a document with you.

━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Q1 Layoff Plans - Confidential.docx
   Shared by: {{sender_name}} ({{sender_role}})
   Organization: {{company_name}}
━━━━━━━━━━━━━━━━━━━━━━━━━

{{sender_name}} added a note:
"Please review before tomorrow's leadership meeting. Keep this confidential."

[Open Document]
https://microsoft365-docs.com/share/d/{{doc_id}}

You're receiving this notification because {{sender_name}} shared this file with {{target_email}}.

Microsoft 365 | Privacy | Terms of Use
© 2026 Microsoft Corporation`,
        redFlags: [
            'Sender domain is "microsoft365-docs.com" not "microsoft.com"',
            'Curiosity-inducing document name ("Layoff Plans")',
            'Claims confidentiality to prevent verification',
            'Link goes to credential harvesting page',
            'Mimics legitimate Microsoft 365 notification format',
            'Personal note creates sense of trust and urgency',
        ]
    },
    {
        id: 'vishing_voicemail',
        category: 'Voice Phishing (Vishing)',
        name: 'Bank Fraud Alert Voicemail',
        difficulty: 'Medium',
        indicators: ['fear', 'urgency', 'authority'],
        subject: '[VOICEMAIL TRANSCRIPT] Fraud Alert — Immediate Action Required',
        from: 'Voicemail Service <voicemail@{{company_domain}}>',
        body: `You have 1 new voicemail message.

━━━━━━━━━━━━━━━━━━━━━━━━━
📞 From: +1 (800) 555-0142
⏱️ Duration: 0:47
📅 Received: Today at 9:14 AM
━━━━━━━━━━━━━━━━━━━━━━━━━

[AUTO-TRANSCRIPT]:
"Hello, this is Agent Martinez from First National Bank's fraud prevention department. We've detected two suspicious transactions on your corporate account ending in 4829 — one for $3,200 to an overseas account and another for $1,847 at an electronics retailer. These transactions have been temporarily held pending your verification. Please call us back immediately at 1-800-555-0142 or press 1 to be connected directly. For security purposes, have your account number, PIN, and the last four digits of your Social Security Number ready. This is urgent — if we don't hear from you within 2 hours, the transactions will be processed automatically. Thank you."

[Play Voicemail] | [Call Back: 1-800-555-0142] | [Delete]`,
        redFlags: [
            'Creates fear with fake fraudulent transactions',
            'Requests sensitive info (PIN, SSN) — banks never ask this',
            'Artificial urgency with 2-hour deadline',
            'Phone number is not the actual bank number',
            'Specific dollar amounts add false credibility',
            'Threatens automatic processing if no response',
        ]
    },
    {
        id: 'supply_chain',
        category: 'Supply Chain Attack',
        name: 'Software Update Notification',
        difficulty: 'Hard',
        indicators: ['authority', 'technical_jargon', 'trust'],
        subject: 'Critical Security Patch Available — {{software_name}} v4.2.1',
        from: '{{software_name}} Security <security@{{software_domain}}>',
        body: `Critical Security Advisory: {{software_name}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CVE-2026-28471 | Severity: CRITICAL (9.8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A critical remote code execution vulnerability has been discovered in {{software_name}} versions 4.0.0 through 4.2.0. This vulnerability is being actively exploited in the wild.

Affected Systems: All installations of {{software_name}} in your organization

**Immediate Action Required:**
Download and apply the emergency patch:

📦 https://{{software_domain}}-cdn.net/patches/v4.2.1-hotfix.exe

Installation Steps:
1. Download the patch file
2. Run as Administrator
3. Restart all affected services
4. Verify version shows 4.2.1

This patch must be applied within 24 hours. CISA has added this vulnerability to the Known Exploited Vulnerabilities catalog.

{{software_name}} Security Response Team
PGP Key: 0xA8F2E1C3`,
        redFlags: [
            'Download link uses "-cdn.net" subdomain, not official domain',
            'Executable file download (.exe) instead of official update mechanism',
            'References real-sounding CVE to add legitimacy',
            'Mentions CISA to invoke authority',
            'Bypasses normal software update channels',
            'No digital signature verification instructions',
        ]
    },
];

export const vishingScripts = [
    {
        id: 'tech_support',
        name: 'IT Support Callback',
        category: 'Technical Support Fraud',
        scenario: 'Caller impersonates internal IT support responding to a ticket the target never submitted.',
        script: [
            { role: 'attacker', line: "Hi {{target_name}}, this is Mike from the IT Help Desk. I'm calling about the ticket you submitted regarding slow computer performance — ticket number HD-7842." },
            { role: 'note', line: "Target likely hasn't submitted a ticket, creating confusion. Attacker exploits this to establish authority." },
            { role: 'attacker', line: "No worries if you don't remember the exact ticket — it might have been auto-generated by our monitoring system when we detected high CPU usage on your workstation." },
            { role: 'attacker', line: "I can fix this remotely right now. I just need you to open a remote session. Can you go to remote-support.com and enter session code 847291?" },
            { role: 'note', line: "Attacker attempts to gain remote access to the target's machine." },
            { role: 'attacker', line: "While that's connecting, I'll need to verify your identity for security purposes. Can you confirm your employee ID and the password you use to log into your workstation?" },
        ],
        tactics: ['Authority impersonation', 'Fabricated context', 'Remote access request', 'Credential harvesting'],
        defenseAdvice: [
            'Never share passwords over the phone, even with IT',
            'Verify caller identity by calling IT on a known number',
            'Check if a ticket actually exists in the system',
            'IT will never ask for remote access with third-party tools',
        ]
    },
    {
        id: 'hr_benefits',
        name: 'HR Benefits Enrollment',
        category: 'HR Impersonation',
        scenario: 'Caller poses as HR representative calling about benefits enrollment deadline.',
        script: [
            { role: 'attacker', line: "Hello {{target_name}}, this is Sarah from Human Resources. I'm reaching out because our records show you haven't completed your annual benefits enrollment, and the deadline is tomorrow." },
            { role: 'attacker', line: "If you don't complete enrollment by end of day tomorrow, you'll lose your current health insurance and dental coverage. I can help you finish right now over the phone to make sure you're covered." },
            { role: 'attacker', line: "I'll just need to verify some information — your date of birth, Social Security Number, and I'll need you to choose your plan options." },
            { role: 'note', line: "Creates urgency around losing benefits. Most people will not risk losing health insurance." },
            { role: 'attacker', line: "Also, we've updated our direct deposit system, so I'll need your current bank account and routing number to ensure your paycheck goes to the right account." },
        ],
        tactics: ['Deadline pressure', 'Fear of loss', 'HR authority', 'Personal data harvesting'],
        defenseAdvice: [
            'HR will never ask for SSN or bank details over the phone',
            'Verify enrollment deadlines through official HR portal',
            'Call HR directly using the number on the company website',
            'Benefits changes should be done through official self-service portals',
        ]
    },
    {
        id: 'executive_impersonation',
        name: 'Executive Urgent Request',
        category: 'Executive Impersonation',
        scenario: 'Caller impersonates a C-level executive requesting an urgent wire transfer.',
        script: [
            { role: 'attacker', line: "{{target_name}}, this is {{ceo_name}}. I need your help with something urgent and confidential." },
            { role: 'attacker', line: "I'm finalizing an acquisition deal and I need a wire transfer processed immediately. I can't go through normal channels because this is under NDA and we can't risk it leaking." },
            { role: 'attacker', line: "The amount is $85,000 to Meridian Holdings. I'll send you the wire details by email in a few minutes. Can you make sure it goes out today?" },
            { role: 'note', line: "Uses authority, secrecy, and urgency to bypass normal approval processes." },
            { role: 'attacker', line: "I know this is unusual, but I'm counting on you. And please don't mention this to anyone else — not even the CFO — until the deal is announced next week." },
        ],
        tactics: ['Executive authority', 'Confidentiality pressure', 'Urgency', 'Process bypass'],
        defenseAdvice: [
            'Always verify unusual requests through a separate channel',
            'No executive should ask you to bypass financial controls',
            'Verify the caller by calling the executive directly',
            '"Don\'t tell anyone" is a major red flag',
        ]
    },
];

export const templateVariables = {
    company_name: 'Nexus Technologies Inc.',
    company_domain: 'nexustech.com',
    ceo_name: 'David Richardson',
    ceo_name_lower: 'drichardson',
    target_name: 'Alex',
    target_email: 'alex.johnson@nexustech.com',
    sender_name: 'Sarah Mitchell',
    sender_role: 'VP of Human Resources',
    vendor_name: 'CloudSync Solutions',
    vendor_domain: 'cloudsync-solutions.com',
    software_name: 'SecureNet Gateway',
    software_domain: 'securenet-gateway.io',
    doc_id: 'aHR0cDovL2V4YW1wbGUu',
};
