// แผนภาพกล้ามเนื้อ (SVG) สร้างเองจาก target/secondary ของแต่ละท่า — ครอบคลุม 100% ถูกกฎหมาย
// วาดเป็นรูปคนหน้า/หลังต่อเนื่อง (base สีเทา) แล้วไฮไลต์กล้ามหลัก (ส้มเข้ม) + กล้ามเสริม (ส้มจาง)
const BG = "#171a21", SKIN = "#2b313b", BASE = "#3f4552", HI = "#ff5a3c";

// target/มัดกล้าม -> โซนบนรูป
const MAP = {
  pectorals: ["chest"], "serratus anterior": ["chest", "obliques"],
  delts: ["shoulders"], biceps: ["biceps"], triceps: ["triceps"], forearms: ["forearm"],
  abs: ["abs"], obliques: ["obliques"],
  lats: ["lats"], "upper back": ["lats", "traps"], traps: ["traps"],
  spine: ["lowerback"], "levator scapulae": ["traps"],
  glutes: ["glutes"], abductors: ["glutes"], adductors: ["quads"],
  quads: ["quads"], hamstrings: ["hams"], calves: ["calves"],
};

// รูปทรงของแต่ละโซน (front คือ figure ซ้าย, back คือขวา offset +100) — ใช้ %F% แทนสีเติม
const R = {
  shoulders: ["<ellipse cx='36' cy='30' rx='6.5' ry='5.5' fill='%F%'/><ellipse cx='64' cy='30' rx='6.5' ry='5.5' fill='%F%'/>",
              "<ellipse cx='136' cy='30' rx='6.5' ry='5.5' fill='%F%'/><ellipse cx='164' cy='30' rx='6.5' ry='5.5' fill='%F%'/>"],
  chest: ["<rect x='40' y='31' width='9' height='12' rx='3' fill='%F%'/><rect x='51' y='31' width='9' height='12' rx='3' fill='%F%'/>", ""],
  abs: ["<rect x='44' y='44' width='12' height='19' rx='3' fill='%F%'/>", ""],
  obliques: ["<rect x='40' y='45' width='4' height='16' rx='2' fill='%F%'/><rect x='56' y='45' width='4' height='16' rx='2' fill='%F%'/>", ""],
  biceps: ["<rect x='30' y='31' width='7' height='14' rx='3.5' fill='%F%'/><rect x='63' y='31' width='7' height='14' rx='3.5' fill='%F%'/>", ""],
  forearm: ["<rect x='28' y='47' width='6' height='16' rx='3' fill='%F%'/><rect x='66' y='47' width='6' height='16' rx='3' fill='%F%'/>",
            "<rect x='128' y='47' width='6' height='16' rx='3' fill='%F%'/><rect x='166' y='47' width='6' height='16' rx='3' fill='%F%'/>"],
  quads: ["<rect x='42' y='68' width='8' height='23' rx='4' fill='%F%'/><rect x='50' y='68' width='8' height='23' rx='4' fill='%F%'/>", ""],
  traps: ["", "<path d='M140 25 h20 v4 l-10 6 l-10 -6z' fill='%F%'/>"],
  lats: ["", "<path d='M140 34 h9 v13 l-9 -3z' fill='%F%'/><path d='M160 34 h-9 v13 l9 -3z' fill='%F%'/>"],
  lowerback: ["", "<rect x='145' y='48' width='10' height='11' rx='2' fill='%F%'/>"],
  triceps: ["", "<rect x='130' y='31' width='7' height='14' rx='3.5' fill='%F%'/><rect x='163' y='31' width='7' height='14' rx='3.5' fill='%F%'/>"],
  glutes: ["", "<rect x='142' y='62' width='8' height='9' rx='4' fill='%F%'/><rect x='150' y='62' width='8' height='9' rx='4' fill='%F%'/>"],
  hams: ["", "<rect x='142' y='71' width='8' height='21' rx='4' fill='%F%'/><rect x='150' y='71' width='8' height='21' rx='4' fill='%F%'/>"],
  calves: ["", "<ellipse cx='146' cy='104' rx='4' ry='11' fill='%F%'/><ellipse cx='154' cy='104' rx='4' ry='11' fill='%F%'/>"],
};

// รูปคน (base) ต่อเนื่อง — วาดที่ offset dx (0=หน้า, 100=หลัง)
function bodyBase(dx) {
  const g = (s) => s.replace(/X(\d+(?:\.\d+)?)/g, (_, n) => (parseFloat(n) + dx).toFixed(1));
  return g(`
<circle cx='X50' cy='14' r='6.5' fill='${SKIN}'/>
<rect x='X47' y='19' width='6' height='5' rx='2' fill='${SKIN}'/>
<path d='M X37 25 Q X50 22 X63 25 L X61 40 Q X60 46 X58 56 Q X57 62 X54 64 L X46 64 Q X43 62 X42 56 Q X40 46 X39 40 Z' fill='${BASE}'/>
<rect x='X42' y='61' width='16' height='11' rx='3' fill='${BASE}'/>
<rect x='X31' y='27' width='7.5' height='21' rx='3.7' fill='${BASE}'/>
<rect x='X61.5' y='27' width='7.5' height='21' rx='3.7' fill='${BASE}'/>
<rect x='X28' y='45' width='6.5' height='20' rx='3.2' fill='${BASE}'/>
<rect x='X65.5' y='45' width='6.5' height='20' rx='3.2' fill='${BASE}'/>
<rect x='X41.5' y='67' width='8.5' height='27' rx='4' fill='${BASE}'/>
<rect x='X50' y='67' width='8.5' height='27' rx='4' fill='${BASE}'/>
<rect x='X42.5' y='92' width='7' height='26' rx='3.2' fill='${BASE}'/>
<rect x='X50.5' y='92' width='7' height='26' rx='3.2' fill='${BASE}'/>`);
}

function drawRegion(id, color) {
  const parts = R[id];
  if (!parts) return "";
  return (parts[0] + parts[1]).split("%F%").join(color);
}

function emojiUri(e) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='${BG}'/><text x='100' y='128' font-size='76' text-anchor='middle'>${e}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

// คืน data-URI SVG (secondary = array ชื่อกล้ามเสริม, primaryOverride = array กล้ามหลักที่แก้แล้ว)
export function muscleMapUri(ex, secondary, primaryOverride) {
  const t = (ex?.target || "").toLowerCase();
  const bp = (ex?.body_part || "").toLowerCase();
  if (t === "cardiovascular system" || bp === "cardio") return emojiUri("🏃");

  const primaries = primaryOverride && primaryOverride.length ? primaryOverride : [t];
  const targetSet = new Set();
  for (const p of primaries) for (const r of MAP[(p || "").toLowerCase()] || []) targetSet.add(r);
  const secSet = new Set();
  for (const m of secondary || []) for (const r of MAP[(m || "").toLowerCase()] || []) if (!targetSet.has(r)) secSet.add(r);

  let sec = "", tgt = "";
  for (const id of secSet) sec += drawRegion(id, HI);
  for (const id of targetSet) tgt += drawRegion(id, HI);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>` +
    `<rect width='200' height='200' fill='${BG}'/>` +
    bodyBase(0) + bodyBase(100) +
    `<g fill-opacity='0.4'>${sec}</g>` +
    `<g>${tgt}</g>` +
    `<text x='50' y='134' font-size='9' fill='#6b7280' text-anchor='middle'>หน้า</text>` +
    `<text x='150' y='134' font-size='9' fill='#6b7280' text-anchor='middle'>หลัง</text>` +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
