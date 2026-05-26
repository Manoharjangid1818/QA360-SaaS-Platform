// Notification Service — Slack, Teams, Email
// Sends alerts when tests pass, fail, or flaky tests are detected

import type { NotificationConfig, NotificationEvent, JobResult } from '@/types/schedules';

interface NotificationPayload {
  scheduleName: string;
  project: string;
  environment: string;
  testSuite: string;
  status: string;
  result: JobResult | null;
  jobId: string;
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function sendNotification(
  config: NotificationConfig,
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  const promises: Promise<void>[] = [];

  if (config.slack?.enabled && config.slack.webhookUrl) {
    if (shouldSend(config.slack.on, event)) {
      promises.push(sendSlack(config.slack.webhookUrl, event, payload));
    }
  }

  if (config.teams?.enabled && config.teams.webhookUrl) {
    if (shouldSend(config.teams.on, event)) {
      promises.push(sendTeams(config.teams.webhookUrl, event, payload));
    }
  }

  if (config.email?.enabled && config.email.recipients.length > 0) {
    if (shouldSend(config.email.on, event)) {
      promises.push(sendEmail(config.email.recipients, event, payload));
    }
  }

  await Promise.allSettled(promises);
}

function shouldSend(on: NotificationEvent[], event: NotificationEvent): boolean {
  return on.includes('all') || on.includes(event);
}

// ─── Slack ────────────────────────────────────────────────────────────────────

async function sendSlack(
  webhookUrl: string,
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  const emoji = event === 'passed' ? '✅' : event === 'flaky' ? '⚠️' : '❌';
  const color = event === 'passed' ? '#22c55e' : event === 'flaky' ? '#f59e0b' : '#ef4444';

  const fields = payload.result
    ? [
        { type: 'mrkdwn', text: `*Passed*\n${payload.result.passed}` },
        { type: 'mrkdwn', text: `*Failed*\n${payload.result.failed}` },
        { type: 'mrkdwn', text: `*Flaky*\n${payload.result.flaky}` },
        {
          type: 'mrkdwn',
          text: `*Duration*\n${Math.round((payload.result.duration ?? 0) / 1000)}s`,
        },
      ]
    : [];

  const body = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emoji} *QA360 — ${payload.scheduleName}*\n${formatEventLabel(event)}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Project*\n${payload.project}` },
              { type: 'mrkdwn', text: `*Environment*\n${payload.environment}` },
              { type: 'mrkdwn', text: `*Suite*\n${payload.testSuite}` },
              { type: 'mrkdwn', text: `*Job ID*\n\`${payload.jobId}\`` },
              ...fields,
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn(`[Notifications] Slack webhook failed: ${res.status}`);
  }
}

// ─── Microsoft Teams ──────────────────────────────────────────────────────────

async function sendTeams(
  webhookUrl: string,
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  const color = event === 'passed' ? '00B894' : event === 'flaky' ? 'FDCB6E' : 'D63031';

  const facts = [
    { name: 'Project', value: payload.project },
    { name: 'Environment', value: payload.environment },
    { name: 'Test Suite', value: payload.testSuite },
    { name: 'Job ID', value: payload.jobId },
  ];

  if (payload.result) {
    facts.push(
      { name: 'Passed', value: String(payload.result.passed) },
      { name: 'Failed', value: String(payload.result.failed) },
      { name: 'Flaky', value: String(payload.result.flaky) },
    );
  }

  const body = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: color,
    summary: `QA360 — ${payload.scheduleName} — ${formatEventLabel(event)}`,
    sections: [
      {
        activityTitle: `**QA360 — ${payload.scheduleName}**`,
        activitySubtitle: formatEventLabel(event),
        facts,
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn(`[Notifications] Teams webhook failed: ${res.status}`);
  }
}

// ─── Email (nodemailer) ───────────────────────────────────────────────────────

async function sendEmail(
  recipients: string[],
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const fromEmail = process.env.SMTP_FROM ?? 'noreply@qa360.app';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[Notifications] Email SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)');
    return;
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const emoji = event === 'passed' ? '✅' : event === 'flaky' ? '⚠️' : '❌';
  const subject = `${emoji} QA360 — ${payload.scheduleName} — ${formatEventLabel(event)}`;

  const resultHtml = payload.result
    ? `<table style="border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:4px 12px 4px 0"><b>Passed</b></td><td style="color:#22c55e">${payload.result.passed}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Failed</b></td><td style="color:#ef4444">${payload.result.failed}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Flaky</b></td><td style="color:#f59e0b">${payload.result.flaky}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Duration</b></td><td>${Math.round((payload.result.duration ?? 0) / 1000)}s</td></tr>
      </table>`
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="margin:0 0 8px">${emoji} ${payload.scheduleName}</h2>
      <p style="color:#6b7280;margin:0 0 16px">${formatEventLabel(event)}</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0"><b>Project</b></td><td>${payload.project}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Environment</b></td><td>${payload.environment}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Test Suite</b></td><td>${payload.testSuite}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><b>Job ID</b></td><td><code>${payload.jobId}</code></td></tr>
      </table>
      ${resultHtml}
    </div>`;

  await transporter.sendMail({ from: fromEmail, to: recipients.join(', '), subject, html });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventLabel(event: NotificationEvent): string {
  switch (event) {
    case 'passed': return 'All tests passed';
    case 'failed': return 'Test run failed';
    case 'flaky': return 'Flaky tests detected';
    case 'all': return 'Test run completed';
  }
}
