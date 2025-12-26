// lib/payments/paypal-service.ts
// @ts-expect-error - @paypal/checkout-server-sdk has no type declarations
import paypal from '@paypal/checkout-server-sdk';

import { createClient } from '@/lib/supabase/server';

export class PayPalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const environment = process.env['PAYPAL_MODE'] === 'live'
      ? new paypal.core.LiveEnvironment(
          process.env['PAYPAL_CLIENT_ID']!,
          process.env['PAYPAL_CLIENT_SECRET']!
        )
      : new paypal.core.SandboxEnvironment(
          process.env['PAYPAL_CLIENT_ID']!,
          process.env['PAYPAL_CLIENT_SECRET']!
        );

    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  /**
   * 1. CREATE SUBSCRIPTION
   */
  async createSubscription(params: {
    userId: string;
    planId: string;
    tier: 'voyager' | 'explorer' | 'transcender';
    currency: 'USD' | 'EUR' | 'RON';
  }) {
    console.log('💳 Creating PayPal subscription:', params);

    // Map tiers to PayPal plan IDs
    const paypalPlanIds = {
      voyager: process.env['PAYPAL_VOYAGER_PLAN_ID'],
      explorer: process.env['PAYPAL_EXPLORER_PLAN_ID'],
      transcender: process.env['PAYPAL_TRANSCENDER_PLAN_ID']
    };

    const request = new paypal.subscriptions.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: paypalPlanIds[params.tier]!,
      subscriber: {
        email_address: '', // Will be filled by PayPal checkout
      },
      application_context: {
        brand_name: 'PorVerse',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env['NEXT_PUBLIC_APP_URL']}/billing/success`,
        cancel_url: `${process.env['NEXT_PUBLIC_APP_URL']}/billing/cancel`
      }
    });

    const response = await this.client.execute(request);
    
    // Salvează în database
    const supabase = await createClient();
    await supabase.from('subscriptions').insert({
      user_id: params.userId,
      payment_provider: 'paypal',
      provider_subscription_id: response.result.id,
      tier: params.tier,
      status: 'pending',
      currency: params.currency
    });

    return {
      subscriptionId: response.result.id,
      approvalUrl: response.result.links.find((l: { rel: string; href?: string }) => l.rel === 'approve')?.href
    };
  }

  /**
   * 2. CANCEL SUBSCRIPTION
   */
  async cancelSubscription(subscriptionId: string) {
    console.log('❌ Cancelling PayPal subscription:', subscriptionId);

    const request = new paypal.subscriptions.SubscriptionsCancelRequest(subscriptionId);
    request.requestBody({
      reason: 'Customer requested cancellation'
    });

    await this.client.execute(request);

    // Update în database
    const supabase = await createClient();
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('provider_subscription_id', subscriptionId);

    return { success: true };
  }

  /**
   * 3. GET SUBSCRIPTION
   */
  async getSubscription(subscriptionId: string) {
    const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);
    const response = await this.client.execute(request);
    return response.result;
  }

  /**
   * 4. HANDLE WEBHOOK
   */
  async handleWebhook(webhookBody: { event_type: string; resource: { id: string; [key: string]: unknown } }, _webhookHeaders: Record<string, unknown>) {
    console.log('🪝 PayPal webhook received:', webhookBody.event_type);

    const eventType = webhookBody.event_type;
    const resource = webhookBody.resource;
    const supabase = await createClient();

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Subscription activated
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            activated_at: new Date().toISOString()
          })
          .eq('provider_subscription_id', resource.id);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Subscription cancelled
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('provider_subscription_id', resource.id);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Payment failed, subscription suspended
        await supabase
          .from('subscriptions')
          .update({ status: 'suspended' })
          .eq('provider_subscription_id', resource.id);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Payment received - use bracket notation for index signature
        {
          const billingAgreementId = resource['billing_agreement_id'];
          const amount = resource['amount'];
          
          await supabase.from('payments').insert({
            subscription_id: typeof billingAgreementId === 'string' ? billingAgreementId : null,
            amount: typeof amount === 'object' && amount !== null && 'total' in amount 
              ? parseFloat(String(amount.total)) 
              : 0,
            currency: typeof amount === 'object' && amount !== null && 'currency' in amount 
              ? String(amount.currency) 
              : 'USD',
            status: 'completed',
            provider: 'paypal',
            provider_payment_id: resource.id
          });
        }
        break;

      default:
        console.log('Unhandled webhook:', eventType);
    }

    return { received: true };
  }
}

// Export singleton
export const paypalService = new PayPalService();