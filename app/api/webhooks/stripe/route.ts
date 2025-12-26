/**
 * 💳 PorVerse V2 - Stripe Webhook Handler
 * Production-grade webhook processing
 * 
 * @version 2.0.0 - WAVE 2 UPGRADED
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { sendSubscriptionEmail } from '@/lib/email/sender'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// ============================================================================
// 🎯 WEBHOOK HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    console.error('❌ Missing Stripe signature')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  // PASUL 1: Verifică semnătura
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // PASUL 2: Procesează event-ul
  try {
    console.log(`📥 Webhook event: ${event.type}`)

    switch (event.type) {
      // ========================================================================
      // CHECKOUT
      // ========================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('✅ Checkout completed:', session.id)

        // Salvează payment
        const { error: paymentError } = await supabase.from('payments').insert({
          user_id: session.metadata?.userId,
          stripe_session_id: session.id,
          stripe_customer_id: session.customer as string,
          amount: session.amount_total,
          currency: session.currency,
          status: 'completed',
          product_id: session.metadata?.productId,
          metadata: {
            tier: session.metadata?.tier,
            mode: session.mode,
          },
          created_at: new Date(session.created * 1000).toISOString(),
        })

        if (paymentError) {
          console.error('❌ Payment insert failed:', paymentError)
        }

        // Update user subscription
        if (session.metadata?.userId) {
          const tier = session.metadata?.tier || 'premium'

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_tier: tier,
              stripe_customer_id: session.customer as string,
              subscription_updated_at: new Date().toISOString(),
            })
            .eq('id', session.metadata.userId)

          if (profileError) {
            console.error('❌ Profile update failed:', profileError)
          }

          // Get user email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', session.metadata.userId)
            .single()

          // Send confirmation email
          if (profile?.email) {
            await sendSubscriptionEmail(
              profile.email,
              profile.display_name || 'User',
              session.metadata.userId,
              tier
            )
          }

          console.log(`✅ Subscription activated: ${tier}`)
        }

        // Log event
        await logWebhookEvent(event.type, session.id, 'success')

        break
      }

      // ========================================================================
      // SUBSCRIPTION
      // ========================================================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('✅ Subscription created:', subscription.id)

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            stripe_subscription_id: subscription.id,
            subscription_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer as string)

        await logWebhookEvent(event.type, subscription.id, 'success')

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('✅ Subscription updated:', subscription.id)

        await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            subscription_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer as string)

        await logWebhookEvent(event.type, subscription.id, 'success')

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('✅ Subscription cancelled:', subscription.id)

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_tier: 'free',
            cancelled_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer as string)

        await logWebhookEvent(event.type, subscription.id, 'success')

        break
      }

      // ========================================================================
      // INVOICES
      // ========================================================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('✅ Payment succeeded:', invoice.id)

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            last_payment_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', invoice.customer as string)

        // Record payment
        await supabase.from('payments').insert({
          stripe_invoice_id: invoice.id,
          stripe_customer_id: invoice.customer as string,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'completed',
          created_at: new Date(invoice.created * 1000).toISOString(),
        })

        await logWebhookEvent(event.type, invoice.id, 'success')

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        console.log('⚠️ Payment failed:', invoice.id)

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            payment_failed_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', invoice.customer as string)

        await logWebhookEvent(event.type, invoice.id, 'warning')

        break
      }

      // ========================================================================
      // CUSTOMER
      // ========================================================================
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer

        console.log('✅ Customer created:', customer.id)

        await logWebhookEvent(event.type, customer.id, 'success')

        break
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer

        console.log('✅ Customer updated:', customer.id)

        // Update email if changed
        if (customer.email) {
          await supabase
            .from('profiles')
            .update({ email: customer.email })
            .eq('stripe_customer_id', customer.id)
        }

        await logWebhookEvent(event.type, customer.id, 'success')

        break
      }

      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer

        console.log('✅ Customer deleted:', customer.id)

        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: null,
            subscription_status: 'cancelled',
          })
          .eq('stripe_customer_id', customer.id)

        await logWebhookEvent(event.type, customer.id, 'success')

        break
      }

      // ========================================================================
      // DEFAULT
      // ========================================================================
      default:
        console.log(`ℹ️  Unhandled event: ${event.type}`)
        await logWebhookEvent(event.type, event.id, 'ignored')
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook handler error:', error)

    await logWebhookEvent(
      event.type,
      event.id,
      'error',
      error instanceof Error ? error.message : 'Unknown error'
    )

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// ============================================================================
// 🗄️ LOGGING
// ============================================================================

/**
 * Loghează webhook event în Supabase
 */
async function logWebhookEvent(
  eventType: string,
  eventId: string,
  status: 'success' | 'warning' | 'error' | 'ignored',
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('webhook_logs').insert({
      event_type: eventType,
      event_id: eventId,
      status,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    })

  } catch (error) {
    console.warn('⚠️ Failed to log webhook event:', error)
  }
}

/**
 * ✅ WAVE 2 - STRIPE WEBHOOK UPGRADED!
 * 
 * EVENTS HANDLED:
 * ✅ checkout.session.completed
 * ✅ customer.subscription.created
 * ✅ customer.subscription.updated
 * ✅ customer.subscription.deleted
 * ✅ invoice.payment_succeeded
 * ✅ invoice.payment_failed
 * ✅ customer.created/updated/deleted
 * 
 * FEATURES:
 * ✅ Signature verification
 * ✅ Supabase integration
 * ✅ Email notifications
 * ✅ Comprehensive logging
 * ✅ Error handling
 * ✅ Status tracking
 */