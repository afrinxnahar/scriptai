import { getSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch user's referral data
export async function GET() {
  const supabase = await getSupabaseServer();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral code and stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, referral_code, total_referrals, referral_credits, full_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }



    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        referred_user_id,
        status,
        credits_awarded,
        created_at,
        completed_at,
        referred_email,
        referred_user:profiles!referrals_referred_user_id_fkey(
          id,
          full_name,
          avatar_url,
          email
        )
      `)
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json({ message: 'Failed to fetch referrals' }, { status: 500 });
    }

    const pendingReferrals = referrals?.filter(r => r.status === 'pending') || [];
    const completedReferrals = referrals?.filter(r => r.status === 'completed') || [];



    return NextResponse.json({
      referralCode: profile.referral_code,
      totalReferrals: profile.total_referrals,
      referralCredits: profile.referral_credits,
      userProfile: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url
      },
      pendingReferrals: pendingReferrals,
      completedReferrals: completedReferrals
    });

  } catch (error) {
    console.error('Error in GET referrals:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Generate new referral code for user
export async function POST() {
  const supabase = await getSupabaseServer();



  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .single();
    if (profileError) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });

    }

    if (profile.referral_code) {
      return NextResponse.json({
        message: 'Referral code already exists',
        referralCode: profile.referral_code
      }, { status: 200 });
    }

    let referralCode: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      referralCode = generateReferralCode()

      const { data: existingCode } = await supabase
        .from('profile')
        .select('referral_code')
        .eq('referral_code', referralCode)
        .single();
      if (!existingCode) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: referralCode })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update referral code:', updateError);
          return NextResponse.json({ message: 'Failed to generate referral code' }, { status: 500 });
        }

        return NextResponse.json({ referralCode });
      }

      attempts++;
    }

    return NextResponse.json({
      message: 'Failed to generate unique referral code. Please try again.'
    }, { status: 500 });


  } catch (error) {
    console.error('Error in POST referrals:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }

}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map(x => chars[x % chars.length])
    .join('');
}
