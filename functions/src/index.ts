import { initializeApp } from 'firebase-admin/app';

// Firebase Admin 초기화
initializeApp();

// API 함수
export { createCollage } from './api/createCollage';
export { getStatus } from './api/getStatus';
export { getStats } from './api/getStats';
export { processPayment } from './api/processPayment';

// Firestore 트리거
export { processQueue } from './triggers/processQueue';
