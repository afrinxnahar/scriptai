import { getSupabaseServer } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await getSupabaseServer();

  try {
    const { referralCode, userEmail } = await request.json();
    if (!referralCode || !userEmail) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });

    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    const normalizedReferralCode = referralCode.toUpperCase().trim();
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id, user_id, email, referral_code, total_referrals')
      .eq('referral_code', normalizedReferralCode)
      .single()
    if (referrerError || !referrer) {
      return NextResponse.json({ message: 'Invalid referral code' }, { status: 400 });
    }

    if (referrer.email?.toLowerCase() === userEmail.toLowerCase()) {
      return NextResponse.json({
        message: 'You cannot use your own referral code',
      }, { status: 400 });
    }

    const { data: anyExistingReferral } = await supabase
      .from('referrals')
      .select('id, status, referrer_id')
      .eq('referred_email', userEmail.toLowerCase())
      .maybeSingle();

    if (anyExistingReferral) {
      // Check if it's from the same referrer
      if (anyExistingReferral.referrer_id === referrer.id) {
        return NextResponse.json(
          { message: 'This email has already been referred by you' },
          { status: 409 }
        );
      }

      // Email already used another referral code
      return NextResponse.json(
        { message: 'This email has already used a referral code' },
        { status: 409 }
      );
    }

    let referredUserId = null;
    const { data: referredUser } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('email', userEmail.toLowerCase())
      .maybeSingle();

    if (referredUser) {
      referredUserId = referredUser.user_id;

      // Additional check: prevent self-referral by user_id
      if (referredUserId === referrer.user_id) {
        return NextResponse.json({
          message: 'You cannot use your own referral code'
        }, { status: 400 });
      }
    }


    const referralData = {
      referrer_id: referrer.id,
      referral_code: normalizedReferralCode,
      status: referredUserId ? 'completed' : 'pending',
      referred_email: userEmail.toLowerCase(),
      ...(referredUserId && {
        referred_user_id: referredUserId,
        completed_at: new Date().toISOString(),
        credits_awarded: 10
      }),
    };


    const { data: createdReferral, error: createError } = await supabase
      .from('referrals')
      .insert(referralData)
      .select()
      .single();

    if (createError) {

      // Check if it's a unique constraint violation
      if (createError.code === '23505') {
        return NextResponse.json({
          message: 'This referral has already been tracked'
        }, { status: 409 });
      }

      return NextResponse.json({
        message: 'Failed to create referral'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Referral tracked successfully',
      referralId: createdReferral.id
    });



  } catch (error) {
    console.error('Error in track-referral:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
