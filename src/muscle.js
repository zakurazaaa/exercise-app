// สร้าง "แผนภาพกล้ามเนื้อเป้าหมาย" เอง (SVG) จาก target ของแต่ละท่า — ครอบคลุม 100%
// ถูกกฎหมาย (เราวาดเอง) ใช้แทน placeholder เมื่อไม่มีรูปจริง
const BG = "#1a1d24", SKIN = "#2f343d", BASE = "#464c58", HI = "#ff5a3c";

// target (ชื่อกล้ามใน dataset) -> โซนบนรูป (มีทั้งด้านหน้า/หลัง)
const MAP = {
  pectorals: ["chest"],
  "serratus anterior": ["chest", "obliques"],
  delts: ["shoulders"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  abs: ["abs"],
  obliques: ["obliques"],
  lats: ["lats"],
  "upper back": ["lats", "traps"],
  traps: ["traps"],
  spine: ["lowerback"],
  "levator scapulae": ["traps"],
  glutes: ["glutes"],
  abductors: ["glutes"],
  adductors: ["quads"],
  quads: ["quads"],
  hamstrings: ["hams"],
  calves: ["calves"],
};

function emojiUri(e) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='${BG}'/><text x='100' y='128' font-size='76' text-anchor='middle'>${e}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// คืน data-URI SVG รูปกล้ามเนื้อ (หรืออีโมจิสำหรับคาร์ดิโอ)
export function muscleMapUri(ex) {
  const t = (ex?.target || "").toLowerCase();
  const bp = (ex?.body_part || "").toLowerCase();
  if (t === "cardiovascular system" || bp === "cardio") return emojiUri("🏃");
  const hi = new Set(MAP[t] || []);
  const f = (id) => (hi.has(id) ? HI : BASE);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
<rect width='200' height='200' fill='${BG}'/>
<circle cx='50' cy='16' r='7' fill='${SKIN}'/>
<ellipse cx='34' cy='31' rx='6' ry='5' fill='${f("shoulders")}'/>
<ellipse cx='66' cy='31' rx='6' ry='5' fill='${f("shoulders")}'/>
<rect x='38' y='28' width='10' height='13' rx='3' fill='${f("chest")}'/>
<rect x='52' y='28' width='10' height='13' rx='3' fill='${f("chest")}'/>
<ellipse cx='29' cy='45' rx='4' ry='9' fill='${f("biceps")}'/>
<ellipse cx='71' cy='45' rx='4' ry='9' fill='${f("biceps")}'/>
<ellipse cx='26' cy='61' rx='4' ry='10' fill='${f("forearm")}'/>
<ellipse cx='74' cy='61' rx='4' ry='10' fill='${f("forearm")}'/>
<rect x='43' y='42' width='14' height='21' rx='3' fill='${f("abs")}'/>
<rect x='37' y='43' width='4' height='17' rx='2' fill='${f("obliques")}'/>
<rect x='59' y='43' width='4' height='17' rx='2' fill='${f("obliques")}'/>
<rect x='40' y='66' width='9' height='27' rx='4' fill='${f("quads")}'/>
<rect x='51' y='66' width='9' height='27' rx='4' fill='${f("quads")}'/>
<rect x='41' y='95' width='7' height='24' rx='3' fill='${SKIN}'/>
<rect x='52' y='95' width='7' height='24' rx='3' fill='${SKIN}'/>
<circle cx='150' cy='16' r='7' fill='${SKIN}'/>
<rect x='139' y='26' width='22' height='8' rx='3' fill='${f("traps")}'/>
<ellipse cx='134' cy='33' rx='6' ry='5' fill='${f("shoulders")}'/>
<ellipse cx='166' cy='33' rx='6' ry='5' fill='${f("shoulders")}'/>
<rect x='140' y='36' width='9' height='16' rx='3' fill='${f("lats")}'/>
<rect x='151' y='36' width='9' height='16' rx='3' fill='${f("lats")}'/>
<rect x='145' y='52' width='10' height='10' rx='2' fill='${f("lowerback")}'/>
<ellipse cx='129' cy='45' rx='4' ry='9' fill='${f("triceps")}'/>
<ellipse cx='171' cy='45' rx='4' ry='9' fill='${f("triceps")}'/>
<ellipse cx='126' cy='61' rx='4' ry='10' fill='${f("forearm")}'/>
<ellipse cx='174' cy='61' rx='4' ry='10' fill='${f("forearm")}'/>
<rect x='141' y='63' width='8' height='10' rx='4' fill='${f("glutes")}'/>
<rect x='151' y='63' width='8' height='10' rx='4' fill='${f("glutes")}'/>
<rect x='141' y='73' width='8' height='22' rx='4' fill='${f("hams")}'/>
<rect x='151' y='73' width='8' height='22' rx='4' fill='${f("hams")}'/>
<ellipse cx='145' cy='105' rx='4' ry='12' fill='${f("calves")}'/>
<ellipse cx='155' cy='105' rx='4' ry='12' fill='${f("calves")}'/>
<text x='50' y='140' font-size='9' fill='#6b7280' text-anchor='middle'>หน้า</text>
<text x='150' y='140' font-size='9' fill='#6b7280' text-anchor='middle'>หลัง</text>
</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
