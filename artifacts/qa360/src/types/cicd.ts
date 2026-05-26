export type Provider = 'github' | 'jenkins' | 'gitlab';
export type BuildStatus = 'success' | 'failed' | 'running' | 'pending' | 'cancelled' | 'skipped';
export type ConnectionStatus = 'connected' | 'error' | 'disconnected' | 'syncing';

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
  gitlabUrl?: string;
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

export interface ConnectInput {
  provider: Provider;
  name: string;
  config: ProviderConfig;
}

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
}

export interface FlakyTest {
  id: string;
  name: string;
  suite: string;
  flakyRate: number;
  totalRuns: number;
  flakyRuns: number;
  lastSeen: string;
  providers: Provider[];
}

export interface CICDStats {
  totalPipelines: number;
  successRate: number;
  avgDuration: number;
  activeConnections: number;
  trendsData: { date: string; success: number; failed: number; total: number }[];
  providerBreakdown: { provider: Provider; count: number }[];
}
