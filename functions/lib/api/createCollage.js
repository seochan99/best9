"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollage = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const nanoid_1 = require("nanoid");
const db = (0, firestore_1.getFirestore)();
exports.createCollage = (0, https_1.onRequest)({
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
        const queueId = (0, nanoid_1.nanoid)(16);
        const now = firestore_1.Timestamp.now();
        const expireAt = firestore_1.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
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
    }
    catch (error) {
        console.error('Error creating collage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=createCollage.js.map