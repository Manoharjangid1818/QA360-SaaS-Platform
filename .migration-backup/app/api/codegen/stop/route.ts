// POST /api/codegen/stop
// Terminates a codegen session and cleans up stored data.

import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/codegen-session-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
    }

    const deleted = deleteSession(sessionId);
    return NextResponse.json({ success: true, deleted });
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}
