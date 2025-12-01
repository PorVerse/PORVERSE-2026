// app/api/billing/paypal/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paypalService } from '@/lib/payments/paypal-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = {
      'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
      'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig')
    };

    await paypalService.handleWebhook(body, headers);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handling failed' },
      { status: 500 }
    );
  }
}