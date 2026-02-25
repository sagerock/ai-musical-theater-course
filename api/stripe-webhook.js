import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Disable body parsing so we can verify the Stripe signature on the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Firebase Admin (singleton)
function getAdminFirestore() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

// Read raw body from request for Stripe signature verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error('Stripe environment variables not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(stripeKey);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, semesterKey, semesterEndDate } = session.metadata;

    if (!userId || !semesterKey || !semesterEndDate) {
      console.error('[Stripe Webhook] Missing metadata:', session.metadata);
      return res.status(400).json({ error: 'Missing required metadata' });
    }

    try {
      const adminDb = getAdminFirestore();
      const batch = adminDb.batch();

      // Payment audit record — use session.id as doc ID for idempotency
      const paymentRef = adminDb.collection('payments').doc(session.id);
      batch.set(paymentRef, {
        userId,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        semesterKey,
        semesterEndDate: Timestamp.fromDate(new Date(semesterEndDate)),
        status: session.payment_status,
        customerEmail: session.customer_email || session.customer_details?.email,
        createdAt: Timestamp.now(),
      });

      // Fast-read cache on user doc
      const userRef = adminDb.collection('users').doc(userId);
      batch.update(userRef, {
        semesterAccess: {
          semesterKey,
          semesterEndDate: Timestamp.fromDate(new Date(semesterEndDate)),
          paymentId: session.id,
          paidAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });

      await batch.commit();
      console.log(`[Stripe Webhook] Payment recorded for user ${userId}, semester ${semesterKey}`);
    } catch (error) {
      console.error('[Stripe Webhook] Firestore write error:', error.message);
      return res.status(500).json({ error: 'Failed to record payment' });
    }
  }

  // Acknowledge receipt to Stripe
  res.status(200).json({ received: true });
}
