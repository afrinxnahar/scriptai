import { Body, Controller, Post, Req, Sse, Param, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { trainAiSchema, type TrainAiDto } from '@repo/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Observable } from 'rxjs';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { getUserId } from '../common/get-user-id';
import { createJobSSE } from '../common/sse';

@Controller('train-ai')

export class TrainAiController {
  constructor(@InjectQueue('train-ai') private readonly queue: Queue) { }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  async trainAi(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(trainAiSchema)) dto: TrainAiDto
  ): Promise<{ message: string; jobId: string }> {
    const userId = getUserId(req);
    const jobId = `train-ai-${userId}-${Date.now()}`;
    await this.queue.add('train-ai', { ...dto, userId }, { jobId });
    return { message: 'Training queued', jobId };
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {
    return createJobSSE({
      queue: this.queue,
      jobId,
      req,
      includeLogs: true,
      getMessages: {
        active: 'Processing...',
        completed: 'Training completed!',
        failed: 'Training failed - check logs',
      },
    });
  }
}