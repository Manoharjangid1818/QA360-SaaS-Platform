// GET /api/cicd — dashboard stats + connections + recent pipelines

import { NextResponse } from 'next/server';
import { ensureInitialized, getRecentPipelines } from '@/lib/cicd/cicd-service';
import { getConnections, getStats, getDemoFlakyTests } from '@/lib/cicd/cicd-store';

export async function GET() {
  ensureInitialized();
  const connections = getConnections();
  const stats = getStats();
  const pipelines = getRecentPipelines(40);
  const flakyTests = getDemoFlakyTests();

  return NextResponse.json({ connections, stats, pipelines, flakyTests });
}
