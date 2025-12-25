"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCollage = generateCollage;
const sharp_1 = __importDefault(require("sharp"));
async function generateCollage(imageUrls, options) {
    const SIZE = 1080;
    const GAP = 4;
    const CELL = Math.floor((SIZE - GAP * 4) / 3);
    // Download and resize images
    const images = await Promise.all(imageUrls.slice(0, 9).map(async (url, index) => {
        try {
            const response = await fetch(url);
            if (!response.ok)
                throw new Error('Fetch failed');
            const buffer = Buffer.from(await response.arrayBuffer());
            return await (0, sharp_1.default)(buffer)
                .resize(CELL, CELL, { fit: 'cover', position: 'center' })
                .toBuffer();
        }
        catch (error) {
            console.error(`Failed to process image ${index}:`, error);
            return await (0, sharp_1.default)({
                create: {
                    width: CELL,
                    height: CELL,
                    channels: 3,
                    background: { r: 240, g: 240, b: 240 },
                },
            }).jpeg().toBuffer();
        }
    }));
    // Grid positions
    const composites = images.map((img, i) => ({
        input: img,
        left: GAP + (i % 3) * (CELL + GAP),
        top: GAP + Math.floor(i / 3) * (CELL + GAP),
    }));
    // Clean, minimal overlay (bottom)
    const overlaySvg = Buffer.from(`
    <svg width="${SIZE}" height="${SIZE}">
      <rect x="0" y="${SIZE - 60}" width="${SIZE}" height="60" fill="rgba(0,0,0,0.75)"/>
      <text x="${SIZE / 2}" y="${SIZE - 25}" text-anchor="middle"
            font-family="-apple-system, BlinkMacSystemFont, sans-serif"
            font-size="20" font-weight="600" fill="white">
        @${options.username} · Best 9 of ${options.year}
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
    return await (0, sharp_1.default)({
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
//# sourceMappingURL=collage.js.map