// เคล็ดลับ & ข้อควรระวัง ตามหมวดการเคลื่อนไหว
// จัดหมวดจากชื่อ/เป้าหมาย/อุปกรณ์ แล้วแมปคิวสำคัญที่ dataset เดิมมักขาด
// (จังหวะหายใจ, ข้อผิดพลาดที่พบบ่อย, จุดโฟกัสฟอร์ม)

export function categorize(ex) {
  const n = (ex.name || "").toLowerCase();
  const t = (ex.target || "").toLowerCase();
  const bp = (ex.body_part || "").toLowerCase();

  if (
    t === "cardiovascular system" ||
    bp === "cardio" ||
    /run|jog|sprint|cycle|bike|elliptical|treadmill|skierg|stair|jump rope|jumping jack|burpee|mountain climber|high knee/.test(n)
  )
    return "cardio";
  if (/stretch|mobility/.test(n)) return "stretch";
  if (/squat/.test(n)) return "squat";
  if (/deadlift|good morning|romanian|rdl|swing|hip thrust|glute bridge|clean|snatch|hinge|stiff leg/.test(n)) return "hinge";
  if (/lunge|split squat|step-up|step up|curtsy/.test(n)) return "lunge";
  if (/calf|heel raise/.test(n)) return "calf";
  if (/leg extension|leg curl|leg press|hack squat/.test(n)) return "legmachine";
  if (/lateral raise|front raise|side raise|rear delt|reverse fly|lateral fly/.test(n)) return "shoulderraise";
  if (/shoulder press|overhead press|military press|arnold|push press|z press/.test(n)) return "ohp";
  if (
    /bench press|chest press|push-up|pushup|push up|chest fly|chest dip|pec|incline press|decline press|floor press/.test(n) ||
    t === "pectorals"
  )
    return "horizontalpress";
  if (/row|pulldown|pull-up|pullup|pull up|chin-up|chin up|pull down|face pull|lat /.test(n)) return "pull";
  if ((/bicep|curl/.test(n) && !/leg|wrist/.test(n)) || t === "biceps") return "biceps";
  if (/tricep|pushdown|push down|kickback|skull|extension|dip/.test(n) || t === "triceps") return "triceps";
  if (
    /crunch|sit-up|situp|sit up|plank|leg raise|twist|russian|knee raise|mountain|hollow|v-up|toe touch|bicycle|oblique/.test(n) ||
    ["abs", "obliques"].includes(t) ||
    bp === "waist"
  )
    return "core";
  if (/wrist|forearm/.test(n) || t === "forearms") return "forearm";
  if (/shrug/.test(n) || t === "traps") return "traps";
  // fallback ตามกลุ่มกล้ามเนื้อ
  if (["lats", "upper back"].includes(t)) return "pull";
  if (["glutes", "quads", "hamstrings", "abductors", "adductors"].includes(t)) return "legmachine";
  if (t === "delts") return "shoulderraise";
  if (t === "calves") return "calf";
  return "general";
}

const TIPS = {
  squat: {
    label: "กลุ่มสควอท",
    items: [
      "🫁 สูดหายใจเข้าลึกถึงท้องก่อนย่อลง กลั้นไว้ตอนลง–ดันขึ้น (ท่าหนัก) แล้วผ่อนลมหายใจออกช่วงดันขึ้น",
      "⚠️ ระวังเข่าหุบเข้าด้านใน — ดันเข่าออกให้อยู่ในแนวเดียวกับปลายเท้า",
      "⚠️ อย่าให้ส้นเท้าลอย ลงน้ำหนักที่กลางเท้าถึงส้น",
      "🎯 ลงให้ต้นขาขนานพื้นเป็นอย่างน้อย คงหลังตรงและอกตั้ง",
    ],
  },
  hinge: {
    label: "กลุ่มพับสะโพก (เดดลิฟต์)",
    items: [
      "🫁 สูดหายใจเข้าท้อง เกร็งแกนกลางลำตัว กลั้นไว้ตลอดช่วงยก แล้วหายใจออกเมื่อยืนสุด",
      "⚠️ ห้ามหลังงอ/โก่งเด็ดขาด — รักษาแนวกระดูกสันหลังให้เป็นกลางเสมอ",
      "⚠️ อย่าใช้หลังดึงน้ำหนักขึ้น ให้ออกแรงดันพื้นด้วยขาและดันสะโพกไปข้างหน้า",
      "🎯 ให้บาร์/น้ำหนักชิดลำตัวตลอด และบีบเกร็งก้นที่จุดยืนสุด",
    ],
  },
  lunge: {
    label: "กลุ่มลันจ์ / ก้าวขา",
    items: [
      "🫁 หายใจเข้าตอนย่อลง หายใจออกตอนดันขึ้น",
      "⚠️ เข่าหน้าไม่ควรเลยปลายเท้ามากเกินไป และไม่บิดเข้าด้านใน",
      "🎯 คงลำตัวตั้งตรง ลงให้เข่าหลังเกือบแตะพื้น และดันด้วยส้นเท้าหน้า",
    ],
  },
  calf: {
    label: "กลุ่มน่อง",
    items: [
      "🫁 หายใจออกตอนเขย่งขึ้น หายใจเข้าตอนลดลง",
      "🎯 เคลื่อนช้าๆ เต็มช่วง — ลดส้นให้ต่ำสุดจนรู้สึกยืดน่อง แล้วเขย่งสูงสุด ค้างเล็กน้อย",
      "⚠️ อย่าเด้งเร็วๆ ด้วยแรงเหวี่ยง จะได้ผลน้อยและเสี่ยงบาดเจ็บ",
    ],
  },
  legmachine: {
    label: "กลุ่มเครื่องบริหารขา",
    items: [
      "🫁 หายใจออกตอนออกแรง (เหยียด/งอ) หายใจเข้าตอนกลับ",
      "⚠️ อย่ากระแทกล็อกเข่าจนสุด และอย่าให้สะโพก/หลังยกพ้นเบาะ",
      "🎯 ควบคุมจังหวะขากลับช้าๆ และเคลื่อนเต็มช่วงการเคลื่อนไหว",
    ],
  },
  shoulderraise: {
    label: "กลุ่มยกไหล่ (raise)",
    items: [
      "🫁 หายใจออกตอนยกขึ้น หายใจเข้าตอนลดลง",
      "⚠️ อย่าใช้แรงเหวี่ยงตัวช่วยยก ใช้น้ำหนักพอเหมาะแล้วยกด้วยกล้ามไหล่",
      "🎯 งอข้อศอกเล็กน้อย ยกไม่เกินระดับไหล่ และคุมจังหวะตอนลด",
    ],
  },
  ohp: {
    label: "กลุ่มดันเหนือศีรษะ",
    items: [
      "🫁 สูดหายใจเข้าท้อง เกร็งแกนกลาง กลั้นไว้ตอนดันขึ้น แล้วหายใจออกด้านบน",
      "⚠️ อย่าแอ่นหลังส่วนล่างมากเกินไป — เกร็งหน้าท้องและก้นไว้",
      "🎯 ดันน้ำหนักเป็นแนวตรงเหนือศีรษะ และคงข้อมือให้ตรง",
    ],
  },
  horizontalpress: {
    label: "กลุ่มดันราบ (อก)",
    items: [
      "🫁 หายใจเข้าตอนลดน้ำหนักลง หายใจออกตอนดันขึ้น",
      "⚠️ อย่ากางข้อศอกออก 90° เต็ม — เก็บเข้าเล็กน้อย (~45–75°) เพื่อถนอมหัวไหล่",
      "🎯 ควบคุมจังหวะตอนลง, ดึงสะบักเข้าหากันให้มั่นคง (เบนช์) หรือคงลำตัวเป็นเส้นตรง (วิดพื้น)",
    ],
  },
  pull: {
    label: "กลุ่มดึง (หลัง)",
    items: [
      "🫁 หายใจออกตอนดึงเข้า หายใจเข้าตอนปล่อยออก",
      "⚠️ อย่าใช้แรงเหวี่ยงหลัง/กระตุกแขน เริ่มการเคลื่อนไหวจากการบีบสะบัก",
      "🎯 ดึงด้วยข้อศอก บีบสะบักเข้าหากันที่จุดสุด และคุมจังหวะตอนปล่อย",
    ],
  },
  biceps: {
    label: "กลุ่มกล้ามต้นแขนด้านหน้า (ไบเซ็ป)",
    items: [
      "🫁 หายใจออกตอนยกขึ้น หายใจเข้าตอนลดลง",
      "⚠️ ให้ต้นแขนอยู่นิ่ง ไม่แกว่งตัวหรือใช้แรงสะโพกช่วย",
      "🎯 เคิร์ลเต็มช่วง บีบเกร็งที่จุดสูงสุด แล้วลดช้าๆ",
    ],
  },
  triceps: {
    label: "กลุ่มกล้ามแขนด้านหลัง (ไตรเซ็ป)",
    items: [
      "🫁 หายใจออกตอนเหยียดแขน หายใจเข้าตอนงอกลับ",
      "⚠️ ให้ต้นแขน/ข้อศอกอยู่นิ่ง ชิดลำตัวหรือชิดศีรษะ",
      "🎯 เหยียดแขนจนสุดเพื่อบีบกล้ามแขนหลัง และคุมจังหวะตอนกลับ",
    ],
  },
  core: {
    label: "กลุ่มหน้าท้อง / แกนกลาง",
    items: [
      "🫁 หายใจออกตอนเกร็ง/ม้วนตัวขึ้น หายใจเข้าตอนกลับลง",
      "⚠️ อย่าดึงคอหรือศีรษะด้วยมือ — ใช้กล้ามท้องยก ไม่ใช่คอ",
      "🎯 เคลื่อนช้าๆ ควบคุมได้ เกร็งหน้าท้องตลอด และให้หลังส่วนล่างแนบพื้น (ท่านอน)",
    ],
  },
  forearm: {
    label: "กลุ่มแขนท่อนล่าง / ข้อมือ",
    items: [
      "🫁 หายใจสม่ำเสมอตลอดการเคลื่อนไหว",
      "⚠️ ใช้น้ำหนักเบาถึงปานกลาง และเลี่ยงการสะบัดข้อมือ",
      "🎯 เคลื่อนข้อมือเต็มช่วงช้าๆ โดยให้ปลายแขนอยู่นิ่ง",
    ],
  },
  traps: {
    label: "กลุ่มกล้ามบ่า (ยักไหล่)",
    items: [
      "🫁 หายใจออกตอนยักไหล่ขึ้น หายใจเข้าตอนลดลง",
      "⚠️ อย่าหมุนไหล่เป็นวง ให้ยกขึ้นตรงๆ",
      "🎯 ยกไหล่เข้าหาใบหู ค้างบีบเล็กน้อย แล้วลดลงช้าๆ",
    ],
  },
  cardio: {
    label: "กลุ่มคาร์ดิโอ",
    items: [
      "🫁 หายใจเป็นจังหวะสม่ำเสมอ อย่ากลั้นหายใจ",
      "🎯 วอร์มอัพก่อน เริ่มเบาแล้วค่อยเพิ่มความเข้มข้น และคูลดาวน์ตอนท้าย",
      "⚠️ คงท่าทางให้ตั้งตรง อย่าเกร็งไหล่หรือพึ่งแรงแขนจับราวมากเกินไป",
    ],
  },
  stretch: {
    label: "กลุ่มยืดเหยียด",
    items: [
      "🫁 หายใจเข้าลึก แล้วผ่อนลมหายใจออกช้าๆ ขณะยืด",
      "⚠️ ยืดถึงจุดตึง 'สบาย' ไม่ถึงจุดเจ็บ และห้ามเด้ง",
      "🎯 ค้างไว้ 15–30 วินาที และทำทั้งสองข้างให้เท่ากัน",
    ],
  },
  general: {
    label: "ทั่วไป",
    items: [
      "🫁 หายใจออกตอนออกแรง หายใจเข้าตอนผ่อน อย่ากลั้นหายใจนานในท่าเบา",
      "⚠️ คงหลังให้ตรงและเกร็งแกนกลางลำตัวตลอดการเคลื่อนไหว",
      "🎯 เคลื่อนไหวช้าๆ ควบคุมได้เต็มช่วง และเลือกน้ำหนักที่คุมฟอร์มได้",
    ],
  },
};

export function getTips(ex) {
  const cat = categorize(ex);
  return TIPS[cat] || TIPS.general;
}
