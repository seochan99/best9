import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const getStatus = onRequest({
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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const queueId = req.query.queueId as string;

    if (!queueId) {
      res.status(400).json({ error: 'Queue ID is required' });
      return;
    }

    const queueDoc = await db.collection('collageQueue').doc(queueId).get();

    if (!queueDoc.exists) {
      res.status(404).json({ error: 'Queue not found' });
      return;
    }

    const queueData = queueDoc.data()!;

    const response: Record<string, unknown> = {
      queueId,
      status: queueData.status,
      progress: queueData.progress,
      statusMessage: queueData.statusMessage,
      instagramUsername: queueData.instagramUsername,
    };

    if (queueData.status === 'completed') {
      response.result = {
        resultUrl: queueData.resultUrl,
        totalLikes: queueData.totalLikes,
      };
    }

    if (queueData.status === 'failed') {
      response.error = queueData.errorMessage || 'Unknown error';
    }

    if (queueData.status === 'completed' || queueData.status === 'failed') {
      res.set('Cache-Control', 'public, max-age=3600');
    } else {
      res.set('Cache-Control', 'no-cache');
    }

    res.json(response);

  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
