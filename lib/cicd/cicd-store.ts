// CI/CD Integration — in-memory store with demo data seed

import type {
  Connection,
  Pipeline,
  BuildDataPoint,
  DeployDataPoint,
  FlakyTrend,
  FlakyTest,
  CICDStats,
  WebhookEvent,
  Provider,
  BuildStatus,
  ConnectInput,
} from '@/types/cicd';

// ─── Store ────────────────────────────────────────────────────────────────────

const connections = new Map<string, Connection>();
const pipelines: Pipeline[] = [];
const webhookEvents: WebhookEvent[] = [];
let seeded = false;

// ─── Connection CRUD ──────────────────────────────────────────────────────────

export function addConnection(input: ConnectInput): Connection {
  const id = `conn-${input.provider}-${Date.now()}`;
  const masked = `${input.token.slice(0, 4)}${'•'.repeat(12)}${input.token.slice(-4)}`;

  const conn: Connection = {
    id,
    provider: input.provider,
    name: input.name,
    maskedToken: masked,
    config: {
      owner: input.owner,
      repo: input.repo,
      url: input.url,
      username: input.username,
      projectId: input.projectId,
      gitlabUrl: input.gitlabUrl,
    },
    status: 'connected',
    lastSyncAt: null,
    pipelineCount: 0,
  };

  // Remove any existing connection for this provider (one per provider)
  for (const [key, c] of connections.entries()) {
    if (c.provider === input.provider) connections.delete(key);
  }

  connections.set(id, conn);
  return conn;
}

export function getConnection(id: string): Connection | undefined {
  return connections.get(id);
}

export function getConnections(): Connection[] {
  return Array.from(connections.values());
}

export function getConnectionByProvider(provider: Provider): Connection | undefined {
  return Array.from(connections.values()).find((c) => c.provider === provider);
}

export function updateConnection(id: string, updates: Partial<Connection>): void {
  const c = connections.get(id);
  if (c) connections.set(id, { ...c, ...updates });
}

export function removeConnection(id: string): void {
  const c = connections.get(id);
  if (c) {
    // Remove pipelines from this connection
    const idx: number[] = [];
    pipelines.forEach((p, i) => { if (p.connectionId === id) idx.push(i); });
    idx.reverse().forEach((i) => pipelines.splice(i, 1));
    connections.delete(id);
  }
}

// ─── Pipeline store ───────────────────────────────────────────────────────────

export function addPipelines(newPipelines: Pipeline[]): void {
  for (const p of newPipelines) {
    const idx = pipelines.findIndex((e) => e.id === p.id);
    if (idx >= 0) pipelines[idx] = p;
    else pipelines.unshift(p);
  }
  // Keep latest 200
  if (pipelines.length > 200) pipelines.splice(200);
}

export function getAllPipelines(): Pipeline[] {
  return pipelines;
}

export function getPipelinesByProvider(provider: Provider): Pipeline[] {
  return pipelines.filter((p) => p.provider === provider);
}

// ─── Webhook events ───────────────────────────────────────────────────────────

export function addWebhookEvent(event: WebhookEvent): void {
  webhookEvents.unshift(event);
  if (webhookEvents.length > 100) webhookEvents.splice(100);
}

export function getWebhookEvents(): WebhookEvent[] {
  return webhookEvents.slice(0, 20);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function getStats(): CICDStats {
  const all = pipelines;
  const completed = all.filter((p) => p.status !== 'running' && p.status !== 'pending');
  const succeeded = all.filter((p) => p.status === 'success');
  const failed = all.filter((p) => p.status === 'failed');
  const running = all.filter((p) => p.status === 'running');

  const durations = completed.filter((p) => p.duration).map((p) => p.duration!);
  const avgBuildTime = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : 0;

  const today = new Date();
  const last30 = new Date(today);
  last30.setDate(last30.getDate() - 30);

  // Build trend — 30 days
  const buildTrend: BuildDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayPipelines = pipelines.filter((p) => p.startedAt.startsWith(dateStr));
    const dp: BuildDataPoint = {
      date: dateStr,
      passed: dayPipelines.filter((p) => p.status === 'success').length,
      failed: dayPipelines.filter((p) => p.status === 'failed').length,
      cancelled: dayPipelines.filter((p) => p.status === 'cancelled').length,
      total: dayPipelines.length,
      avgDuration: dayPipelines.filter((p) => p.duration).reduce((s, p) => s + p.duration!, 0) /
        (dayPipelines.filter((p) => p.duration).length || 1),
      github: dayPipelines.filter((p) => p.provider === 'github').length,
      jenkins: dayPipelines.filter((p) => p.provider === 'jenkins').length,
      gitlab: dayPipelines.filter((p) => p.provider === 'gitlab').length,
    };
    buildTrend.push(dp);
  }

  // Deploy trend — 8 weeks
  const deployTrend: DeployDataPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekDeployments = pipelines.filter(
      (p) => p.isDeployment && new Date(p.startedAt) >= weekStart && new Date(p.startedAt) < weekEnd,
    );
    const weekSucceeded = weekDeployments.filter((p) => p.status === 'success');
    deployTrend.push({
      week: `W${i === 0 ? 'now' : `-${i}`}`,
      deploys: weekDeployments.length,
      successRate: weekDeployments.length > 0
        ? Math.round((weekSucceeded.length / weekDeployments.length) * 100)
        : 0,
    });
  }

  // Flaky trend — 14 days
  const flakyTrend: FlakyTrend[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayFlaky = pipelines.filter(
      (p) => p.startedAt.startsWith(dateStr) && (p.testResults?.flaky ?? 0) > 0,
    );
    const totalTests = dayFlaky.reduce((s, p) => s + (p.testResults?.total ?? 0), 0);
    const flakyTotal = dayFlaky.reduce((s, p) => s + (p.testResults?.flaky ?? 0), 0);
    flakyTrend.push({
      date: dateStr,
      flakyRate: totalTests > 0 ? Math.round((flakyTotal / totalTests) * 100) : 0,
      occurrences: flakyTotal,
    });
  }

  const deployments = pipelines.filter((p) => p.isDeployment);
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 7);
  const weekDeploys = deployments.filter((p) => new Date(p.startedAt) >= last7).length;

  return {
    totalBuilds: all.length,
    successRate: completed.length > 0 ? Math.round((succeeded.length / completed.length) * 100) : 100,
    avgBuildTime,
    deployFrequency: weekDeploys,
    activePipelines: running.length,
    flakyTests: getDemoFlakyTests().length,
    connectedProviders: connections.size,
    failedBuilds: failed.length,
    totalDeployments: deployments.length,
    buildTrend,
    deployTrend,
    flakyTrend,
  };
}

// ─── Flaky tests ──────────────────────────────────────────────────────────────

export function getDemoFlakyTests(): FlakyTest[] {
  return [
    {
      id: 'flk-001',
      name: 'should complete checkout with Stripe payment',
      suite: 'Checkout Flow Tests',
      provider: 'github',
      failureRate: 0.32,
      passCount: 34,
      failCount: 16,
      totalRuns: 50,
      lastSeen: new Date(Date.now() - 2 * 3600000).toISOString(),
      firstSeen: new Date(Date.now() - 14 * 86400000).toISOString(),
      affectedBranches: ['main', 'staging', 'feat/payment-v2'],
      impactedTestCases: ['TC-142', 'TC-143', 'TC-156'],
      trend: 'worsening',
    },
    {
      id: 'flk-002',
      name: 'user login with 2FA — timeout on OTP step',
      suite: 'Auth Flow Tests',
      provider: 'jenkins',
      failureRate: 0.18,
      passCount: 41,
      failCount: 9,
      totalRuns: 50,
      lastSeen: new Date(Date.now() - 6 * 3600000).toISOString(),
      firstSeen: new Date(Date.now() - 21 * 86400000).toISOString(),
      affectedBranches: ['main'],
      impactedTestCases: ['TC-088', 'TC-091'],
      trend: 'stable',
    },
    {
      id: 'flk-003',
      name: 'product image gallery — lazy load race condition',
      suite: 'Full Regression Suite',
      provider: 'gitlab',
      failureRate: 0.24,
      passCount: 38,
      failCount: 12,
      totalRuns: 50,
      lastSeen: new Date(Date.now() - 18 * 3600000).toISOString(),
      firstSeen: new Date(Date.now() - 8 * 86400000).toISOString(),
      affectedBranches: ['main', 'feat/image-optimization'],
      impactedTestCases: ['TC-201', 'TC-202', 'TC-205'],
      trend: 'improving',
    },
    {
      id: 'flk-004',
      name: 'search autocomplete — debounce timing',
      suite: 'Smoke Tests',
      provider: 'github',
      failureRate: 0.12,
      passCount: 44,
      failCount: 6,
      totalRuns: 50,
      lastSeen: new Date(Date.now() - 26 * 3600000).toISOString(),
      firstSeen: new Date(Date.now() - 5 * 86400000).toISOString(),
      affectedBranches: ['feat/search-v3'],
      impactedTestCases: ['TC-317'],
      trend: 'improving',
    },
    {
      id: 'flk-005',
      name: 'email notification delivery verification',
      suite: 'API Integration Tests',
      provider: 'gitlab',
      failureRate: 0.44,
      passCount: 28,
      failCount: 22,
      totalRuns: 50,
      lastSeen: new Date(Date.now() - 1 * 3600000).toISOString(),
      firstSeen: new Date(Date.now() - 30 * 86400000).toISOString(),
      affectedBranches: ['main', 'staging', 'fix/email-service'],
      impactedTestCases: ['TC-411', 'TC-415', 'TC-419', 'TC-421'],
      trend: 'worsening',
    },
  ];
}

// ─── Seed demo data ───────────────────────────────────────────────────────────

export function seedDemoData(): void {
  if (seeded) return;
  seeded = true;

  const authors = ['alice', 'bob', 'carol', 'dave', 'eve'];
  const branches = ['main', 'main', 'main', 'staging', 'feat/auth', 'feat/payment', 'fix/bug-123'];
  const commitMessages = [
    'feat: add dark mode toggle',
    'fix: resolve checkout timeout issue',
    'chore: update dependencies',
    'feat: improve search performance',
    'fix: auth token refresh race condition',
    'feat: add payment retry logic',
    'refactor: clean up API layer',
    'fix: image lazy loading on mobile',
    'feat: add flaky test detection',
    'chore: bump Node to 20',
  ];
  const workflowNames = {
    github: ['CI', 'Deploy to Staging', 'Deploy to Production', 'Run Tests'],
    jenkins: ['Build & Test', 'Nightly Regression', 'Deploy Pipeline'],
    gitlab: ['pipeline', 'staging-deploy', 'prod-deploy', 'test-suite'],
  };

  const providers: Provider[] = ['github', 'jenkins', 'gitlab'];
  const statuses: BuildStatus[] = ['success', 'success', 'success', 'failed', 'success', 'success', 'cancelled'];
  const triggerTypes = ['push', 'push', 'pull_request', 'manual', 'schedule'] as const;

  const today = new Date();

  // Generate 30 days × ~6 pipelines/day across 3 providers
  for (let day = 29; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);

    for (let j = 0; j < 6; j++) {
      const provider = providers[j % 3];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const startedAt = new Date(date);
      startedAt.setHours(Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 60), 0, 0);
      const duration = status === 'running' ? null : Math.floor(Math.random() * 600000) + 60000;
      const finishedAt = duration ? new Date(startedAt.getTime() + duration).toISOString() : null;
      const workflows = workflowNames[provider];
      const wfName = workflows[Math.floor(Math.random() * workflows.length)];
      const isDeployment = wfName.toLowerCase().includes('deploy');
      const ref = branches[Math.floor(Math.random() * branches.length)];
      const commit = Math.random().toString(16).slice(2, 9);
      const total = Math.floor(Math.random() * 80) + 20;
      const failed = status === 'failed' ? Math.floor(Math.random() * 8) + 1 : 0;
      const flaky = Math.random() < 0.2 ? Math.floor(Math.random() * 4) + 1 : 0;

      const jobs: import('@/types/cicd').CICDJob[] = [
        { id: `j-${commit}-1`, pipelineId: commit, name: 'setup', status: 'success', duration: 15000, startedAt: startedAt.toISOString() },
        { id: `j-${commit}-2`, pipelineId: commit, name: 'lint & type-check', status: status === 'failed' && Math.random() < 0.3 ? 'failed' : 'success', duration: 45000, startedAt: startedAt.toISOString() },
        { id: `j-${commit}-3`, pipelineId: commit, name: 'unit tests', status: status === 'failed' && Math.random() < 0.5 ? 'failed' : 'success', duration: 120000, startedAt: startedAt.toISOString(), failureReason: status === 'failed' ? 'AssertionError: expected 200, got 422' : undefined },
        { id: `j-${commit}-4`, pipelineId: commit, name: 'e2e tests', status, duration: duration ? duration - 180000 : null, startedAt: startedAt.toISOString(), failureReason: status === 'failed' ? `${failed} Playwright test(s) failed` : undefined },
        ...(isDeployment ? [{ id: `j-${commit}-5`, pipelineId: commit, name: 'deploy', status: status === 'success' ? 'success' as BuildStatus : 'failed' as BuildStatus, duration: 60000, startedAt: startedAt.toISOString() }] : []),
      ];

      pipelines.push({
        id: `${provider}-${commit}-${day}-${j}`,
        provider,
        connectionId: `demo-${provider}`,
        connectionName: provider === 'github' ? 'My GitHub' : provider === 'jenkins' ? 'Jenkins CI' : 'GitLab',
        pipelineName: wfName,
        ref,
        commit,
        commitMessage: commitMessages[Math.floor(Math.random() * commitMessages.length)],
        author: authors[Math.floor(Math.random() * authors.length)],
        status: day === 0 && j === 0 ? 'running' : status,
        startedAt: startedAt.toISOString(),
        finishedAt,
        duration,
        url: `https://${provider === 'github' ? 'github.com' : provider === 'jenkins' ? 'jenkins.example.com' : 'gitlab.com'}/run/${commit}`,
        jobs,
        testResults: status !== 'cancelled'
          ? { total, passed: total - failed - flaky, failed, skipped: 0, flaky }
          : undefined,
        isDeployment,
        environment: isDeployment ? (wfName.toLowerCase().includes('prod') ? 'production' : 'staging') : undefined,
        triggerType: triggerTypes[Math.floor(Math.random() * triggerTypes.length)],
      });
    }
  }
}
