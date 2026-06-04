import { useState, useEffect } from "react";

const SUPABASE_URL = "https://fmnggvaqkwtwyurpqkki.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbmdndmFxa3d0d3l1cnBxa2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjY4MjUsImV4cCI6MjA5NjEwMjgyNX0.d5ZdPsU8kSuaNCdboB-RGW3-5Hw5HH6M30UlspQd7TM";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

async function sbGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
  return res.json();
}
async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function sbUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers: { ...headers, "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function sbDelete(table, id) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE", headers,
  });
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ROLES = ["Bartender", "Server", "Host/Hostess", "Runner", "Kitchen", "Bar Back", "Supervisor"];

const ROLE_COLORS = {
  "Bartender":    { bg: "#fef3c7", border: "#f59e0b" },
  "Server":       { bg: "#dbeafe", border: "#3b82f6" },
  "Host/Hostess": { bg: "#fce7f3", border: "#ec4899" },
  "Runner":       { bg: "#d1fae5", border: "#10b981" },
  "Kitchen":      { bg: "#ede9fe", border: "#8b5cf6" },
  "Bar Back":     { bg: "#ffedd5", border: "#f97316" },
  "Supervisor":   { bg: "#e0f2fe", border: "#0ea5e9" },
};

const EMPTY_USER = { name: "", username: "", password: "", phone: "", position: "", email: "" };

function getMonthDays(year, month) {
  return { first: new Date(year, month, 1).getDay(), total: new Date(year, month + 1, 0).getDate() };
}
function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function todayKey() { const t = new Date(); return dateKey(t.getFullYear(), t.getMonth(), t.getDate()); }
function formatDate(dk) {
  if (!dk) return "";
  const [y, m, d] = dk.split("-");
  const obj = new Date(Number(y), Number(m)-1, Number(d));
  return `${DAYS[obj.getDay()]}, ${MONTHS[Number(m)-1]} ${d}, ${y}`;
}

const S = {
  input: { width:"100%", boxSizing:"border-box", background:"#0f0f14", border:"1px solid #2a2a3a", borderRadius:8, padding:"10px 12px", color:"#f5f0e8", fontSize:14, outline:"none", fontFamily:"Georgia, serif" },
  label: { fontSize:11, letterSpacing:1, color:"#6b6b80", textTransform:"uppercase", display:"block", marginBottom:6 },
  btnPrimary: { background:"#c8a96e", color:"#0a0a0f", border:"none", borderRadius:8, padding:"10px 18px", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"Georgia, serif" },
  btnSecondary: { background:"none", color:"#c8c8d8", border:"1px solid #2a2a3a", borderRadius:8, padding:"10px 18px", fontSize:14, cursor:"pointer", fontFamily:"Georgia, serif" },
  btnDanger: { background:"none", color:"#f87171", border:"1px solid #f8717133", borderRadius:8, padding:"8px 14px", fontSize:13, cursor:"pointer", fontFamily:"Georgia, serif" },
  iconBtn: { background:"none", border:"1px solid #2a2a3a", borderRadius:6, padding:"5px 7px", cursor:"pointer", color:"#6b6b80", display:"flex", alignItems:"center" },
  navBtn: { background:"none", border:"1px solid #2a2a3a", color:"#c8c8d8", fontSize:20, width:36, height:36, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  tabActive: { background:"#c8a96e22", color:"#c8a96e", border:"1px solid #c8a96e44", borderRadius:8, padding:"6px 14px", fontSize:13, cursor:"pointer", fontFamily:"Georgia, serif" },
  tabInactive: { background:"none", color:"#6b6b80", border:"1px solid transparent", borderRadius:8, padding:"6px 14px", fontSize:13, cursor:"pointer", fontFamily:"Georgia, serif" },
};

const Ico = ({ d, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

function Modal({ children, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:"#13131a", border:"1px solid #2a2a3a", borderRadius:16, padding:"28px 28px 24px", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 100px rgba(0,0,0,0.7)" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function OnSite() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("calendar");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [loginCreds, setLoginCreds] = useState({ username:"", password:"" });
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState({ name:"", date:"", start_time:"18:00", end_time:"23:00", role:"Server", assignees:[], notes:"" });
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [u, e] = await Promise.all([sbGet("users"), sbGet("events")]);
    setUsers(Array.isArray(u) ? u : []);
    setEvents(Array.isArray(e) ? e : []);
    setLoading(false);
  }

  const employees = users.filter(u => u.role === "employee");
  const isManager = currentUser?.role === "manager";
  const today = todayKey();

  function handleLogin(e) {
    e.preventDefault();
    const u = users.find(u => u.username === loginCreds.username.trim() && u.password === loginCreds.password);
    if (u) { setCurrentUser(u); setLoginError(""); }
    else setLoginError("Incorrect username or password.");
  }

  function getDay(dk) { return events.filter(ev => ev.date === dk); }

  function openAdd(dk) {
    setSelectedDate(dk); setEditIdx(null);
    setForm({ name:"", date:dk, start_time:"18:00", end_time:"23:00", role:"Server", assignees:[], notes:"" });
    setModal("event");
  }
  function openEdit(ev) {
    setSelectedDate(ev.date); setEditIdx(ev.id);
    setForm({ name:ev.name, date:ev.date, start_time:ev.start_time, end_time:ev.end_time, role:ev.role, assignees:ev.assignees||[], notes:ev.notes||"" });
    setModal("event");
  }
  async function saveEvent() {
    if (!form.name.trim()) return;
    if (editIdx !== null) {
      await sbUpdate("events", editIdx, form);
    } else {
      await sbInsert("events", form);
    }
    await loadData();
    setModal(null);
  }
  async function deleteEvent(id) {
    await sbDelete("events", id);
    await loadData();
  }

  function openAddUser() { setEditingUserId(null); setUserForm(EMPTY_USER); setModal("user"); }
  function openEditUser(u) {
    setEditingUserId(u.id);
    setUserForm({ name:u.name, username:u.username, password:u.password, phone:u.phone||"", position:u.position||"", email:u.email||"" });
    setModal("user");
  }
  async function saveUser() {
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.password.trim()) return;
    if (editingUserId !== null) {
      await sbUpdate("users", editingUserId, { ...userForm, role:"employee" });
    } else {
      await sbInsert("users", { ...userForm, role:"employee" });
    }
    await loadData();
    setModal(null); setEditingUserId(null); setUserForm(EMPTY_USER);
  }
  async function deleteUser(id) {
    if (window.confirm("Remove this employee?")) {
      await sbDelete("users", id);
      await loadData();
    }
  }

  function myEvents() {
    return events
      .filter(ev => ev.assignees?.includes(currentUser.id))
      .sort((a,b) => a.date.localeCompare(b.date));
  }

  const { first, total } = getMonthDays(calYear, calMonth);
  function prevMonth() { if (calMonth===0) { setCalYear(y=>y-1); setCalMonth(11); } else setCalMonth(m=>m-1); }
  function nextMonth() { if (calMonth===11) { setCalYear(y=>y+1); setCalMonth(0); } else setCalMonth(m=>m+1); }

  // ── LOGIN ──
  if (!currentUser) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia, serif" }}>
        <div style={{ width:380, background:"#13131a", border:"1px solid #2a2a3a", borderRadius:16, padding:"48px 40px", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ fontSize:11, letterSpacing:6, color:"#c8a96e", textTransform:"uppercase", marginBottom:8 }}>On St. Elmo</div>
            <div style={{ fontSize:32, fontWeight:"bold", color:"#f5f0e8", letterSpacing:-1 }}>OnSite</div>
            <div style={{ fontSize:13, color:"#6b6b80", marginTop:6 }}>Schedule Management</div>
          </div>
          {loading ? (
            <div style={{ textAlign:"center", color:"#6b6b80", padding:"20px 0" }}>Loading...</div>
          ) : (
            <form onSubmit={handleLogin}>
              <input style={S.input} placeholder="Username" value={loginCreds.username} onChange={e => setLoginCreds(p=>({...p,username:e.target.value}))} />
              <input style={{...S.input,marginTop:12}} type="password" placeholder="Password" value={loginCreds.password} onChange={e => setLoginCreds(p=>({...p,password:e.target.value}))} />
              {loginError && <div style={{ color:"#f87171", fontSize:13, marginTop:8 }}>{loginError}</div>}
              <button type="submit" style={{...S.btnPrimary, width:"100%", marginTop:24, padding:14}}>Sign In</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0f", color:"#f5f0e8", fontFamily:"Georgia, serif" }}>
      <div style={{ background:"#13131a", borderBottom:"1px solid #2a2a3a", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div>
            <span style={{ fontSize:11, letterSpacing:4, color:"#c8a96e", textTransform:"uppercase" }}>On St. Elmo </span>
            <span style={{ fontSize:20, fontWeight:"bold", letterSpacing:-0.5 }}>OnSite</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            <button onClick={() => setView("calendar")} style={view==="calendar" ? S.tabActive : S.tabInactive}>Calendar</button>
            {!isManager && <button onClick={() => setView("mySchedule")} style={view==="mySchedule" ? S.tabActive : S.tabInactive}>My Schedule</button>}
            {isManager && <button onClick={() => setView("team")} style={view==="team" ? S.tabActive : S.tabInactive}>Team</button>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:13, color:"#9a9ab0", display:"flex", alignItems:"center", gap:6 }}>
            <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <span style={{ color:"#f5f0e8" }}>{currentUser.name}</span>
            {isManager && <span style={{ background:"#c8a96e22", color:"#c8a96e", fontSize:10, padding:"2px 8px", borderRadius:10, letterSpacing:1, textTransform:"uppercase", border:"1px solid #c8a96e44" }}>Manager</span>}
          </div>
          <button onClick={() => setCurrentUser(null)} style={{ background:"none", border:"none", color:"#6b6b80", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:4 }}>
            <Ico d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px" }}>

        {/* CALENDAR */}
        {view==="calendar" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <button onClick={prevMonth} style={S.navBtn}>‹</button>
                <h2 style={{ fontSize:22, fontWeight:"bold", margin:0 }}>{MONTHS[calMonth]} <span style={{ color:"#c8a96e" }}>{calYear}</span></h2>
                <button onClick={nextMonth} style={S.navBtn}>›</button>
              </div>
              {isManager && (
                <button onClick={openAddUser} style={{...S.btnSecondary, display:"flex", alignItems:"center", gap:6}}>
                  <Ico d="M12 5v14M5 12h14" /> Add Employee
                </button>
              )}
            </div>
            <div style={{ background:"#13131a", border:"1px solid #2a2a3a", borderRadius:16, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #2a2a3a" }}>
                {DAYS.map(d => <div key={d} style={{ padding:"12px 0", textAlign:"center", fontSize:11, letterSpacing:2, color:"#6b6b80", textTransform:"uppercase" }}>{d}</div>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
                {Array.from({length:first}).map((_,i) => (
                  <div key={`e${i}`} style={{ minHeight:110, borderRight:"1px solid #2a2a3a", borderBottom:"1px solid #2a2a3a", background:"#0a0a0f" }} />
                ))}
                {Array.from({length:total}).map((_,i) => {
                  const day = i+1;
                  const dk = dateKey(calYear, calMonth, day);
                  const dayEvs = getDay(dk);
                  const isToday = dk===today;
                  const dow = (first+i)%7;
                  const isOp = [3,4,5,6,0].includes(dow);
                  const visEvs = isManager ? dayEvs : dayEvs.filter(ev => ev.assignees?.includes(currentUser.id));
                  return (
                    <div key={dk}
                      onClick={() => { if (isManager||visEvs.length>0) { setSelectedDate(dk); setModal("day"); } }}
                      style={{ minHeight:110, borderRight:"1px solid #2a2a3a", borderBottom:"1px solid #2a2a3a", padding:"10px 8px 8px", background:isToday?"#1a1a2e":isOp?"#13131a":"#0f0f14", cursor:isManager||visEvs.length>0?"pointer":"default", transition:"background 0.12s" }}
                      onMouseEnter={e => { if(isManager||visEvs.length>0) e.currentTarget.style.background="#1c1c2a"; }}
                      onMouseLeave={e => { e.currentTarget.style.background=isToday?"#1a1a2e":isOp?"#13131a":"#0f0f14"; }}
                    >
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:isToday?"bold":"normal", color:isToday?"#c8a96e":isOp?"#c8c8d8":"#3a3a4a", background:isToday?"#c8a96e22":"none", width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", border:isToday?"1px solid #c8a96e55":"none" }}>{day}</span>
                        {isManager&&isOp && <button onClick={e=>{e.stopPropagation();openAdd(dk);}} style={{ background:"none", border:"none", color:"#c8a96e66", cursor:"pointer", fontSize:18, lineHeight:1, padding:2 }}>+</button>}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                        {visEvs.slice(0,3).map((ev,ei) => {
                          const rc = ROLE_COLORS[ev.role]||{bg:"#f3f4f6",border:"#9ca3af"};
                          return <div key={ei} style={{ background:rc.bg+"22", border:`1px solid ${rc.border}55`, borderLeft:`3px solid ${rc.border}`, borderRadius:4, padding:"2px 5px", fontSize:10, color:rc.border, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ev.start_time} {ev.name}</div>;
                        })}
                        {visEvs.length>3 && <div style={{ fontSize:10, color:"#6b6b80" }}>+{visEvs.length-3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MY SCHEDULE */}
        {view==="mySchedule" && (
          <div>
            <h2 style={{ fontSize:22, fontWeight:"bold", marginBottom:24 }}>My Schedule</h2>
            {myEvents().length===0
              ? <div style={{ textAlign:"center", color:"#4a4a5a", padding:"60px 0", fontSize:15 }}>No upcoming shifts assigned.</div>
              : myEvents().map((ev,i) => {
                  const rc = ROLE_COLORS[ev.role]||{bg:"#f3f4f6",border:"#9ca3af"};
                  return (
                    <div key={i} style={{ background:"#13131a", border:`1px solid ${rc.border}44`, borderLeft:`4px solid ${rc.border}`, borderRadius:12, padding:"16px 20px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"space-between", opacity:ev.date>=today?1:0.5 }}>
                      <div>
                        <div style={{ fontSize:13, color:"#9a9ab0", marginBottom:4 }}>{formatDate(ev.date)}</div>
                        <div style={{ fontSize:17, fontWeight:"bold", marginBottom:6 }}>{ev.name}</div>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          <span style={{ background:rc.bg+"33", color:rc.border, fontSize:11, padding:"2px 8px", borderRadius:8, border:`1px solid ${rc.border}44` }}>{ev.role}</span>
                          <span style={{ fontSize:12, color:"#9a9ab0" }}>{ev.start_time} – {ev.end_time}</span>
                        </div>
                        {ev.notes && <div style={{ fontSize:12, color:"#6b6b80", marginTop:6 }}>{ev.notes}</div>}
                      </div>
                      {ev.date>=today && <div style={{ width:8, height:8, borderRadius:"50%", background:rc.border, flexShrink:0 }} />}
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* TEAM */}
        {view==="team" && isManager && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <h2 style={{ fontSize:22, fontWeight:"bold", margin:0 }}>Team</h2>
              <button onClick={openAddUser} style={{...S.btnPrimary, display:"flex", alignItems:"center", gap:6}}>
                <Ico d="M12 5v14M5 12h14" /> New Employee
              </button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
              {employees.map(u => (
                <div key={u.id} style={{ background:"#13131a", border:"1px solid #2a2a3a", borderRadius:12, padding:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                    <div style={{ width:44, height:44, borderRadius:"50%", background:"#c8a96e22", border:"1px solid #c8a96e44", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"#c8a96e", fontWeight:"bold", flexShrink:0 }}>{u.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight:"bold", fontSize:15 }}>{u.name}</div>
                      <div style={{ fontSize:12, color:"#6b6b80" }}>@{u.username}</div>
                    </div>
                  </div>
                  {u.position && <div style={{ fontSize:12, marginBottom:6 }}><span style={{ color:"#6b6b80" }}>Position: </span><span style={{ color:"#c8c8d8" }}>{u.position}</span></div>}
                  {u.phone && <div style={{ fontSize:12, marginBottom:6 }}><span style={{ color:"#6b6b80" }}>Phone: </span><a href={`tel:${u.phone}`} style={{ color:"#c8a96e", textDecoration:"none" }}>{u.phone}</a></div>}
                  {u.email && <div style={{ fontSize:12, marginBottom:12 }}><span style={{ color:"#6b6b80" }}>Email: </span><a href={`mailto:${u.email}`} style={{ color:"#c8a96e", textDecoration:"none" }}>{u.email}</a></div>}
                  {!u.phone && !u.email && !u.position && <div style={{ marginBottom:12 }} />}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => openEditUser(u)} style={{...S.btnSecondary, flex:1, fontSize:12, padding:"7px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:5}}>
                      <Ico d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={13}/> Edit
                    </button>
                    <button onClick={() => deleteUser(u.id)} style={{...S.btnDanger, flex:1, fontSize:12, padding:"7px 0"}}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Day Detail */}
      {modal==="day" && selectedDate && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, letterSpacing:3, color:"#c8a96e", textTransform:"uppercase", marginBottom:4 }}>Day Events</div>
            <h3 style={{ margin:0, fontSize:20 }}>{formatDate(selectedDate)}</h3>
          </div>
          {getDay(selectedDate).length===0
            ? <div style={{ color:"#4a4a5a", textAlign:"center", padding:"30px 0" }}>No events this day.</div>
            : getDay(selectedDate).map((ev,i) => {
                const rc = ROLE_COLORS[ev.role]||{bg:"#f3f4f6",border:"#9ca3af"};
                const assigned = employees.filter(u => ev.assignees?.includes(u.id));
                return (
                  <div key={i} style={{ background:"#0f0f14", border:`1px solid ${rc.border}44`, borderLeft:`4px solid ${rc.border}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:"bold", fontSize:16, marginBottom:4 }}>{ev.name}</div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ background:rc.bg+"33", color:rc.border, fontSize:11, padding:"2px 8px", borderRadius:8, border:`1px solid ${rc.border}44` }}>{ev.role}</span>
                          <span style={{ fontSize:12, color:"#9a9ab0" }}>{ev.start_time} – {ev.end_time}</span>
                        </div>
                        {ev.notes && <div style={{ fontSize:12, color:"#6b6b80", marginBottom:8 }}>{ev.notes}</div>}
                        {assigned.length>0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {assigned.map(p => <span key={p.id} style={{ fontSize:11, background:"#2a2a3a", color:"#c8c8d8", padding:"2px 8px", borderRadius:8 }}>{p.name}</span>)}
                          </div>
                        )}
                      </div>
                      {isManager && (
                        <div style={{ display:"flex", gap:6, marginLeft:12 }}>
                          <button onClick={() => { setModal(null); setTimeout(()=>openEdit(ev),50); }} style={S.iconBtn}>
                            <Ico d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" size={14}/>
                          </button>
                          <button onClick={() => deleteEvent(ev.id)} style={S.iconBtn}>
                            <Ico d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" size={14}/>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          }
          {isManager && (
            <button onClick={() => { setModal(null); setTimeout(()=>openAdd(selectedDate),50); }} style={{...S.btnPrimary, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:8}}>
              <Ico d="M12 5v14M5 12h14" /> Add Event
            </button>
          )}
        </Modal>
      )}

      {/* MODAL: Add/Edit Event */}
      {modal==="event" && isManager && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, letterSpacing:3, color:"#c8a96e", textTransform:"uppercase", marginBottom:4 }}>{editIdx!==null?"Edit Event":"New Event"}</div>
            <h3 style={{ margin:0, fontSize:20 }}>{formatDate(selectedDate)}</h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={S.label}>Event Name</label>
              <input style={S.input} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Private Dinner, Corporate Event..." />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={S.label}>Start Time</label>
                <input style={S.input} type="time" value={form.start_time} onChange={e=>setForm(p=>({...p,start_time:e.target.value}))} />
              </div>
              <div>
                <label style={S.label}>End Time</label>
                <input style={S.input} type="time" value={form.end_time} onChange={e=>setForm(p=>({...p,end_time:e.target.value}))} />
              </div>
            </div>
            <div>
              <label style={S.label}>Role / Position</label>
              <select style={S.input} value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Assign Employees</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                {employees.map(u => {
                  const sel = form.assignees.includes(u.id);
                  return (
                    <button key={u.id} onClick={()=>setForm(p=>({...p,assignees:sel?p.assignees.filter(id=>id!==u.id):[...p.assignees,u.id]}))} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer", background:sel?"#c8a96e22":"#1c1c2a", border:`1px solid ${sel?"#c8a96e":"#3a3a4a"}`, color:sel?"#c8a96e":"#9a9ab0", fontFamily:"Georgia, serif" }}>
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={S.label}>Additional Notes</label>
              <textarea style={{...S.input, resize:"vertical", minHeight:70}} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Special instructions, dress code, etc." />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            <button onClick={()=>setModal(null)} style={{...S.btnSecondary,flex:1}}>Cancel</button>
            <button onClick={saveEvent} style={{...S.btnPrimary,flex:2}}>{editIdx!==null?"Save Changes":"Create Event"}</button>
          </div>
        </Modal>
      )}

      {/* MODAL: Add/Edit User */}
      {modal==="user" && isManager && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, letterSpacing:3, color:"#c8a96e", textTransform:"uppercase", marginBottom:4 }}>{editingUserId!==null?"Edit Employee":"New Employee"}</div>
            <h3 style={{ margin:0, fontSize:20 }}>{editingUserId!==null?"Update Information":"Add to Team"}</h3>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={S.label}>Full Name</label>
              <input style={S.input} value={userForm.name} onChange={e=>setUserForm(p=>({...p,name:e.target.value}))} placeholder="Employee name" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={S.label}>Username</label>
                <input style={S.input} value={userForm.username} onChange={e=>setUserForm(p=>({...p,username:e.target.value}))} placeholder="username" />
              </div>
              <div>
                <label style={S.label}>Password</label>
                <input style={S.input} value={userForm.password} onChange={e=>setUserForm(p=>({...p,password:e.target.value}))} placeholder="Password" />
              </div>
            </div>
            <div>
              <label style={S.label}>Phone</label>
              <input style={S.input} value={userForm.phone} onChange={e=>setUserForm(p=>({...p,phone:e.target.value}))} placeholder="787-555-0000" />
            </div>
            <div>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" value={userForm.email} onChange={e=>setUserForm(p=>({...p,email:e.target.value}))} placeholder="employee@email.com" />
            </div>
            <div>
              <label style={S.label}>Primary Position</label>
              <select style={S.input} value={userForm.position} onChange={e=>setUserForm(p=>({...p,position:e.target.value}))}>
                <option value="">Not specified</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            <button onClick={()=>setModal(null)} style={{...S.btnSecondary,flex:1}}>Cancel</button>
            <button onClick={saveUser} style={{...S.btnPrimary,flex:2}}>{editingUserId!==null?"Save Changes":"Add Employee"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
