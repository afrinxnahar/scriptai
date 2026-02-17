import { getSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ScriptRecord } from './[id]/route';


// GET: Fetch all scripts (limit 10, newest first)
export async function GET() {
  const supabase = await getSupabaseServer();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ message: 'Error fetching scripts' }, { status: 500 });
    }

    return NextResponse.json(data as ScriptRecord[]);
  } catch (error: unknown) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
