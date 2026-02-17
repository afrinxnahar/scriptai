import { getSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface ScriptRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  prompt: string | null;
  context: string | null;
  tone: string | null;
  include_storytelling: boolean;
  reference_links: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

interface UpdateScriptRequest {
  title: string;
  content: string;
}

// GET: Fetch a single script by ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServer();
  const params = await context.params;
  const scriptId = params.id;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ message: 'Script not found' }, { status: 404 });
    }

    return NextResponse.json(data as ScriptRecord);
  } catch (error: unknown) {
    console.error('Error fetching script:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update a script's title and content
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServer();
  const params = await context.params;
  const scriptId = params.id;

  try {
    const body: UpdateScriptRequest = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('scripts')
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ message: 'Script not found or update failed' }, { status: 404 });
    }

    return NextResponse.json(data as ScriptRecord);
  } catch (error: unknown) {
    console.error('Error updating script:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a script by ID
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServer();
  const params = await context.params;
  const scriptId = params.id;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ message: 'Script not found or deletion failed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Script deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting script:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}