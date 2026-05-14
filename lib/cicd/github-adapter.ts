// GitHub Actions adapter — fetches workflow runs, jobs, deployments

import type { Pipeline, CICDJob, BuildStatus } from '@/types/cicd';
import type { GitHubConfig } from '@/types/cicd';

function ghStatus(status: string, conclusion: string | null): BuildStatus {
  if (status === 'in_progress' || status === 'queued') return 'running';
  if (status === 'completed') {
    switch (conclusion) {
      case 'success': return 'success';
      case 'failure': return 'failed';
      case 'cancelled': return 'cancelled';
      case 'skipped': return 'skipped';
      default: return 'failed';
    }
  }
  return 'pending';
}

export async function fetchGitHubPipelines(
  config: GitHubConfig,
  connectionId: string,
  connectionName: string,
): Promise<Pipeline[]> {
  const { token, owner, repo } = config;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'QA360-CI',
  };

  // Fetch workflow runs
  const runsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=30`,
    { headers },
  );

  if (!runsRes.ok) {
    const body = await runsRes.text();
    throw new Error(`GitHub API error ${runsRes.status}: ${body}`);
  }

  const runsData = await runsRes.json();
  const runs = runsData.workflow_runs ?? [];

  // Fetch deployments for isDeployment flag
  const deploymentsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/deployments?per_page=20`,
    { headers },
  );
  const deploymentsData = deploymentsRes.ok ? await deploymentsRes.json() : [];
  const deploymentShas = new Set<string>(deploymentsData.map((d: { sha: string }) => d.sha));

  const pipelines: Pipeline[] = await Promise.all(
    runs.map(async (run: Record<string, unknown>): Promise<Pipeline> => {
      const status = ghStatus(run.status as string, run.conclusion as string | null);
      const startedAt = run.run_started_at as string || run.created_at as string;
      const finishedAt = run.updated_at as string || null;
      const duration = startedAt && finishedAt && status !== 'running'
        ? new Date(finishedAt).getTime() - new Date(startedAt).getTime()
        : null;

      // Fetch jobs for this run
      let jobs: CICDJob[] = [];
      try {
        const jobsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`,
          { headers },
        );
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          jobs = (jobsData.jobs ?? []).map((j: Record<string, unknown>) => ({
            id: String(j.id),
            pipelineId: String(run.id),
            name: j.name as string,
            status: ghStatus(j.status as string, j.conclusion as string | null),
            duration: j.started_at && j.completed_at
              ? new Date(j.completed_at as string).getTime() - new Date(j.started_at as string).getTime()
              : null,
            startedAt: j.started_at as string | null,
            failureReason: (j.conclusion === 'failure' ? 'Job failed' : undefined),
          }));
        }
      } catch {
        // ignore job fetch errors
      }

      const headCommit = run.head_commit as Record<string, unknown> | null;

      return {
        id: `github-${run.id}`,
        provider: 'github',
        connectionId,
        connectionName,
        pipelineName: run.name as string || run.display_title as string || 'Workflow',
        ref: (run.head_branch as string) || 'main',
        commit: ((run.head_sha as string) || '').slice(0, 7),
        commitMessage: headCommit?.message as string || '',
        author: (headCommit?.author as Record<string, unknown>)?.name as string || (run.actor as Record<string, unknown>)?.login as string || 'unknown',
        status,
        startedAt,
        finishedAt: status !== 'running' ? finishedAt : null,
        duration,
        url: run.html_url as string || '',
        jobs,
        isDeployment: deploymentShas.has(run.head_sha as string),
        triggerType: (run.event as string) === 'push' ? 'push'
          : (run.event as string) === 'pull_request' ? 'pull_request'
          : (run.event as string) === 'schedule' ? 'schedule'
          : 'manual',
      };
    }),
  );

  return pipelines;
}
