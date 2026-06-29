import { useEffect, useMemo, useState } from "react";
import { loadExercises, uniqueValues, mediaUrl } from "./data";
import { translateSteps } from "./translate";
import { useFavorites } from "./favorites";
import { thBody, thEquip, thMuscle, thMuscles, thName } from "./th-dict";
import { getTips, categorize, CATEGORIES } from "./tips";
import "./App.css";

// รูปสำรองเมื่อรูป/GIF โหลดไม่ได้ (404)
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%231a1d24'/%3E%3Ctext x='100' y='118' font-size='64' text-anchor='middle'%3E%F0%9F%92%AA%3C/text%3E%3C/svg%3E";

function onImgError(e) {
  if (!e.target.dataset.fb) {
    e.target.dataset.fb = "1";
    e.target.src = PLACEHOLDER;
  }
}

// แมปชื่อท่าอังกฤษ -> ไทย (โหลดครั้งเดียว)
let namesPromise = null;
function loadNames() {
  if (!namesPromise) {
    namesPromise = fetch(`${import.meta.env.BASE_URL}th-names.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return namesPromise;
}

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [nameMap, setNameMap] = useState({});

  const [view, setView] = useState("browse"); // browse | categories
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [target, setTarget] = useState("");
  const [category, setCategory] = useState(""); // หมวดการเคลื่อนไหว
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState(null);

  const { toggle, isFav, count } = useFavorites();

  // ชื่อท่าไทย: ใช้ไฟล์แปลล่วงหน้าก่อน ถ้าไม่มี fallback เป็น glossary ทีละคำ
  const thaiName = (name) => nameMap[name] || thName(name);

  useEffect(() => {
    loadExercises()
      .then((data) => {
        setExercises(data);
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
    loadNames().then(setNameMap);
  }, []);

  const bodyParts = useMemo(() => uniqueValues(exercises, "body_part"), [exercises]);
  const equipments = useMemo(() => uniqueValues(exercises, "equipment"), [exercises]);
  const targets = useMemo(() => uniqueValues(exercises, "target"), [exercises]);

  // นับจำนวนท่าต่อหมวดการเคลื่อนไหว (สำหรับหน้าหมวดหมู่)
  const catCounts = useMemo(() => {
    const c = {};
    for (const ex of exercises) {
      const k = categorize(ex);
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (favOnly && !isFav(ex.id)) return false;
      if (category && categorize(ex) !== category) return false;
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (bodyPart && ex.body_part !== bodyPart) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (target && ex.target !== target) return false;
      return true;
    });
  }, [exercises, query, bodyPart, equipment, target, favOnly, isFav, category]);

  const resetFilters = () => {
    setQuery("");
    setBodyPart("");
    setEquipment("");
    setTarget("");
    setFavOnly(false);
    setCategory("");
  };

  const openCategory = (key) => {
    setCategory(key);
    setView("browse");
  };

  const activeCatLabel = CATEGORIES.find((c) => c.key === category)?.label;

  return (
    <div className="app">
      <header className="header">
        <h1>💪 FitPedia <span className="brand-sub">คลังท่าออกกำลังกาย</span></h1>
        <p className="subtitle">
          ค้นหาท่าออกกำลังกายพร้อมภาพเคลื่อนไหว กล้ามเนื้อเป้าหมาย และวิธีทำทีละขั้น
        </p>
        <div className="nav">
          <button
            className={"nav-btn" + (view === "browse" ? " nav-active" : "")}
            onClick={() => setView("browse")}
          >
            🔎 ค้นหา
          </button>
          <button
            className={"nav-btn" + (view === "categories" ? " nav-active" : "")}
            onClick={() => setView("categories")}
          >
            🗂️ หมวดหมู่
          </button>
        </div>
      </header>

      {status === "loading" && (
        <p className="state">⏳ กำลังโหลดข้อมูลจาก GitHub… (ไฟล์ใหญ่ ~6 MB)</p>
      )}
      {status === "error" && <p className="state error">❌ {error}</p>}

      {status === "ready" && view === "categories" && (
        <div className="cat-grid">
          {CATEGORIES.filter((c) => catCounts[c.key]).map((c) => (
            <button key={c.key} className="cat-tile" onClick={() => openCategory(c.key)}>
              <span className="cat-emoji">{c.emoji}</span>
              <span className="cat-label">{c.label}</span>
              <span className="cat-count">{catCounts[c.key]} ท่า</span>
            </button>
          ))}
        </div>
      )}

      {status === "ready" && view === "browse" && (
        <>
          <div className="controls">
            <input
              className="search"
              type="search"
              placeholder="ค้นหาชื่อท่า เช่น sit-up, push-up, squat…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="filters">
              <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                <option value="">ส่วนของร่างกาย (ทั้งหมด)</option>
                {bodyParts.map((v) => (
                  <option key={v} value={v}>{thBody(v)}</option>
                ))}
              </select>
              <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                <option value="">อุปกรณ์ (ทั้งหมด)</option>
                {equipments.map((v) => (
                  <option key={v} value={v}>{thEquip(v)}</option>
                ))}
              </select>
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">กล้ามเนื้อเป้าหมาย (ทั้งหมด)</option>
                {targets.map((v) => (
                  <option key={v} value={v}>{thMuscle(v)}</option>
                ))}
              </select>
              <button
                className={"chip" + (favOnly ? " chip-active" : "")}
                onClick={() => setFavOnly((v) => !v)}
              >
                {favOnly ? "★" : "☆"} เฉพาะที่ชอบ ({count})
              </button>
              <button className="reset" onClick={resetFilters}>ล้างตัวกรอง</button>
            </div>
            {category && (
              <div className="active-cat">
                หมวด: <strong>{activeCatLabel}</strong>
                <button className="active-cat-x" onClick={() => setCategory("")}>✕</button>
              </div>
            )}
          </div>

          <p className="count">พบ {filtered.length.toLocaleString()} ท่า</p>
          {favOnly && filtered.length === 0 && (
            <p className="state">ยังไม่มีท่าโปรด — กดรูป ♡ ที่การ์ดเพื่อบันทึก</p>
          )}
          <div className="grid">
            {filtered.slice(0, 300).map((ex) => {
              const thai = thaiName(ex.name);
              const fav = isFav(ex.id);
              return (
                <div key={ex.id} className="card" onClick={() => setSelected(ex)}>
                  <div className="thumb-wrap">
                    <img
                      className="thumb"
                      src={mediaUrl(ex.image)}
                      alt={ex.name}
                      loading="lazy"
                      onError={onImgError}
                    />
                    <button
                      className={"fav-btn" + (fav ? " fav-on" : "")}
                      title={fav ? "เอาออกจากที่ชอบ" : "เพิ่มในที่ชอบ"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(ex.id);
                      }}
                    >
                      {fav ? "♥" : "♡"}
                    </button>
                  </div>
                  <div className="card-body">
                    <h3>{ex.name}</h3>
                    {thai && <p className="th-name">{thai}</p>}
                    <div className="tags">
                      <span className="tag">{thBody(ex.body_part)}</span>
                      <span className="tag tag-muted">{thEquip(ex.equipment)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length > 300 && (
            <p className="state">แสดง 300 ท่าแรก — ใช้ตัวกรองเพื่อแคบผลลัพธ์</p>
          )}
        </>
      )}

      {selected && (
        <ExerciseModal
          ex={selected}
          thaiName={thaiName(selected.name)}
          onClose={() => setSelected(null)}
          isFav={isFav(selected.id)}
          onToggleFav={() => toggle(selected.id)}
        />
      )}

      <footer className="footer">
        ข้อมูลจาก{" "}
        <a
          href="https://github.com/hasaneyldrm/exercises-dataset"
          target="_blank"
          rel="noreferrer"
        >
          hasaneyldrm/exercises-dataset
        </a>{" "}
        · เพื่อการศึกษาเท่านั้น
      </footer>
    </div>
  );
}

function ExerciseModal({ ex, thaiName, onClose, isFav, onToggleFav }) {
  const enSteps = ex.instruction_steps?.en || [];
  const [lang, setLang] = useState("th"); // th | en
  const [thSteps, setThSteps] = useState(null);
  const [tStatus, setTStatus] = useState("idle"); // idle | loading | done | error

  // แปลวิธีทำเป็นไทยเมื่อเลือกภาษาไทยครั้งแรก
  useEffect(() => {
    if (lang !== "th" || thSteps || tStatus === "loading") return;
    let cancelled = false;
    setTStatus("loading");
    translateSteps(enSteps)
      .then((th) => {
        if (cancelled) return;
        setThSteps(th);
        setTStatus("done");
      })
      .catch(() => !cancelled && setTStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [lang, thSteps, tStatus, enSteps]);

  const showThai = lang === "th";
  const steps = showThai && thSteps ? thSteps : enSteps;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <img className="gif" src={mediaUrl(ex.gif_url)} alt={ex.name} onError={onImgError} />
        <div className="modal-content">
          <div className="modal-title">
            <div>
              <h2>{ex.name}</h2>
              {thaiName && <p className="th-name">{thaiName}</p>}
            </div>
            <button
              className={"fav-btn fav-lg" + (isFav ? " fav-on" : "")}
              onClick={onToggleFav}
              title={isFav ? "เอาออกจากที่ชอบ" : "เพิ่มในที่ชอบ"}
            >
              {isFav ? "♥" : "♡"}
            </button>
          </div>

          <div className="tags">
            <span className="tag">{thBody(ex.body_part)}</span>
            <span className="tag">{thEquip(ex.equipment)}</span>
            <span className="tag tag-accent">เป้าหมาย: {thMuscle(ex.target)}</span>
          </div>
          {ex.secondary_muscles?.length > 0 && (
            <p className="muscles">
              กล้ามเนื้อเสริม: {thMuscles(ex.secondary_muscles).join(", ")}
            </p>
          )}

          <div className="steps-head">
            <h4>วิธีทำ</h4>
            <div className="lang-toggle">
              <button
                className={showThai ? "active" : ""}
                onClick={() => setLang("th")}
              >
                ไทย
              </button>
              <button
                className={!showThai ? "active" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
          </div>

          {showThai && tStatus === "loading" && (
            <p className="translating">⏳ กำลังแปลวิธีทำเป็นภาษาไทย…</p>
          )}
          {showThai && tStatus === "error" && (
            <p className="translating">⚠️ แปลไม่สำเร็จ แสดงภาษาอังกฤษแทน</p>
          )}

          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          <TipsBox ex={ex} />
        </div>
      </div>
    </div>
  );
}

function TipsBox({ ex }) {
  const tips = getTips(ex);
  return (
    <div className="tips">
      <h4>💡 เคล็ดลับ & ข้อควรระวัง <span className="tips-cat">({tips.label})</span></h4>
      <ul className="tips-list">
        {tips.items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      <p className="translate-note">
        * คำแนะนำทั่วไปตามหมวดการเคลื่อนไหว — หากเพิ่งเริ่มหรือมีอาการบาดเจ็บ ควรปรึกษาผู้เชี่ยวชาญ
      </p>
    </div>
  );
}
