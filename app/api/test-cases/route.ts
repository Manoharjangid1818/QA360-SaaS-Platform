// API route: GET /api/test-cases, POST /api/test-cases
// Uses Supabase when configured, falls back to mock data

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { mockTestCases } from '@/lib/mock-data';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ testCases: mockTestCases });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ testCases: mockTestCases });

    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ testCases: data || [] });
  } catch (err) {
    console.error('GET /api/test-cases error:', err);
    return NextResponse.json({ testCases: mockTestCases });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, steps, expected_result, priority, status } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    const newCase = {
      id: `tc-${Date.now()}`,
      title,
      description: description || '',
      steps: steps || '',
      expected_result: expected_result || '',
      priority: priority || 'medium',
      status: status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ testCase: newCase }, { status: 201 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: 'Database not available.' }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('test_cases')
      .insert({ title, description, steps, expected_result, priority, status, user_id: user?.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ testCase: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/test-cases error:', err);
    return NextResponse.json({ error: 'Failed to create test case.' }, { status: 500 });
  }
}
