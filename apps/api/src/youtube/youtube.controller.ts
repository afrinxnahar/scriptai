import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { YoutubeService } from './youtube.service';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { getUserId } from '../common/get-user-id';

@Controller('youtube')
@UseGuards(SupabaseAuthGuard)
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('video-metadata')
  getVideoMetadata(@Query('videoUrl') videoUrl: string) {
    return this.youtubeService.getVideoMetadata(videoUrl);
  }

  @Get('channel-videos')
  getChannelVideos(
    @Req() req: AuthRequest,
    @Query('pageToken') pageToken?: string,
    @Query('maxResults') maxResults?: string,
  ) {
    const userId = getUserId(req);
    return this.youtubeService.getChannelVideos(
      userId,
      pageToken,
      maxResults ? Math.min(parseInt(maxResults, 10), 24) : 6,
    );
  }
}
