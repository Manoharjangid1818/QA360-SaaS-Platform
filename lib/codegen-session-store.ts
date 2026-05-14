// In-memory session store for codegen sessions
// Sessions are short-lived (minutes), so in-memory is appropriate here

import type { CodegenSession } from '@/types/codegen';

interface StoredSession extends CodegenSession {
  expiresAt: number;
}

// Module-level map (persists across requests in Next.js dev / single-process deploys)
const sessions = new Map<string, StoredSession>();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(id);
    }
  }
}

export function createSession(session: CodegenSession): void {
  pruneExpired();
  sessions.set(session.id, {
    ...session,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

export function getSession(id: string): CodegenSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  if (session.expiresAt < Date.now()) {
    sessions.delete(id);
    return undefined;
  }
  return session;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function sessionCount(): number {
  pruneExpired();
  return sessions.size;
}
