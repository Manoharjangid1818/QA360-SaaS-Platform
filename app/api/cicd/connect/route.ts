// POST /api/cicd/connect — add / update a CI provider connection

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, syncConnection } from '@/lib/cicd/cicd-service';
import { addConnection } from '@/lib/cicd/cicd-store';
import type { ConnectInput } from '@/types/cicd';

export async function POST(req: NextRequest) {
  ensureInitialized();

  let body: Partial<ConnectInput>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.provider) return NextResponse.json({ error: 'provider is required.' }, { status: 400 });
  if (!body.token) return NextResponse.json({ error: 'token is required.' }, { status: 400 });
  if (!body.name) return NextResponse.json({ error: 'name is required.' }, { status: 400 });

  // Provider-specific validation
  switch (body.provider) {
    case 'github':
      if (!body.owner || !body.repo) {
        return NextResponse.json({ error: 'owner and repo are required for GitHub.' }, { status: 400 });
      }
      break;
    case 'jenkins':
      if (!body.url || !body.username) {
        return NextResponse.json({ error: 'url and username are required for Jenkins.' }, { status: 400 });
      }
      break;
    case 'gitlab':
      if (!body.projectId) {
        return NextResponse.json({ error: 'projectId is required for GitLab.' }, { status: 400 });
      }
      break;
    default:
      return NextResponse.json({ error: 'Invalid provider.' }, { status: 400 });
  }

  const connection = addConnection(body as ConnectInput);

  // Attempt sync in background — don't block the response
  syncConnection(connection.id).catch((e) =>
    console.warn(`[CICD] Background sync failed for ${connection.id}:`, e),
  );

  return NextResponse.json({ connection }, { status: 201 });
}
