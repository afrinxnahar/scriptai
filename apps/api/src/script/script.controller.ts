import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Req, Res, Sse, UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateScriptSchema, type CreateScriptInput } from '@repo/validation';
import { getUserId } from '../common/get-user-id';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ScriptService } from './script.service';
import { createJobSSE } from '../common/sse';

@Controller('script')
export class ScriptController {
  constructor(
    @InjectQueue('script') private readonly queue: Queue,
    private readonly scriptService: ScriptService,
  ) {}

  @Post('generate')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  generate(
    @Body(new ZodValidationPipe(CreateScriptSchema)) body: CreateScriptInput,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthRequest,
  ) {
    return this.scriptService.createJob(getUserId(req), body, files || []);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  list(@Req() req: AuthRequest) {
    return this.scriptService.list(getUserId(req));
  }

  @Get(':id/export')
  @UseGuards(SupabaseAuthGuard)
  async exportPdf(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const { pdfBytes, filename } = await this.scriptService.exportPdf(id, getUserId(req));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(Buffer.from(pdfBytes));
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  getOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.scriptService.getOne(id, getUserId(req));
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(
    @Param('id') id: string,
    @Body() body: { title: string; content: string },
    @Req() req: AuthRequest,
  ) {
    return this.scriptService.update(id, getUserId(req), body.title, body.content);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.scriptService.remove(id, getUserId(req));
  }

  @Sse('status/:jobId')
  status(@Param('jobId') jobId: string, @Req() req: AuthRequest): Observable<MessageEvent> {
    return createJobSSE({
      queue: this.queue,
      jobId,
      req,
      getMessages: {
        active: 'Generating your script...',
        completed: 'Script generated!',
        failed: 'Generation failed',
      },
      extractResult: (job) => ({
        title: job.returnvalue?.title,
        script: job.returnvalue?.script,
        creditsConsumed: job.returnvalue?.creditsConsumed ?? 0,
      }),
    });
  }
}
