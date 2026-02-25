import Stripe from 'stripe';

// Semester configuration
const SEMESTERS = {
  'SP2026': { label: 'Spring 2026', endDate: '2026-06-15T23:59:59Z', price: 4900 },
  'FA2026': { label: 'Fall 2026', endDate: '2026-12-20T23:59:59Z', price: 4900 },
  'SP2027': { label: 'Spring 2027', endDate: '2027-06-15T23:59:59Z', price: 4900 },
  'FA2027': { label: 'Fall 2027', endDate: '2027-12-20T23:59:59Z', price: 4900 },
};

function getCurrentSemesterKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();

  // Jan 1 – Jun 15 = Spring, Jun 16 – Dec 31 = Fall
  if (month < 5 || (month === 5 && day <= 15)) {
    return `SP${year}`;
  }
  return `FA${year}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in Vercel environment variables.' });
  }

  const { userId, userEmail, courseCode } = req.body;

  if (!userId || !userEmail || !courseCode) {
    return res.status(400).json({ error: 'userId, userEmail, and courseCode are required' });
  }

  try {
    const stripe = new Stripe(stripeKey);
    const semesterKey = getCurrentSemesterKey();
    const semester = SEMESTERS[semesterKey];

    if (!semester) {
      return res.status(400).json({ error: `No semester configuration found for ${semesterKey}` });
    }

    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://aiengagementhub.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: semester.price,
            product_data: {
              name: `AI Engagement Hub — ${semester.label} Access`,
              description: `Student access through ${new Date(semester.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        semesterKey,
        semesterEndDate: semester.endDate,
      },
      success_url: `${origin}/join?payment=success&code=${encodeURIComponent(courseCode)}`,
      cancel_url: `${origin}/join?payment=cancelled&code=${encodeURIComponent(courseCode)}`,
    });

    console.log(`[Stripe] Checkout session created: ${session.id} for user ${userId}, semester ${semesterKey}`);
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session. Please try again.' });
  }
}
