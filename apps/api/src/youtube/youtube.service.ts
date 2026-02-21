import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import axios from 'axios';

const YT_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export interface ChannelVideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
}

@Injectable()
export class YoutubeService {
  private readonly supabase;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  async getVideoMetadata(videoUrl: string) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) throw new InternalServerErrorException('Server configuration error.');

    if (!videoUrl) throw new BadRequestException('videoUrl parameter is missing');

    const match = videoUrl.match(YT_REGEX);
    if (!match?.[1]) throw new BadRequestException('Invalid YouTube URL format');

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${match[1]}&key=${apiKey}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok || !data.items?.length) {
        throw new NotFoundException('Failed to fetch video details or video not found');
      }

      const snippet = data.items[0].snippet;
      const thumbnail = snippet.thumbnails.maxres || snippet.thumbnails.high || snippet.thumbnails.medium;
      return { title: snippet.title, thumbnail: thumbnail.url };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getChannelVideos(
    userId: string,
    pageToken?: string,
    maxResults = 6,
  ): Promise<{ videos: ChannelVideoItem[]; nextPageToken?: string }> {
    const { data: channel, error } = await this.supabase
      .from('youtube_channels')
      .select('channel_id, provider_token, refresh_token')
      .eq('user_id', userId)
      .single();

    if (error || !channel) {
      throw new NotFoundException('YouTube channel not found. Please connect your channel first.');
    }

    const accessToken = await this.resolveAccessToken(userId, channel);

    const searchParams: Record<string, string | number> = {
      part: 'snippet',
      forMine: 'true',
      type: 'video',
      order: 'viewCount',
      maxResults,
    };
    if (pageToken) searchParams.pageToken = pageToken;

    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: searchParams,
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000,
    }).catch(() => {
      throw new InternalServerErrorException('Failed to fetch videos from YouTube');
    });

    const items = searchRes.data.items;
    if (!items?.length) {
      return { videos: [], nextPageToken: undefined };
    }

    const videoIds = items.map((i: any) => i.id.videoId).join(',');
    const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'statistics', id: videoIds },
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15000,
    }).catch(() => null);

    const statsMap = new Map<string, number>();
    if (statsRes?.data?.items) {
      for (const v of statsRes.data.items) {
        statsMap.set(v.id, parseInt(v.statistics.viewCount, 10) || 0);
      }
    }

    const videos: ChannelVideoItem[] = items.map((item: any) => {
      const snippet = item.snippet;
      const thumb = snippet.thumbnails?.high || snippet.thumbnails?.medium || snippet.thumbnails?.default;
      return {
        id: item.id.videoId,
        title: snippet.title,
        thumbnail: thumb?.url || '',
        publishedAt: snippet.publishedAt,
        viewCount: statsMap.get(item.id.videoId) ?? 0,
      };
    });

    return { videos, nextPageToken: searchRes.data.nextPageToken };
  }

  private async resolveAccessToken(
    userId: string,
    channel: { provider_token: string; refresh_token?: string },
  ): Promise<string> {
    try {
      await axios.get('https://oauth2.googleapis.com/tokeninfo', {
        params: { access_token: channel.provider_token },
        timeout: 10000,
      });
      return channel.provider_token;
    } catch {
      // Token expired, try refresh
    }

    if (!channel.refresh_token) {
      throw new BadRequestException('YouTube connection expired. Please reconnect your channel.');
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('Server configuration error.');
    }

    try {
      const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: channel.refresh_token,
        grant_type: 'refresh_token',
      }, { timeout: 15000, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

      const newToken = tokenRes.data.access_token;

      await this.supabase
        .from('youtube_channels')
        .update({ provider_token: newToken, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      return newToken;
    } catch {
      throw new BadRequestException('YouTube connection expired. Please reconnect your channel.');
    }
  }
}
