"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIFY_API_KEY = void 0;
exports.fetchInstagramPosts = fetchInstagramPosts;
const params_1 = require("firebase-functions/params");
const APIFY_API_KEY = (0, params_1.defineSecret)('APIFY_API_KEY');
exports.APIFY_API_KEY = APIFY_API_KEY;
async function fetchInstagramPosts(username, year) {
    const apiKey = APIFY_API_KEY.value();
    // Apify Instagram Profile Scraper 실행
    const runResponse = await fetch('https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            usernames: [username],
            resultsLimit: 100,
        }),
    });
    if (!runResponse.ok) {
        throw new Error(`Apify API error: ${runResponse.status}`);
    }
    const runData = await runResponse.json();
    const runId = runData.data.id;
    // 완료될 때까지 폴링
    let result;
    let attempts = 0;
    const maxAttempts = 60;
    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        const statusData = await statusResponse.json();
        if (statusData.data.status === 'SUCCEEDED') {
            // 결과 가져오기
            const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });
            result = await datasetResponse.json();
            break;
        }
        if (statusData.data.status === 'FAILED' || statusData.data.status === 'ABORTED') {
            throw new Error('Instagram data fetch failed');
        }
        attempts++;
    }
    if (!result || result.length === 0) {
        throw new Error('No data returned from Instagram');
    }
    // 프로필 데이터 파싱
    const profile = result[0];
    // 연도별 필터링
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const posts = (profile.latestPosts || [])
        .filter((post) => {
        if (!post.timestamp)
            return true; // 타임스탬프 없으면 포함
        const postDate = new Date(post.timestamp);
        return postDate >= startOfYear && postDate <= endOfYear;
    })
        .map((post) => ({
        id: (post.id || post.shortCode || ''),
        imageUrl: (post.displayUrl || post.url || ''),
        likes: (post.likesCount || post.likes || 0),
        comments: (post.commentsCount || post.comments || 0),
        timestamp: post.timestamp ? new Date(post.timestamp) : new Date(),
    }))
        .filter((post) => post.imageUrl);
    const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
    return {
        username: profile.username || username,
        posts,
        totalLikes,
    };
}
//# sourceMappingURL=instagram.js.map