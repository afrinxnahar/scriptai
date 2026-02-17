import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, UseGuards, UnauthorizedException, BadRequestException, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UsePipes } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubtitleService } from './subtitle.service';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateSubtitleSchema,
  UpdateSubtitleSchema,
  UpdateSubtitleByIdSchema,
  UploadVideoSchema,
  BurnSubtitleSchema,
} from '@repo/validation';
import type {
  CreateSubtitleInput,
  UpdateSubtitleInput,
  UpdateSubtitleByIdInput,
  UploadVideoInput,
  BurnSubtitleInput,
} from '@repo/validation';

interface AuthRequest extends Request {
  user?: { id: string };
}

@Controller('subtitle')
@UseGuards(SupabaseAuthGuard)
export class SubtitleController {
  constructor(private readonly subtitleService: SubtitleService) { }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateSubtitleSchema))
  create(@Body() body: CreateSubtitleInput, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.create(body, userId);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.findAll(userId);
  }


  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 200 * 1024 * 1024 }), // 200MB
          new FileTypeValidator({ fileType: /(video\/.*)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body(new ZodValidationPipe(UploadVideoSchema)) body: UploadVideoInput,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.upload(file, body, userId, file.originalname);
  }



  @Patch()
  @UsePipes(new ZodValidationPipe(UpdateSubtitleSchema))
  update(@Body() body: UpdateSubtitleInput, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.update(body, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.findOne(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.remove(id, userId);
  }

  @Patch(':id')
  updateSubtitles(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSubtitleByIdSchema)) body: UpdateSubtitleByIdInput,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }
    return this.subtitleService.updateSubtitles(id, body, userId);
  }

  @Post('burn')
  async burnSubtitle(
    @Body(new ZodValidationPipe(BurnSubtitleSchema)) body: BurnSubtitleInput,
    @Res() res: Response,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    try {
      const videoBuffer = await this.subtitleService.burnSubtitle(body);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename=video_with_subtitles.mp4');
      res.setHeader('Content-Length', videoBuffer.length.toString());
      res.send(videoBuffer);
    } catch (error) {
      console.error('Burn subtitle controller error:', error);
      if (!res.headersSent) {
        if (error instanceof BadRequestException) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
        }
      }
    }
  }
}
