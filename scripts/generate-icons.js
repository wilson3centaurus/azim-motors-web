/* eslint-disable @typescript-eslint/no-require-imports */
// Generates PWA icon PNGs from the Hazim Motors logo using sharp
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const logoPath = path.join(publicDir, 'hazin-motors-logo.png')

// Background colour matching the manifest background_color
const BG = { r: 8, g: 19, b: 17 } // #081311

async function makeIcon(outFile, size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.12) : 0
  const logoSize = size - padding * 2

  const resizedLogo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  const { width: lw, height: lh } = await sharp(resizedLogo).metadata()
  const left = Math.round((size - lw) / 2)
  const top = Math.round((size - lh) / 2)

  await sharp({
    create: { width: size, height: size, channels: 4, background: { ...BG, alpha: 255 } },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toFile(path.join(publicDir, outFile))

  console.log(`✓ ${outFile} (${size}x${size}${maskable ? ', maskable' : ''})`)
}

async function main() {
  await makeIcon('pwa-192x192.png', 192)
  await makeIcon('pwa-512x512.png', 512)
  await makeIcon('maskable-icon.png', 512, true)
  await makeIcon('apple-touch-icon.png', 180)
}

main().catch(err => { console.error(err); process.exit(1) })

