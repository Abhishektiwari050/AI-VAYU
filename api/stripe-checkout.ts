// Vercel Serverless Function — /api/stripe-checkout
// Handles real Stripe Checkout Sessions or graceful mock fallback if no secret key is set

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { planTier = 'PRO', userEmail = 'pic.pilot@vayu.aero', currency = 'USD' } = req.body || {};

  const apiKey = process.env.STRIPE_SECRET_KEY;

  if (!apiKey) {
    // Return mock checkout session response when Stripe key is not configured in env
    return res.status(200).json({
      id: `cs_test_mock_${Date.now()}`,
      url: null,
      message: 'Mock Stripe Session initialized. Upgrading tier directly.',
      tier: planTier,
    });
  }

  try {
    const stripe = new Stripe(apiKey, { apiVersion: '2025-02-24.acacia' as any });

    const unitAmount = planTier === 'FLEET'
      ? (currency === 'INR' ? 399900 : 4900)
      : (currency === 'INR' ? 79900 : 999);

    const priceName = planTier === 'FLEET' ? 'VAYU Fleet / Flight School Tier' : 'VAYU Pro Pilot Tier';
    const origin = req.headers.referer || req.headers.origin || 'https://ai-vayu.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: priceName,
              description: 'FAR Part 91/121/135 Compliant Pre-Flight Intelligence Engine',
            },
            unit_amount: unitAmount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}?payment=success&tier=${planTier}`,
      cancel_url: `${origin}?payment=cancel`,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error('[VAYU /api/stripe-checkout] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create Stripe Checkout session.' });
  }
}
