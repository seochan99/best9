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
    const { instagramUsername, year = 2025, showOverlay = true } = req.body ?? {};

    if (!instagramUsername || typeof instagramUsername !== 'string') {
      res.status(400).json({ error: 'Instagram username is required' });
      return;
    }

    const cleanUsername = instagramUsername.replace('@', '').trim().toLowerCase();

    if (!/^[a-z0-9._]{1,30}$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Invalid Instagram username format' });
      return;
    }

    if (typeof showOverlay !== 'boolean') {
      res.status(400).json({ error: 'showOverlay must be a boolean' });
      return;
    }

    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      res.status(400).json({ error: 'Invalid year' });
      return;
    }

    // 이미 완료된 콜라주가 있는지 확인 (같은 username + year + showOverlay)
    const existingQuery = await db.collection('collageQueue')
      .where('instagramUsername', '==', cleanUsername)
      .where('year', '==', parsedYear)
      .where('showOverlay', '==', showOverlay)
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      console.log(`[Cache Hit] Returning existing collage for @${cleanUsername}`);
      res.status(200).json({
        success: true,
        queueId: existingDoc.id,
        status: 'completed',
        cached: true,
      });
      return;
    }

    const queueId = nanoid(16);
    const now = Timestamp.now();
    const expireAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const queueDoc = {
      id: queueId,
      instagramUsername: cleanUsername,
      year: parsedYear,
      showOverlay,
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
      cached: false,
    });

  } catch (error) {
    console.error('Error creating collage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
