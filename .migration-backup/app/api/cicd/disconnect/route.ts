// POST /api/cicd/disconnect — remove a provider connection

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/cicd/cicd-service';
import { getConnection, removeConnection } from '@/lib/cicd/cicd-store';

export async function POST(req: NextRequest) {
  ensureInitialized();

  let body: { connectionId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!body.connectionId) {
    return NextResponse.json({ error: 'connectionId is required.' }, { status: 400 });
  }

  if (!getConnection(body.connectionId)) {
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 });
  }

  removeConnection(body.connectionId);
  return NextResponse.json({ success: true });
}
