import { useEffect, useMemo, useState } from "react";
import { loadExercises, uniqueValues, mediaUrl } from "./data";
import "./App.css";

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [target, setTarget] = useState("");
  const [selected, setSelected] = useState(null);

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
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (bodyPart && ex.body_part !== bodyPart) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (target && ex.target !== target) return false;
      return true;
    });
  }, [exercises, query, bodyPart, equipment, target]);

  const resetFilters = () => {
    setQuery("");
    setBodyPart("");
    setEquipment("");
    setTarget("");
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
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            <option value="">อุปกรณ์ (ทั้งหมด)</option>
            {equipments.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">กล้ามเนื้อเป้าหมาย (ทั้งหมด)</option>
            {targets.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
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
          <div className="grid">
            {filtered.slice(0, 300).map((ex) => (
              <button key={ex.id} className="card" onClick={() => setSelected(ex)}>
                <img
                  className="thumb"
                  src={mediaUrl(ex.image)}
                  alt={ex.name}
                  loading="lazy"
                />
                <div className="card-body">
                  <h3>{ex.name}</h3>
                  <div className="tags">
                    <span className="tag">{ex.body_part}</span>
                    <span className="tag tag-muted">{ex.equipment}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filtered.length > 300 && (
            <p className="state">แสดง 300 ท่าแรก — ใช้ตัวกรองเพื่อแคบผลลัพธ์</p>
          )}
        </>
      )}

      {selected && (
        <ExerciseModal ex={selected} onClose={() => setSelected(null)} />
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

function ExerciseModal({ ex, onClose }) {
  const steps = ex.instruction_steps?.en || [];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <img className="gif" src={mediaUrl(ex.gif_url)} alt={ex.name} />
        <div className="modal-content">
          <h2>{ex.name}</h2>
          <div className="tags">
            <span className="tag">{ex.body_part}</span>
            <span className="tag">{ex.equipment}</span>
            <span className="tag tag-accent">เป้าหมาย: {ex.target}</span>
          </div>
          {ex.secondary_muscles?.length > 0 && (
            <p className="muscles">
              กล้ามเนื้อเสริม: {ex.secondary_muscles.join(", ")}
            </p>
          )}
          <h4>วิธีทำ</h4>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
