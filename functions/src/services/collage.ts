import sharp from 'sharp';

interface CollageOptions {
  username: string;
  year: number;
  totalLikes: number;
}

// Create placeholder SVG for empty slots
function createPlaceholderSvg(cell: number, index: number, total: number): Buffer {
  const messages = [
    '2025',
    'More to come',
    'Stay tuned',
    'Coming soon',
    'Post more!',
    '📸',
    '✨',
    '🎯',
    '🚀',
  ];
  const message = messages[index % messages.length];

  return Buffer.from(`
    <svg width="${cell}" height="${cell}">
      <rect width="${cell}" height="${cell}" fill="#f5f5f5"/>
      <text x="${cell / 2}" y="${cell / 2}"
            text-anchor="middle" dominant-baseline="middle"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${cell * 0.12}" fill="#ccc">
        ${message}
      </text>
      <text x="${cell / 2}" y="${cell * 0.7}"
            text-anchor="middle"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="${cell * 0.06}" fill="#ddd">
        ${total > 0 ? `${index + 1}/${total < 9 ? total : 9}` : ''}
      </text>
    </svg>
  `);
}

export async function generateCollage(
  imageUrls: string[],
  options: CollageOptions
): Promise<Buffer> {
  const SIZE = 1080;
  const GAP = 4;
  const CELL = Math.floor((SIZE - GAP * 4) / 3);
  const actualCount = imageUrls.length;

  // Process images + create placeholders for missing slots
  const images: Buffer[] = [];

  for (let i = 0; i < 9; i++) {
    if (i < imageUrls.length && imageUrls[i]) {
      try {
        const response = await fetch(imageUrls[i]);
        if (!response.ok) throw new Error('Fetch failed');
        const buffer = Buffer.from(await response.arrayBuffer());
        const processed = await sharp(buffer)
          .resize(CELL, CELL, { fit: 'cover', position: 'center' })
          .toBuffer();
        images.push(processed);
      } catch (error) {
        console.error(`Failed to process image ${i}:`, error);
        // Create placeholder for failed image
        const placeholder = await sharp(createPlaceholderSvg(CELL, i, actualCount))
          .jpeg()
          .toBuffer();
        images.push(placeholder);
      }
    } else {
      // Create placeholder for missing image
      const placeholder = await sharp(createPlaceholderSvg(CELL, i, actualCount))
        .jpeg()
        .toBuffer();
      images.push(placeholder);
    }
  }

  // Grid positions
  const composites = images.map((img, i) => ({
    input: img,
    left: GAP + (i % 3) * (CELL + GAP),
    top: GAP + Math.floor(i / 3) * (CELL + GAP),
  }));

  // Clean, minimal overlay (bottom)
  const titleText = actualCount < 9
    ? `@${options.username} · Best ${actualCount} of ${options.year}`
    : `@${options.username} · Best 9 of ${options.year}`;

  const overlaySvg = Buffer.from(`
    <svg width="${SIZE}" height="${SIZE}">
      <rect x="0" y="${SIZE - 60}" width="${SIZE}" height="60" fill="rgba(0,0,0,0.75)"/>
      <text x="${SIZE / 2}" y="${SIZE - 25}" text-anchor="middle"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="20" font-weight="600" fill="white">
        ${titleText}
      </text>
      <text x="${SIZE - 16}" y="${SIZE - 25}" text-anchor="end"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="12" fill="rgba(255,255,255,0.5)">
        seochan
      </text>
    </svg>
  `);

  composites.push({ input: overlaySvg, left: 0, top: 0 });

  // Create collage
  return await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toBuffer();
}
