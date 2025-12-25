import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

export const getStats = onRequest({
  memory: '256MiB',
  timeoutSeconds: 30,
  region: 'us-central1',
}, async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const statsRef = db.collection('stats').doc('global');

    await statsRef.set({
      totalVisits: FieldValue.increment(1),
    }, { merge: true });

    const statsDoc = await statsRef.get();
    const data = statsDoc.data() || { totalGenerated: 0, totalVisits: 0 };

    res.set('Cache-Control', 'public, max-age=10');
    res.json({
      totalGenerated: data.totalGenerated || 0,
      totalVisits: data.totalVisits || 0,
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
