// GitLab CI adapter — fetches pipelines, jobs, deployments

import type { Pipeline, CICDJob, BuildStatus } from '@/types/cicd';
import type { GitLabConfig } from '@/types/cicd';

function glStatus(status: string): BuildStatus {
  switch (status) {
    case 'success': return 'success';
    case 'failed': return 'failed';
    case 'running': return 'running';
    case 'pending': return 'pending';
    case 'canceled': return 'cancelled';
    case 'skipped': return 'skipped';
    default: return 'pending';
  }
}

export async function fetchGitLabPipelines(
  config: GitLabConfig,
  connectionId: string,
  connectionName: string,
): Promise<Pipeline[]> {
  const { token, projectId, gitlabUrl = 'https://gitlab.com' } = config;
  const base = gitlabUrl.replace(/\/$/, '');
  const headers = { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' };

  // Fetch pipelines
  const pipelinesRes = await fetch(
    `${base}/api/v4/projects/${encodeURIComponent(projectId)}/pipelines?per_page=30&order_by=id&sort=desc`,
    { headers },
  );

  if (!pipelinesRes.ok) {
    const body = await pipelinesRes.text();
    throw new Error(`GitLab API error ${pipelinesRes.status}: ${body}`);
  }

  const pipelinesData: Record<string, unknown>[] = await pipelinesRes.json();

  // Fetch commits for context
  const commitsRes = await fetch(
    `${base}/api/v4/projects/${encodeURIComponent(projectId)}/repository/commits?per_page=30`,
    { headers },
  );
  const commitsData: Record<string, unknown>[] = commitsRes.ok ? await commitsRes.json() : [];
  const commitMap = new Map<string, Record<string, unknown>>(
    commitsData.map((c) => [c.id as string, c]),
  );

  // Fetch deployments
  const deploymentsRes = await fetch(
    `${base}/api/v4/projects/${encodeURIComponent(projectId)}/deployments?per_page=20`,
    { headers },
  );
  const deploymentsData: Record<string, unknown>[] = deploymentsRes.ok ? await deploymentsRes.json() : [];
  const deployedPipelineIds = new Set<number>(
    deploymentsData.map((d) => (d.deployable as Record<string, unknown>)?.pipeline_id as number),
  );

  const pipelines: Pipeline[] = await Promise.all(
    pipelinesData.map(async (pl: Record<string, unknown>): Promise<Pipeline> => {
      const status = glStatus(pl.status as string);
      const startedAt = pl.created_at as string;
      const finishedAt = pl.finished_at as string | null;
      const duration = pl.duration as number | null;
      const sha = pl.sha as string;
      const commit = commitMap.get(sha);

      // Fetch jobs for pipeline
      let jobs: CICDJob[] = [];
      try {
        const jobsRes = await fetch(
          `${base}/api/v4/projects/${encodeURIComponent(projectId)}/pipelines/${pl.id}/jobs?per_page=20`,
          { headers },
        );
        if (jobsRes.ok) {
          const jobsData: Record<string, unknown>[] = await jobsRes.json();
          jobs = jobsData.map((j) => ({
            id: String(j.id),
            pipelineId: String(pl.id),
            name: j.name as string,
            status: glStatus(j.status as string),
            duration: j.duration as number | null,
            startedAt: j.started_at as string | null,
            failureReason: j.failure_reason as string | undefined,
          }));
        }
      } catch { /* ignore */ }

      // Fetch test report
      let testResults: Pipeline['testResults'] | undefined;
      try {
        const testRes = await fetch(
          `${base}/api/v4/projects/${encodeURIComponent(projectId)}/pipelines/${pl.id}/test_report`,
          { headers },
        );
        if (testRes.ok) {
          const testData = await testRes.json();
          testResults = {
            total: testData.total_count || 0,
            passed: testData.success_count || 0,
            failed: testData.failed_count || 0,
            skipped: testData.skipped_count || 0,
            flaky: 0,
          };
        }
      } catch { /* no test report */ }

      return {
        id: `gitlab-${pl.id}`,
        provider: 'gitlab',
        connectionId,
        connectionName,
        pipelineName: (pl.name as string) || `Pipeline #${pl.id}`,
        ref: pl.ref as string || 'main',
        commit: sha.slice(0, 7),
        commitMessage: commit?.title as string || commit?.message as string || '',
        author: commit?.author_name as string || pl.user as string || 'unknown',
        status,
        startedAt,
        finishedAt,
        duration: duration ? duration * 1000 : null,
        url: pl.web_url as string || '',
        jobs,
        testResults,
        isDeployment: deployedPipelineIds.has(pl.id as number),
        environment: deployedPipelineIds.has(pl.id as number) ? 'staging' : undefined,
        triggerType: pl.source === 'push' ? 'push'
          : pl.source === 'merge_request_event' ? 'pull_request'
          : pl.source === 'schedule' ? 'schedule'
          : 'manual',
      };
    }),
  );

  return pipelines;
}
