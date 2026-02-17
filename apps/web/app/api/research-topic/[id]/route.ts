import { getSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface ResearchTopicRecord {
  id: string;
  user_id: string;
  topic: string;
  context?: string;
  research_data: {
    summary: string;
    keyPoints: string[];
    trends: string[];
    questions: string[];
    contentAngles: string[];
    sources: string[];
  };
  created_at: string;
  updated_at: string;
}

// GET: Fetch a single research topic by ID
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServer();
  const researchId = (await context.params).id;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('research_topics')
      .select('*')
      .eq('id', researchId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Research topic not found' }, { status: 404 });
    }

    return NextResponse.json(data as ResearchTopicRecord);
  } catch (error: unknown) {
    console.error('Error fetching research topic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a research topic by ID
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await getSupabaseServer();
  const researchId = (await context.params).id;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('research_topics')
      .delete()
      .eq('id', researchId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting research topic:', error);
      return NextResponse.json({ error: 'Failed to delete research topic' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error: unknown) {
    console.error('Error in DELETE research-topic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}