/**
 * Brevo (Sendinblue) integration via direct REST API calls.
 * Using axios instead of the @getbrevo/brevo SDK to avoid ESM/CJS import issues.
 * Brevo API docs: https://developers.brevo.com/reference
 */
import axios from 'axios'

// Read config lazily at call time (not at import time).
// In ESM, import statements are hoisted before dotenv.config() runs,
// so top-level process.env reads would always be undefined.
function getConfig() {
  return {
    apiKey:      process.env.BREVO_API_KEY,
    listId:      parseInt(process.env.BREVO_LIST_ID || '2', 10),
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@newsai.app',
    senderName:  process.env.BREVO_SENDER_NAME  || 'NewsAI Intelligence',
    frontendUrl: process.env.FRONTEND_URL        || 'http://localhost:3000'
  }
}

function isConfigured(apiKey) {
  return apiKey && !apiKey.startsWith('your_brevo')
}

function brevoHeaders(apiKey) {
  return {
    'accept':       'application/json',
    'content-type': 'application/json',
    'api-key':      apiKey
  }
}


/**
 * Add a subscriber to the Brevo contact list.
 */
export async function addContactToBrevo(email) {
  const { apiKey, listId } = getConfig()

  if (!isConfigured(apiKey)) {
    console.warn('[Brevo] API key not configured — skipping contact add')
    return { skipped: true }
  }

  try {
    await axios.post(
      'https://api.brevo.com/v3/contacts',
      { email: email.toLowerCase(), listIds: [listId], updateEnabled: true },
      { headers: brevoHeaders(apiKey) }
    )
    console.log(`[Brevo] Contact added: ${email}`)
    return { success: true }
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || ''
    if (msg.toLowerCase().includes('contact already exist')) {
      console.log(`[Brevo] Contact already in list: ${email}`)
      return { success: true, alreadyExisted: true }
    }
    console.error('[Brevo] addContact error:', msg)
    throw new Error(msg)
  }
}

/**
 * Send a branded welcome email to a new subscriber.
 */
export async function sendWelcomeEmail(email) {
  const { apiKey, senderEmail, senderName, frontendUrl } = getConfig()

  if (!isConfigured(apiKey)) {
    console.warn('[Brevo] API key not configured — skipping welcome email')
    return { skipped: true }
  }

  const htmlContent = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:40px 32px;border-radius:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
        <div style="width:36px;height:36px;background:#2563eb;border-radius:8px;text-align:center;line-height:36px;">
          <span style="color:white;font-weight:800;font-size:18px;">✦</span>
        </div>
        <span style="font-size:20px;font-weight:800;color:white;letter-spacing:-0.5px;">NewsAI</span>
      </div>
      <h1 style="font-size:28px;font-weight:800;color:white;margin:0 0 12px;">Welcome aboard. 🚀</h1>
      <p style="color:#94a3b8;font-size:16px;line-height:1.7;margin:0 0 24px;">
        You're now part of a growing group of readers who trust <strong style="color:#e2e8f0;">NewsAI</strong> for smarter, bias-aware news — without the noise.
      </p>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:32px;">
        <p style="color:#94a3b8;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">What's coming your way</p>
        <ul style="list-style:none;padding:0;margin:0;color:#cbd5e1;font-size:15px;line-height:2.2;">
          <li>📰 &nbsp; AI-curated daily news digests</li>
          <li>🧠 &nbsp; Bias scores &amp; sentiment analysis</li>
          <li>🌍 &nbsp; Global stories you need to know</li>
          <li>✦ &nbsp; Weekly deep-dives on trending topics</li>
        </ul>
      </div>
      <a href="${frontendUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;">
        Read Today's Headlines →
      </a>
      <p style="color:#475569;font-size:12px;margin-top:40px;line-height:1.6;">
        You received this because you subscribed at NewsAI.<br>
        <a href="${frontendUrl}" style="color:#3b82f6;">Visit NewsAI</a>
      </p>
    </div>
  `

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject: "🎉 You're in — Welcome to NewsAI",
        htmlContent
      },
      { headers: brevoHeaders(apiKey) }
    )
    console.log(`[Brevo] Welcome email sent to: ${email}`)
    return { success: true }
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || ''
    console.error('[Brevo] sendWelcomeEmail error:', msg)
    return { success: false, error: msg }
  }
}

/**
 * Future hook: send an AI-generated digest to all active subscribers.
 * Call this from a cron job or the /api/newsletter/send-digest endpoint.
 */
export async function sendDigestEmail(subject, htmlContent, recipients) {
  const { apiKey, senderEmail, senderName } = getConfig()

  if (!isConfigured(apiKey)) {
    console.warn('[Brevo] API key not configured — skipping digest')
    return { skipped: true }
  }

  const results = []
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50)
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        { sender: { name: senderName, email: senderEmail }, to: batch.map(email => ({ email })), subject, htmlContent },
        { headers: brevoHeaders(apiKey) }
      )
      results.push({ batch: Math.floor(i / 50) + 1, sent: batch.length })
    } catch (err) {
      const msg = err?.response?.data?.message || err.message
      console.error(`[Brevo] Digest batch ${Math.floor(i / 50) + 1} error:`, msg)
      results.push({ batch: Math.floor(i / 50) + 1, error: msg })
    }
  }
  return { results }
}

/**
 * Send a secure password reset link to a user.
 */
export async function sendPasswordResetEmail(email, token) {
  const { apiKey, senderEmail, senderName, frontendUrl } = getConfig()

  if (!isConfigured(apiKey)) {
    console.warn('[Brevo] API key not configured — skipping reset email')
    return { skipped: true }
  }

  const resetLink = `${frontendUrl}/reset-password?token=${token}`

  const htmlContent = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:40px 32px;border-radius:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
        <div style="width:36px;height:36px;background:#2563eb;border-radius:8px;text-align:center;line-height:36px;">
          <span style="color:white;font-weight:800;font-size:18px;">✦</span>
        </div>
        <span style="font-size:20px;font-weight:800;color:white;letter-spacing:-0.5px;">NewsAI</span>
      </div>
      <h1 style="font-size:24px;font-weight:800;color:white;margin:0 0 12px;">Reset your password. 🔐</h1>
      <p style="color:#94a3b8;font-size:16px;line-height:1.7;margin:0 0 24px;">
        We received a request to reset your password for your NewsAI account. Click the button below to secure your account.
      </p>
      
      <div style="margin:32px 0;">
        <a href="${resetLink}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:700;font-size:16px;">
          Reset Password →
        </a>
      </div>

      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
        This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
      </p>
      
      <p style="color:#475569;font-size:12px;margin-top:40px;line-height:1.6;border-top:1px solid #1e293b;padding-top:24px;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color:#3b82f6;">${resetLink}</a>
      </p>
    </div>
  `

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject: "🔒 Password Reset Request - NewsAI",
        htmlContent
      },
      { headers: brevoHeaders(apiKey) }
    )
    console.log(`[Brevo] Reset email sent to: ${email}`)
    return { success: true }
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || ''
    console.error('[Brevo] sendPasswordResetEmail error:', msg)
    return { success: false, error: msg }
  }
}
