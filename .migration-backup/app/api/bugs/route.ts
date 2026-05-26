// API route: GET /api/bugs, POST /api/bugs
// Uses Supabase when configured, falls back to mock data

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';
import { mockBugs } from '@/lib/mock-data';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ bugs: mockBugs });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ bugs: mockBugs });

    const { data, error } = await supabase
      .from('bugs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ bugs: data || [] });
  } catch (err) {
    console.error('GET /api/bugs error:', err);
    return NextResponse.json({ bugs: mockBugs });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, steps_to_reproduce, severity, status, test_case_id } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    const newBug = {
      id: `bug-${Date.now()}`,
      title,
      description: description || '',
      steps_to_reproduce: steps_to_reproduce || '',
      severity: severity || 'medium',
      status: status || 'open',
      test_case_id: test_case_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return NextResponse.json({ bug: newBug }, { status: 201 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return NextResponse.json({ error: 'Database not available.' }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('bugs')
      .insert({ title, description, steps_to_reproduce, severity, status, test_case_id: test_case_id || null, user_id: user?.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ bug: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/bugs error:', err);
    return NextResponse.json({ error: 'Failed to create bug.' }, { status: 500 });
  }
}
