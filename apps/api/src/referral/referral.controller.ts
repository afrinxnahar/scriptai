import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
import { TrackReferralSchema, type TrackReferralInput } from '@repo/validation';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  getReferralData(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.referralService.getReferralData(userId);
  }

  @Post('generate')
  @UseGuards(SupabaseAuthGuard)
  generateReferralCode(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.referralService.generateReferralCode(userId);
  }

  @Post('track')
  trackReferral(
    @Body(new ZodValidationPipe(TrackReferralSchema)) body: TrackReferralInput,
  ) {
    return this.referralService.trackReferral(body);
  }
}
