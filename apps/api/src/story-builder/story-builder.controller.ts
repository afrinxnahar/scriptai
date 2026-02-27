import { Controller, Post, Get, Delete, Body, Req, Param, Sse, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateStoryBuilderSchema, type CreateStoryBuilderInput } from '@repo/validation';
import type { Observable } from 'rxjs';
import { StoryBuilderService } from './story-builder.service';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { getUserId } from '../common/get-user-id';
import { createJobSSE } from '../common/sse';

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
    return this.storyBuilderService.createJob(getUserId(req), body);
  }

  @Get('profile-status')
  async profileStatus(@Req() req: AuthRequest) {
    return this.storyBuilderService.getProfileStatus(getUserId(req));
  }

  @Get()
  async listJobs(@Req() req: AuthRequest) {
    return this.storyBuilderService.listJobs(getUserId(req));
  }

  @Get(':id')
  async getJob(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.storyBuilderService.getJob(id, getUserId(req));
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.storyBuilderService.deleteJob(id, getUserId(req));
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {
    return createJobSSE({
      queue: this.queue,
      jobId,
      req,
      getMessages: {
        active: 'Analyzing and structuring your story...',
        completed: 'Story structure generated!',
        failed: 'Generation failed',
      },
      extractResult: (job) => ({ result: job.returnvalue?.result }),
    });
  }
}
