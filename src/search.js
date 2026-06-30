// ค้นหาแบบฉลาด: หลายคำ (ทุกคำต้องมี ไม่ต้องเรียงติดกัน)
// ครอบคลุม: ชื่ออังกฤษ, ชื่อไทย, กล้ามเนื้อเป้าหมาย, ส่วนของร่างกาย (ทั้งไทย/อังกฤษ) + ชื่อย่อ/ชื่อเล่น
import { thMuscle, thBody } from "./th-dict";

// ชื่อย่อ/ชื่อเล่น -> คำจริงในชุดข้อมูล (ขยายตอนค้นหา)
const ALIASES = {
  rdl: "romanian deadlift",
  ohp: "overhead press",
  db: "dumbbell",
  bb: "barbell",
  kb: "kettlebell",
  bulgarian: "split squat",
  "bulgarian split squat": "single leg split squat",
  "lat pulldown": "lateral pulldown",
  "lat pull down": "lateral pulldown",
  bor: "bent over row",
  "rear delt fly": "reverse fly",
  pec: "pectorals",
  pecs: "pectorals",
  abs: "abs",
  "good mornings": "good morning",
  "ยืด": "stretch",
  "hip thrusts": "hip thrust",
  bss: "single leg split squat",
};

function expandAliases(q) {
  let s = " " + q.toLowerCase().trim() + " ";
  for (const [k, v] of Object.entries(ALIASES)) {
    s = s.split(" " + k + " ").join(" " + v + " ");
  }
  return s.trim();
}

// ข้อความที่ใช้ค้น: ชื่อ + แบบไม่มีขีด/เว้นวรรค + ชื่อไทย + กล้ามเนื้อ + ส่วนร่างกาย
function searchText(ex, thai) {
  const n = (ex.name || "").toLowerCase();
  const t = (thai || "").toLowerCase();
  return [
    n,
    n.replace(/[-\s/]/g, ""),
    t,
    t.replace(/\s/g, ""),
    (ex.target || "").toLowerCase(),
    thMuscle(ex.target).toLowerCase(),
    (ex.body_part || "").toLowerCase(),
    thBody(ex.body_part).toLowerCase(),
    (ex.equipment || "").toLowerCase(),
    thMuscle(ex.equipment).toLowerCase(),
  ].join(" ");
}

// คืน true ถ้าทุกคำใน query ปรากฏใน searchText (ไม่ต้องเรียงติดกัน)
export function matchExercise(ex, thai, rawQuery) {
  const q = expandAliases(rawQuery);
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const text = searchText(ex, thai);
  return tokens.every((tok) => text.includes(tok));
}
