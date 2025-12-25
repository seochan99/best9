import { defineSecret } from 'firebase-functions/params';

const APIFY_API_KEY = defineSecret('APIFY_API_KEY');

export interface InstagramPost {
  id: string;
  imageUrl: string;
  likes: number;
  comments: number;
  timestamp: Date;
  isVideo?: boolean;
  views?: number;
}

export interface InstagramData {
  username: string;
  posts: InstagramPost[];
  totalLikes: number;
}

export async function fetchInstagramPosts(
  username: string,
  year: number
): Promise<InstagramData> {
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

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    const statusData = await statusResponse.json();

    if (statusData.data.status === 'SUCCEEDED') {
      // 결과 가져오기
      const datasetResponse = await fetch(
        `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );
      result = await datasetResponse.json();
      break;
    }

    if (statusData.data.status === 'FAILED' || statusData.data.status === 'ABORTED') {
      throw new Error('Instagram data fetch failed');
    }

    attempts++;
  }

  if (!result || result.length === 0) {
    throw new Error('Account not found. Please check the username.');
  }

  // 프로필 데이터 파싱
  const profile = result[0];

  // 계정 존재하지 않음
  if (!profile || profile.error) {
    throw new Error('Account not found. Please check the username.');
  }

  // 비공개 계정 체크
  if (profile.private === true || profile.isPrivate === true) {
    throw new Error('This account is private. Please use a public account.');
  }

  // 게시물이 없는 경우
  if (!profile.latestPosts || profile.latestPosts.length === 0) {
    throw new Error('No posts found on this account.');
  }

  // 연도별 필터링
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const posts: InstagramPost[] = (profile.latestPosts || [])
    .filter((post: Record<string, unknown>) => {
      if (!post.timestamp) return true; // 타임스탬프 없으면 포함
      const postDate = new Date(post.timestamp as string);
      return postDate >= startOfYear && postDate <= endOfYear;
    })
    .map((post: Record<string, unknown>) => ({
      id: (post.id || post.shortCode || '') as string,
      imageUrl: (post.displayUrl || post.url || '') as string,
      likes: (post.likesCount || post.likes || 0) as number,
      comments: (post.commentsCount || post.comments || 0) as number,
      timestamp: post.timestamp ? new Date(post.timestamp as string) : new Date(),
      isVideo: (post.isVideo || post.type === 'Video' || post.type === 'Reel') as boolean,
      views: (post.videoViewCount || post.viewCount || post.views || 0) as number,
    }))
    .filter((post: InstagramPost) => post.imageUrl);

  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);

  return {
    username: profile.username || username,
    posts,
    totalLikes,
  };
}

export { APIFY_API_KEY };
