/* eslint-disable @typescript-eslint/no-require-imports */
// Generates solid-color PNG icons for PWA — no external dependencies
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function createPNG(width, height, r, g, b) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB color type
  // compression, filter, interlace = 0

  // Each row: 1 filter byte + width*3 RGB bytes
  const rowLen = 1 + width * 3
  const rawData = Buffer.alloc(height * rowLen, 0)
  for (let y = 0; y < height; y++) {
    rawData[y * rowLen] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const off = y * rowLen + 1 + x * 3
      rawData[off] = r
      rawData[off + 1] = g
      rawData[off + 2] = b
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 })

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = path.join(__dirname, '..', 'public')

// Brand color: #1f5f59
const [r, g, b] = [0x1f, 0x5f, 0x59]

const icons = [
  { file: 'pwa-192x192.png', w: 192, h: 192, r, g, b },
  { file: 'pwa-512x512.png', w: 512, h: 512, r, g, b },
  { file: 'maskable-icon.png', w: 512, h: 512, r, g, b },
  { file: 'apple-touch-icon.png', w: 180, h: 180, r, g, b },
]

for (const { file, w, h, r, g, b } of icons) {
  fs.writeFileSync(path.join(publicDir, file), createPNG(w, h, r, g, b))
  console.log(`✓ ${file} (${w}x${h})`)
}
