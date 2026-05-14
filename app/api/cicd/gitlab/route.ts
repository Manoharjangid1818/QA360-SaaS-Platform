// GET /api/cicd/gitlab — GitLab CI-specific pipelines + stats

import { NextResponse } from 'next/server';
import { ensureInitialized } from '@/lib/cicd/cicd-service';
import { getPipelinesByProvider, getStats } from '@/lib/cicd/cicd-store';

export async function GET() {
  ensureInitialized();
  const pipelines = getPipelinesByProvider('gitlab');
  const allStats = getStats();

  const succeeded = pipelines.filter((p) => p.status === 'success').length;
  const failed = pipelines.filter((p) => p.status === 'failed').length;
  const running = pipelines.filter((p) => p.status === 'running').length;

  return NextResponse.json({
    pipelines: pipelines.slice(0, 20),
    stats: {
      total: pipelines.length,
      succeeded,
      failed,
      running,
      successRate: pipelines.length > 0 ? Math.round((succeeded / pipelines.length) * 100) : 0,
      buildTrend: allStats.buildTrend.map((d) => ({ date: d.date, value: d.gitlab })),
    },
  });
}
