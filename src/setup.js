// คำแนะนำ "การตั้งเครื่อง" ก่อนเริ่ม — เฉพาะท่าที่ใช้เครื่อง/เคเบิล/คาร์ดิโอแมชชีน
// อิงหลักฐาน (ExRx/ACE/NSCA + งานวิจัย biomechanics): จัดแกนข้อต่อให้ตรงจุดหมุน,
// ตั้งเบาะอ้างกับจุดบนร่างกาย (ไม่ใช่ตัวเลขตายตัว เพราะแต่ละยี่ห้อต่างกัน),
// แพดสัมผัสให้ถูกตำแหน่ง, และคุมช่วงการเคลื่อนไหว (ROM)

const MACHINE = new Set([
  "leverage machine",
  "smith machine",
  "sled machine",
  "assisted",
]);
const CABLE = new Set(["cable"]);
const CARDIO = new Set([
  "stationary bike",
  "elliptical machine",
  "stepmill machine",
  "skierg machine",
  "upper body ergometer",
]);

// จัดประเภทท่าเครื่องเพื่อเลือกคิวที่ตรงที่สุด (ลำดับสำคัญ)
function classify(ex) {
  const n = (ex.name || "").toLowerCase();
  const t = (ex.target || "").toLowerCase();
  const bp = (ex.body_part || "").toLowerCase();

  if (/calf|heel raise/.test(n)) return "calf";
  if (/leg extension/.test(n)) return "legext";
  if (/leg curl/.test(n)) return "legcurl";
  if (/leg press|hack squat/.test(n)) return "legpress";
  if (/abduction|adduction|hip abductor|hip adductor/.test(n)) return "hipabd";
  if (/back extension|hyperextension|hip extension/.test(n)) return "backext";
  if (/rear delt|rear lateral|rear fly|revers|reverse fly/.test(n)) return "lateralraise";
  if (/pec deck|pec-deck|butterfly|\bfly\b|flye/.test(n)) return "fly";
  if (/lat pulldown|pulldown|pull-down|pull down/.test(n)) return "latpulldown";
  if (/\brow\b/.test(n)) return "row";
  if (/shoulder press|overhead press|military|arnold/.test(n)) return "ohp";
  if (/lateral raise|side raise|front raise/.test(n)) return "lateralraise";
  if ((/curl/.test(n) && !/leg|wrist/.test(n)) || t === "biceps") return "bicep";
  if (/tricep|pushdown|push-down|kickback|skull|extension|dip/.test(n) || t === "triceps")
    return "tricep";
  if (/crunch|abdominal|\bab\b|sit-up|situp/.test(n) || ["abs", "obliques"].includes(t) || bp === "waist")
    return "abs";
  if (/shrug/.test(n) || t === "traps") return "shrug";
  if (/chest press|bench press|incline press|decline press|chest/.test(n) || t === "pectorals")
    return "chestpress";
  return "generic";
}

const CUES = {
  legext: [
    "🪑 เลื่อนพนัก/เบาะให้ “ข้อเข่า” ตรงกับจุดหมุนของเครื่อง (มักมีจุดหรือสติกเกอร์สี)",
    "🦵 ปรับแพดให้พาดบนหลังเท้า เหนือข้อเท้าเล็กน้อย",
    "🪑 หลังแนบพนัก จับที่จับด้านข้างกันตัวเด้ง",
    "📐 เหยียดเข่าจนเกือบตรง (อย่ากระแทกล็อก) แล้วลดลงช้าๆ",
  ],
  legcurl: [
    "🪑 เลื่อนให้ “ข้อเข่า” ตรงกับจุดหมุนของเครื่อง",
    "🦵 ปรับแพดให้พาดที่น่องส่วนล่าง เหนือส้นเท้า",
    "🛡️ ถ้ามีแพดทับต้นขา กดให้กระชับเหนือเข่า กันสะโพกยก",
  ],
  legpress: [
    "🦵 วางเท้ากว้างประมาณช่วงไหล่ กลางแป้นเหยียบ",
    "🪑 ปรับเบาะให้เข่างอประมาณ 90° ตอนเริ่ม",
    "⚠️ อย่าเหยียดเข่าจนล็อกสุด และอย่าให้หลังล่าง/ก้นยกลอยจากเบาะ",
  ],
  calf: [
    "🛡️ ปรับแพดไหล่/เบาะให้กระชับพอดีตัว",
    "📐 ปล่อยส้นลงจนรู้สึกตึงน่อง แล้วเขย่งขึ้นจนสุด",
  ],
  chestpress: [
    "🪑 ปรับเบาะให้ “ที่จับอยู่ระดับกลางอก” (สูงเกินไปจะไปลงหัวไหล่)",
    "🪑 หลังและศีรษะแนบพนัก เท้าวางเต็มฝ่าเท้า",
  ],
  fly: [
    "🪑 ปรับเบาะให้แขน/ที่จับอยู่ระดับอก ข้อศอกต่ำกว่าหัวไหล่เล็กน้อย",
    "🪑 หลังแนบพนักตลอดช่วง บีบอกตอนหุบเข้า",
  ],
  ohp: [
    "🪑 ปรับเบาะให้ “ที่จับอยู่ระดับไหล่”",
    "🪑 หลังแนบพนัก ไม่แอ่นหลังมากตอนดันขึ้น",
  ],
  lateralraise: [
    "🪑 ปรับเบาะให้ “ข้อไหล่” ตรงกับจุดหมุน แพดกดที่ต้นแขน",
    "📐 ยกถึงระดับไหล่ ไม่ต้องสูงกว่า แล้วลดช้าๆ",
  ],
  latpulldown: [
    "🦵 ปรับแพดต้นขาให้กดเข่ากระชับ กันตัวลอยขึ้น",
    "✋ จับกว้างกว่าหัวไหล่เล็กน้อย",
    "📐 ดึงบาร์ลงถึงกระดูกไหปลาร้า/อกบน อกตั้ง อย่าเอนหลังมาก",
  ],
  row: [
    "🪑 ปรับเบาะ/แพดอกให้ “ที่จับอยู่ระดับกลางอก” แพดอกแตะเบาๆ",
    "📐 อกตั้ง หลังตรง ดึงศอกไปด้านหลังพร้อมบีบสะบัก",
  ],
  bicep: [
    "💪 วางต้นแขนเต็มแพด รักแร้ชิดขอบบนของแพด",
    "🎯 ให้ “ข้อศอก” ตรงกับจุดหมุนของเครื่อง",
  ],
  tricep: [
    "🎯 ให้ “ข้อศอก” ตรงจุดหมุน/แนบแพดให้นิ่ง",
    "📐 เหยียดแขนจนสุดแล้วงอกลับช้าๆ ไม่เหวี่ยง",
  ],
  abs: [
    "🪑 ปรับเบาะให้แพดอก/ที่จับพอดีไหล่ ให้ลำตัวงอที่ “เอว” ตรงจุดหมุน",
    "📐 ม้วนตัวงอลำตัว ไม่ดึงด้วยคอหรือแขน",
  ],
  hipabd: [
    "🪑 นั่งหลังแนบพนัก ปรับแพดให้แนบด้านนอก/ในของต้นขา",
    "📐 ตั้งช่วงเปิด/หุบให้พอดี ไม่ฝืนจนสุดแรง",
  ],
  backext: [
    "🪑 ปรับแพดให้ขอบสะโพกอยู่ใต้สันสะโพกเล็กน้อย",
    "📐 ก้ม-เงยจากสะโพก หลังตรงเป็นแนวเดียว ไม่แอ่นเกิน",
  ],
  shrug: [
    "🪑 ปรับให้จับได้สบายแขนเหยียดตรง",
    "📐 ยกไหล่ขึ้นตรงๆ บีบค้างสั้นๆ ไม่หมุนไหล่",
  ],
  generic: [
    "🪑 ปรับเบาะ/แพดให้พอดีตัว จัดข้อต่อที่ใช้งานให้ตรงแนวจุดหมุนของเครื่อง",
    "🛡️ หลังแนบพนัก เท้ามีที่รองรับ ไม่ลอย",
  ],
};

// คิวเปิดตามชนิดอุปกรณ์
const INTRO = {
  machine: "🏋️ ปรับหมุดน้ำหนักให้พอดี — เริ่มเบาเพื่อจับฟอร์มก่อนเพิ่ม",
  cable: "🔧 ปรับความสูงรอกให้เหมาะกับทิศของแรง (ดัน/ดึง) แล้วเลือกน้ำหนักที่พอดี",
};

// คืน { label, items[] } หรือ null ถ้าไม่ใช่ท่าที่ต้องตั้งเครื่อง
export function getSetup(ex) {
  const eq = (ex.equipment || "").toLowerCase();
  const isMachine = MACHINE.has(eq);
  const isCable = CABLE.has(eq);
  const isCardio = CARDIO.has(eq);
  if (!isMachine && !isCable && !isCardio) return null;

  if (isCardio) {
    const n = (ex.name || "").toLowerCase();
    if (/bike|cycl/.test(n) || eq === "stationary bike") {
      return {
        label: "จักรยานนั่งปั่น",
        items: [
          "🪑 ปรับความสูงเบาะให้เข่างอเล็กน้อย (~25–30°) ตอนเท้าถึงจุดต่ำสุด",
          "⚙️ เริ่มที่ความหนืดต่ำๆ แล้วค่อยเพิ่ม ลำตัวตรงไม่ทิ้งน้ำหนักลงที่จับ",
        ],
      };
    }
    return {
      label: "เครื่องคาร์ดิโอ",
      items: [
        "⚙️ เริ่มที่ระดับความต้านทานต่ำเพื่อจับจังหวะก่อนเพิ่ม",
        "🧍 ลำตัวตรง ไม่ทิ้งน้ำหนักลงที่จับ คุมจังหวะให้สม่ำเสมอ",
      ],
    };
  }

  const items = [INTRO[isCable ? "cable" : "machine"], ...CUES[classify(ex)]];
  return { label: isCable ? "เคเบิล" : "เครื่อง (Machine)", items };
}
