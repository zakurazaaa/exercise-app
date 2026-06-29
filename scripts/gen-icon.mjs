// สร้างไอคอน PNG (พื้นส้มไล่เฉด + ดัมเบลขาว) โดยไม่ต้องพึ่งไลบรารีภายนอก
// ใช้ zlib เข้ารหัส PNG เอง  ->  public/icon-192.png, icon-512.png, apple-touch-icon.png
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ระยะจากสี่เหลี่ยมมุมมน (ใช้ทำขอบเนียน/มุมโค้ง)
function roundRectCovers(px, py, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(px, x0 + r), x1 - r);
  const cy = Math.min(Math.max(py, y0 + r), y1 - r);
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function drawIcon(S) {
  const buf = Buffer.alloc(S * S * 4);
  const white = [255, 255, 255];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // พื้นหลังไล่เฉดส้ม (มุมบนซ้ายสว่าง -> ล่างขวาเข้ม)
      const t = (x + y) / (2 * S);
      let r = Math.round(255 - t * 40);
      let g = Math.round(120 - t * 45);
      let b = Math.round(70 - t * 25);
      // ดัมเบล (พิกัดสัมพัทธ์กับ S)
      const u = x / S, v = y / S;
      const onBar = v > 0.46 && v < 0.54 && u > 0.30 && u < 0.70;
      const plateInL = roundRectCovers(u, v, 0.255, 0.36, 0.335, 0.64, 0.03);
      const plateInR = roundRectCovers(u, v, 0.665, 0.36, 0.745, 0.64, 0.03);
      const plateOutL = roundRectCovers(u, v, 0.175, 0.40, 0.255, 0.60, 0.03);
      const plateOutR = roundRectCovers(u, v, 0.745, 0.40, 0.825, 0.60, 0.03);
      if (onBar || plateInL || plateInR || plateOutL || plateOutR) {
        [r, g, b] = white;
      }
      const i = (y * S + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }
  return encodePNG(S, S, buf);
}

for (const [name, size] of [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["public/apple-touch-icon.png", 180],
]) {
  writeFileSync(new URL("../" + name, import.meta.url), drawIcon(size));
  console.log("wrote", name, size + "x" + size);
}
