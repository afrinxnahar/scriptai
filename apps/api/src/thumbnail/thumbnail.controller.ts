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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateThumbnailSchema, type CreateThumbnailInput } from '@repo/validation';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { getUserId } from '../common/get-user-id';
import type { Observable } from 'rxjs';
import { ThumbnailService } from './thumbnail.service';
import { createJobSSE } from '../common/sse';

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
    return this.thumbnailService.createJob(
      getUserId(req),
      body,
      files?.referenceImage?.[0],
      files?.faceImage?.[0],
    );
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  async listJobs(@Req() req: AuthRequest) {
    return this.thumbnailService.listJobs(getUserId(req));
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  async getJob(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.thumbnailService.getJob(id, getUserId(req));
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  async deleteJob(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.thumbnailService.deleteJob(id, getUserId(req));
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {
    return createJobSSE({
      queue: this.queue,
      jobId,
      req,
      getMessages: {
        active: 'Generating thumbnails...',
        completed: 'Thumbnails generated!',
        failed: 'Generation failed',
      },
      extractResult: (job) => ({ imageUrls: job.returnvalue?.imageUrls }),
    });
  }
}
