import sharp from 'sharp';

export interface PostData {
  imageUrl: string;
  likes: number;
  isVideo?: boolean;
  views?: number;
}

interface CollageOptions {
  username: string;
  year: number;
  totalLikes: number;
  showOverlay?: boolean;
}

// Format number with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Create placeholder SVG for empty slots
function createPlaceholderSvg(cell: number): Buffer {
  return Buffer.from(`
    <svg width="${cell}" height="${cell}">
      <rect width="${cell}" height="${cell}" fill="#fafafa"/>
      <text x="${cell / 2}" y="${cell / 2}"
            text-anchor="middle" dominant-baseline="middle"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${cell * 0.15}" fill="#e0e0e0">
        +
      </text>
    </svg>
  `);
}

// Create like/view overlay for each image
function createStatsOverlay(cell: number, likes: number, isVideo: boolean, views?: number): Buffer {
  const viewValue = typeof views === 'number' ? views : Number.NaN;
  const hasViews = isVideo && Number.isFinite(viewValue);
  const displayNum = hasViews ? viewValue : likes;
  const icon = hasViews ? '▶' : '♥';

  return Buffer.from(`
    <svg width="${cell}" height="${cell}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0.6)"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0)"/>
        </linearGradient>
      </defs>
      <rect x="0" y="${cell - 50}" width="${cell}" height="50" fill="url(#grad)"/>
      <text x="12" y="${cell - 15}"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="16" font-weight="600" fill="white">
        ${icon} ${formatNumber(displayNum)}
      </text>
    </svg>
  `);
}

export async function generateCollage(
  posts: PostData[],
  options: CollageOptions
): Promise<Buffer> {
  const showOverlay = options.showOverlay !== false;
  // Polaroid style dimensions
  const PHOTO_SIZE = 1080;
  const BORDER = 40;
  const BOTTOM_BORDER = 140; // Larger bottom for Polaroid effect
  const TOTAL_WIDTH = PHOTO_SIZE + BORDER * 2;
  const TOTAL_HEIGHT = PHOTO_SIZE + BORDER + BOTTOM_BORDER;

  const GAP = 6;
  const CELL = Math.floor((PHOTO_SIZE - GAP * 4) / 3);
  const actualCount = posts.length;

  // Process images with stats overlay
  const images: Buffer[] = [];

  for (let i = 0; i < 9; i++) {
    if (i < posts.length && posts[i]?.imageUrl) {
      try {
        const response = await fetch(posts[i].imageUrl);
        if (!response.ok) throw new Error('Fetch failed');
        const buffer = Buffer.from(await response.arrayBuffer());

        // Resize image
        const resized = await sharp(buffer)
          .resize(CELL, CELL, { fit: 'cover', position: 'center' })
          .toBuffer();

        if (showOverlay) {
          const statsOverlay = createStatsOverlay(
            CELL,
            posts[i].likes,
            posts[i].isVideo || false,
            posts[i].views
          );

          const withStats = await sharp(resized)
            .composite([{ input: statsOverlay, left: 0, top: 0 }])
            .toBuffer();

          images.push(withStats);
        } else {
          images.push(resized);
        }
      } catch (error) {
        console.error(`Failed to process image ${i}:`, error);
        const placeholder = await sharp(createPlaceholderSvg(CELL))
          .jpeg()
          .toBuffer();
        images.push(placeholder);
      }
    } else {
      const placeholder = await sharp(createPlaceholderSvg(CELL))
        .jpeg()
        .toBuffer();
      images.push(placeholder);
    }
  }

  // Grid positions (offset by border)
  const composites = images.map((img, i) => ({
    input: img,
    left: BORDER + GAP + (i % 3) * (CELL + GAP),
    top: BORDER + GAP + Math.floor(i / 3) * (CELL + GAP),
  }));

  // Bottom text area (Polaroid style)
  const bestCount = actualCount < 9 ? actualCount : 9;

  const bottomOverlay = Buffer.from(`
    <svg width="${TOTAL_WIDTH}" height="${TOTAL_HEIGHT}">
      <!-- Username and year on the left -->
      <text x="${BORDER + 10}" y="${PHOTO_SIZE + BORDER + 50}"
            font-family="'Helvetica Neue', Arial, sans-serif"
            font-size="28" font-weight="700" fill="#1a1a1a">
        @${options.username}
      </text>
      <text x="${BORDER + 10}" y="${PHOTO_SIZE + BORDER + 85}"
            font-family="'Helvetica Neue', Arial, sans-serif"
            font-size="18" fill="#666">
        Best ${bestCount} of ${options.year}
      </text>

      <!-- Total likes -->
      <text x="${BORDER + 10}" y="${PHOTO_SIZE + BORDER + 115}"
            font-family="'Helvetica Neue', Arial, sans-serif"
            font-size="16" fill="#999">
        ♥ ${formatNumber(options.totalLikes)} total likes
      </text>

      <!-- Logo on the right -->
      <text x="${TOTAL_WIDTH - BORDER - 10}" y="${PHOTO_SIZE + BORDER + 70}"
            text-anchor="end"
            font-family="'Helvetica Neue', Arial, sans-serif"
            font-size="24" font-weight="700" fill="#1a1a1a">
        ${options.year} Best9
      </text>
      <text x="${TOTAL_WIDTH - BORDER - 10}" y="${PHOTO_SIZE + BORDER + 100}"
            text-anchor="end"
            font-family="'Helvetica Neue', Arial, sans-serif"
            font-size="14" fill="#999">
        @seochan
      </text>
    </svg>
  `);

  composites.push({ input: bottomOverlay, left: 0, top: 0 });

  // Create Polaroid frame
  return await sharp({
    create: {
      width: TOTAL_WIDTH,
      height: TOTAL_HEIGHT,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 95 })
    .toBuffer();
}
