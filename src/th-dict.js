// พจนานุกรมไทยแบบฝังในแอป — ครอบคลุมคำที่เป็นเซ็ตจำกัด (ส่วนร่างกาย/อุปกรณ์/กล้ามเนื้อ)
// แปลทันที ไม่ต้องเรียก API คุณภาพถูกต้อง 100%

export const BODY_PART = {
  back: "หลัง",
  cardio: "คาร์ดิโอ",
  chest: "หน้าอก",
  "lower arms": "แขนท่อนล่าง",
  "lower legs": "ขาท่อนล่าง",
  neck: "คอ",
  shoulders: "ไหล่",
  "upper arms": "แขนท่อนบน",
  "upper legs": "ขาท่อนบน",
  waist: "เอว / หน้าท้อง",
};

export const EQUIPMENT = {
  assisted: "มีตัวช่วยพยุง",
  band: "ยางยืด",
  barbell: "บาร์เบล",
  "body weight": "น้ำหนักตัว",
  "bosu ball": "โบซูบอล",
  cable: "เคเบิล",
  dumbbell: "ดัมเบล",
  "elliptical machine": "เครื่องเดินวงรี",
  "ez barbell": "บาร์เบล EZ",
  hammer: "ค้อน",
  kettlebell: "เคตเทิลเบล",
  "leverage machine": "เครื่องคานงัด",
  "medicine ball": "เมดิซินบอล",
  "olympic barbell": "บาร์เบลโอลิมปิก",
  "resistance band": "ยางยืดแรงต้าน",
  roller: "ลูกกลิ้ง",
  rope: "เชือก",
  "skierg machine": "เครื่องสกีเอิร์ก",
  "sled machine": "เครื่องเลื่อน (sled)",
  "smith machine": "สมิธแมชชีน",
  "stability ball": "ลูกบอลโยคะ",
  "stationary bike": "จักรยานอยู่กับที่",
  "stepmill machine": "เครื่องเดินขั้นบันได",
  tire: "ยางรถ",
  "trap bar": "แทร็พบาร์",
  "upper body ergometer": "เครื่องปั่นแขน",
  weighted: "เพิ่มน้ำหนัก",
  "wheel roller": "ล้อบริหารหน้าท้อง",
};

// รวมกล้ามเนื้อทั้งหมด (target + muscle_group + secondary_muscles)
export const MUSCLE = {
  abductors: "กล้ามเนื้อกางขา",
  abdominals: "หน้าท้อง",
  abs: "หน้าท้อง",
  adductors: "กล้ามเนื้อหุบขา",
  "ankle stabilizers": "กล้ามเนื้อพยุงข้อเท้า",
  ankles: "ข้อเท้า",
  back: "หลัง",
  biceps: "ไบเซ็ป (แขนหน้า)",
  brachialis: "กล้ามเนื้อต้นแขน",
  calves: "น่อง",
  "cardiovascular system": "ระบบหัวใจและหลอดเลือด",
  chest: "หน้าอก",
  core: "แกนกลางลำตัว",
  deltoids: "กล้ามเนื้อไหล่",
  delts: "กล้ามเนื้อไหล่",
  feet: "เท้า",
  forearms: "แขนท่อนล่าง",
  glutes: "ก้น / สะโพก",
  "grip muscles": "กล้ามเนื้อการจับ",
  groin: "ขาหนีบ",
  hamstrings: "ต้นขาด้านหลัง",
  hands: "มือ",
  "hip flexors": "กล้ามเนื้องอสะโพก",
  "inner thighs": "ต้นขาด้านใน",
  lats: "ปีกหลัง",
  "latissimus dorsi": "ปีกหลัง",
  "levator scapulae": "กล้ามเนื้อยกสะบัก",
  "lower abs": "หน้าท้องส่วนล่าง",
  "lower back": "หลังส่วนล่าง",
  obliques: "หน้าท้องด้านข้าง",
  pectorals: "หน้าอก",
  quadriceps: "ต้นขาด้านหน้า",
  quads: "ต้นขาด้านหน้า",
  "rear deltoids": "ไหล่ด้านหลัง",
  rhomboids: "กล้ามเนื้อสะบัก",
  "rotator cuff": "กล้ามเนื้อหมุนหัวไหล่",
  "serratus anterior": "กล้ามเนื้อข้างซี่โครง",
  shins: "หน้าแข้ง",
  shoulders: "ไหล่",
  soleus: "น่องส่วนลึก",
  spine: "กระดูกสันหลัง",
  sternocleidomastoid: "กล้ามเนื้อคอด้านข้าง",
  trapezius: "กล้ามเนื้อบ่า",
  traps: "กล้ามเนื้อบ่า",
  triceps: "ไตรเซ็ป (แขนหลัง)",
  "upper back": "หลังส่วนบน",
  "upper chest": "หน้าอกส่วนบน",
  "wrist extensors": "กล้ามเนื้อเหยียดข้อมือ",
  "wrist flexors": "กล้ามเนื้องอข้อมือ",
  wrists: "ข้อมือ",
};

// คำที่พบบ่อยในชื่อท่า — ใช้แปลแบบทีละคำ (word-level) ให้ได้ชื่อไทยทันที
const NAME_WORDS = {
  "sit-up": "ซิทอัพ",
  situp: "ซิทอัพ",
  "push-up": "วิดพื้น",
  pushup: "วิดพื้น",
  "pull-up": "ดึงข้อ",
  pullup: "ดึงข้อ",
  "chin-up": "ดึงข้อหงายมือ",
  squat: "สควอท",
  squats: "สควอท",
  lunge: "ลันจ์",
  lunges: "ลันจ์",
  crunch: "ครันช์",
  crunches: "ครันช์",
  plank: "แพลงก์",
  bridge: "บริดจ์",
  deadlift: "เดดลิฟต์",
  press: "ดัน (press)",
  bench: "ม้านั่ง",
  curl: "เคิร์ล",
  curls: "เคิร์ล",
  row: "โรว์ (ดึงเข้า)",
  raise: "ยก",
  raises: "ยก",
  fly: "ฟลาย (กางแขน)",
  flye: "ฟลาย (กางแขน)",
  extension: "เหยียด",
  extensions: "เหยียด",
  kickback: "คิกแบ็ก",
  dip: "ดิป",
  dips: "ดิป",
  twist: "บิดลำตัว",
  "leg raise": "ยกขา",
  pulldown: "ดึงลง",
  pushdown: "ดันลง",
  "calf raise": "เขย่งน่อง",
  shrug: "ยักไหล่",
  thrust: "ดันสะโพก",
  // ตำแหน่ง/ท่าทาง
  seated: "นั่ง",
  standing: "ยืน",
  lying: "นอน",
  incline: "เอียงขึ้น",
  decline: "เอียงลง",
  kneeling: "คุกเข่า",
  single: "ข้างเดียว",
  "one arm": "แขนเดียว",
  "single leg": "ขาเดียว",
  alternate: "สลับข้าง",
  reverse: "ย้อนกลับ",
  wide: "กว้าง",
  close: "แคบ",
  front: "ด้านหน้า",
  side: "ด้านข้าง",
  rear: "ด้านหลัง",
  overhead: "เหนือศีรษะ",
  // อุปกรณ์ (ในชื่อท่า)
  barbell: "บาร์เบล",
  dumbbell: "ดัมเบล",
  cable: "เคเบิล",
  kettlebell: "เคตเทิลเบล",
  machine: "เครื่อง",
  "smith machine": "สมิธแมชชีน",
  "resistance band": "ยางยืด",
  band: "ยางยืด",
  "medicine ball": "เมดิซินบอล",
};

function lookup(map, val) {
  if (!val) return val;
  return map[val.toLowerCase()] || val;
}

export const thBody = (v) => lookup(BODY_PART, v);
export const thEquip = (v) => lookup(EQUIPMENT, v);
export const thMuscle = (v) => lookup(MUSCLE, v);
export const thMuscles = (arr) => (arr || []).map(thMuscle);

// แปลชื่อท่าแบบทีละคำ — แทนที่คำที่รู้จัก ส่วนคำที่ไม่รู้คงไว้เดิม
// คืน null ถ้าไม่มีคำไหนแปลได้เลย (จะได้ไม่ต้องโชว์บรรทัดไทยซ้ำกับอังกฤษ)
export function thName(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  let result = name;
  let hit = false;
  // จับวลี 2 คำก่อน (เช่น "single leg") แล้วค่อยคำเดี่ยว
  const phrases = Object.keys(NAME_WORDS).sort(
    (a, b) => b.length - a.length
  );
  for (const p of phrases) {
    if (lower.includes(p)) {
      const re = new RegExp(p.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "gi");
      result = result.replace(re, NAME_WORDS[p]);
      hit = true;
    }
  }
  return hit ? result : null;
}
