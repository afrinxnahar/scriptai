import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Req, Res, UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { getUserId } from '../common/get-user-id';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ScriptService, GenerateScriptParams } from './script.service';

@Controller('script')
@UseGuards(SupabaseAuthGuard)
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.scriptService.list(getUserId(req));
  }

  @Post('generate')
  @UseInterceptors(FilesInterceptor('files'))
  generate(
    @Body() body: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthRequest,
  ) {
    const params: GenerateScriptParams = {
      prompt: body.prompt,
      context: body.context,
      tone: body.tone,
      includeStorytelling: body.includeStorytelling === 'true',
      includeTimestamps: body.includeTimestamps === 'true',
      duration: body.duration,
      references: body.references,
      language: body.language,
      personalized: body.personalized === 'true',
    };
    return this.scriptService.generate(getUserId(req), params, files || []);
  }

  @Get(':id/export')
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
  getOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.scriptService.getOne(id, getUserId(req));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title: string; content: string },
    @Req() req: AuthRequest,
  ) {
    return this.scriptService.update(id, getUserId(req), body.title, body.content);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.scriptService.remove(id, getUserId(req));
  }
}
