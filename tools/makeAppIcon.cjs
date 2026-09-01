/**
 * makeAppIcon.js
 *
 * Generates the 1024x1024 PNG Meta requires as an app icon.
 *
 * Written as a pure-Node PNG encoder on purpose: the project has no image
 * library (no sharp/jimp/canvas), and adding a native dependency just to render
 * one static asset is not worth it. zlib is built in, and a PNG is only a few
 * chunks around a deflate stream.
 *
 * Design: rounded-square brand-blue gradient with a white message bubble.
 * Deliberately NOT WhatsApp green with a WhatsApp-style glyph — reusing Meta's
 * brand marks in an app icon is a policy problem, so this uses OneEmployee's own
 * brand colour from src/config/phase.js (#0866FF).
 *
 * Usage: node tools/makeAppIcon.js  ->  public/app-icon-1024.png
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 1024;
const SS = 3;                       // supersampling factor for smooth edges

// ── Geometry helpers ────────────────────────────────────────────────────────

/** Signed distance to a rounded rectangle; negative inside. */
function roundedRectSDF(px, py, cx, cy, halfW, halfH, r) {
    const qx = Math.abs(px - cx) - (halfW - r);
    const qy = Math.abs(py - cy) - (halfH - r);
    const ax = Math.max(qx, 0);
    const ay = Math.max(qy, 0);
    return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Signed distance to a circle; negative inside. */
function circleSDF(px, py, cx, cy, r) {
    return Math.hypot(px - cx, py - cy) - r;
}

/**
 * Distance to the bubble tail, drawn as a small circle so it reads as a
 * rounded pointer rather than a hard triangle.
 */
function tailSDF(px, py) {
    return circleSDF(px, py, 372, 700, 74);
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Brand gradient (top -> bottom)
const TOP = [0x08, 0x66, 0xFF];
const BOT = [0x58, 0xA6, 0xFF];
const WHITE = [0xFF, 0xFF, 0xFF];

// ── Render ──────────────────────────────────────────────────────────────────

const rgba = Buffer.alloc(SIZE * SIZE * 4);

for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
        let plateHits = 0;
        let bubbleHits = 0;
        let dotHits = 0;

        // Supersample this pixel to get coverage instead of jagged edges.
        for (let sy = 0; sy < SS; sy++) {
            for (let sx = 0; sx < SS; sx++) {
                const px = x + (sx + 0.5) / SS;
                const py = y + (sy + 0.5) / SS;

                // App plate: rounded square, iOS-ish corner radius
                if (roundedRectSDF(px, py, 512, 512, 512, 512, 224) < 0) plateHits++;

                // Message bubble body + tail
                const inBubble =
                    roundedRectSDF(px, py, 512, 470, 260, 200, 88) < 0 ||
                    tailSDF(px, py) < 0;
                if (inBubble) bubbleHits++;

                // Three dots inside the bubble
                if (
                    circleSDF(px, py, 400, 470, 40) < 0 ||
                    circleSDF(px, py, 512, 470, 40) < 0 ||
                    circleSDF(px, py, 624, 470, 40) < 0
                ) dotHits++;
            }
        }

        const total = SS * SS;
        const plateA = plateHits / total;
        const bubbleA = bubbleHits / total;
        const dotA = dotHits / total;

        // Plate gradient colour at this row
        const t = y / (SIZE - 1);
        const base = [
            lerp(TOP[0], BOT[0], t),
            lerp(TOP[1], BOT[1], t),
            lerp(TOP[2], BOT[2], t),
        ];

        // Composite: plate -> white bubble -> gradient dots punched back in
        let r = base[0], g = base[1], b = base[2];

        const bubbleOverPlate = bubbleA * plateA;
        r = lerp(r, WHITE[0], bubbleOverPlate);
        g = lerp(g, WHITE[1], bubbleOverPlate);
        b = lerp(b, WHITE[2], bubbleOverPlate);

        const dotOver = dotA * bubbleOverPlate;
        r = lerp(r, base[0], dotOver);
        g = lerp(g, base[1], dotOver);
        b = lerp(b, base[2], dotOver);

        const i = (y * SIZE + x) * 4;
        rgba[i] = Math.round(r);
        rgba[i + 1] = Math.round(g);
        rgba[i + 2] = Math.round(b);
        // Meta shows the icon on light and dark surfaces; keep the plate opaque
        // and everything outside it transparent.
        rgba[i + 3] = Math.round(plateA * 255);
    }
}

// ── Minimal PNG encoder ─────────────────────────────────────────────────────

const CRC_TABLE = (() => {
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c;
    }
    return table;
})();

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
}

// IHDR: width, height, bit depth 8, colour type 6 (RGBA), no interlace
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

// Raw scanlines, each prefixed with filter type 0 (None)
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
    const off = y * (SIZE * 4 + 1);
    raw[off] = 0;
    rgba.copy(raw, off + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(__dirname, '..', 'public', 'app-icon-1024.png');
fs.writeFileSync(outPath, png);

console.log(`wrote ${outPath}`);
console.log(`bytes: ${png.length}`);
console.log(`signature ok: ${png.slice(1, 4).toString('ascii') === 'PNG'}`);
console.log(`dimensions from IHDR: ${png.readUInt32BE(16)} x ${png.readUInt32BE(20)}`);
console.log(`colour type: ${png[25]} (6 = RGBA)`);
