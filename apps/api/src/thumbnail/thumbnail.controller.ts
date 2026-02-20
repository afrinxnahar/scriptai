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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateThumbnailSchema, type CreateThumbnailInput } from '@repo/validation';
import { AuthRequest } from '../common/interfaces/auth-request.interface';
import { Observable } from 'rxjs';
import { ThumbnailService } from './thumbnail.service';

interface ThumbnailJobEvent {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  message: string;
  imageUrls?: string[];
  error?: string;
  finished: boolean;
}

@Controller('thumbnail')
export class ThumbnailController {
  constructor(
    @InjectQueue('thumbnail') private readonly queue: Queue,
    private readonly thumbnailService: ThumbnailService,
  ) {}

  @Post('generate')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'referenceImage', maxCount: 1 },
      { name: 'faceImage', maxCount: 1 },
    ]),
  )
  async generate(
    @Body(new ZodValidationPipe(CreateThumbnailSchema)) body: CreateThumbnailInput,
    @UploadedFiles()
    files: {
      referenceImage?: Express.Multer.File[];
      faceImage?: Express.Multer.File[];
    },
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    return this.thumbnailService.createJob(
      userId,
      body,
      files?.referenceImage?.[0],
      files?.faceImage?.[0],
    );
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async listJobs(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.thumbnailService.listJobs(userId);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  async getJob(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.thumbnailService.getJob(id, userId);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  async deleteJob(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.thumbnailService.deleteJob(id, userId);
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {
    return new Observable((observer) => {
      let closed = false;

      const sendEvent = (data: ThumbnailJobEvent) => {
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
          ) as ThumbnailJobEvent['state'];

          const returnValue = job.returnvalue;

          sendEvent({
            state,
            progress,
            message:
              state === 'completed' ? 'Thumbnails generated!'
                : state === 'failed' ? 'Generation failed'
                  : state === 'active' ? 'Generating thumbnails...'
                    : 'In queue...',
            imageUrls: state === 'completed' ? returnValue?.imageUrls : undefined,
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
