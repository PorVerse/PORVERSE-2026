// app/api/billing/paypal/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { paypalService } from '@/lib/payments/paypal-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, currency = 'USD' } = body;

    // Create subscription
    const subscription = await paypalService.createSubscription({
      userId: user.id,
      planId: `paypal-${tier}`,
      tier,
      currency
    });

    return NextResponse.json({
      subscriptionId: subscription.subscriptionId,
      approvalUrl: subscription.approvalUrl
    });

  } catch (error) {
    console.error('PayPal checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}