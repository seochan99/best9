import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

const db = getFirestore();
const PORTONE_API_SECRET = defineSecret('PORTONE_API_SECRET');

export const processPayment = onRequest({
  memory: '256MiB',
  timeoutSeconds: 30,
  region: 'us-central1',
  secrets: [PORTONE_API_SECRET],
}, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { paymentId, queueId } = req.body;

    if (!paymentId || !queueId) {
      res.status(400).json({ error: 'Missing paymentId or queueId' });
      return;
    }

    // Verify payment with PortOne API
    const verifyResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          'Authorization': `PortOne ${PORTONE_API_SECRET.value()}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify payment');
    }

    const paymentData = await verifyResponse.json();

    // Check if payment is successful and amount is correct (1000 KRW)
    if (paymentData.status !== 'PAID' || paymentData.amount.total < 1000) {
      res.status(400).json({ error: 'Invalid payment' });
      return;
    }

    // Update queue document with priority
    const queueRef = db.collection('collageQueue').doc(queueId);
    const queueDoc = await queueRef.get();

    if (!queueDoc.exists) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    await queueRef.update({
      priority: true,
      paidAt: Timestamp.now(),
      paymentId,
      updatedAt: Timestamp.now(),
    });

    // Update stats
    await db.collection('stats').doc('global').set({
      totalPaidSkips: FieldValue.increment(1),
    }, { merge: true });

    res.json({ success: true, message: 'Priority activated' });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});
