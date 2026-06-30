import { useEffect, useMemo, useState } from "react";
import { loadIndex, loadDetailsMap, uniqueValues, mediaUrl } from "./data";
import { translateSteps } from "./translate";
import { useUserData } from "./store";
import { useAuth } from "./auth";
import { thBody, thEquip, thMuscle, thMuscles, thName } from "./th-dict";
import { getTips, categorize, CATEGORIES } from "./tips";
import { getSetup } from "./setup";
import { getStretch, isStretch, stretchType } from "./stretch";
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
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast({ msg, t: (toast?.t || 0) + 1 });
  };
  const [picker, setPicker] = useState(null); // ท่าที่กำลังเลือกว่าจะใส่โปรแกรมไหน

  const auth = useAuth();
  const { fav, programs, syncing, streak } = useUserData(auth.user);

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
      if (q && !matchExercise(ex, thaiName(ex.name), q)) return false;
      if (bodyPart) {
        // "m:biceps"/"m:triceps" = แยกแขนหน้า/แขนหลังจากแขนท่อนบน
        if (bodyPart.startsWith("m:")) {
          if (ex.target !== bodyPart.slice(2)) return false;
        } else if (ex.body_part !== bodyPart) return false;
      }
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

  // ต้องล็อกอินก่อนใช้งาน (login wall)
  if (auth.cloudEnabled && !auth.ready) {
    return <div className="app"><p className="state">⏳ กำลังโหลด…</p></div>;
  }
  if (auth.cloudEnabled && !auth.user) {
    return <LoginGate auth={auth} />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💪 FitPedia <span className="brand-sub">คลังท่าออกกำลังกาย</span></h1>
        {auth.cloudEnabled && auth.user && (
          <div className="authbar">
            <span className="auth-email">☁️ {syncing ? "กำลังซิงค์…" : auth.displayName}</span>
            <button className="auth-link" onClick={auth.signOut}>ออกจากระบบ</button>
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

      {status === "ready" && view === "stretch" && (
        <StretchView exercises={exercises} thaiName={thaiName} onOpen={setSelected} streak={streak} />
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
            <div className="filter-bar">
              <button
                className={"filter-toggle" + (showFilters ? " ft-open" : "")}
                onClick={() => setShowFilters((v) => !v)}
              >
                🎚️ ตัวกรอง{[bodyPart, equipment, target].filter(Boolean).length > 0 ? ` (${[bodyPart, equipment, target].filter(Boolean).length})` : ""}
                <span className="ft-caret">{showFilters ? "▲" : "▼"}</span>
              </button>
              <button className={"chip" + (favOnly ? " chip-active" : "")} onClick={() => setFavOnly((v) => !v)}>
                {favOnly ? "★" : "☆"} ที่ชอบ ({fav.count})
              </button>
              {(bodyPart || equipment || target || favOnly || category) && (
                <button className="reset" onClick={resetFilters}>ล้าง</button>
              )}
            </div>
            {showFilters && (
              <div className="filters filters-panel">
                <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
                  <option value="">ส่วนของร่างกาย (ทั้งหมด)</option>
                  {bodyParts.flatMap((v) =>
                    v === "upper arms"
                      ? [
                          <option key="m:biceps" value="m:biceps">แขนหน้า (ไบเซ็ป)</option>,
                          <option key="m:triceps" value="m:triceps">แขนหลัง (ไตรเซ็ป)</option>,
                        ]
                      : [<option key={v} value={v}>{thBody(v)}</option>]
                  )}
                </select>
                <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
                  <option value="">อุปกรณ์ (ทั้งหมด)</option>
                  {equipments.map((v) => (<option key={v} value={v}>{thEquip(v)}</option>))}
                </select>
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">กล้ามเนื้อเป้าหมาย (ทั้งหมด)</option>
                  {targets.map((v) => (<option key={v} value={v}>{thMuscle(v)}</option>))}
                </select>
              </div>
            )}
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
                onToggleFav={() => { const was = fav.isFav(ex.id); fav.toggle(ex.id); notify(was ? "เอาออกจากที่ชอบแล้ว" : "เพิ่มในที่ชอบแล้ว ♥"); }}
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
          onToggleFav={() => { const was = fav.isFav(selected.id); fav.toggle(selected.id); notify(was ? "เอาออกจากที่ชอบแล้ว" : "เพิ่มในที่ชอบแล้ว ♥"); }}
          inRoutine={programs.inAny(selected.id)}
          onToggleRoutine={() => setPicker(selected)}
          allExercises={exercises}
          thaiOf={thaiName}
          onOpenExercise={setSelected}
        />
      )}

      {picker && (
        <ProgramPicker
          ex={picker}
          thaiName={thaiName(picker.name)}
          programs={programs}
          onClose={() => setPicker(null)}
          notify={notify}
        />
      )}

      {toast && <Toast key={toast.t} msg={toast.msg} onDone={() => setToast(null)} />}

      <nav className="bottom-nav">
        {[
          { k: "browse", icon: "🔎", label: "ค้นหา" },
          { k: "categories", icon: "🗂️", label: "หมวดหมู่" },
          { k: "stretch", icon: "🧘", label: "ยืด" },
          { k: "program", icon: "📋", label: "โปรแกรม" },
        ].map((t) => (
          <button
            key={t.k}
            className={"bn-item" + (view === t.k ? " bn-active" : "")}
            onClick={() => setView(t.k)}
          >
            <span className="bn-icon">{t.icon}</span>
            <span className="bn-label">{t.label}</span>
            {t.k === "program" && programs.programCount > 0 && (
              <span className="bn-badge">{programs.programCount}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Toast แจ้งเตือนสั้นๆ เด้งขึ้นเหนือ bottom nav แล้วหายเอง
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="toast" role="status">{msg}</div>;
}

function LoginGate({ auth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | working | error
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setStatus("working");
    setErr("");
    try {
      await auth.signIn(username, password);
      // สำเร็จ -> auth.user เปลี่ยน -> แอปจะ render หน้าหลักเอง
    } catch (e2) {
      setErr(e2.message || "เกิดข้อผิดพลาด");
      setStatus("error");
    }
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <h1 className="gate-logo">💪 FitPedia</h1>
        <p className="gate-sub">เข้าสู่ระบบเพื่อใช้งานและซิงค์โปรแกรมทุกเครื่อง</p>
        <p className="picker-hint" style={{ marginTop: 0 }}>
          ตั้งชื่อผู้ใช้และรหัสผ่านอะไรก็ได้ (รหัสอย่างน้อย 6 ตัว) — ถ้ายังไม่มีบัญชี ระบบจะสมัครให้อัตโนมัติ
        </p>
        <form onSubmit={submit}>
          <input
            className="search"
            type="text"
            placeholder="ชื่อผู้ใช้ (เช่น zaku, สมชาย)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="search"
            type="password"
            placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginTop: 8 }}
          />
          <button
            className="picker-new"
            type="submit"
            disabled={status === "working"}
            style={{ borderStyle: "solid", marginTop: 12 }}
          >
            {status === "working" ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ / สมัคร"}
          </button>
        </form>
        {status === "error" && <p className="state error">❌ {err}</p>}
      </div>
    </div>
  );
}

function ProgramPicker({ ex, thaiName, programs, onClose, notify }) {
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
                onClick={() => { programs.toggleIn(p.id, ex.id); notify && notify(checked ? `เอาออกจาก '${p.name}'` : `เพิ่มเข้า '${p.name}' แล้ว ✓`); }}
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
        <h3>{thai || ex.name}</h3>
        {thai && <p className="en-name">{ex.name}</p>}
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

function ExerciseModal({ ex, detail, detailsReady, thaiName, onClose, isFav, onToggleFav, inRoutine, onToggleRoutine, allExercises, thaiOf, onOpenExercise }) {
  const stretch = getStretch(ex);
  // ทำให้ identity คงที่ — กัน useEffect แปลข้างล่างรันซ้ำ/ยกเลิกตัวเองจน "กำลังแปล" ค้าง
  const enSteps = useMemo(() => detail?.instruction_steps?.en || [], [detail]);
  const gif = detail?.gif_url;
  const secondary = detail?.secondary_muscles || [];
  const [lang, setLang] = useState("th");
  const [thSteps, setThSteps] = useState(null);
  const [tStatus, setTStatus] = useState("idle");

  useEffect(() => {
    if (lang !== "th" || enSteps.length === 0) return;
    let cancelled = false;
    setTStatus("loading");
    translateSteps(enSteps)
      .then((th) => { if (!cancelled) { setThSteps(th); setTStatus("done"); } })
      .catch(() => !cancelled && setTStatus("error"));
    return () => { cancelled = true; };
  }, [lang, enSteps]);

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
              <h2>{thaiName || ex.name}</h2>
              {thaiName && <p className="en-name">{ex.name}</p>}
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

          {stretch ? <StretchBox stretch={stretch} /> : <SetupBox ex={ex} />}

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

          {!stretch && (
            <StretchSuggest ex={ex} all={allExercises} thaiOf={thaiOf} onOpen={onOpenExercise} />
          )}
          {!stretch && <TipsBox ex={ex} />}
        </div>
      </div>
    </div>
  );
}

// สั่นเครื่อง (ถ้ารองรับ) — ใช้ feedback เวลาใกล้หมด/หมดเวลา
function buzz(pattern) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch { /* ไม่รองรับ */ }
}

// ตัวจับเวลานับถอยหลังแบบวงแหวน — มี haptic + เปลี่ยนสีช่วงท้าย
function StretchTimer({ seconds, autoStart = false, onDone, compact = false }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(autoStart);

  useEffect(() => {
    setLeft(seconds);
    setRunning(autoStart);
  }, [seconds, autoStart]);

  useEffect(() => {
    if (!running) return;
    if (left <= 0) {
      setRunning(false);
      buzz([90, 50, 90]); // หมดเวลา
      onDone && onDone();
      return;
    }
    if (left <= 3) buzz(60); // นับถอยหลัง 3 วิสุดท้าย
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, left]);

  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = seconds > 0 ? left / seconds : 0;
  const ending = left <= 3 && left > 0;
  const color = ending ? "#ff5a3c" : "#2ec5d3";
  const size = compact ? 116 : 140;

  return (
    <div className={"timer" + (compact ? " timer-compact" : "")}>
      <div className="ring-wrap" style={{ width: size, height: size }}>
        <svg className="ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#1a1d24" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
        <div className="ring-num" style={{ color }}>
          {left}<span className="ring-unit">วิ</span>
        </div>
      </div>
      <div className="timer-ctrl">
        <button onClick={() => setRunning((r) => !r)}>{running ? "⏸ หยุด" : (left <= 0 ? "↻ เริ่มใหม่" : "▶ เริ่ม")}</button>
        <button onClick={() => { setLeft(seconds); setRunning(false); }}>รีเซ็ต</button>
      </div>
    </div>
  );
}

function StretchBox({ stretch }) {
  return (
    <Collapsible icon="🧘" title="วิธียืด & เวลาค้าง" sub={stretch.typeLabel} accent="#2ec5d3" defaultOpen>
      <div className="stretch-dose">
        <span className="dose-chip">{stretch.timingEmoji} {stretch.timingLabel}</span>
        <span className="dose-chip">⏳ {stretch.hold}</span>
        <span className="dose-chip">🔁 {stretch.sets}</span>
      </div>
      {stretch.holdSeconds > 0 && <StretchTimer seconds={stretch.holdSeconds} compact />}
      <ul className="stretch-list">
        {stretch.cues.map((c, i) => (<li key={i}>{c}</li>))}
      </ul>
      <p className="translate-note">
        * ยืดมัดหลัก ≥2–3 วัน/สัปดาห์ (ทุกวันยิ่งดี) — การยืดช่วยเรื่องความยืดหยุ่น ไม่ใช่เพิ่มกล้าม/แรงหรือกันบาดเจ็บ
      </p>
    </Collapsible>
  );
}

// แนะนำท่ายืดสำหรับกล้ามที่เพิ่งเล่น (ส่วนของร่างกายเดียวกัน)
function StretchSuggest({ ex, all, thaiOf, onOpen }) {
  const picks = useMemo(() => {
    if (!all) return [];
    return all
      .filter((s) => isStretch(s) && s.id !== ex.id && s.body_part === ex.body_part && stretchType(s) !== "dynamic")
      .slice(0, 4);
  }, [all, ex]);
  if (picks.length === 0) return null;
  return (
    <Collapsible icon="🧘" title="ยืดกล้ามมัดนี้หลังเล่น" accent="#2ec5d3">
      <div className="suggest-row">
        {picks.map((s) => (
          <button key={s.id} className="suggest-chip" onClick={() => onOpen && onOpen(s)}>
            <img src={mediaUrl(s.image)} alt={s.name} onError={onImgError} />
            <span>{thaiOf ? thaiOf(s.name) : s.name}</span>
          </button>
        ))}
      </div>
    </Collapsible>
  );
}

// กล่องยุบได้ (accordion) — ปิดไว้ก่อนเพื่อไม่ให้โมดัลยาวเกิน
function Collapsible({ icon, title, sub, accent, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={"acc" + (open ? " acc-open" : "")} style={accent ? { borderLeftColor: accent } : undefined}>
      <button type="button" className="acc-head" onClick={() => setOpen((o) => !o)}>
        <span className="acc-title">{icon} {title}{sub && <span className="acc-sub"> {sub}</span>}</span>
        <span className="acc-chevron">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}

function SetupBox({ ex }) {
  const setup = getSetup(ex);
  if (!setup) return null;
  return (
    <Collapsible icon="⚙️" title="การตั้งเครื่องก่อนเริ่ม" sub={`(${setup.label})`} accent="#34c759">
      <ul className="setup-list">
        {setup.items.map((s, i) => (<li key={i}>{s}</li>))}
      </ul>
      <p className="translate-note">
        * ตำแหน่งเบาะอ้างกับจุดบนร่างกาย เพราะแต่ละยี่ห้อต่างกัน — ดูสติกเกอร์/คู่มือบนเครื่องประกอบ
      </p>
    </Collapsible>
  );
}

function TipsBox({ ex }) {
  const tips = getTips(ex);
  return (
    <Collapsible icon="💡" title="เคล็ดลับ & ข้อควรระวัง" sub={`(${tips.label})`} accent="var(--accent)">
      <ul className="tips-list">
        {tips.items.map((t, i) => (<li key={i}>{t}</li>))}
      </ul>
      <p className="translate-note">
        * คำแนะนำทั่วไปตามหมวดการเคลื่อนไหว — หากเพิ่งเริ่มหรือมีอาการบาดเจ็บ ควรปรึกษาผู้เชี่ยวชาญ
      </p>
    </Collapsible>
  );
}

// หน้า "ยืดเหยียด" — เลือกโหมด (อุ่นเครื่อง/คูลดาวน์) + ส่วนของร่างกาย แล้วยืดทีละท่าพร้อมจับเวลา
function StretchView({ exercises, thaiName, onOpen, streak }) {
  const [mode, setMode] = useState("static"); // static = คูลดาวน์ | dynamic = อุ่นเครื่อง
  const [areas, setAreas] = useState([]); // body_part[]; ว่าง = ทั้งตัว
  const [player, setPlayer] = useState(null);

  const all = useMemo(() => exercises.filter(isStretch), [exercises]);
  const areaOpts = useMemo(() => Array.from(new Set(all.map((e) => e.body_part))), [all]);
  const pool = useMemo(
    () =>
      all.filter((e) => {
        const t = stretchType(e);
        const matchMode = mode === "dynamic" ? t === "dynamic" : t !== "dynamic";
        const matchArea = areas.length === 0 || areas.includes(e.body_part);
        return matchMode && matchArea;
      }),
    [all, mode, areas]
  );

  const toggleArea = (a) =>
    setAreas((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));

  if (player)
    return <StretchPlayer list={player} thaiName={thaiName} streak={streak} onClose={() => setPlayer(null)} />;

  return (
    <div className="stretch-view">
      {streak?.count > 0 && (
        <div className="streak-banner">🔥 ยืดต่อเนื่อง <strong>{streak.count}</strong> วัน — รักษาให้ต่อเนื่องนะ!</div>
      )}
      <div className="stretch-modes">
        <button className={"mode-btn" + (mode === "dynamic" ? " mode-on" : "")} onClick={() => setMode("dynamic")}>
          🔥 อุ่นเครื่อง (Dynamic)
        </button>
        <button className={"mode-btn" + (mode === "static" ? " mode-on" : "")} onClick={() => setMode("static")}>
          🧊 คูลดาวน์ / ยืดหยุ่น (Static)
        </button>
      </div>
      <p className="stretch-blurb">
        {mode === "dynamic"
          ? "ยืดแบบเคลื่อนไหวก่อนออกกำลัง — ทำช้าๆ เพิ่มช่วงทีละนิด ไม่ค้าง"
          : "ยืดค้างหลังออกกำลัง / เพิ่มความยืดหยุ่น — ค้าง 15–30 วิ ต่อท่า ทำ ≥2–3 วัน/สัปดาห์"}
      </p>
      <div className="area-chips">
        <button className={"area-chip" + (areas.length === 0 ? " area-on" : "")} onClick={() => setAreas([])}>
          ทั้งตัว
        </button>
        {areaOpts.map((a) => (
          <button key={a} className={"area-chip" + (areas.includes(a) ? " area-on" : "")} onClick={() => toggleArea(a)}>
            {thBody(a)}
          </button>
        ))}
      </div>
      <div className="stretch-actions">
        <p className="count">{pool.length} ท่า</p>
        {pool.length > 0 && (
          <button className="play-btn" onClick={() => setPlayer(pool)}>▶️ เริ่มยืดทีละท่า</button>
        )}
      </div>
      {pool.length === 0 ? (
        <p className="state">ไม่มีท่ายืดในเงื่อนไขนี้ — ลองเลือกส่วนอื่นหรือสลับโหมด</p>
      ) : (
        <div className="grid">
          {pool.map((ex) => (
            <div key={ex.id} className="card" onClick={() => onOpen(ex)}>
              <div className="thumb-wrap">
                <img className="thumb" src={mediaUrl(ex.image)} alt={ex.name} loading="lazy" onError={onImgError} />
              </div>
              <div className="card-body">
                <h3>{thaiName(ex.name) || ex.name}</h3>
                <p className="en-name">{ex.name}</p>
                <div className="tags"><span className="tag">{thBody(ex.body_part)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// เครื่องเล่นยืดทีละท่า — จับเวลานับถอยหลังอัตโนมัติ แล้วไปท่าถัดไป
function StretchPlayer({ list, thaiName, streak, onClose }) {
  const [i, setI] = useState(0);
  const [result, setResult] = useState(null); // ผลลัพธ์เมื่อจบ session
  const ex = list[i];
  const info = getStretch(ex);
  const isLast = i >= list.length - 1;
  const next = () => setI((x) => Math.min(x + 1, list.length - 1));
  const prev = () => setI((x) => Math.max(x - 1, 0));

  const finish = () => {
    const seconds = list.reduce((a, e) => {
      const s = getStretch(e);
      return a + (s && s.holdSeconds > 0 ? s.holdSeconds : 30);
    }, 0);
    const st = streak ? streak.record() : { count: 0, incremented: false, alreadyToday: false };
    setResult({ count: list.length, seconds, streak: st });
  };

  if (result) return <StretchDone result={result} onClose={onClose} />;

  return (
    <div className="player">
      <div className="player-top">
        <span className="player-prog">ท่า {i + 1} / {list.length}</span>
        <button className="close" onClick={onClose}>✕</button>
      </div>
      <img className="player-img" src={mediaUrl(ex.image)} alt={ex.name} onError={onImgError} />
      <h2 className="player-name">{thaiName(ex.name)}</h2>
      <p className="player-en">{ex.name}</p>
      <div className="stretch-dose">
        <span className="dose-chip">{info.timingEmoji} {info.typeLabel}</span>
        <span className="dose-chip">⏳ {info.hold}</span>
      </div>
      {info.holdSeconds > 0 ? (
        <StretchTimer key={ex.id} seconds={info.holdSeconds} autoStart onDone={() => !isLast && next()} />
      ) : (
        <p className="player-reps">ทำ {info.hold} แล้วกด “ถัดไป”</p>
      )}
      <div className="player-nav">
        <button onClick={prev} disabled={i === 0}>← ก่อนหน้า</button>
        {isLast ? (
          <button className="play-btn" onClick={finish}>✓ เสร็จสิ้น</button>
        ) : (
          <button className="play-btn" onClick={next}>ถัดไป →</button>
        )}
      </div>
    </div>
  );
}

// หน้าจบ session ยืด — ฉลอง + แสดง streak
function StretchDone({ result, onClose }) {
  const mins = Math.max(1, Math.round(result.seconds / 60));
  const s = result.streak;
  return (
    <div className="done">
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (<span key={i} className={"cf cf" + (i % 7)} />))}
      </div>
      <div className="done-emoji">🎉</div>
      <h2 className="done-title">เยี่ยมมาก!</h2>
      <p className="done-sub">คุณยืดครบแล้ว</p>
      <div className="done-stats">
        <div className="done-stat"><span className="ds-num">{result.count}</span><span className="ds-label">ท่า</span></div>
        <div className="done-stat"><span className="ds-num">~{mins}</span><span className="ds-label">นาที</span></div>
        <div className="done-stat"><span className="ds-num">🔥 {s.count}</span><span className="ds-label">วันต่อเนื่อง</span></div>
      </div>
      <p className="done-streak">
        {s.incremented
          ? (s.count === 1 ? "เริ่มสตรีคใหม่! กลับมายืดพรุ่งนี้เพื่อต่อให้ยาว 💪" : `ต่อเนื่องเป็นวันที่ ${s.count} แล้ว — สุดยอด! 🔥`)
          : "วันนี้ยืดไปแล้ว เยี่ยมที่กลับมาทำซ้ำ 👍"}
      </p>
      <button className="play-btn done-btn" onClick={onClose}>เสร็จสิ้น</button>
    </div>
  );
}
