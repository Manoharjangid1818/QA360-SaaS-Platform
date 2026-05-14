// Jenkins adapter — fetches jobs, builds, test reports

import type { Pipeline, CICDJob, BuildStatus } from '@/types/cicd';
import type { JenkinsConfig } from '@/types/cicd';

function jenkinsStatus(result: string | null, building: boolean): BuildStatus {
  if (building) return 'running';
  switch (result) {
    case 'SUCCESS': return 'success';
    case 'FAILURE': return 'failed';
    case 'ABORTED': return 'cancelled';
    case 'UNSTABLE': return 'failed';
    case 'NOT_BUILT': return 'skipped';
    default: return 'pending';
  }
}

export async function fetchJenkinsPipelines(
  config: JenkinsConfig,
  connectionId: string,
  connectionName: string,
): Promise<Pipeline[]> {
  const { url, username, token, jobName } = config;
  const auth = Buffer.from(`${username}:${token}`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  const baseUrl = url.replace(/\/$/, '');

  // Fetch all jobs
  const jobsRes = await fetch(
    `${baseUrl}/api/json?tree=jobs[name,url,color,lastBuild[number,result,duration,timestamp,building,url,description,changeSet[items[comment,authorEmail]]],lastSuccessfulBuild[number],lastFailedBuild[number]]`,
    { headers },
  );

  if (!jobsRes.ok) {
    const body = await jobsRes.text();
    throw new Error(`Jenkins API error ${jobsRes.status}: ${body}`);
  }

  const jobsData = await jobsRes.json();
  const jobs: Record<string, unknown>[] = jobsData.jobs ?? [];

  // Filter by jobName if specified
  const filteredJobs = jobName ? jobs.filter((j) => (j.name as string) === jobName) : jobs;

  const pipelines: Pipeline[] = [];

  for (const job of filteredJobs.slice(0, 10)) {
    const lastBuild = job.lastBuild as Record<string, unknown> | null;
    if (!lastBuild) continue;

    // Fetch recent builds for this job
    let builds: Record<string, unknown>[] = [];
    try {
      const buildsRes = await fetch(
        `${baseUrl}/job/${encodeURIComponent(job.name as string)}/api/json?tree=builds[number,result,duration,timestamp,building,url,description,changeSet[items[comment,authorEmail]]]`,
        { headers },
      );
      if (buildsRes.ok) {
        const buildsData = await buildsRes.json();
        builds = (buildsData.builds ?? []).slice(0, 15);
      }
    } catch {
      builds = [lastBuild];
    }

    for (const build of builds) {
      const status = jenkinsStatus(build.result as string | null, build.building as boolean);
      const timestamp = build.timestamp as number;
      const startedAt = new Date(timestamp).toISOString();
      const duration = build.duration as number || null;
      const finishedAt = duration && status !== 'running'
        ? new Date(timestamp + (duration as number)).toISOString()
        : null;

      // Fetch test report if available
      let testResults: Pipeline['testResults'] | undefined;
      try {
        const testRes = await fetch(
          `${baseUrl}/job/${encodeURIComponent(job.name as string)}/${build.number}/testReport/api/json?tree=passCount,failCount,skipCount,totalCount`,
          { headers },
        );
        if (testRes.ok) {
          const testData = await testRes.json();
          testResults = {
            total: testData.totalCount || 0,
            passed: testData.passCount || 0,
            failed: testData.failCount || 0,
            skipped: testData.skipCount || 0,
            flaky: 0,
          };
        }
      } catch { /* no test report */ }

      const changeItems = ((build.changeSet as Record<string, unknown>)?.items as Record<string, unknown>[] | undefined) ?? [];
      const firstChange = changeItems[0];

      const cicdJobs: CICDJob[] = [
        {
          id: `jenkins-${job.name}-${build.number}-build`,
          pipelineId: `jenkins-${job.name}-${build.number}`,
          name: `Build #${build.number}`,
          status,
          duration,
          startedAt,
          failureReason: status === 'failed' ? (build.description as string) || 'Build failed' : undefined,
        },
      ];

      pipelines.push({
        id: `jenkins-${job.name}-${build.number}`,
        provider: 'jenkins',
        connectionId,
        connectionName,
        pipelineName: job.name as string,
        ref: 'main',
        commit: String(build.number),
        commitMessage: firstChange
          ? (firstChange.comment as string) || ''
          : `Build #${build.number}`,
        author: firstChange
          ? (firstChange.authorEmail as string)?.split('@')[0] || 'jenkins'
          : 'jenkins',
        status,
        startedAt,
        finishedAt,
        duration,
        url: build.url as string || `${baseUrl}/job/${job.name}/${build.number}`,
        jobs: cicdJobs,
        testResults,
        isDeployment: (job.name as string).toLowerCase().includes('deploy'),
        triggerType: 'manual',
      });
    }
  }

  return pipelines;
}
