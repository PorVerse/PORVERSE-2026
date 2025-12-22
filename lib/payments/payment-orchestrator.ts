// lib/payments/payment-orchestrator.ts
import { createClient } from '@/lib/supabase/client';

import { paypalService } from './paypal-service';

export type PaymentProvider = 'stripe' | 'paypal';

export interface PaymentConfig {
  preferredProvider?: PaymentProvider;
  enableFailover?: boolean;
  currency: 'USD' | 'EUR' | 'RON';
  tier: 'voyager' | 'explorer' | 'transcender';
}

export interface PaymentResult {
  success: boolean;
  provider: PaymentProvider;
  subscriptionId?: string;
  checkoutUrl?: string;
  error?: string;
  failedOver?: boolean;
}

export class PaymentOrchestrator {
  private supabase = createClient();

  /**
   * 1. CREATE SUBSCRIPTION
   * Încearcă provider-ul preferat, apoi failover la celălalt
   */
  async createSubscription(
    userId: string,
    config: PaymentConfig
  ): Promise<PaymentResult> {
    console.log('💳 Payment Orchestrator: Creating subscription', config);

    // Determină provider-ul de încercat
    const primaryProvider = config.preferredProvider || this.selectBestProvider(config);
    const secondaryProvider = primaryProvider === 'stripe' ? 'paypal' : 'stripe';

    // Încearcă provider-ul principal
    try {
      const result = await this.tryProvider(primaryProvider, userId, config);
      
      if (result.success) {
        console.log(`✅ Success with ${primaryProvider}`);
        return result;
      }
    } catch (error) {
      console.error(`❌ ${primaryProvider} failed:`, error);
    }

    // Dacă failover e activat, încearcă al doilea provider
    if (config.enableFailover) {
      console.log(`🔄 Failing over to ${secondaryProvider}...`);
      
      try {
        const result = await this.tryProvider(secondaryProvider, userId, config);
        
        if (result.success) {
          console.log(`✅ Failover success with ${secondaryProvider}`);
          return {
            ...result,
            failedOver: true
          };
        }
      } catch (error) {
        console.error(`❌ ${secondaryProvider} also failed:`, error);
      }
    }

    // Ambele au eșuat
    return {
      success: false,
      provider: primaryProvider,
      error: 'All payment providers failed'
    };
  }

  /**
   * 2. SELECT BEST PROVIDER
   * Alege provider-ul cel mai bun bazat pe criterii
   */
  private selectBestProvider(config: PaymentConfig): PaymentProvider {
    // Logica de selecție:
    // 1. RON → Stripe (mai bun suport)
    // 2. USD/EUR → PayPal (taxe mai mici)
    // 3. Verifică health status

    if (config.currency === 'RON') {
      return 'stripe';
    }

    // Verifică health
    const stripeHealth = this.checkProviderHealth('stripe');
    const paypalHealth = this.checkProviderHealth('paypal');

    if (stripeHealth > paypalHealth) {
      return 'stripe';
    }

    return 'paypal';
  }

  /**
   * 3. TRY PROVIDER
   * Încearcă să creeze subscription cu un provider specific
   */
  private async tryProvider(
    provider: PaymentProvider,
    userId: string,
    config: PaymentConfig
  ): Promise<PaymentResult> {
    if (provider === 'stripe') {
      return this.tryStripe(userId, config);
    } else {
      return this.tryPayPal(userId, config);
    }
  }

  /**
   * 4. TRY STRIPE
   */
  private async tryStripe(
    userId: string,
    config: PaymentConfig
  ): Promise<PaymentResult> {
    try {
      // Call Stripe API
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: config.tier,
          currency: config.currency,
          provider: 'stripe'
        })
      });

      if (!response.ok) {
        throw new Error('Stripe checkout failed');
      }

      const data = await response.json();

      // Log în database
      await this.logPaymentAttempt(userId, 'stripe', 'success', config);

      return {
        success: true,
        provider: 'stripe',
        subscriptionId: data.sessionId,
        checkoutUrl: data.url
      };
    } catch (error) {
      await this.logPaymentAttempt(userId, 'stripe', 'failed', config);
      throw error;
    }
  }

  /**
   * 5. TRY PAYPAL
   */
  private async tryPayPal(
    userId: string,
    config: PaymentConfig
  ): Promise<PaymentResult> {
    try {
      // Call PayPal API
      const response = await fetch('/api/billing/paypal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: config.tier,
          currency: config.currency
        })
      });

      if (!response.ok) {
        throw new Error('PayPal checkout failed');
      }

      const data = await response.json();

      // Log în database
      await this.logPaymentAttempt(userId, 'paypal', 'success', config);

      return {
        success: true,
        provider: 'paypal',
        subscriptionId: data.subscriptionId,
        checkoutUrl: data.approvalUrl
      };
    } catch (error) {
      await this.logPaymentAttempt(userId, 'paypal', 'failed', config);
      throw error;
    }
  }

  /**
   * 6. CHECK PROVIDER HEALTH
   * Verifică dacă provider-ul e funcțional
   */
  private checkProviderHealth(provider: PaymentProvider): number {
    // În producție, verifică:
    // - Uptime monitoring
    // - Recent success rate
    // - API response time
    
    // Pentru demo, returnează scor static
    const healthScores: Record<PaymentProvider, number> = {
      stripe: 0.95,
      paypal: 0.90
    };

    return healthScores[provider] || 0;
  }

  /**
   * 7. LOG PAYMENT ATTEMPT
   * Loghează fiecare încercare de plată
   */
  private async logPaymentAttempt(
    userId: string,
    provider: PaymentProvider,
    status: 'success' | 'failed',
    config: PaymentConfig
  ): Promise<void> {
    await this.supabase
      .from('payment_attempts')
      .insert({
        user_id: userId,
        provider,
        status,
        tier: config.tier,
        currency: config.currency,
        timestamp: new Date().toISOString()
      });
  }

  /**
   * 8. GET PAYMENT STATS
   * Statistici despre provider-e
   */
  async getPaymentStats(): Promise<{
    stripe: { success: number; failed: number; rate: number };
    paypal: { success: number; failed: number; rate: number };
  }> {
    const { data: attempts } = await this.supabase
      .from('payment_attempts')
      .select('provider, status')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const stats = {
      stripe: { success: 0, failed: 0, rate: 0 },
      paypal: { success: 0, failed: 0, rate: 0 }
    };

    (attempts || []).forEach((a: { provider: string; status: string }) => {
      if (a.status === 'success') {
        stats[a.provider as PaymentProvider].success++;
      } else {
        stats[a.provider as PaymentProvider].failed++;
      }
    });

    // Calculate success rates
    stats.stripe.rate = stats.stripe.success / 
      (stats.stripe.success + stats.stripe.failed || 1);
    stats.paypal.rate = stats.paypal.success / 
      (stats.paypal.success + stats.paypal.failed || 1);

    return stats;
  }

  /**
   * 9. CANCEL SUBSCRIPTION
   * Anulează subscription indiferent de provider
   */
  async cancelSubscription(subscriptionId: string): Promise<PaymentResult> {
    // Găsește subscription în database
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('payment_provider, provider_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      return {
        success: false,
        provider: 'stripe',
        error: 'Subscription not found'
      };
    }

    const provider = subscription.payment_provider as PaymentProvider;

    try {
      if (provider === 'stripe') {
        await fetch('/api/billing/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: subscription.provider_subscription_id })
        });
      } else {
        await paypalService.cancelSubscription(subscription.provider_subscription_id);
      }

      return {
        success: true,
        provider
      };
    } catch (error) {
      return {
        success: false,
        provider,
        error: 'Failed to cancel subscription'
      };
    }
  }
}

// Export singleton
export const paymentOrchestrator = new PaymentOrchestrator();