// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { forgotPasswordSchema, resetPasswordSchema, verifyOtpSchema } from '@repo/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { z } from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    body: z.infer<typeof forgotPasswordSchema>,
  ) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema))
    body: z.infer<typeof verifyOtpSchema>,
  ) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema))
    body: z.infer<typeof resetPasswordSchema>,
  ) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword, body.confirmNewPassword);
  }
}