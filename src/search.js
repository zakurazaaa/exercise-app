// ค้นหาแบบฉลาด: หลายคำ (ทุกคำต้องมี ไม่ต้องเรียงติดกัน) + รองรับชื่อย่อ/ชื่อเล่น + ค้นชื่อไทย

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
  "rdl": "romanian deadlift",
  "good mornings": "good morning",
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

// สร้างข้อความที่ใช้ค้น: ชื่ออังกฤษ + แบบไม่มีขีด/เว้นวรรค + ชื่อไทย
function searchText(name, thai) {
  const n = (name || "").toLowerCase();
  const t = (thai || "").toLowerCase();
  return (
    n +
    " " +
    n.replace(/[-\s/]/g, "") +
    " " +
    t +
    " " +
    t.replace(/\s/g, "")
  );
}

// คืน true ถ้าทุกคำใน query ปรากฏใน searchText (ไม่ต้องเรียงติดกัน)
export function matchExercise(name, thai, rawQuery) {
  const q = expandAliases(rawQuery);
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const text = searchText(name, thai);
  return tokens.every((tok) => text.includes(tok));
}
