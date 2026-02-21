import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(SupabaseAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('report-issue')
  reportIssue(@Body() body: { subject: string; email: string; body: string }) {
    return this.supportService.reportIssue(body.subject, body.email, body.body);
  }
}
