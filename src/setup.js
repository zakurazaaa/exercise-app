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

// จัดประเภทท่าเครื่องเพื่อเลือกคิวที่ตรงที่สุด (ลำดับสำคัญ — บนสุดถูกเช็กก่อน)
function classify(ex) {
  const n = (ex.name || "").toLowerCase();
  const t = (ex.target || "").toLowerCase();
  const bp = (ex.body_part || "").toLowerCase();

  if (/calf|heel raise|toe raise/.test(n)) return "calf";
  if (/leg extension/.test(n)) return "legext";
  if (/leg curl/.test(n)) return "legcurl";
  if (/leg press|hack squat|leg wide press|lying squat/.test(n)) return "legpress";
  if (/squat|lunge|split squat|sprint/.test(n)) return "squat";
  if (/deadlift|good morning|romanian|\brdl\b|pull through|hip hinge|\bswing\b/.test(n)) return "hinge";
  if (/abduction|adduction|hip abductor|hip adductor/.test(n)) return "hipabd";
  if (/back extension|hyperextension|hip extension/.test(n)) return "backext";
  if (/hip thrust|glute bridge/.test(n)) return "hipthrust";
  if (/assisted/.test(n) && /pull-up|chin-up|pull up|chin up|dip/.test(n)) return "assisted";
  if (/rear delt|rear lateral|rear fly|revers|reverse fly/.test(n)) return "lateralraise";
  if (/pec deck|pec-deck|butterfly|\bfly\b|flye/.test(n)) return "fly";
  if (/lat pulldown|pulldown|pull-down|pull down/.test(n)) return "latpulldown";
  if (/pullover/.test(n)) return "pullover";
  if (/\brow\b/.test(n)) return "row";
  if (/shoulder press|overhead press|military|arnold|behind neck press|behind the neck/.test(n)) return "ohp";
  if (/internal rotation|external rotation|rotator|rotational/.test(n)) return "rotation";
  if (/lateral raise|side raise|front raise|forward raise|shoulder raise/.test(n)) return "lateralraise";
  if (/wrist|forearm/.test(n) || t === "forearms") return "forearm";
  if (/shrug/.test(n) || t === "traps") return "shrug";
  if ((/curl/.test(n) && !/leg|wrist/.test(n)) || t === "biceps") return "bicep";
  if (/tricep|pushdown|push-down|kickback|skull|extension|dip/.test(n) || t === "triceps") return "tricep";
  if (/crunch|abdominal|\bab\b|ab coaster|sit-up|situp/.test(n) || ["abs", "obliques"].includes(t) || bp === "waist")
    return "abs";
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
  squat: [
    "🔧 ตั้งความสูงเริ่มต้นของบาร์ให้พอดีไหล่ และตั้งตัวล็อกนิรภัย (safety stops) ไว้ใต้จุดต่ำสุด",
    "🦶 ยืนเท้ากว้างประมาณช่วงไหล่ ปลายเท้าชี้ออกเล็กน้อย",
    "📐 ย่อลงจนต้นขาขนานพื้น หลังตรง เข่าไปทางเดียวกับปลายเท้า",
  ],
  hinge: [
    "🔧 ตั้งความสูงบาร์/จุดเริ่มและตัวล็อกนิรภัยให้เหมาะกับช่วงดึง",
    "📐 พับสะโพกไปด้านหลัง หลังตรงเป็นแนวเดียว เข่างอเล็กน้อย",
    "⚠️ อย่างอหลังล่าง — ดันสะโพกไปข้างหน้าตอนยืดขึ้น บีบก้นบนสุด",
  ],
  calf: [
    "🛡️ ปรับแพดไหล่/เบาะให้กระชับพอดีตัว",
    "📐 ปล่อยส้นลงจนรู้สึกตึงน่อง แล้วเขย่งขึ้นจนสุด",
  ],
  chestpress: [
    "🪑 ปรับเบาะให้ “ที่จับอยู่ระดับกลางอก” (สูงเกินไปจะไปลงหัวไหล่)",
    "🪑 หลังและศีรษะแนบพนัก เท้าวางเต็มฝ่าเท้า",
    "📐 ดันจนแขนเกือบเหยียด (อย่าล็อกศอก) แล้วลดจนรู้สึกยืดอก",
  ],
  fly: [
    "🪑 ปรับเบาะให้แขน/ที่จับอยู่ระดับอก ข้อศอกต่ำกว่าหัวไหล่เล็กน้อย",
    "🪑 หลังแนบพนักตลอดช่วง บีบอกตอนหุบเข้า",
  ],
  ohp: [
    "🪑 ปรับเบาะให้ “ที่จับอยู่ระดับไหล่”",
    "🪑 หลังแนบพนัก ไม่แอ่นหลังมากตอนดันขึ้น",
    "📐 ดันขึ้นจนแขนเกือบเหยียด แล้วลดลงจนข้อศอกระดับไหล่",
  ],
  lateralraise: [
    "📐 ยกแขนขึ้นถึงระดับไหล่ คุมช้าๆ ไม่เหวี่ยงตัวช่วย",
    "🪑 ถ้าเป็นเครื่องมีแพด ให้ “ข้อไหล่” ตรงจุดหมุนและแพดกดที่ต้นแขน",
  ],
  latpulldown: [
    "🦵 ปรับแพดต้นขาให้กดเข่ากระชับ กันตัวลอยขึ้น",
    "✋ จับกว้างกว่าหัวไหล่เล็กน้อย",
    "📐 ดึงบาร์ลงถึงกระดูกไหปลาร้า/อกบน อกตั้ง อย่าเอนหลังมาก",
  ],
  pullover: [
    "🪑 ปรับเบาะ/แพดให้ “ข้อไหล่” ตรงแนวจุดหมุนของเครื่อง",
    "📐 กางแขนไปด้านหลังจนรู้สึกยืดอก/หลัง แล้วดึงกลับโดยคุมจังหวะ",
  ],
  row: [
    "🪑 ปรับเบาะ/แพดอกให้ “ที่จับอยู่ระดับกลางอก” แพดอกแตะเบาๆ",
    "📐 อกตั้ง หลังตรง ดึงศอกไปด้านหลังพร้อมบีบสะบัก",
    "🚫 ลำตัวนิ่ง อย่าเอนหน้า-หลังเหวี่ยงช่วย",
  ],
  rotation: [
    "🔧 ตั้งความสูงรอก/ที่จับให้อยู่ระดับข้อศอก ข้อศอกแนบลำตัวงอ 90°",
    "📐 หมุนปลายแขนเข้า/ออกช้าๆ คุมจังหวะ ไม่เหวี่ยง (เน้นเบา)",
  ],
  forearm: [
    "🪑 วางปลายแขนบนต้นขา/เบาะให้นิ่ง เหลือข้อมือพ้นขอบ",
    "📐 ม้วนข้อมือขึ้น-ลงจนสุดช่วง โดยไม่ขยับปลายแขน",
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
  hipthrust: [
    "🪑 พิงสะบักกับเบาะ/พนัก วางแพดทับสะโพกให้กระชับ",
    "📐 ดันสะโพกขึ้นจนลำตัว-ต้นขาเป็นแนวตรง บีบก้นค้างบนสุด",
    "⚠️ อย่าแอ่นหลังล่าง — เก็บคางและซี่โครงลง",
  ],
  assisted: [
    "🏋️ ตั้งน้ำหนักช่วย (assist) — ใส่ “มาก” = ช่วยมาก เริ่มจากมากแล้วค่อยลด",
    "🦵 วางเข่า/เท้าบนแป้นรองให้มั่นคงก่อนปล่อยน้ำหนัก",
    "📐 ขึ้นจนคางพ้นบาร์/อกแตะ แล้วลงจนแขนเหยียดเกือบสุด (เต็มช่วง)",
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

// คิวเปิดตามชนิดอุปกรณ์/ประเภทท่า
const INTRO = {
  machine: "🏋️ ปรับหมุดน้ำหนักให้พอดี — เริ่มเบาเพื่อจับฟอร์มก่อนเพิ่ม",
  smith: "🏋️ ใส่แผ่นน้ำหนักให้พอดี เริ่มเบาเพื่อจับฟอร์ม และปลดล็อกบาร์โดยหมุนข้อมือ",
  cable: "🔧 ปรับความสูงรอกให้เหมาะกับทิศของแรง (ดัน/ดึง) แล้วเลือกน้ำหนักที่พอดี",
};

// เลือกคิวเปิดตามบริบท (assisted อธิบายน้ำหนักช่วยในคิวของตัวเองแล้ว)
function introCue(eq, isCable, cat) {
  if (cat === "assisted") return null;
  if (isCable) return INTRO.cable;
  if (eq === "smith machine") return INTRO.smith;
  return INTRO.machine;
}

// คืน { label, items[] } หรือ null ถ้าไม่ใช่ท่าที่ต้องตั้งเครื่อง
export function getSetup(ex) {
  const eq = (ex.equipment || "").toLowerCase();
  const n = (ex.name || "").toLowerCase();
  const t = (ex.target || "").toLowerCase();
  const isMachine = MACHINE.has(eq);
  const isCable = CABLE.has(eq);
  const isCardio = CARDIO.has(eq) || t === "cardiovascular system";
  if (!isMachine && !isCable && !isCardio) return null;

  // ท่ายืดเหยียดไม่ใช่การตั้งเครื่อง
  if (/stretch/.test(n)) return null;

  if (isCardio) {
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

  const cat = classify(ex);
  const intro = introCue(eq, isCable, cat);
  const items = [intro, ...CUES[cat]].filter(Boolean);
  return { label: isCable ? "เคเบิล" : "เครื่อง (Machine)", items };
}
