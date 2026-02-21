import dns from 'dns';
import net from 'net';
import { execSync } from 'child_process';
import crypto from 'crypto';

const dnsPromises = dns.promises;

// ═══════════════════════════════════════════════════════════
// OSINT RECONNAISSANCE ENGINE — Real Cyber Tools
// ═══════════════════════════════════════════════════════════

// ─── WHOIS Lookup ──────────────────────────────────────────
export async function whoisLookup(domain) {
    try {
        const raw = execSync(`whois ${domain.replace(/[^a-zA-Z0-9.-]/g, '')}`, { timeout: 15000, encoding: 'utf-8' });
        const parsed = parseWhois(raw);
        return { success: true, domain, raw: raw.substring(0, 3000), parsed };
    } catch (err) {
        return { success: false, domain, error: err.message };
    }
}

function parseWhois(raw) {
    const extract = (patterns) => {
        for (const p of patterns) {
            const match = raw.match(new RegExp(`${p}:\\s*(.+)`, 'i'));
            if (match) return match[1].trim();
        }
        return null;
    };
    return {
        registrar: extract(['Registrar', 'registrar']),
        registrant: extract(['Registrant Name', 'Registrant Organization', 'registrant']),
        creationDate: extract(['Creation Date', 'Created Date', 'created']),
        expiryDate: extract(['Registry Expiry Date', 'Expiration Date', 'expires']),
        updatedDate: extract(['Updated Date', 'Last Updated']),
        nameServers: (raw.match(/Name Server:\s*(.+)/gi) || []).map(ns => ns.replace(/Name Server:\s*/i, '').trim()),
        status: (raw.match(/Status:\s*(.+)/gi) || []).map(s => s.replace(/Status:\s*/i, '').trim()).slice(0, 5),
        dnssec: extract(['DNSSEC']),
    };
}

// ─── DNS Reconnaissance ────────────────────────────────────
export async function dnsRecon(domain) {
    const results = { domain, records: {} };

    const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];

    for (const type of recordTypes) {
        try {
            switch (type) {
                case 'A': results.records.A = await dnsPromises.resolve4(domain); break;
                case 'AAAA':
                    try { results.records.AAAA = await dnsPromises.resolve6(domain); } catch { results.records.AAAA = []; }
                    break;
                case 'MX': results.records.MX = await dnsPromises.resolveMx(domain); break;
                case 'NS': results.records.NS = await dnsPromises.resolveNs(domain); break;
                case 'TXT':
                    try { results.records.TXT = (await dnsPromises.resolveTxt(domain)).map(t => t.join('')); } catch { results.records.TXT = []; }
                    break;
                case 'CNAME':
                    try { results.records.CNAME = await dnsPromises.resolveCname(domain); } catch { results.records.CNAME = []; }
                    break;
                case 'SOA':
                    try { results.records.SOA = await dnsPromises.resolveSoa(domain); } catch { results.records.SOA = null; }
                    break;
            }
        } catch { results.records[type] = []; }
    }

    // Reverse DNS on A records
    if (results.records.A?.length > 0) {
        results.reverseDNS = {};
        for (const ip of results.records.A) {
            try { results.reverseDNS[ip] = await dnsPromises.reverse(ip); } catch { results.reverseDNS[ip] = ['No PTR record']; }
        }
    }

    // Security analysis of DNS records
    results.securityNotes = [];
    if (results.records.TXT?.length > 0) {
        const spf = results.records.TXT.find(t => t.includes('v=spf1'));
        const dmarc = results.records.TXT.find(t => t.includes('v=DMARC1'));
        const dkim = results.records.TXT.find(t => t.includes('DKIM'));
        if (spf) results.securityNotes.push({ type: 'SPF', status: 'Found', detail: spf.substring(0, 100) });
        else results.securityNotes.push({ type: 'SPF', status: 'Missing', detail: 'No SPF record — domain is vulnerable to email spoofing' });
        if (dmarc) results.securityNotes.push({ type: 'DMARC', status: 'Found', detail: dmarc.substring(0, 100) });
        else results.securityNotes.push({ type: 'DMARC', status: 'Missing', detail: 'No DMARC record — no enforcement on spoofed emails' });
    }

    return { success: true, ...results };
}

// ─── Subdomain Enumeration ─────────────────────────────────
export async function enumerateSubdomains(domain) {
    const commonSubs = [
        'www', 'mail', 'ftp', 'admin', 'portal', 'webmail', 'remote', 'vpn',
        'api', 'dev', 'staging', 'test', 'beta', 'demo', 'app', 'mobile',
        'blog', 'shop', 'store', 'cdn', 'static', 'assets', 'img', 'images',
        'ns1', 'ns2', 'dns', 'mx', 'smtp', 'pop', 'imap', 'exchange',
        'owa', 'autodiscover', 'cpanel', 'whm', 'plesk', 'panel',
        'db', 'database', 'mysql', 'postgres', 'mongo', 'redis', 'elastic',
        'git', 'gitlab', 'github', 'jenkins', 'ci', 'build', 'deploy',
        'auth', 'sso', 'login', 'id', 'identity', 'oauth', 'cas',
        'monitor', 'status', 'health', 'grafana', 'kibana', 'prometheus',
        'docs', 'wiki', 'help', 'support', 'ticket', 'jira', 'confluence',
        'intranet', 'internal', 'private', 'secure', 'gateway', 'proxy',
        'backup', 'bak', 'old', 'legacy', 'v2', 'new', 'stage',
        'cloud', 'aws', 'azure', 'gcp', 's3', 'storage', 'bucket',
        'chat', 'slack', 'teams', 'meet', 'zoom', 'video', 'call',
        'hr', 'payroll', 'finance', 'crm', 'erp', 'sap',
    ];

    const found = [];
    const notFound = [];

    // Batch DNS lookups with concurrency control
    const batchSize = 10;
    for (let i = 0; i < commonSubs.length; i += batchSize) {
        const batch = commonSubs.slice(i, i + batchSize);
        const promises = batch.map(async (sub) => {
            const fqdn = `${sub}.${domain}`;
            try {
                const addresses = await dnsPromises.resolve4(fqdn);
                found.push({ subdomain: sub, fqdn, ips: addresses, type: categorizeSubdomain(sub) });
            } catch {
                notFound.push(sub);
            }
        });
        await Promise.all(promises);
    }

    return {
        success: true,
        domain,
        found,
        notFoundCount: notFound.length,
        totalChecked: commonSubs.length,
        summary: `Discovered ${found.length} active subdomains out of ${commonSubs.length} checked`,
    };
}

function categorizeSubdomain(sub) {
    const categories = {
        web: ['www', 'app', 'portal', 'blog', 'shop', 'store', 'mobile'],
        mail: ['mail', 'webmail', 'smtp', 'pop', 'imap', 'exchange', 'owa', 'mx'],
        infra: ['ns1', 'ns2', 'dns', 'cdn', 'static', 'vpn', 'remote', 'proxy', 'gateway'],
        dev: ['dev', 'staging', 'test', 'beta', 'demo', 'git', 'gitlab', 'jenkins', 'ci', 'build'],
        admin: ['admin', 'cpanel', 'whm', 'plesk', 'panel', 'monitor', 'grafana', 'kibana'],
        data: ['db', 'database', 'mysql', 'postgres', 'mongo', 'redis', 'elastic', 'backup'],
        auth: ['auth', 'sso', 'login', 'id', 'identity', 'oauth', 'cas'],
        cloud: ['cloud', 'aws', 'azure', 'gcp', 's3', 'storage'],
    };
    for (const [cat, subs] of Object.entries(categories)) {
        if (subs.includes(sub)) return cat;
    }
    return 'other';
}

// ─── Port Scanning ─────────────────────────────────────────
export async function portScan(target, ports) {
    const defaultPorts = [21, 22, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 8888, 9090, 27017];
    const portList = ports || defaultPorts;

    // Resolve domain to IP first
    let ip = target;
    let hostname = target;
    try {
        const addrs = await dnsPromises.resolve4(target);
        if (addrs.length > 0) ip = addrs[0];
    } catch { /* target might already be an IP */ }

    const results = [];
    const scanStart = Date.now();

    // Scan with concurrency control
    const batchSize = 8;
    for (let i = 0; i < portList.length; i += batchSize) {
        const batch = portList.slice(i, i + batchSize);
        const promises = batch.map(port => scanPort(ip, port));
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
    }

    const openPorts = results.filter(r => r.state === 'open');
    const scanTime = Date.now() - scanStart;

    return {
        success: true,
        target: hostname,
        ip,
        scanTime: `${scanTime}ms`,
        totalScanned: portList.length,
        openPorts: openPorts.length,
        results: results.sort((a, b) => a.port - b.port),
        riskNotes: generatePortRiskNotes(openPorts),
    };
}

function scanPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);

        socket.on('connect', () => {
            socket.destroy();
            resolve({ port, state: 'open', service: getServiceName(port) });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, state: 'filtered', service: getServiceName(port) });
        });

        socket.on('error', () => {
            resolve({ port, state: 'closed', service: getServiceName(port) });
        });

        socket.connect(port, host);
    });
}

function getServiceName(port) {
    const services = {
        21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS', 80: 'HTTP',
        110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 993: 'IMAPS',
        995: 'POP3S', 1433: 'MSSQL', 1521: 'Oracle', 3306: 'MySQL', 3389: 'RDP',
        5432: 'PostgreSQL', 5900: 'VNC', 6379: 'Redis', 8080: 'HTTP-Alt',
        8443: 'HTTPS-Alt', 8888: 'HTTP-Alt', 9090: 'Web-Admin', 27017: 'MongoDB',
    };
    return services[port] || `Port-${port}`;
}

function generatePortRiskNotes(openPorts) {
    const notes = [];
    const portMap = openPorts.reduce((map, p) => { map[p.port] = p; return map; }, {});

    if (portMap[21]) notes.push({ severity: 'High', note: 'FTP (21) open — file transfer service, check for anonymous access' });
    if (portMap[22]) notes.push({ severity: 'Info', note: 'SSH (22) open — secure shell, check for key-based auth' });
    if (portMap[23]) notes.push({ severity: 'Critical', note: 'Telnet (23) open — unencrypted remote access, should be disabled' });
    if (portMap[25]) notes.push({ severity: 'Medium', note: 'SMTP (25) open — mail server, check for open relay' });
    if (portMap[445]) notes.push({ severity: 'High', note: 'SMB (445) open — file sharing, common target for exploits (WannaCry, EternalBlue)' });
    if (portMap[3306]) notes.push({ severity: 'High', note: 'MySQL (3306) open — database exposed, should not be internet-facing' });
    if (portMap[3389]) notes.push({ severity: 'High', note: 'RDP (3389) open — remote desktop, high-value attack target (BlueKeep)' });
    if (portMap[5432]) notes.push({ severity: 'High', note: 'PostgreSQL (5432) open — database exposed to network' });
    if (portMap[5900]) notes.push({ severity: 'Critical', note: 'VNC (5900) open — remote desktop often without encryption' });
    if (portMap[6379]) notes.push({ severity: 'Critical', note: 'Redis (6379) open — often unauthenticated, can lead to RCE' });
    if (portMap[27017]) notes.push({ severity: 'Critical', note: 'MongoDB (27017) open — NoSQL DB, frequently exposed without auth' });
    if (portMap[8080] || portMap[8443] || portMap[9090]) notes.push({ severity: 'Medium', note: 'Alternative web ports open — may expose admin panels or dev instances' });

    if (notes.length === 0) notes.push({ severity: 'Low', note: 'Only standard web/mail ports detected — surface appears minimal' });
    return notes;
}

// ─── HTTP Header Analysis ──────────────────────────────────
export async function analyzeHeaders(url) {
    try {
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(targetUrl, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)' },
        });
        clearTimeout(timeout);

        const headers = {};
        response.headers.forEach((v, k) => { headers[k] = v; });

        // Security analysis
        const securityHeaders = {
            'strict-transport-security': { name: 'HSTS', importance: 'Critical' },
            'content-security-policy': { name: 'CSP', importance: 'High' },
            'x-frame-options': { name: 'X-Frame-Options', importance: 'Medium' },
            'x-content-type-options': { name: 'X-Content-Type-Options', importance: 'Medium' },
            'x-xss-protection': { name: 'X-XSS-Protection', importance: 'Low' },
            'referrer-policy': { name: 'Referrer-Policy', importance: 'Low' },
            'permissions-policy': { name: 'Permissions-Policy', importance: 'Medium' },
        };

        const present = [];
        const missing = [];
        for (const [header, info] of Object.entries(securityHeaders)) {
            if (headers[header]) present.push({ ...info, header, value: headers[header].substring(0, 100) });
            else missing.push({ ...info, header });
        }

        // Tech stack detection
        const techStack = [];
        if (headers['server']) techStack.push({ type: 'Server', value: headers['server'] });
        if (headers['x-powered-by']) techStack.push({ type: 'Framework', value: headers['x-powered-by'] });
        if (headers['x-aspnet-version']) techStack.push({ type: 'ASP.NET', value: headers['x-aspnet-version'] });
        if (headers['x-drupal-cache']) techStack.push({ type: 'CMS', value: 'Drupal' });
        if (headers['x-generator']) techStack.push({ type: 'Generator', value: headers['x-generator'] });
        if (headers['x-shopify-stage']) techStack.push({ type: 'Platform', value: 'Shopify' });

        // Information leakage
        const leaks = [];
        if (headers['server']) leaks.push({ header: 'Server', detail: `Reveals server software: ${headers['server']}` });
        if (headers['x-powered-by']) leaks.push({ header: 'X-Powered-By', detail: `Reveals framework: ${headers['x-powered-by']}` });
        if (headers['x-aspnet-version']) leaks.push({ header: 'X-AspNet-Version', detail: `Reveals ASP.NET version: ${headers['x-aspnet-version']}` });

        const score = Math.round((present.length / Object.keys(securityHeaders).length) * 100);

        return {
            success: true,
            url: targetUrl,
            statusCode: response.status,
            headers,
            security: { present, missing, score, grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F' },
            techStack,
            informationLeakage: leaks,
        };
    } catch (err) {
        return { success: false, url, error: err.message };
    }
}

// ─── Email Harvester ───────────────────────────────────────
export function harvestEmails(domain, names) {
    const patterns = [
        { format: 'first.last', fn: (f, l) => `${f}.${l}` },
        { format: 'first_last', fn: (f, l) => `${f}_${l}` },
        { format: 'firstlast', fn: (f, l) => `${f}${l}` },
        { format: 'flast', fn: (f, l) => `${f[0]}${l}` },
        { format: 'first.l', fn: (f, l) => `${f}.${l[0]}` },
        { format: 'first', fn: (f) => `${f}` },
        { format: 'last.first', fn: (f, l) => `${l}.${f}` },
        { format: 'f.last', fn: (f, l) => `${f[0]}.${l}` },
    ];

    const roleEmails = [
        'info', 'admin', 'contact', 'support', 'sales', 'hr', 'jobs', 'careers',
        'security', 'abuse', 'postmaster', 'webmaster', 'helpdesk', 'billing',
        'marketing', 'press', 'media', 'legal', 'compliance', 'privacy',
        'noreply', 'no-reply', 'feedback', 'newsletter', 'office', 'team',
    ];

    const generatedEmails = [];

    // Generate from names
    if (names && names.length > 0) {
        for (const name of names) {
            const parts = name.trim().toLowerCase().split(/\s+/);
            if (parts.length < 2) continue;
            const first = parts[0].replace(/[^a-z]/g, '');
            const last = parts[parts.length - 1].replace(/[^a-z]/g, '');
            if (!first || !last) continue;

            for (const pattern of patterns) {
                const email = `${pattern.fn(first, last)}@${domain}`;
                generatedEmails.push({ name, email, pattern: pattern.format, type: 'personal' });
            }
        }
    }

    // Add role-based emails
    for (const role of roleEmails) {
        generatedEmails.push({ name: role, email: `${role}@${domain}`, pattern: 'role-based', type: 'role' });
    }

    return {
        success: true,
        domain,
        totalGenerated: generatedEmails.length,
        personalEmails: generatedEmails.filter(e => e.type === 'personal').length,
        roleEmails: generatedEmails.filter(e => e.type === 'role').length,
        emails: generatedEmails,
        note: 'These are predicted email addresses based on common naming patterns. Verification (e.g., via SMTP VRFY or LinkedIn cross-reference) is recommended.',
    };
}
