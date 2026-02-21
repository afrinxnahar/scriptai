import {
  Controller, Get, Post, Delete,
  Param, Body, Req, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { getUserId } from '../common/get-user-id';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { ResearchService } from './research.service';

@Controller('research')
@UseGuards(SupabaseAuthGuard)
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.researchService.list(getUserId(req));
  }

  @Post()
  create(
    @Body() body: { topic?: string; context?: string; autoResearch: boolean },
    @Req() req: AuthRequest,
  ) {
    return this.researchService.create(getUserId(req), body);
  }

  @Get(':id/export')
  async exportPdf(
    @Param('id') id: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const { pdfBytes, filename } = await this.researchService.exportPdf(id, getUserId(req));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(Buffer.from(pdfBytes));
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.researchService.getOne(id, getUserId(req));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.researchService.remove(id, getUserId(req));
  }
}
