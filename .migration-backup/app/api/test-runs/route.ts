// API route: GET /api/test-runs, POST /api/test-runs

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { mockTestRuns } from '@/lib/mock-data';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ testRuns: mockTestRuns });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ testRuns: mockTestRuns });

    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ testRuns: data || [] });
  } catch (err) {
    console.error('GET /api/test-runs error:', err);
    return NextResponse.json({ testRuns: mockTestRuns });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, total, passed, failed, skipped, duration_ms } = body;

  if (!isSupabaseConfigured) {
    const newRun = {
      id: `run-${Date.now()}`,
      name: name || 'Test Run',
      total: total || 0,
      passed: passed || 0,
      failed: failed || 0,
      skipped: skipped || 0,
      duration_ms: duration_ms || 0,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ testRun: newRun }, { status: 201 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: 'Database not available.' }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('test_runs')
      .insert({ name, total, passed, failed, skipped, duration_ms, user_id: user?.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ testRun: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/test-runs error:', err);
    return NextResponse.json({ error: 'Failed to save test run.' }, { status: 500 });
  }
}
