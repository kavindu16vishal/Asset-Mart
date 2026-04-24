import nodemailer from 'nodemailer';

const APP_NAME = process.env.APP_NAME || 'Saranga';

export function isEmailConfigured(): boolean {
  if (String(process.env.EMAIL_ENABLED || '').toLowerCase() === 'false') {
    return false;
  }
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.MAIL_FROM?.trim()
  );
}

export function getExtraAdminNotifyEmails(): string[] {
  const raw = process.env.ADMIN_NOTIFY_EMAILS || '';
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('[mail] SMTP not configured; skipped:', opts.subject);
    return;
  }
  const transport = createTransport();
  const to = Array.isArray(opts.to) ? opts.to : [opts.to];
  const unique = [...new Set(to.map((e) => e.trim()).filter(Boolean))];
  if (unique.length === 0) return;

  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to: unique.join(', '),
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

/** User signed in successfully */
export async function sendLoginNotificationEmail(params: {
  to: string;
  userName: string;
}): Promise<void> {
  const when = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const text = [
    `Hello ${params.userName},`,
    '',
    `You successfully signed in to ${APP_NAME} at ${when}.`,
    '',
    `If this was not you, change your password and contact an administrator.`,
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  const html = `
    <p>Hello ${escapeHtml(params.userName)},</p>
    <p>You successfully signed in to <strong>${escapeHtml(APP_NAME)}</strong> at <strong>${escapeHtml(when)}</strong>.</p>
    <p>If this was not you, change your password and contact an administrator.</p>
    <p>— ${escapeHtml(APP_NAME)}</p>
  `;

  await sendMail({
    to: params.to,
    subject: `${APP_NAME}: Sign-in notification`,
    text,
    html,
  });
}

/** New issue submitted — notify admins */
export async function sendNewIssueAdminEmail(params: {
  to: string[];
  issueId: number;
  assetId: string | null;
  issueType: string;
  priority: string;
  description: string;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterUserId: string | null;
}): Promise<void> {
  const reporterLine =
    params.reporterName || params.reporterEmail || params.reporterUserId
      ? `Reporter: ${params.reporterName || '—'} (${params.reporterEmail || 'no email'})  ID: ${params.reporterUserId || '—'}`
      : 'Reporter: not linked to a user account';

  const text = [
    `A new issue was submitted in ${APP_NAME}.`,
    '',
    `Issue #${params.issueId}`,
    `Asset ID: ${params.assetId || '—'}`,
    `Type: ${params.issueType}`,
    `Priority: ${params.priority}`,
    reporterLine,
    '',
    'Description:',
    params.description || '(none)',
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  const html = `
    <p>A new issue was submitted in <strong>${escapeHtml(APP_NAME)}</strong>.</p>
    <ul>
      <li><strong>Issue #${params.issueId}</strong></li>
      <li>Asset ID: ${escapeHtml(params.assetId || '—')}</li>
      <li>Type: ${escapeHtml(params.issueType)}</li>
      <li>Priority: ${escapeHtml(params.priority)}</li>
      <li>${escapeHtml(reporterLine)}</li>
    </ul>
    <p><strong>Description</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(params.description || '(none)')}</pre>
    <p>— ${escapeHtml(APP_NAME)}</p>
  `;

  await sendMail({
    to: params.to,
    subject: `${APP_NAME}: New issue #${params.issueId} (${params.issueType})`,
    text,
    html,
  });
}

/** Issue marked resolved — notify reporter */
export async function sendIssueResolvedEmail(params: {
  to: string;
  userName: string | null;
  issueId: number;
  assetId: string | null;
  issueType: string;
  priority: string;
  description: string;
  resultSummary?: string;
}): Promise<void> {
  const greeting = params.userName ? `Hello ${params.userName},` : 'Hello,';
  const resultBlock =
    params.resultSummary?.trim() ||
    'Your report has been reviewed and marked as **Resolved** by an administrator.';

  const text = [
    greeting,
    '',
    `Your issue #${params.issueId} in ${APP_NAME} is now resolved.`,
    '',
    'Report summary:',
    `  Asset ID: ${params.assetId || '—'}`,
    `  Type: ${params.issueType}`,
    `  Priority: ${params.priority}`,
    '',
    'What you reported:',
    params.description || '(none)',
    '',
    'Result:',
    resultBlock.replace(/\*\*/g, ''),
    '',
    `— ${APP_NAME}`,
  ].join('\n');

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Your issue <strong>#${params.issueId}</strong> in <strong>${escapeHtml(APP_NAME)}</strong> is now <strong>Resolved</strong>.</p>
    <p><strong>Report summary</strong></p>
    <ul>
      <li>Asset ID: ${escapeHtml(params.assetId || '—')}</li>
      <li>Type: ${escapeHtml(params.issueType)}</li>
      <li>Priority: ${escapeHtml(params.priority)}</li>
    </ul>
    <p><strong>What you reported</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(params.description || '(none)')}</pre>
    <p><strong>Result</strong></p>
    <p>${escapeHtml(resultBlock.replace(/\*\*/g, ''))}</p>
    <p>— ${escapeHtml(APP_NAME)}</p>
  `;

  await sendMail({
    to: params.to,
    subject: `${APP_NAME}: Issue #${params.issueId} resolved`,
    text,
    html,
  });
}
