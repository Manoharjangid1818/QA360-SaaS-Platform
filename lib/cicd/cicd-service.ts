// CI/CD Service — abstraction layer over provider adapters

import {
  getConnection,
  getConnections,
  updateConnection,
  addPipelines,
  getAllPipelines,
  seedDemoData,
} from './cicd-store';
import { fetchGitHubPipelines } from './github-adapter';
import { fetchJenkinsPipelines } from './jenkins-adapter';
import { fetchGitLabPipelines } from './gitlab-adapter';
import type { Pipeline } from '@/types/cicd';

let initialized = false;

export function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;
  seedDemoData();
}

// ─── Sync a single connection ─────────────────────────────────────────────────

export async function syncConnection(connectionId: string): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const connection = getConnection(connectionId);
  if (!connection) return { success: false, count: 0, error: 'Connection not found' };

  updateConnection(connectionId, { status: 'syncing' });

  try {
    let pipelines: Pipeline[] = [];
    const cfg = connection.config;

    switch (connection.provider) {
      case 'github':
        pipelines = await fetchGitHubPipelines(
          { token: cfg.token ?? '', owner: cfg.owner ?? '', repo: cfg.repo ?? '' },
          connectionId,
          connection.name,
        );
        break;

      case 'jenkins':
        pipelines = await fetchJenkinsPipelines(
          { url: cfg.url ?? '', username: cfg.username ?? '', token: cfg.token ?? '', jobName: cfg.jobName },
          connectionId,
          connection.name,
        );
        break;

      case 'gitlab':
        pipelines = await fetchGitLabPipelines(
          { token: cfg.token ?? '', projectId: cfg.projectId ?? '', gitlabUrl: cfg.gitlabUrl },
          connectionId,
          connection.name,
        );
        break;
    }

    addPipelines(pipelines);
    updateConnection(connectionId, {
      status: 'connected',
      lastSyncAt: new Date().toISOString(),
      pipelineCount: pipelines.length,
      error: undefined,
    });

    return { success: true, count: pipelines.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    updateConnection(connectionId, { status: 'error', error: message });
    return { success: false, count: 0, error: message };
  }
}

// ─── Sync all connections ─────────────────────────────────────────────────────

export async function syncAllConnections(): Promise<Record<string, { success: boolean; count: number; error?: string }>> {
  const connections = getConnections();
  const results: Record<string, { success: boolean; count: number; error?: string }> = {};

  await Promise.all(
    connections.map(async (c) => {
      results[c.id] = await syncConnection(c.id);
    }),
  );

  return results;
}

// ─── Trigger a pipeline ───────────────────────────────────────────────────────

export async function triggerPipeline(connectionId: string, ref = 'main'): Promise<{ success: boolean; error?: string }> {
  const connection = getConnection(connectionId);
  if (!connection) return { success: false, error: 'Connection not found' };

  const cfg = connection.config;

  try {
    switch (connection.provider) {
      case 'github': {
        // Trigger workflow dispatch
        const res = await fetch(
          `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${cfg.jobName ?? 'ci.yml'}/dispatches`,
          {
            method: 'POST',
            headers: {
              Authorization: `token ${cfg.token}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ref }),
          },
        );
        if (!res.ok) throw new Error(`GitHub trigger failed: ${res.status}`);
        break;
      }
      case 'jenkins': {
        const auth = Buffer.from(`${cfg.username}:${cfg.token}`).toString('base64');
        const res = await fetch(
          `${cfg.url}/job/${encodeURIComponent(cfg.jobName ?? 'build')}/build`,
          { method: 'POST', headers: { Authorization: `Basic ${auth}` } },
        );
        if (!res.ok && res.status !== 201) throw new Error(`Jenkins trigger failed: ${res.status}`);
        break;
      }
      case 'gitlab': {
        const res = await fetch(
          `${cfg.gitlabUrl ?? 'https://gitlab.com'}/api/v4/projects/${encodeURIComponent(cfg.projectId ?? '')}/pipeline`,
          {
            method: 'POST',
            headers: { 'PRIVATE-TOKEN': cfg.token ?? '', 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref }),
          },
        );
        if (!res.ok) throw new Error(`GitLab trigger failed: ${res.status}`);
        break;
      }
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Get recent pipelines ──────────────────────────────────────────────────────

export function getRecentPipelines(limit = 30): Pipeline[] {
  return getAllPipelines()
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}
