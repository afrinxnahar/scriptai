import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { getUserId } from '../common/get-user-id';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { CourseService } from './course.service';

@Controller('course')
@UseGuards(SupabaseAuthGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('generate')
  generate(
    @Body() body: {
      topic: string;
      description?: string;
      difficulty?: string;
      videoCount?: number;
      references?: string;
    },
    @Req() req: AuthRequest,
  ) {
    return this.courseService.generate(getUserId(req), body);
  }
}
