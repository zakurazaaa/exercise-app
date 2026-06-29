import { useEffect, useMemo, useState } from "react";
import { loadExercises, uniqueValues, mediaUrl } from "./data";
import { translateSteps } from "./translate";
import { useFavorites } from "./favorites";
import { thBody, thEquip, thMuscle, thMuscles, thName } from "./th-dict";
import "./App.css";

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [target, setTarget] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState(null);

  const { toggle, isFav, count } = useFavorites();

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
  }, []);

  const bodyParts = useMemo(() => uniqueValues(exercises, "body_part"), [exercises]);
  const equipments = useMemo(() => uniqueValues(exercises, "equipment"), [exercises]);
  const targets = useMemo(() => uniqueValues(exercises, "target"), [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (favOnly && !isFav(ex.id)) return false;
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (bodyPart && ex.body_part !== bodyPart) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (target && ex.target !== target) return false;
      return true;
    });
  }, [exercises, query, bodyPart, equipment, target, favOnly, isFav]);

  const resetFilters = () => {
    setQuery("");
    setBodyPart("");
    setEquipment("");
    setTarget("");
    setFavOnly(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>💪 คลังท่าออกกำลังกาย</h1>
        <p className="subtitle">
          ค้นหาท่าออกกำลังกายพร้อมภาพเคลื่อนไหว กล้ามเนื้อเป้าหมาย และวิธีทำทีละขั้น
        </p>
      </header>

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
      </div>

      {status === "loading" && (
        <p className="state">⏳ กำลังโหลดข้อมูลจาก GitHub… (ไฟล์ใหญ่ ~6 MB)</p>
      )}
      {status === "error" && <p className="state error">❌ {error}</p>}

      {status === "ready" && (
        <>
          <p className="count">พบ {filtered.length.toLocaleString()} ท่า</p>
          {favOnly && filtered.length === 0 && (
            <p className="state">ยังไม่มีท่าโปรด — กดรูป ♡ ที่การ์ดเพื่อบันทึก</p>
          )}
          <div className="grid">
            {filtered.slice(0, 300).map((ex) => {
              const thai = thName(ex.name);
              const fav = isFav(ex.id);
              return (
                <div key={ex.id} className="card" onClick={() => setSelected(ex)}>
                  <div className="thumb-wrap">
                    <img
                      className="thumb"
                      src={mediaUrl(ex.image)}
                      alt={ex.name}
                      loading="lazy"
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

function ExerciseModal({ ex, onClose, isFav, onToggleFav }) {
  const enSteps = ex.instruction_steps?.en || [];
  const [lang, setLang] = useState("th"); // th | en
  const [thSteps, setThSteps] = useState(null);
  const [tStatus, setTStatus] = useState("idle"); // idle | loading | done | error

  // แปลวิธีทำเป็นไทยเมื่อเลือกภาษาไทยครั้งแรก (เฉพาะ steps ที่ต้องพึ่ง API)
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
  const thai = thName(ex.name);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <img className="gif" src={mediaUrl(ex.gif_url)} alt={ex.name} />
        <div className="modal-content">
          <div className="modal-title">
            <div>
              <h2>{ex.name}</h2>
              {thai && <p className="th-name">{thai}</p>}
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

          {showThai && tStatus === "done" && (
            <p className="translate-note">* วิธีทำแปลอัตโนมัติด้วย MyMemory</p>
          )}
        </div>
      </div>
    </div>
  );
}
