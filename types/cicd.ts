// CI/CD Integration — TypeScript types

export type Provider = 'github' | 'jenkins' | 'gitlab';
export type BuildStatus = 'success' | 'failed' | 'running' | 'pending' | 'cancelled' | 'skipped';
export type ConnectionStatus = 'connected' | 'error' | 'disconnected' | 'syncing';

// ─── Connections ──────────────────────────────────────────────────────────────

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface JenkinsConfig {
  url: string;
  username: string;
  token: string;
  jobName?: string;
}

export interface GitLabConfig {
  token: string;
  projectId: string;
  gitlabUrl?: string; // default: gitlab.com
}

export type ProviderConfig = GitHubConfig | JenkinsConfig | GitLabConfig;

export interface Connection {
  id: string;
  provider: Provider;
  name: string;
  maskedToken: string;
  config: Partial<GitHubConfig & JenkinsConfig & GitLabConfig>;
  status: ConnectionStatus;
  lastSyncAt: string | null;
  error?: string;
  pipelineCount: number;
}

// ─── Pipeline / Build ─────────────────────────────────────────────────────────

export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
}

export interface CICDJob {
  id: string;
  pipelineId: string;
  name: string;
  status: BuildStatus;
  duration: number | null;
  startedAt: string | null;
  failureReason?: string;
  logs?: string;
  artifacts?: string[];
}

export interface Pipeline {
  id: string;
  provider: Provider;
  connectionId: string;
  connectionName: string;
  pipelineName: string;
  ref: string;
  commit: string;
  commitMessage: string;
  author: string;
  authorAvatar?: string;
  status: BuildStatus;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  url: string;
  jobs: CICDJob[];
  testResults?: TestResults;
  isDeployment: boolean;
  environment?: string;
  triggerType: 'push' | 'pull_request' | 'manual' | 'schedule' | 'webhook';
}

// ─── Chart data ───────────────────────────────────────────────────────────────

export interface BuildDataPoint {
  date: string;
  passed: number;
  failed: number;
  cancelled: number;
  total: number;
  avgDuration: number;
  github: number;
  jenkins: number;
  gitlab: number;
}

export interface DeployDataPoint {
  week: string;
  deploys: number;
  successRate: number;
}

export interface FlakyTrend {
  date: string;
  flakyRate: number;
  occurrences: number;
}

// ─── Flaky Tests ──────────────────────────────────────────────────────────────

export interface FlakyTest {
  id: string;
  name: string;
  suite: string;
  provider: Provider;
  failureRate: number;
  passCount: number;
  failCount: number;
  totalRuns: number;
  lastSeen: string;
  firstSeen: string;
  affectedBranches: string[];
  impactedTestCases: string[];
  trend: 'improving' | 'worsening' | 'stable';
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface CICDStats {
  totalBuilds: number;
  successRate: number;
  avgBuildTime: number;
  deployFrequency: number;
  activePipelines: number;
  flakyTests: number;
  connectedProviders: number;
  failedBuilds: number;
  totalDeployments: number;
  buildTrend: BuildDataPoint[];
  deployTrend: DeployDataPoint[];
  flakyTrend: FlakyTrend[];
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface WebhookEvent {
  id: string;
  provider: Provider;
  event: string;
  payload: Record<string, unknown>;
  receivedAt: string;
  processed: boolean;
  triggered: boolean;
}

// ─── Connect input ────────────────────────────────────────────────────────────

export interface ConnectInput {
  provider: Provider;
  name: string;
  token: string;
  owner?: string;
  repo?: string;
  url?: string;
  username?: string;
  projectId?: string;
  gitlabUrl?: string;
}
