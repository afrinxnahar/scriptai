import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class SupportService {
  private readonly resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) this.resend = new Resend(apiKey);
  }

  async reportIssue(subject: string, email: string, body: string) {
    if (!subject || !email || !body) {
      throw new BadRequestException('Missing required fields');
    }
    if (!this.resend) throw new InternalServerErrorException('Email service not configured');

    const { data, error } = await this.resend.emails.send({
      from: 'Script AI <notifications@tryscriptai.com>',
      to: 'afrin@tryscriptai.com',
      subject,
      html: `<div style="font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px;">
        <div style="background: white; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4F46E5;">🚨 New Issue Reported</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="white-space: pre-line;">${body}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #888;">Sent on ${new Date().toLocaleString()}</p>
        </div>
      </div>`,
    });

    if (error) throw new InternalServerErrorException('Failed to send issue report');
    return { success: true, data };
  }
}
