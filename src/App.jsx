import { useEffect, useMemo, useState } from "react";
import { loadIndex, loadDetailsMap, uniqueValues, mediaUrl } from "./data";
import { translateSteps } from "./translate";
import { useUserData } from "./store";
import { useAuth } from "./auth";
import { thBody, thEquip, thMuscle, thMuscles, thName } from "./th-dict";
import { getTips, categorize, CATEGORIES } from "./tips";
import { matchExercise } from "./search";
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
  const [details, setDetails] = useState({}); // id -> รายละเอียดเต็ม (lazy)

  const [view, setView] = useState("browse"); // browse | categories | program
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [equipment, setEquipment] = useState("");
  const [target, setTarget] = useState("");
  const [category, setCategory] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [picker, setPicker] = useState(null); // ท่าที่กำลังเลือกว่าจะใส่โปรแกรมไหน
  const [showLogin, setShowLogin] = useState(false);

  const auth = useAuth();
  const { fav, programs, syncing } = useUserData(auth.user);

  const thaiName = (name) => nameMap[name] || thName(name);

  useEffect(() => {
    loadIndex()
      .then((data) => {
        setExercises(data);
        setStatus("ready");
        // โหลดรายละเอียดเต็มเบื้องหลัง "หลัง" index พร้อม (ไม่แย่ง bandwidth หน้าแรก)
        loadDetailsMap().then(setDetails);
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
  const byId = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises]
  );

  const catCounts = useMemo(() => {
    const c = {};
    for (const ex of exercises) {
      const k = categorize(ex);
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return exercises.filter((ex) => {
      if (favOnly && !fav.isFav(ex.id)) return false;
      if (category && categorize(ex) !== category) return false;
      if (q && !matchExercise(ex.name, thaiName(ex.name), q)) return false;
      if (bodyPart && ex.body_part !== bodyPart) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (target && ex.target !== target) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, query, bodyPart, equipment, target, favOnly, fav, category, nameMap]);

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
  const activeItems = (programs.active?.ids || []).map((id) => byId[id]).filter(Boolean);

  return (
    <div className="app">
      <header className="header">
        <h1>💪 FitPedia <span className="brand-sub">คลังท่าออกกำลังกาย</span></h1>
        <p className="subtitle">
          ค้นหาท่าออกกำลังกายพร้อมภาพเคลื่อนไหว กล้ามเนื้อเป้าหมาย และวิธีทำทีละขั้น
        </p>
        <div className="nav">
          <button className={"nav-btn" + (view === "browse" ? " nav-active" : "")} onClick={() => setView("browse")}>
            🔎 ค้นหา
          </button>
          <button className={"nav-btn" + (view === "categories" ? " nav-active" : "")} onClick={() => setView("categories")}>
            🗂️ หมวดหมู่
          </button>
          <button className={"nav-btn" + (view === "program" ? " nav-active" : "")} onClick={() => setView("program")}>
            📋 โปรแกรม ({programs.programCount})
          </button>
        </div>
        {auth.cloudEnabled && (
          <div className="authbar">
            {auth.user ? (
              <>
                <span className="auth-email">☁️ {syncing ? "กำลังซิงค์…" : auth.user.email}</span>
                <button className="auth-link" onClick={auth.signOut}>ออกจากระบบ</button>
              </>
            ) : (
              <button className="auth-link" onClick={() => setShowLogin(true)}>
                ☁️ เข้าสู่ระบบเพื่อซิงค์ทุกเครื่อง
              </button>
            )}
          </div>
        )}
      </header>

      {status === "loading" && <p className="state">⏳ กำลังโหลด…</p>}
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

      {status === "ready" && view === "program" && (
        <ProgramView
          items={activeItems}
          thaiName={thaiName}
          programs={programs}
          onOpen={setSelected}
        />
      )}

      {status === "ready" && view === "browse" && (
        <>
          <div className="controls">
            <input
              className="search"
              type="search"
              placeholder="ค้นหา (ไทย/อังกฤษ หลายคำได้) เช่น barbell row, สควอท, rdl…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="filters">
              <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                <option value="">ส่วนของร่างกาย (ทั้งหมด)</option>
                {bodyParts.map((v) => (<option key={v} value={v}>{thBody(v)}</option>))}
              </select>
              <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                <option value="">อุปกรณ์ (ทั้งหมด)</option>
                {equipments.map((v) => (<option key={v} value={v}>{thEquip(v)}</option>))}
              </select>
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">กล้ามเนื้อเป้าหมาย (ทั้งหมด)</option>
                {targets.map((v) => (<option key={v} value={v}>{thMuscle(v)}</option>))}
              </select>
              <button className={"chip" + (favOnly ? " chip-active" : "")} onClick={() => setFavOnly((v) => !v)}>
                {favOnly ? "★" : "☆"} เฉพาะที่ชอบ ({fav.count})
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
            {filtered.slice(0, 300).map((ex) => (
              <Card
                key={ex.id}
                ex={ex}
                thai={thaiName(ex.name)}
                fav={fav.isFav(ex.id)}
                inRoutine={programs.inAny(ex.id)}
                onOpen={() => setSelected(ex)}
                onToggleFav={() => fav.toggle(ex.id)}
                onToggleRoutine={() => setPicker(ex)}
              />
            ))}
          </div>
          {filtered.length > 300 && (
            <p className="state">แสดง 300 ท่าแรก — ใช้ตัวกรองเพื่อแคบผลลัพธ์</p>
          )}
        </>
      )}

      {selected && (
        <ExerciseModal
          ex={selected}
          detail={details[selected.id]}
          detailsReady={Object.keys(details).length > 0}
          thaiName={thaiName(selected.name)}
          onClose={() => setSelected(null)}
          isFav={fav.isFav(selected.id)}
          onToggleFav={() => fav.toggle(selected.id)}
          inRoutine={programs.inAny(selected.id)}
          onToggleRoutine={() => setPicker(selected)}
        />
      )}

      {picker && (
        <ProgramPicker
          ex={picker}
          thaiName={thaiName(picker.name)}
          programs={programs}
          onClose={() => setPicker(null)}
        />
      )}

      {showLogin && <LoginModal auth={auth} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function LoginModal({ auth, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    try {
      await auth.signIn(email.trim());
      setStatus("sent");
    } catch (e2) {
      setErr(e2.message || "เกิดข้อผิดพลาด");
      setStatus("error");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <h3 className="picker-title">เข้าสู่ระบบ / ซิงค์</h3>
        {status === "sent" ? (
          <p className="picker-ex">
            ✅ ส่งลิงก์เข้าสู่ระบบไปที่ {email} แล้ว<br />
            เปิดอีเมลแล้วกดลิงก์เพื่อเข้าสู่ระบบ (ลิงก์จะพากลับมาที่แอปนี้)
          </p>
        ) : (
          <>
            <p className="picker-hint" style={{ marginTop: 0 }}>
              ใส่อีเมล → เราจะส่งลิงก์เข้าสู่ระบบให้ (ไม่ต้องตั้งรหัสผ่าน) เพื่อให้โปรแกรม/ที่ชอบของคุณซิงค์ทุกเครื่อง
            </p>
            <form onSubmit={submit}>
              <input
                className="search"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <button className="picker-new" type="submit" disabled={status === "sending"} style={{ borderStyle: "solid", marginTop: 12 }}>
                {status === "sending" ? "กำลังส่ง…" : "ส่งลิงก์เข้าสู่ระบบ"}
              </button>
            </form>
            {status === "error" && <p className="state error">❌ {err}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function ProgramPicker({ ex, thaiName, programs, onClose }) {
  const handleCreate = () => {
    const name = window.prompt("ตั้งชื่อโปรแกรมใหม่ (เช่น Upper Body วันจันทร์)", "");
    if (name && name.trim()) programs.createWith(name.trim(), ex.id);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <h3 className="picker-title">เพิ่มเข้าโปรแกรม</h3>
        <p className="picker-ex">{thaiName || ex.name}</p>
        <div className="picker-list">
          {programs.programs.map((p) => {
            const checked = p.ids.includes(ex.id);
            return (
              <button
                key={p.id}
                className={"picker-row" + (checked ? " picker-on" : "")}
                onClick={() => programs.toggleIn(p.id, ex.id)}
              >
                <span className="picker-check">{checked ? "✓" : "＋"}</span>
                <span className="picker-name">{p.name}</span>
                <span className="picker-n">{p.ids.length} ท่า</span>
              </button>
            );
          })}
        </div>
        <button className="picker-new" onClick={handleCreate}>＋ สร้างโปรแกรมใหม่แล้วเพิ่มท่านี้</button>
        <p className="picker-hint">เพิ่มท่านี้ได้หลายโปรแกรมพร้อมกัน (ติ๊กได้มากกว่า 1)</p>
      </div>
    </div>
  );
}

function Card({ ex, thai, fav, inRoutine, onOpen, onToggleFav, onToggleRoutine }) {
  return (
    <div className="card" onClick={onOpen}>
      <div className="thumb-wrap">
        <img className="thumb" src={mediaUrl(ex.image)} alt={ex.name} loading="lazy" onError={onImgError} />
        <button
          className={"rt-btn" + (inRoutine ? " rt-on" : "")}
          title={inRoutine ? "อยู่ในโปรแกรมแล้ว — แตะเพื่อเลือกโปรแกรม" : "เลือกโปรแกรมที่จะเพิ่ม"}
          onClick={(e) => { e.stopPropagation(); onToggleRoutine(); }}
        >
          {inRoutine ? "✓" : "＋"}
        </button>
        <button
          className={"fav-btn" + (fav ? " fav-on" : "")}
          title={fav ? "เอาออกจากที่ชอบ" : "เพิ่มในที่ชอบ"}
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
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
}

function ProgramView({ items, thaiName, programs, onOpen }) {
  const { active } = programs;

  const handleCreate = () => {
    const name = window.prompt("ตั้งชื่อโปรแกรมใหม่ (เช่น Upper Body วันจันทร์)", "");
    if (name && name.trim()) programs.create(name.trim());
  };
  const handleRename = () => {
    if (!active) return;
    const name = window.prompt("เปลี่ยนชื่อโปรแกรม", active.name);
    if (name && name.trim()) programs.rename(active.id, name.trim());
  };
  const handleDelete = () => {
    if (!active) return;
    if (window.confirm(`ลบโปรแกรม "${active.name}"?`)) programs.removeProgram(active.id);
  };

  return (
    <div>
      {/* แถบเลือกโปรแกรม */}
      <div className="prog-tabs">
        {programs.programs.map((p) => (
          <button
            key={p.id}
            className={"prog-tab" + (p.id === active?.id ? " prog-tab-active" : "")}
            onClick={() => programs.setActive(p.id)}
          >
            {p.name} <span className="prog-tab-n">{p.ids.length}</span>
          </button>
        ))}
        <button className="prog-tab prog-tab-new" onClick={handleCreate}>＋ สร้างโปรแกรม</button>
      </div>

      {!active ? (
        <div className="empty">
          <p className="state">ยังไม่มีโปรแกรม — กด "＋ สร้างโปรแกรม" เพื่อเริ่ม</p>
        </div>
      ) : (
        <>
          <div className="program-head">
            <h2 className="prog-title">
              {active.name}
              <button className="prog-icon" onClick={handleRename} title="เปลี่ยนชื่อ">✎</button>
              <button className="prog-icon" onClick={handleDelete} title="ลบโปรแกรม">🗑️</button>
            </h2>
            {items.length > 0 && (
              <button className="reset" onClick={programs.clearActive}>ล้างท่าทั้งหมด</button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty">
              <p className="state">📋 ยังไม่มีท่าในโปรแกรมนี้</p>
              <p className="state">ไปที่หน้า "ค้นหา" แล้วกดปุ่ม ＋ ที่การ์ด เพื่อเพิ่มท่าเข้าโปรแกรมที่เลือกอยู่</p>
            </div>
          ) : (
            <ol className="program-list">
              {items.map((ex, i) => (
                <li key={ex.id} className="program-item">
                  <span className="program-no">{i + 1}</span>
                  <img className="program-thumb" src={mediaUrl(ex.image)} alt={ex.name} loading="lazy" onError={onImgError} onClick={() => onOpen(ex)} />
                  <div className="program-info" onClick={() => onOpen(ex)}>
                    <strong>{thaiName(ex.name)}</strong>
                    <span className="program-en">{ex.name}</span>
                  </div>
                  <div className="program-actions">
                    <button onClick={() => programs.move(ex.id, -1)} disabled={i === 0} title="ขึ้น">▲</button>
                    <button onClick={() => programs.move(ex.id, 1)} disabled={i === items.length - 1} title="ลง">▼</button>
                    <button onClick={() => programs.removeFromActive(ex.id)} title="ลบ">✕</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function ExerciseModal({ ex, detail, detailsReady, thaiName, onClose, isFav, onToggleFav, inRoutine, onToggleRoutine }) {
  const enSteps = detail?.instruction_steps?.en || [];
  const gif = detail?.gif_url;
  const secondary = detail?.secondary_muscles || [];
  const [lang, setLang] = useState("th");
  const [thSteps, setThSteps] = useState(null);
  const [tStatus, setTStatus] = useState("idle");

  useEffect(() => {
    if (lang !== "th" || thSteps || tStatus === "loading" || enSteps.length === 0) return;
    let cancelled = false;
    setTStatus("loading");
    translateSteps(enSteps)
      .then((th) => { if (!cancelled) { setThSteps(th); setTStatus("done"); } })
      .catch(() => !cancelled && setTStatus("error"));
    return () => { cancelled = true; };
  }, [lang, thSteps, tStatus, enSteps]);

  const showThai = lang === "th";
  const steps = showThai && thSteps ? thSteps : enSteps;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <img className="gif" src={mediaUrl(gif || ex.image)} alt={ex.name} onError={onImgError} />
        <div className="modal-content">
          <div className="modal-title">
            <div>
              <h2>{ex.name}</h2>
              {thaiName && <p className="th-name">{thaiName}</p>}
            </div>
            <div className="modal-actions">
              <button
                className={"rt-btn rt-lg" + (inRoutine ? " rt-on" : "")}
                onClick={onToggleRoutine}
                title={inRoutine ? "อยู่ในโปรแกรมแล้ว — แตะเพื่อเลือกโปรแกรม" : "เลือกโปรแกรมที่จะเพิ่ม"}
              >
                {inRoutine ? "✓" : "＋"}
              </button>
              <button
                className={"fav-btn fav-lg" + (isFav ? " fav-on" : "")}
                onClick={onToggleFav}
                title={isFav ? "เอาออกจากที่ชอบ" : "เพิ่มในที่ชอบ"}
              >
                {isFav ? "♥" : "♡"}
              </button>
            </div>
          </div>

          <div className="tags">
            <span className="tag">{thBody(ex.body_part)}</span>
            <span className="tag">{thEquip(ex.equipment)}</span>
            <span className="tag tag-accent">เป้าหมาย: {thMuscle(ex.target)}</span>
          </div>
          {secondary.length > 0 && (
            <p className="muscles">กล้ามเนื้อเสริม: {thMuscles(secondary).join(", ")}</p>
          )}

          <div className="steps-head">
            <h4>วิธีทำ</h4>
            <div className="lang-toggle">
              <button className={showThai ? "active" : ""} onClick={() => setLang("th")}>ไทย</button>
              <button className={!showThai ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
          </div>

          {!detail && !detailsReady && <p className="translating">⏳ กำลังโหลดรายละเอียด…</p>}
          {detail && showThai && tStatus === "loading" && (
            <p className="translating">⏳ กำลังแปลวิธีทำเป็นภาษาไทย…</p>
          )}
          {showThai && tStatus === "error" && (
            <p className="translating">⚠️ แปลไม่สำเร็จ แสดงภาษาอังกฤษแทน</p>
          )}

          <ol className="steps">
            {steps.map((s, i) => (<li key={i}>{s}</li>))}
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
        {tips.items.map((t, i) => (<li key={i}>{t}</li>))}
      </ul>
      <p className="translate-note">
        * คำแนะนำทั่วไปตามหมวดการเคลื่อนไหว — หากเพิ่งเริ่มหรือมีอาการบาดเจ็บ ควรปรึกษาผู้เชี่ยวชาญ
      </p>
    </div>
  );
}
