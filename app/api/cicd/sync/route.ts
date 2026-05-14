// POST /api/cicd/sync — sync all or one provider

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized, syncConnection, syncAllConnections } from '@/lib/cicd/cicd-service';

export async function POST(req: NextRequest) {
  ensureInitialized();

  let body: { connectionId?: string } = {};
  try { body = await req.json(); } catch { /* no body is fine */ }

  if (body.connectionId) {
    const result = await syncConnection(body.connectionId);
    return NextResponse.json(result);
  }

  const results = await syncAllConnections();
  return NextResponse.json({ results });
}
