import { getSupabaseServer } from '@/lib/supabase/server';
import axios, { AxiosError } from 'axios';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const redirectUrl = new URL('/dashboard', request.url);

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      redirectUrl.searchParams.set('error', 'missing_code');
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.session) {
      console.error('Supabase auth error:', exchangeError);
      redirectUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const { provider_token, provider_refresh_token, user } = data.session;
    console.log('OAuth session data:', data);
    if (!provider_token) {
      redirectUrl.searchParams.set('error', 'no_provider_token');
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch YouTube channel data
    let channelResponse;
    try {
      channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'id,snippet,statistics,contentDetails,topicDetails,status,brandingSettings',
          mine: true,
        },
        headers: {
          Authorization: `Bearer ${provider_token}`,
        },
      });
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('YouTube API error:', axiosError.response?.data || axiosError.message);

      redirectUrl.searchParams.set('error', 'youtube_fetch_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const channelData = channelResponse.data.items?.[0];
    if (!channelData) {
      redirectUrl.searchParams.set('error', 'no_channel_data');
      return NextResponse.redirect(redirectUrl);
    }

    // Save to DB
    const channelDetails = {
      user_id: user.id,
      channel_id: channelData.id,
      provider_token,
      refresh_token: provider_refresh_token,
      channel_name: channelData.snippet.title,
      channel_description: channelData.snippet.description,
      custom_url: channelData.snippet.customUrl,
      published_at: channelData.snippet.publishedAt,
      country: channelData.snippet.country,
      thumbnail:
        channelData.snippet.thumbnails.high?.url ||
        channelData.snippet.thumbnails.medium?.url ||
        channelData.snippet.thumbnails.default?.url,
      default_language: channelData.snippet.defaultLanguage,
      view_count: parseInt(channelData.statistics.viewCount, 10),
      subscriber_count: parseInt(channelData.statistics.subscriberCount, 10),
      video_count: parseInt(channelData.statistics.videoCount, 10),
      is_linked: channelData.status.isLinked,
      text_color: channelData.brandingSettings.watch?.textColor,
      background_color: channelData.brandingSettings.watch?.backgroundColor,
      topic_details: channelData.topicDetails || {},
      updated_at: new Date().toISOString(),
    };

    const { error: channelError } = await supabase
      .from('youtube_channels')
      .upsert(channelDetails, { onConflict: 'user_id, channel_id' });

    if (channelError) {
      console.error('Error saving channel data:', channelError);
      redirectUrl.searchParams.set('error', 'save_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ youtube_connected: true })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      redirectUrl.searchParams.set('error', 'profile_update_failed');
      return NextResponse.redirect(redirectUrl);
    }

    // ✅ Success → Dashboard
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Unexpected error in YouTube callback:', err);
    redirectUrl.searchParams.set('error', 'unexpected');
    return NextResponse.redirect(redirectUrl);
  }
}
