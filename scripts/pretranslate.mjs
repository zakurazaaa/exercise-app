// Pre-translate exercise step instructions EN -> TH and bundle as public/th-steps.json
//
// - ดึงข้อมูลจาก dataset, รวมประโยค step ที่ไม่ซ้ำ, เรียงตามความถี่ (บ่อยสุดก่อน)
// - แปลผ่าน MyMemory (ฟรี) ทีละประโยค พร้อมหน่วงเวลากันโดน throttle
// - เขียนผลลง public/th-steps.json แบบ incremental → resume ได้ถ้าหยุดกลางคัน
//
// ใช้งาน:  node scripts/pretranslate.mjs
// ตัวเลือก env:  MM_EMAIL=you@example.com (เพิ่มโควต้า), DELAY_MS=150, LIMIT=4414

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DATA_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const OUT = new URL("../public/th-steps.json", import.meta.url).pathname;
const EMAIL = process.env.MM_EMAIL || "";
const DELAY_MS = Number(process.env.DELAY_MS || 150);
const LIMIT = Number(process.env.LIMIT || Infinity);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadOut() {
  if (existsSync(OUT)) {
    try {
      return JSON.parse(readFileSync(OUT, "utf8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveOut(map) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(map));
}

async function translate(text) {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text) +
    "&langpair=en|th" +
    (EMAIL ? "&de=" + encodeURIComponent(EMAIL) : "");
  const res = await fetch(url);
  const data = await res.json();
  if (data?.responseStatus !== 200 && data?.responseStatus !== "200") {
    throw new Error("MM status " + data?.responseStatus + ": " + data?.responseDetails);
  }
  const th = data?.responseData?.translatedText;
  if (!th) throw new Error("no translation");
  return th;
}

async function main() {
  console.log("ดึงข้อมูล dataset…");
  const arr = await (await fetch(DATA_URL)).json();

  // รวมประโยค step ไม่ซ้ำ + นับความถี่
  const freq = new Map();
  for (const ex of arr) {
    for (const s of ex.instruction_steps?.en || []) {
      const k = s.trim();
      if (k) freq.set(k, (freq.get(k) || 0) + 1);
    }
  }
  const lines = [...freq.keys()].sort((a, b) => freq.get(b) - freq.get(a));
  console.log(`ประโยคไม่ซ้ำ: ${lines.length}`);

  const out = loadOut();
  let done = Object.keys(out).length;
  let processed = 0;
  console.log(`แปลไว้แล้ว: ${done} | เริ่มแปลส่วนที่เหลือ…`);

  for (const line of lines) {
    if (processed >= LIMIT) break;
    if (out[line]) continue;
    try {
      out[line] = await translate(line);
      done++;
      processed++;
      if (done % 25 === 0) {
        saveOut(out);
        console.log(`  …${done}/${lines.length}`);
      }
      await sleep(DELAY_MS);
    } catch (e) {
      console.error(`หยุด: ${e.message}`);
      break; // มักเป็นโควต้าหมด — เซฟแล้วออก เพื่อ resume วันหลัง
    }
  }

  saveOut(out);
  console.log(`เสร็จรอบนี้ — รวมแปลแล้ว ${done}/${lines.length} ประโยค`);
}

main();
