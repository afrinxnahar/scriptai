import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  Logger,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { BillingService } from './billing.service';

@Controller('stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature || !req.rawBody) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing signature' });
    }

    let event;
    try {
      event = this.billingService.constructWebhookEvent(req.rawBody, signature);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.billingService.handleCheckoutCompleted(event.data.object as any);
          break;
        case 'customer.subscription.updated':
          await this.billingService.handleSubscriptionUpdated(event.data.object as any);
          break;
        case 'customer.subscription.deleted':
          await this.billingService.handleSubscriptionDeleted(event.data.object as any);
          break;
        case 'invoice.paid':
          await this.billingService.handleInvoicePaid(event.data.object as any);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(`Webhook handler error: ${err}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Handler failed' });
    }

    return res.status(HttpStatus.OK).json({ received: true });
  }
}
