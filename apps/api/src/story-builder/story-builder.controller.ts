import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Param,
  Sse,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateStoryBuilderSchema, type CreateStoryBuilderInput } from '@repo/validation';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { StoryBuilderService } from './story-builder.service';

import { AuthRequest } from '../common/interfaces/auth-request.interface';

interface StoryJobEvent {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: any;
  error?: string;
  finished: boolean;
}

@Controller('story-builder')
@UseGuards(SupabaseAuthGuard)
export class StoryBuilderController {
  constructor(
    @InjectQueue('story-builder') private readonly queue: Queue,
    private readonly storyBuilderService: StoryBuilderService,
  ) {}

  @Post('generate')
  async generate(
    @Body(new ZodValidationPipe(CreateStoryBuilderSchema)) body: CreateStoryBuilderInput,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.storyBuilderService.createJob(userId, body);
  }

  @Get('profile-status')
  async profileStatus(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.storyBuilderService.getProfileStatus(userId);
  }

  @Get()
  async listJobs(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.storyBuilderService.listJobs(userId);
  }

  @Get(':id')
  async getJob(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.storyBuilderService.getJob(id, userId);
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.storyBuilderService.deleteJob(id, userId);
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {
    return new Observable((observer) => {
      let closed = false;

      const sendEvent = (data: StoryJobEvent) => {
        if (!closed) observer.next({ data: JSON.stringify(data) } as MessageEvent);
      };

      sendEvent({ state: 'waiting', progress: 0, message: 'Job queued...', finished: false });

      const interval = setInterval(async () => {
        if (closed) return;

        try {
          const job: Job | undefined = await this.queue.getJob(jobId);
          if (!job) {
            sendEvent({ state: 'failed', progress: 0, message: 'Job not found', finished: true });
            clearInterval(interval);
            observer.complete();
            return;
          }

          const rawState = await job.getState();
          const progress = typeof job.progress === 'number' ? job.progress : 0;

          const state = (
            rawState === 'completed' ? 'completed'
              : rawState === 'failed' ? 'failed'
                : rawState === 'active' ? 'active'
                  : 'waiting'
          ) as StoryJobEvent['state'];

          const returnValue = job.returnvalue;

          sendEvent({
            state,
            progress,
            message:
              state === 'completed' ? 'Story structure generated!'
                : state === 'failed' ? 'Generation failed'
                  : state === 'active' ? 'Analyzing and structuring your story...'
                    : 'In queue...',
            result: state === 'completed' ? returnValue?.result : undefined,
            error: state === 'failed' ? (job.failedReason || '') : undefined,
            finished: ['completed', 'failed'].includes(state),
          });

          if (['completed', 'failed'].includes(state)) {
            clearInterval(interval);
            observer.complete();
          }
        } catch {
          sendEvent({ state: 'failed', progress: 0, message: 'Status check failed', finished: true });
          clearInterval(interval);
          observer.complete();
        }
      }, 2000);

      req.on('close', () => {
        closed = true;
        clearInterval(interval);
        observer.complete();
      });
    });
  }
}
