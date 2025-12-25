"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const instagram_1 = require("../services/instagram");
const collage_1 = require("../services/collage");
const db = (0, firestore_2.getFirestore)();
const storage = (0, storage_1.getStorage)();
exports.processQueue = (0, firestore_1.onDocumentCreated)({
    document: 'collageQueue/{queueId}',
    memory: '2GiB',
    cpu: 2,
    timeoutSeconds: 300,
    minInstances: 0,
    maxInstances: 10,
    region: 'us-central1',
    secrets: [instagram_1.APIFY_API_KEY],
}, async (event) => {
    const queueId = event.params.queueId;
    const queueRef = db.collection('collageQueue').doc(queueId);
    try {
        const queueData = event.data?.data();
        if (!queueData)
            throw new Error('Queue data not found');
        // 상태 업데이트: fetching
        await queueRef.update({
            status: 'fetching',
            progress: 20,
            statusMessage: 'Instagram 데이터 가져오는 중...',
            updatedAt: firestore_2.Timestamp.now(),
        });
        // Instagram 데이터 가져오기
        const instagramData = await (0, instagram_1.fetchInstagramPosts)(queueData.instagramUsername, queueData.year);
        if (instagramData.posts.length < 9) {
            throw new Error(`게시물이 ${instagramData.posts.length}개뿐입니다. 최소 9개가 필요합니다.`);
        }
        // 상위 9개 선택 (좋아요 기준)
        const top9 = instagramData.posts
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 9);
        // 상태 업데이트: processing
        await queueRef.update({
            status: 'processing',
            progress: 50,
            statusMessage: '콜라주 생성 중...',
            updatedAt: firestore_2.Timestamp.now(),
        });
        // 콜라주 생성
        const collageBuffer = await (0, collage_1.generateCollage)(top9.map(p => p.imageUrl), {
            username: instagramData.username,
            year: queueData.year,
            totalLikes: instagramData.totalLikes,
        });
        // 상태 업데이트: uploading
        await queueRef.update({
            progress: 80,
            statusMessage: '이미지 저장 중...',
            updatedAt: firestore_2.Timestamp.now(),
        });
        // Storage에 업로드
        const bucket = storage.bucket();
        const fileName = `collages/${queueId}.jpg`;
        const file = bucket.file(fileName);
        await file.save(collageBuffer, {
            metadata: {
                contentType: 'image/jpeg',
                cacheControl: 'public, max-age=31536000',
            },
        });
        await file.makePublic();
        const resultUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        // 완료 상태 업데이트
        await queueRef.update({
            status: 'completed',
            progress: 100,
            statusMessage: '완료!',
            resultUrl,
            totalLikes: instagramData.totalLikes,
            updatedAt: firestore_2.Timestamp.now(),
        });
        // 통계 업데이트
        await db.collection('stats').doc('global').set({
            totalGenerated: firestore_2.FieldValue.increment(1),
        }, { merge: true });
        console.log(`Collage created successfully for ${queueData.instagramUsername}`);
    }
    catch (error) {
        console.error('Error processing queue:', error);
        await queueRef.update({
            status: 'failed',
            statusMessage: '콜라주 생성에 실패했습니다.',
            errorMessage: error.message,
            updatedAt: firestore_2.Timestamp.now(),
        });
    }
});
//# sourceMappingURL=processQueue.js.map