import { Body, Controller, Post, Req, Sse, Param, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { trainAiSchema, type TrainAiDto } from '@repo/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { Request } from 'express';
import { Observable } from 'rxjs';

interface AuthRequest extends Request {
  user?: { id: string };
}

interface JobEvent {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  message: string;
  logs?: string[];
  error?: string;
  finished: boolean;
}

@Controller('train-ai')

export class TrainAiController {
  constructor(@InjectQueue('train-ai') private readonly queue: Queue) { }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  async trainAi(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(trainAiSchema)) dto: TrainAiDto
  ): Promise<{ message: string; jobId: string }> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    const jobId = `train-ai-${userId}-${Date.now()}`;
    await this.queue.add('train-ai', { ...dto, userId }, { jobId });
    return { message: 'Training queued', jobId };
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {

    return new Observable((observer) => {
      let closed = false;

      const sendEvent = (data: JobEvent) => {
        if (!closed) observer.next({ data: JSON.stringify(data) } as MessageEvent);
      };

      // Initial queued state
      sendEvent({ state: 'waiting', progress: 0, message: 'Job queued...', finished: false });

      // Poll every 2s (scalable; low Redis load)
      const interval = setInterval(async () => {
        if (closed) return;

        try {
          const job: Job | undefined = await this.queue.getJob(jobId);
          if (!job) {
            sendEvent({ state: 'failed', progress: 0, message: 'Job not found', finished: true });
            observer.complete();
            return;
          }

          const rawState = await job.getState();
          const progress = typeof job.progress === 'number' ? job.progress : 0;
          const logs = (await this.queue.getJobLogs(jobId, 0, 100))?.logs ?? []; // Last 100 logs

          // Map potentially broader JobState (e.g. 'delayed', 'paused', etc.) to the narrow set we expose
          const state = (rawState === 'completed' ? 'completed'
            : rawState === 'failed' ? 'failed'
              : rawState === 'active' ? 'active'
                : 'waiting') as 'waiting' | 'active' | 'completed' | 'failed';

          sendEvent({
            state,
            progress,
            logs,
            message: state === 'completed' ? 'Training completed!' :
              state === 'failed' ? 'Training failed - check logs' :
                state === 'active' ? 'Processing...' : 'In queue...',
            error: state === 'failed' ? (job.failedReason || '') : undefined,
            finished: ['completed', 'failed'].includes(state),
          });

          if (['completed', 'failed'].includes(state)) {
            clearInterval(interval);
            observer.complete();
          }
        } catch (err) {
          sendEvent({ state: 'failed', progress: 0, message: 'Status check failed', finished: true });
          observer.complete();
        }
      }, 2000);

      // Cleanup on disconnect
      req.on('close', () => {
        closed = true;
        clearInterval(interval);
        observer.complete();
      });
    });
  }
}