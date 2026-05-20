/**
 * Notification Service Configuration
 * Supports Slack and Discord webhooks for CI/CD notifications
 * 
 * Usage:
 * ```
 * import { notifySlack, notifyDiscord } from './lib/notification-service'
 * await notifySlack('Test Suite Passed', { /* payload */ })
 * await notifyDiscord('Test Failure Alert', { /* payload */ })
 * ```
 */

export interface NotificationPayload {
  title: string;
  message: string;
  status: 'success' | 'failure' | 'warning' | 'info';
  duration?: number;
  failedTests?: number;
  passedTests?: number;
  skippedTests?: number;
  reportUrl?: string;
  screenshotUrl?: string;
  timestamp?: string;
}

/**
 * Send Slack notification
 */
export async function notifySlack(payload: NotificationPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK;
  
  if (!webhookUrl) {
    console.warn('⚠️  SLACK_WEBHOOK not configured. Skipping Slack notification.');
    return;
  }

  const color = {
    success: '#36a64f',
    failure: '#ff0000',
    warning: '#ffaa00',
    info: '#0099ff',
  }[payload.status];

  const slackPayload = {
    attachments: [
      {
        color,
        title: payload.title,
        text: payload.message,
        fields: [
          ...(payload.duration ? [{
            title: 'Duration',
            value: `${payload.duration}s`,
            short: true,
          }] : []),
          ...(payload.passedTests !== undefined ? [{
            title: '✅ Passed',
            value: `${payload.passedTests}`,
            short: true,
          }] : []),
          ...(payload.failedTests !== undefined ? [{
            title: '❌ Failed',
            value: `${payload.failedTests}`,
            short: true,
          }] : []),
          ...(payload.skippedTests !== undefined ? [{
            title: '⏭️  Skipped',
            value: `${payload.skippedTests}`,
            short: true,
          }] : []),
        ],
        ...(payload.reportUrl && {
          actions: [{
            type: 'button',
            text: 'View Report',
            url: payload.reportUrl,
          }],
        }),
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }

    console.log('✅ Slack notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send Slack notification:', error);
  }
}

/**
 * Send Discord notification
 */
export async function notifyDiscord(payload: NotificationPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK;
  
  if (!webhookUrl) {
    console.warn('⚠️  DISCORD_WEBHOOK not configured. Skipping Discord notification.');
    return;
  }

  const color = {
    success: 0x36a64f,
    failure: 0xff0000,
    warning: 0xffaa00,
    info: 0x0099ff,
  }[payload.status];

  const discordPayload = {
    embeds: [
      {
        title: payload.title,
        description: payload.message,
        color,
        fields: [
          ...(payload.duration ? [{
            name: 'Duration',
            value: `${payload.duration}s`,
            inline: true,
          }] : []),
          ...(payload.passedTests !== undefined ? [{
            name: '✅ Passed Tests',
            value: `${payload.passedTests}`,
            inline: true,
          }] : []),
          ...(payload.failedTests !== undefined ? [{
            name: '❌ Failed Tests',
            value: `${payload.failedTests}`,
            inline: true,
          }] : []),
          ...(payload.skippedTests !== undefined ? [{
            name: '⏭️  Skipped Tests',
            value: `${payload.skippedTests}`,
            inline: true,
          }] : []),
        ],
        ...(payload.reportUrl && {
          url: payload.reportUrl,
        }),
        timestamp: payload.timestamp || new Date().toISOString(),
        footer: {
          text: 'QA360 Automation Framework',
          icon_url: 'https://via.placeholder.com/50',
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      throw new Error(`Discord notification failed: ${response.statusText}`);
    }

    console.log('✅ Discord notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error);
  }
}

/**
 * Send notification to both Slack and Discord
 */
export async function notifyAll(payload: NotificationPayload): Promise<void> {
  await Promise.all([
    notifySlack(payload),
    notifyDiscord(payload),
  ]);
}
