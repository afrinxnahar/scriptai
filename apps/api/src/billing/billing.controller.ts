import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { SupabaseAuthGuard } from '../guards/auth.guard';
import type { AuthRequest } from '../common/interfaces/auth-request.interface';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('info')
  @UseGuards(SupabaseAuthGuard)
  getBillingInfo(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    return this.billingService.getBillingInfo(userId);
  }

  @Post('checkout')
  @UseGuards(SupabaseAuthGuard)
  createCheckoutSession(
    @Req() req: AuthRequest,
    @Body() body: { planId: string },
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    return this.billingService.createCheckoutSession(userId, body.planId);
  }

  @Post('portal')
  @UseGuards(SupabaseAuthGuard)
  createPortalSession(@Req() req: AuthRequest) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException();
    return this.billingService.createPortalSession(userId);
  }
}
