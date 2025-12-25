import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';

const db = getFirestore();

export const createCollage = onRequest({
  memory: '256MiB',
  timeoutSeconds: 60,
  region: 'us-central1',
}, async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    const { instagramUsername, year = 2025 } = req.body;

    if (!instagramUsername || typeof instagramUsername !== 'string') {
      res.status(400).json({ error: 'Instagram username is required' });
      return;
    }

    const cleanUsername = instagramUsername.replace('@', '').trim().toLowerCase();

    if (!/^[a-z0-9._]{1,30}$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Invalid Instagram username format' });
      return;
    }

    const queueId = nanoid(16);
    const now = Timestamp.now();
    const expireAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const queueDoc = {
      id: queueId,
      instagramUsername: cleanUsername,
      year,
      status: 'pending',
      progress: 0,
      statusMessage: 'Waiting...',
      createdAt: now,
      updatedAt: now,
      expireAt,
    };

    await db.collection('collageQueue').doc(queueId).set(queueDoc);

    res.status(202).json({
      success: true,
      queueId,
      status: 'pending',
    });

  } catch (error) {
    console.error('Error creating collage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
