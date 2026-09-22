import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(size) {
  const width = size;
  const height = size;

  // Raw RGBA buffer with 1 filter byte per scanline
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = size * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Squircle distance check
      const dx = Math.max(Math.abs(x - cx) - (cx - cornerRadius - 8), 0);
      const dy = Math.max(Math.abs(y - cy) - (cy - cornerRadius - 8), 0);
      const distFromCorner = Math.sqrt(dx * dx + dy * dy);

      if (distFromCorner > cornerRadius) {
        // Transparent outside squircle
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Inside squircle: Obsidian dark background #121214 with subtle top lighting
      let r = 20;
      let g = 20;
      let b = 22;
      let a = 255;

      const normY = y / height;
      const normX = x / width;

      // Top dot (Apple Emerald Green #30D158)
      const dot1Dx = x - cx;
      const dot1Dy = y - (height * 0.28);
      const dot1Dist = Math.sqrt(dot1Dx * dot1Dx + dot1Dy * dot1Dy);
      const dot1Radius = size * 0.08;

      // Bottom dot (Apple Blue #0A84FF)
      const dot2Dx = x - cx;
      const dot2Dy = y - (height * 0.72);
      const dot2Dist = Math.sqrt(dot2Dx * dot2Dx + dot2Dy * dot2Dy);
      const dot2Radius = size * 0.08;

      // Center divide bar (Clean Titanium / White #F2F2F7)
      const barY = Math.abs(y - cy);
      const barX = Math.abs(x - cx);
      const inBar = barY <= (size * 0.04) && barX <= (size * 0.28);

      if (dot1Dist <= dot1Radius) {
        r = 48;
        g = 209;
        b = 88;
      } else if (dot2Dist <= dot2Radius) {
        r = 10;
        g = 132;
        b = 255;
      } else if (inBar) {
        r = 242;
        g = 242;
        b = 247;
      } else {
        // Subtle inner rim lighting
        if (distFromCorner > cornerRadius - 2) {
          r += 35;
          g += 35;
          b += 40;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);

    const fullData = Buffer.concat([typeBuf, data]);
    const crc = crc32(fullData);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, fullData, crcBuf]);
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180));
console.log('Successfully generated Apple PWA icons!');
