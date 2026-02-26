import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import Stripe from 'stripe';

export interface PlanRecord {
  id: string;
  name: string;
  price_monthly: number;
  credits_monthly: number;
  features: unknown;
  is_active: boolean;
  stripe_price_id?: string;
}

interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  plans: PlanRecord;
}

@Injectable()
export class BillingService {
  private stripeInstance: Stripe | null = null;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  private getStripe(): Stripe {
    if (!this.stripeInstance) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new BadRequestException('Stripe is not configured');
      }
      this.stripeInstance = new Stripe(secretKey, {
        apiVersion: '2026-01-28.clover',
      });
    }
    return this.stripeInstance;
  }

  async getPlans(): Promise<PlanRecord[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) throw new BadRequestException('Failed to fetch plans');
    return data ?? [];
  }

  async getBillingInfo(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('user_id', userId)
      .single();

    const starterPlan = await this.getStarterPlan();

    return {
      currentPlan: subscription?.plans ?? starterPlan,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            stripeSubscriptionId: subscription.stripe_subscription_id,
          }
        : null,
      credits: profile?.credits ?? 0,
    };
  }

  async createCheckoutSession(userId: string, planId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) throw new NotFoundException('Plan not found');
    if (plan.price_monthly === 0) {
      throw new BadRequestException('Cannot purchase the free plan');
    }
    if (!plan.stripe_price_id) {
      throw new BadRequestException('Plan is not configured for payments');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (!profile?.email) throw new BadRequestException('User email not found');

    let customerId = await this.getOrCreateStripeCustomer(userId, profile.email);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_PROD_URL') ||
      this.configService.get<string>('FRONTEND_DEV_URL') ||
      'http://localhost:3000';

    const session = await this.getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard/settings?tab=billing&status=success`,
      cancel_url: `${frontendUrl}/dashboard/settings?tab=billing&status=cancelled`,
      metadata: { userId, planId },
      subscription_data: { metadata: { userId, planId } },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const customerId = await this.getStripeCustomerId(userId);
    if (!customerId) {
      throw new BadRequestException('No active subscription found');
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_PROD_URL') ||
      this.configService.get<string>('FRONTEND_DEV_URL') ||
      'http://localhost:3000';

    const session = await this.getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/dashboard/settings?tab=billing`,
    });

    return { url: session.url };
  }

  // --- Webhook handlers ---

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription') return;

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (!userId || !planId || !subscriptionId) {
      this.logger.warn('Missing metadata in checkout session');
      return;
    }

    const supabase = this.supabaseService.getClient();
    const stripeSubscription =
      await this.getStripe().subscriptions.retrieve(subscriptionId);
    const item = stripeSubscription.items.data[0];

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'past_due']);

    await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: 'active',
      current_period_start: item
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
      current_period_end: item
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
    });

    const { data: plan } = await supabase
      .from('plans')
      .select('credits_monthly')
      .eq('id', planId)
      .single();

    if (plan) {
      await supabase
        .from('profiles')
        .update({ credits: plan.credits_monthly })
        .eq('user_id', userId);
    }

    this.logger.log(`Subscription activated for user ${userId}`);
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const supabase = this.supabaseService.getClient();
    const stripeSubId = subscription.id;
    const item = subscription.items.data[0];

    const status = this.mapStripeStatus(subscription.status);

    await supabase
      .from('subscriptions')
      .update({
        status,
        current_period_start: item
          ? new Date(item.current_period_start * 1000).toISOString()
          : null,
        current_period_end: item
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
      })
      .eq('stripe_subscription_id', stripeSubId);
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const supabase = this.supabaseService.getClient();

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (sub?.user_id) {
      await supabase
        .from('profiles')
        .update({ credits: 500 })
        .eq('user_id', sub.user_id);
    }
  }

  async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subDetails = invoice.parent?.subscription_details;
    if (!subDetails?.subscription) return;

    const subscriptionId =
      typeof subDetails.subscription === 'string'
        ? subDetails.subscription
        : subDetails.subscription.id;

    const supabase = this.supabaseService.getClient();

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id, plan_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!sub) return;

    const { data: plan } = await supabase
      .from('plans')
      .select('credits_monthly')
      .eq('id', sub.plan_id)
      .single();

    if (plan) {
      await supabase
        .from('profiles')
        .update({ credits: plan.credits_monthly })
        .eq('user_id', sub.user_id);
    }
  }

  // --- Helpers ---

  private async getOrCreateStripeCustomer(
    userId: string,
    email: string,
  ): Promise<string> {
    const supabase = this.supabaseService.getClient();

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      return existingSub.stripe_customer_id;
    }

    const customer = await this.getStripe().customers.create({
      email,
      metadata: { supabase_user_id: userId },
    });

    return customer.id;
  }

  private async getStripeCustomerId(
    userId: string,
  ): Promise<string | null> {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    return data?.stripe_customer_id ?? null;
  }

  private async getStarterPlan(): Promise<PlanRecord | null> {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('name', 'Starter')
      .single();
    return data;
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): string {
    const map: Record<string, string> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'unpaid',
      trialing: 'trialing',
      incomplete: 'incomplete',
      incomplete_expired: 'canceled',
      paused: 'paused',
    };
    return map[status] ?? 'canceled';
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    return this.getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
