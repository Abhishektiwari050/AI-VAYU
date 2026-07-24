import Stripe from 'stripe';
import { supabase } from '../../../../src/lib/supabaseClient';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_vayu_stripe_key';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_vayu_webhook_secret';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripeClient;
}

/**
 * Next.js App Router Stripe Webhook Handler
 * Synchronizes checkout sessions & subscription lifecycle to Supabase `profiles` table.
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    try {
      if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // Fallback or development event payload
        event = JSON.parse(body);
      }
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle Subscription & Checkout Events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log(`[Stripe Webhook] Checkout completed for ${customerEmail}`);

        if (supabase && customerEmail) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'pro',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            })
            .eq('email', customerEmail);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        const isPro = status === 'active' || status === 'trialing';
        const tier = isPro ? 'pro' : 'free';

        console.log(`[Stripe Webhook] Subscription updated for customer ${customerId} -> Status: ${status}`);

        if (supabase) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: tier,
              stripe_subscription_id: subscription.id,
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`[Stripe Webhook] Subscription canceled for customer ${customerId}`);

        if (supabase) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Server Exception:`, err);
    return new Response(JSON.stringify({ error: 'Internal Webhook Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
