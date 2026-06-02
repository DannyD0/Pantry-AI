import sharp from "sharp"
import { mkdir } from "fs/promises"

await mkdir("public", { recursive: true })

// SVG icon: dark green rounded square with white "P" glyph
function makeSvg(size) {
  const radius = size * 0.2
  const fontSize = size * 0.52
  return Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#16a34a"/>
      <stop offset="100%" style="stop-color:#15803d"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)"/>
  <text x="50%" y="54%" font-family="Arial Black, Arial, sans-serif" font-weight="900"
    font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="middle">P</text>
</svg>`)
}

const sizes = [
  { name: "public/icon-512.png", size: 512 },
  { name: "public/icon-192.png", size: 192 },
  { name: "public/apple-touch-icon.png", size: 180 },
  { name: "public/favicon-32.png", size: 32 },
]

for (const { name, size } of sizes) {
  await sharp(makeSvg(size)).png().toFile(name)
  console.log(`✓ ${name}`)
}

console.log("Icons generated.")
