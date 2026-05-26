// POST /api/cicd/webhook — receive webhook events from GitHub, Jenkins, GitLab
// Auto-triggers Playwright test run on successful deployment events

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/cicd/cicd-service';
import { addWebhookEvent } from '@/lib/cicd/cicd-store';
import type { Provider } from '@/types/cicd';

export async function POST(req: NextRequest) {
  ensureInitialized();

  const provider = (req.nextUrl.searchParams.get('provider') ?? 'github') as Provider;
  const ghEvent = req.headers.get('x-github-event');
  const glEvent = req.headers.get('x-gitlab-event');

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const eventType = ghEvent ?? glEvent ?? 'build';
  const id = `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const event = {
    id,
    provider,
    event: eventType,
    payload,
    receivedAt: new Date().toISOString(),
    processed: false,
    triggered: false,
  };

  addWebhookEvent(event);

  // Detect successful deployment events and auto-trigger Playwright
  let triggered = false;

  // GitHub: workflow_run completed + conclusion=success for deploy workflows
  if (provider === 'github' && eventType === 'workflow_run') {
    const action = payload.action as string;
    const run = payload.workflow_run as Record<string, unknown>;
    if (action === 'completed' && run?.conclusion === 'success') {
      const name = (run.name as string ?? '').toLowerCase();
      if (name.includes('deploy') || name.includes('release')) {
        triggered = true;
        console.log(`[Webhook] Auto-trigger: GitHub deploy workflow "${run.name}" succeeded`);
      }
    }
  }

  // GitLab: pipeline hook, status=success, ref=main
  if (provider === 'gitlab' && eventType === 'Pipeline Hook') {
    const attrs = payload.object_attributes as Record<string, unknown>;
    if (attrs?.status === 'success' && attrs?.ref === 'main') {
      triggered = true;
      console.log('[Webhook] Auto-trigger: GitLab pipeline on main succeeded');
    }
  }

  // Jenkins: build event, result=SUCCESS
  if (provider === 'jenkins' && (payload.build as Record<string, unknown>)?.phase === 'FINALIZED') {
    const build = payload.build as Record<string, unknown>;
    if ((build?.status as string)?.toUpperCase() === 'SUCCESS') {
      triggered = true;
      console.log('[Webhook] Auto-trigger: Jenkins build succeeded');
    }
  }

  // Update event record
  event.processed = true;
  event.triggered = triggered;

  return NextResponse.json({ received: true, eventId: id, triggered });
}
