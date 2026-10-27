import { useEffect, useState } from "react";
import {
  NAV_ITEMS,
  ROLE_LABELS,
  calculateGpa,
  checkEligibility,
  cloneInitialState,
  courseById,
  getDemoUser,
  gradePoints,
  studentById,
} from "./data";

const STORAGE_KEY = "signmeup-prototype-state-v2";

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function dateTime(value = new Date().toISOString()) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function notify(setToast, message, tone = "success") {
  setToast({ message, tone, id: Date.now() });
}

function Button({ children, variant = "primary", size = "md", ...props }) {
  return <button className={`button button-${variant} button-${size}`} {...props}>{children}</button>;
}

function Panel({ title, eyebrow, actions, children, className = "" }) {
  return <section className={`panel ${className}`}>
    <div className="panel-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}{title && <h2>{title}</h2>}</div>{actions && <div className="panel-actions">{actions}</div>}</div>
    {children}
  </section>;
}

function FieldHelp({ children }) {
  return <span className="field-help" title={children} aria-label={`Help: ${children}`}>?</span>;
}

function Status({ children, tone = "neutral" }) { return <span className={`status status-${tone}`}>{children}</span>; }

function EmptyState({ title, children }) {
  return <div className="empty-state"><div className="empty-icon">◌</div><h3>{title}</h3><p>{children}</p></div>;
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter both your Student ID or campus email and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await onLogin(username, password);
      if (!user) setError("The credentials were not recognized. Check both values and try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(user, demoPassword) {
    setUsername(user);
    setPassword(demoPassword);
    setError("");
  }

  return <main className="login-shell">
    <section className="login-brand"><div><p className="wordmark">College <span>SignMeUp</span></p><p className="tagline">University portal</p></div><div className="login-copy"><p className="eyebrow">One connected campus workspace</p><h1>Your next chapter starts here.</h1><p>Register for classes, track degree progress, maintain student records, and support faculty workflows from one secure workspace.</p></div><div className="login-metrics"><div><strong>5</strong><span>subsystems</span></div><div><strong>24/7</strong><span>web access</span></div><div><strong>1</strong><span>shared record</span></div></div></section>
    <section className="login-panel"><div className="login-card"><p className="eyebrow">Secure access</p><h2>Sign in to SignMeUp</h2><p className="muted">Use a campus email or demo account to continue.</p>{error && <div className="alert alert-error" role="alert">{error}</div>}<form onSubmit={submit} noValidate><label htmlFor="login-username">Student ID or campus email <FieldHelp>Required. Use your assigned campus identifier.</FieldHelp></label><input id="login-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="student@example.edu" /><label htmlFor="login-password">Password <FieldHelp>Required. Passwords are validated before access is granted.</FieldHelp></label><div className="password-wrap"><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" /><button type="button" className="inline-button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div><Button type="submit" disabled={loading}>{loading ? "Checking…" : "Sign in"}</Button></form><div className="demo-login"><div className="divider"><span>Demo accounts</span></div><p className="muted small">Choose a role to prefill its credentials.</p><div className="demo-grid">{[["Student", "student@example.edu", "student123"], ["Faculty", "faculty@example.edu", "faculty123"], ["Advisor", "advisor@example.edu", "advisor123"], ["Admin", "admin@example.edu", "admin123"]].map(([label, user, pass]) => <button type="button" className="demo-account" key={label} onClick={() => fillDemo(user, pass)}><strong>{label}</strong><span>{user}</span></button>)}</div></div></div></section>
  </main>;
}

function AppShell({ state, session, effectiveRole, page, setPage, setSession, setState, onReset }) {
  const [toast, setToast] = useState(null);
  const currentUser = state.users.find((user) => user.id === session.id) ?? session;
  const activeNav = NAV_ITEMS.find((item) => item.id === page);
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(effectiveRole));
  const activeStudentId = effectiveRole === "student" && state.students.some((student) => student.id === currentUser.id) ? currentUser.id : state.students[0]?.id;

  useEffect(() => {
    if (!visibleNav.some((item) => item.id === page)) setPage("dashboard");
  }, [effectiveRole, page, setPage, visibleNav]);

  function mutate(mutator, successMessage) {
    setState((previous) => {
      const next = copy(previous);
      mutator(next);
      if (successMessage) next.auditLog.unshift({ id: Date.now(), userId: currentUser.id, action: successMessage, at: new Date().toISOString() });
      return next;
    });
    if (successMessage) notify(setToast, successMessage);
  }

  function registerCourse(studentId, courseId) {
    const eligibility = checkEligibility(state, studentId, courseId);
    if (!eligibility.eligible) { notify(setToast, eligibility.reasons[0], "error"); return; }
    mutate((next) => { const student = studentById(next, studentId); const course = courseById(next, courseId); student.currentEnrollment.push({ courseId: course.id, title: course.title, units: course.units, schedule: course.schedule, semester: "Fall 2026" }); course.seats -= 1; }, `Registered ${studentId} for ${courseId}`);
  }

  function dropCourse(studentId, courseId) {
    mutate((next) => { const student = studentById(next, studentId); const course = courseById(next, courseId); student.currentEnrollment = student.currentEnrollment.filter((item) => item.courseId !== courseId); if (course) course.seats += 1; }, `Canceled registration for ${courseId}`);
  }

  function updateStudent(studentId, changes) { mutate((next) => Object.assign(studentById(next, studentId), changes), `Updated student record ${studentId}`); }

  function addStudentNote(studentId, text) {
    mutate((next) => { studentById(next, studentId).notes.push({ id: `N${Date.now()}`, text, createdAt: new Date().toISOString(), employeeId: currentUser.id }); }, `Added a protected note to student ${studentId}`);
  }

  function updateOutline(studentId, entry, status) {
    mutate((next) => { const outline = next.outlines[studentId]; const existing = outline.entries.find((item) => item.courseId === entry.courseId); const before = existing.status; existing.status = status; existing.statusDate = new Date().toISOString().slice(0, 10); existing.approvedBy = currentUser.id; outline.lastApproved = existing.statusDate; outline.history.unshift({ courseId: entry.courseId, from: before, to: status, changedBy: currentUser.id, changedAt: new Date().toISOString() }); }, `Updated major outline status for ${studentId}`);
  }

  function saveGrade(courseId, row) {
    const course = courseById(state, courseId);
    const canEdit = effectiveRole === "admin" || (effectiveRole === "faculty" && course?.instructorId === currentUser.id);
    if (!canEdit) { notify(setToast, "Only the primary instructor or a specially authorized user may update this grade.", "error"); return; }
    if (effectiveRole !== "admin" && !row.endOfSemester) { notify(setToast, "Grade entry is restricted until the end of the semester.", "error"); return; }
    mutate((next) => { const record = next.grades[courseId] ?? { generalComment: "", students: [] }; next.grades[courseId] = record; const existing = record.students.find((item) => item.studentId === row.studentId); const update = { studentId: row.studentId, registrationType: row.registrationType, grade: row.grade, note: row.note || "", updatedBy: currentUser.id, updatedAt: new Date().toISOString() }; if (existing) Object.assign(existing, update); else record.students.push(update); }, `Updated ${courseId} grade for ${row.studentId}`);
  }

  function addUser(form) {
    if (!form.name.trim() || !form.username.trim() || !form.password || !form.role) { notify(setToast, "Name, email, password, and role are required.", "error"); return false; }
    mutate((next) => { const id = form.role === "student" ? `S${Date.now().toString().slice(-4)}` : `U${Date.now().toString().slice(-4)}`; next.users.push({ id, username: form.username.trim(), password: form.password, name: form.name.trim(), role: form.role, title: ROLE_LABELS[form.role], access: [] }); if (form.role === "student") next.students.push({ id, name: form.name.trim(), telephone: "", address: "", dateOfBirth: "", major: "", minor: "", graduateAccepted: false, completedCourses: [], transferCourses: [], currentEnrollment: [], notes: [] }); }, `Created authorized user ${form.username}`);
    return true;
  }

  function resetPassword(userId, password) { if (password.trim()) mutate((next) => { next.users.find((user) => user.id === userId).password = password; }, `Reset password for ${userId}`); }

  const content = {
    dashboard: <Dashboard state={state} currentUser={currentUser} effectiveRole={effectiveRole} setPage={setPage} onReset={onReset} />,
    registration: <RegistrationPage state={state} role={effectiveRole} activeStudentId={activeStudentId} onRegister={registerCourse} onDrop={dropCourse} />,
    records: <RecordsPage state={state} role={effectiveRole} activeStudentId={activeStudentId} onUpdate={updateStudent} onAddNote={addStudentNote} />,
    majors: <MajorsPage state={state} role={effectiveRole} activeStudentId={activeStudentId} onUpdateOutline={updateOutline} />,
    faculty: <FacultyPage state={state} />,
    grades: <GradesPage state={state} role={effectiveRole} currentUser={currentUser} onSaveGrade={saveGrade} onUpdateComment={(courseId, comment) => mutate((next) => { (next.grades[courseId] ??= { students: [] }).generalComment = comment; }, `Updated ${courseId} course comment`)} />,
    reports: <ReportsPage state={state} role={effectiveRole} activeStudentId={activeStudentId} />,
    users: <UsersPage state={state} onAddUser={addUser} onResetPassword={resetPassword} />,
    help: <HelpPage page={page} />,
  }[page] ?? null;

  return <div className="app-shell"><aside className="sidebar"><div className="sidebar-brand"><span className="brand-mark">S</span><div><strong>SignMeUp</strong><small>University portal</small></div></div><div className="sidebar-section-label">Workspace</div><nav aria-label="Primary navigation">{visibleNav.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav><div className="sidebar-bottom"><div className="secure-note"><span>●</span><div><strong>Protected workspace</strong><small>Activity is logged</small></div></div><button className="signout" onClick={() => setSession(null)}>Sign out</button></div></aside><main className="main-shell"><header className="topbar"><div><p className="breadcrumb">SignMeUp / {activeNav?.label ?? "Overview"}</p><h1>{activeNav?.label ?? "Overview"}</h1></div><div className="topbar-actions">{session.role === "admin" && <label className="view-as">View as <select value={effectiveRole} onChange={(event) => { setPage("dashboard"); setSession({ ...session, previewRole: event.target.value }); }}><option value="admin">Administrator</option><option value="student">Student</option><option value="faculty">Faculty</option><option value="advisor">Advisor</option></select></label>}<button className="help-button" onClick={() => setPage("help")} aria-label="Open help">?</button><div className="profile-chip"><span className="avatar">{currentUser.name?.slice(0, 1)}</span><div><strong>{currentUser.name}</strong><small>{ROLE_LABELS[effectiveRole]}</small></div></div></div></header><div className="content-area">{content}</div></main>{toast && <div className={`toast toast-${toast.tone}`} role="status" key={toast.id}><span>{toast.tone === "error" ? "!" : "✓"}</span>{toast.message}<button onClick={() => setToast(null)}>×</button></div>}</div>;
}

function Dashboard({ state, currentUser, effectiveRole, setPage, onReset }) {
  const [todayLabel] = useState(() => new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
  const studentId = state.students.some((item) => item.id === currentUser.id) ? currentUser.id : state.students[0]?.id;
  const student = effectiveRole === "student" ? studentById(state, studentId) : state.students[0];
  const registered = student?.currentEnrollment.length ?? 0;
  const seats = state.courses.reduce((sum, course) => sum + course.seats, 0);
  const actions = effectiveRole === "student" ? [["registration", "Register for classes", "Browse upcoming offerings and check eligibility."], ["records", "Open my record", "Review courses, notes, and GPA."], ["majors", "View my major plan", "See approved courses and completion status."]] : [["records", "Review student records", "Open protected student information."], ["reports", "Open reports", "Preview and print operational reports."], ["faculty", "Search directory", "Find faculty and course information."]];
  return <div className="page-stack"><div className="welcome-row"><div><p className="eyebrow">{todayLabel}</p><h2>Good morning, {currentUser.name.split(" ")[0]}.</h2><p className="muted">Your {ROLE_LABELS[effectiveRole].toLowerCase()} workspace is ready.</p></div><div className="welcome-actions"><Button variant="secondary" onClick={() => window.print()}>Print this display</Button><Button variant="ghost" onClick={onReset}>Reset demo data</Button></div></div><div className="metric-grid"><Metric label="Registered courses" value={registered} detail={student ? `${student.currentEnrollment.reduce((sum, item) => sum + item.units, 0)} credits this term` : "Shared workspace"} accent="maroon" /><Metric label="Available seats" value={seats} detail="Across all departments" accent="blue" /><Metric label="Student GPA" value={student ? calculateGpa(student) : "—"} detail={student ? "Current calculated GPA" : "Select a record"} accent="green" /><Metric label="Audit events" value={state.auditLog.length} detail="Logged workspace actions" accent="gold" /></div><div className="dashboard-grid"><Panel title="Start with a task" eyebrow="Quick access"><div className="quick-action-grid">{actions.map(([id, title, description]) => <button key={id} className="quick-action" onClick={() => setPage(id)}><span className="quick-arrow">↗</span><strong>{title}</strong><span>{description}</span></button>)}</div></Panel><Panel title="System status" eyebrow="Operational overview"><div className="status-list"><div><span className="status-dot green" />Database prototype <strong>Ready</strong></div><div><span className="status-dot green" />Security logging <strong>Active</strong></div><div><span className="status-dot green" />Local persistence <strong>Enabled</strong></div><div><span className="status-dot gold" />Neon database <strong>Integration pending</strong></div></div><p className="panel-footnote">The prototype keeps changes in this browser using localStorage. The backend contract is ready for PostgreSQL integration.</p></Panel></div><Panel title="Recent activity" eyebrow="Audit trail" actions={<Button variant="ghost" size="sm" onClick={() => window.print()}>Print</Button>}>{state.auditLog.length === 0 ? <EmptyState title="No activity yet">Actions you take in this session will appear here.</EmptyState> : <div className="activity-list">{state.auditLog.slice(0, 6).map((item) => <div className="activity-row" key={item.id}><span className="activity-icon">✓</span><div><strong>{item.action}</strong><small>{item.userId} · {dateTime(item.at)}</small></div></div>)}</div>}</Panel></div>;
}

function Metric({ label, value, detail, accent }) { return <div className={`metric-card metric-${accent}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }

function RegistrationPage({ state, role, activeStudentId, onRegister, onDrop }) {
  const [studentId, setStudentId] = useState(activeStudentId);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [outlineOnly, setOutlineOnly] = useState(false);
  const student = studentById(state, studentId);
  const departments = [...new Set(state.courses.map((course) => course.department))];
  const courses = state.courses.filter((course) => { const matchesQuery = `${course.id} ${course.title} ${course.description}`.toLowerCase().includes(query.toLowerCase()); const matchesDepartment = department === "all" || course.department === department; const result = checkEligibility(state, studentId, course.id, { requireOutline: outlineOnly }); return matchesQuery && matchesDepartment && (!eligibleOnly || result.eligible); });
  return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">REG subsystem</p><h2>Build an upcoming schedule</h2><p className="muted">Courses are checked one at a time against prerequisites, seats, major/minor rules, approved outlines, conflicts, and the 18-credit limit.</p></div><div className="legend"><Status tone="success">Eligible</Status><Status tone="error">Needs attention</Status></div></div><div className="two-column-layout"><div className="wide-column"><Panel title="Course offerings" eyebrow="Fall 2026" actions={role !== "student" && <label className="inline-select">Student <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{state.students.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.id})</option>)}</select></label>}><div className="filter-row"><label className="search-input"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course ID or title" /></label><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select><label className="check-label"><input type="checkbox" checked={eligibleOnly} onChange={(event) => setEligibleOnly(event.target.checked)} /> Eligible only</label><label className="check-label"><input type="checkbox" checked={outlineOnly} onChange={(event) => setOutlineOnly(event.target.checked)} /> Approved outline</label></div><div className="course-list">{courses.map((course) => <CourseCard key={course.id} course={course} eligibility={checkEligibility(state, studentId, course.id, { requireOutline: outlineOnly })} onRegister={() => onRegister(studentId, course.id)} />)}{courses.length === 0 && <EmptyState title="No matching offerings">Try a different search or filter.</EmptyState>}</div></Panel></div><div className="side-column"><Panel title="Current schedule" eyebrow={student ? `${student.name} · ${student.id}` : "Student record required"} actions={student && <Status tone="info">{student.currentEnrollment.reduce((sum, item) => sum + item.units, 0)} / 18 credits</Status>}>{!student ? <EmptyState title="Student record required">A student record must exist before registration can begin.</EmptyState> : student.currentEnrollment.length === 0 ? <EmptyState title="Schedule is empty">Select an eligible offering to register one course at a time.</EmptyState> : <div className="schedule-list">{student.currentEnrollment.map((item) => <div className="schedule-row" key={item.courseId}><div><strong>{item.courseId}</strong><span>{item.title}</span><small>{item.schedule} · {item.units} units</small></div><Button variant="danger" size="sm" onClick={() => onDrop(student.id, item.courseId)}>Cancel</Button></div>)}</div>}</Panel><Panel title="Eligibility rules" eyebrow="How registration works"><ul className="rule-list"><li>Prerequisites must be completed.</li><li>Upper-division courses must match the major or minor.</li><li>Graduate courses require graduate acceptance.</li><li>Approved-outline mode requires an approved course entry.</li><li>Seats, conflicts, and the 18-credit cap are checked.</li></ul></Panel></div></div></div>;
}

function CourseCard({ course, eligibility, onRegister }) { return <article className="course-card"><div className="course-card-main"><div className="course-title-row"><span className="course-code">{course.id}</span><Status tone={eligibility.eligible ? "success" : "error"}>{eligibility.eligible ? "Eligible" : "Review rules"}</Status></div><h3>{course.title}</h3><p>{course.description}</p><div className="course-meta"><span>{course.department} · {course.units} units</span><span>{course.schedule}</span><span>{course.seats} seats left</span></div>{!eligibility.eligible && <details className="eligibility-details"><summary>Why registration is blocked</summary><ul>{eligibility.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>}</div><Button disabled={!eligibility.eligible} onClick={onRegister}>{eligibility.eligible ? "Register" : "Unavailable"}</Button></article>; }

function RecordsPage({ state, role, activeStudentId, onUpdate, onAddNote }) {
  const selectable = role === "student" ? state.students.filter((student) => student.id === activeStudentId) : state.students;
  const [studentId, setStudentId] = useState(activeStudentId);
  const student = studentById(state, studentId);
  const canEdit = role === "admin" || role === "advisor";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(student ?? {});
  const [note, setNote] = useState("");
  useEffect(() => { setDraft(student ?? {}); setEditing(false); }, [studentId, state.students]);
  if (!student) return <Panel title="Student records" eyebrow="ER subsystem"><EmptyState title="Student record required">This function cannot continue until the required student information exists.</EmptyState></Panel>;
  function save() { if (!draft.name?.trim() || !draft.major?.trim()) return; onUpdate(student.id, { name: draft.name, telephone: draft.telephone, address: draft.address, dateOfBirth: draft.dateOfBirth, major: draft.major, minor: draft.minor, graduateAccepted: draft.graduateAccepted }); setEditing(false); }
  return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">ER subsystem</p><h2>Electronic student records</h2><p className="muted">General student information, course completion, transfer credit, current enrollment, GPA, and append-only notes.</p></div>{role !== "student" && <label className="inline-select">Student <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{selectable.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.id})</option>)}</select></label>}</div><div className="record-layout"><div className="wide-column"><Panel title={student.name} eyebrow={`Student ID ${student.id}`} actions={<><Button variant="secondary" onClick={() => window.print()}>Print record</Button>{canEdit && <Button variant={editing ? "ghost" : "primary"} onClick={() => setEditing((value) => !value)}>{editing ? "Cancel edit" : "Edit record"}</Button>}</>}>
    {editing ? <div className="form-grid"><Field label="Student name" required><input value={draft.name ?? ""} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></Field><Field label="Telephone"><input value={draft.telephone ?? ""} onChange={(event) => setDraft({ ...draft, telephone: event.target.value })} /></Field><Field label="Address"><input value={draft.address ?? ""} onChange={(event) => setDraft({ ...draft, address: event.target.value })} /></Field><Field label="Date of birth" required><input type="date" value={draft.dateOfBirth ?? ""} onChange={(event) => setDraft({ ...draft, dateOfBirth: event.target.value })} /></Field><Field label="Major" required><input value={draft.major ?? ""} onChange={(event) => setDraft({ ...draft, major: event.target.value })} /></Field><Field label="Minor"><input value={draft.minor ?? ""} onChange={(event) => setDraft({ ...draft, minor: event.target.value })} /></Field><label className="check-label full-span"><input type="checkbox" checked={Boolean(draft.graduateAccepted)} onChange={(event) => setDraft({ ...draft, graduateAccepted: event.target.checked })} /> Accepted into graduate program</label><div className="full-span"><Button onClick={save}>Save record</Button></div></div> : <div className="record-summary"><Info label="Student ID" value={student.id} /><Info label="Telephone" value={student.telephone || "Not provided"} /><Info label="Address" value={student.address || "Not provided"} /><Info label="Date of birth" value={student.dateOfBirth || "Not provided"} /><Info label="Major" value={student.major || "Not provided"} /><Info label="Minor" value={student.minor || "Not provided"} /><Info label="GPA" value={calculateGpa(student)} /><Info label="Graduate status" value={student.graduateAccepted ? "Accepted" : "Not accepted"} /></div>}
  </Panel><Panel title="Course history" eyebrow="Current university and transfer credit"><CourseTable title="Completed at this university" courses={student.completedCourses} /><CourseTable title="Completed at another university" courses={student.transferCourses} transfer /></Panel><Panel title="Current enrollment" eyebrow="Upcoming semester">{student.currentEnrollment.length ? <CourseTable courses={student.currentEnrollment} /> : <p className="muted">No current courses. Open Course Registration to select one course at a time.</p>}</Panel></div><div className="side-column"><Panel title="Protected notes" eyebrow="Chronological and append-only"><div className="note-form"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a formal student note" aria-label="Student note" /><Button disabled={!note.trim()} onClick={() => { onAddNote(student.id, note.trim()); setNote(""); }}>Add note</Button></div><div className="notes-list">{[...student.notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((item) => <div className="note-item" key={item.id}><span className="note-line" /><div><p>{item.text}</p><small>{dateTime(item.createdAt)} · employee {item.employeeId}</small></div></div>)}{student.notes.length === 0 && <p className="muted small">No notes have been entered.</p>}</div><p className="panel-footnote">Notes cannot be deleted. Each entry records the time and employee ID.</p></Panel></div></div></div>;
}

function CourseTable({ title, courses = [], transfer = false }) { return <div className="course-table-block"><h3>{title}</h3>{courses.length ? <div className="table-wrap"><table><thead><tr><th>Course</th><th>Title</th><th>Semester</th><th>Units</th><th>Grade</th>{transfer && <th>University</th>}</tr></thead><tbody>{courses.map((item, index) => <tr key={`${item.courseId}-${index}`}><td><strong>{item.courseId}</strong></td><td>{item.title}</td><td>{item.semester || "Fall 2026"}</td><td>{item.units}</td><td>{item.grade || "—"}</td>{transfer && <td>{item.university} · {item.location}</td>}</tr>)}</tbody></table></div> : <p className="muted small">No course entries.</p>}</div>; }

function MajorsPage({ state, role, activeStudentId, onUpdateOutline }) {
  const selectable = role === "student" ? state.students.filter((student) => student.id === activeStudentId) : state.students;
  const [studentId, setStudentId] = useState(activeStudentId);
  const student = studentById(state, studentId);
  const outline = state.outlines[studentId];
  const major = state.majors.find((item) => item.id === outline?.majorId);
  const canEdit = role === "admin" || role === "advisor";
  return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">MAJOR subsystem</p><h2>Major requirements and outline</h2><p className="muted">Review required and elective courses, then track approved outline status and history.</p></div>{role !== "student" && <label className="inline-select">Student <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{selectable.map((item) => <option value={item.id} key={item.id}>{item.name} ({item.id})</option>)}</select></label>}</div>{!student || !outline || !major ? <Panel title="Major outline"><EmptyState title="No approved outline">A student and major outline are required before this screen can continue.</EmptyState></Panel> : <div className="two-column-layout"><div className="wide-column"><Panel title={`${major.title} (${major.id})`} eyebrow={`${student.name} · ${major.department}`} actions={<Button variant="secondary" onClick={() => window.print()}>Print plan</Button>}><div className="record-summary"><Info label="Required units" value={major.requiredUnits} /><Info label="Advisor" value={outline.approvedBy} /><Info label="Last approved" value={outline.lastApproved} /><Info label="Required courses" value={major.requiredCourses.length} /></div><div className="outline-list"><h3>Approved course entries</h3>{outline.entries.map((entry) => { const course = courseById(state, entry.courseId) ?? { title: "Course not in catalog" }; return <div className="outline-row" key={entry.courseId}><div><strong>{entry.courseId}</strong><span>{course.title}</span><small>Last action {entry.statusDate} · approved by {entry.approvedBy}</small></div>{canEdit ? <select value={entry.status} onChange={(event) => onUpdateOutline(student.id, entry, event.target.value)}><option value="approved">Approved</option><option value="dropped">Dropped</option><option value="waived">Waived</option></select> : <Status tone={entry.status === "approved" ? "success" : "warning"}>{entry.status}</Status>}</div>; })}</div><div className="course-table-block"><h3>Elective courses</h3><p className="muted">{major.electiveCourses.join(", ") || "No electives recorded."}</p></div></Panel></div><div className="side-column"><Panel title="Outline history" eyebrow="Protected audit history">{outline.history.length ? <div className="history-list">{outline.history.map((item, index) => <div className="history-item" key={`${item.courseId}-${index}`}><strong>{item.courseId}</strong><span>{item.from} → {item.to}</span><small>{dateTime(item.changedAt)} · {item.changedBy}</small></div>)}</div> : <EmptyState title="No changes yet">Approved outline changes will remain available here.</EmptyState>}<p className="panel-footnote">Approved entries cannot be deleted. Status changes are retained in the history.</p></Panel><Panel title="Access rules" eyebrow="MJ05"><ul className="rule-list"><li>Required-course list: available to all users.</li><li>Student status and history: student, advisor, or administrator.</li><li>Only an advisor or administrator may change the outline.</li></ul></Panel></div></div>}</div>;
}

function wildcardMatch(value, pattern) { if (!pattern.trim()) return true; const escaped = pattern.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&").replace(/\\\*/g, ".*"); return new RegExp(`^${escaped}$`, "i").test(value); }

function FacultyPage({ state }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const faculty = state.faculty.filter((item) => (department === "all" || item.department === department) && (wildcardMatch(item.id, query) || wildcardMatch(item.name, query)));
  const courses = state.courses.filter((course) => (department === "all" || course.department === department) && (wildcardMatch(course.id, query) || wildcardMatch(course.title, query)));
  const departments = [...new Set(state.courses.map((course) => course.department))];
  return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">FCI subsystem</p><h2>Faculty and course information</h2><p className="muted">Search by faculty ID, faculty name, course ID, or course title. Use * for wildcard searches.</p></div><div className="legend"><Status tone="info">Wildcard search enabled</Status></div></div><Panel title="Directory search" eyebrow="FC04"><div className="filter-row"><label className="search-input wide"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Smith, U2001, CS*, or Algorithms" /></label><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></Panel><div className="two-column-layout"><Panel title="Faculty matches" eyebrow={`${faculty.length} results`}><div className="directory-list">{faculty.map((item) => <article className="directory-card" key={item.id}><div className="directory-avatar">{item.name.slice(0, 1)}</div><div><strong>{item.name}</strong><span>{item.id} · {item.position}</span><small>{item.department} · Office {item.office} · {item.telephone}</small><small>Office hours: {item.officeHours}</small><p>Authorized courses: {item.qualifiedCourses.join(", ")}</p></div></article>)}{faculty.length === 0 && <EmptyState title="No faculty matches">Try a different identifier or wildcard.</EmptyState>}</div></Panel><Panel title="Course matches" eyebrow={`${courses.length} results`}><div className="directory-list">{courses.map((course) => <article className="directory-card course-directory" key={course.id}><div className="course-code large">{course.id}</div><div><strong>{course.title}</strong><span>{course.department} · {course.units} units · {course.level}</span><small>{course.description}</small><small>Prerequisites: {course.prerequisites.join(", ") || "None"}</small><p>Qualified faculty: {state.faculty.filter((item) => item.qualifiedCourses.includes(course.id)).map((item) => item.name).join(", ") || "Not assigned"}</p></div></article>)}{courses.length === 0 && <EmptyState title="No course matches">Try a different course ID or title.</EmptyState>}</div></Panel></div></div>;
}

function GradesPage({ state, role, currentUser, onSaveGrade, onUpdateComment }) {
  const available = state.courses.filter((course) => role === "admin" || course.instructorId === currentUser.id);
  const [courseId, setCourseId] = useState(available[0]?.id ?? "");
  const [endOfSemester, setEndOfSemester] = useState(true);
  const course = courseById(state, courseId);
  const record = state.grades[courseId] ?? { generalComment: "", students: [] };
  const registered = state.students.filter((student) => student.currentEnrollment.some((item) => item.courseId === courseId));
  const rows = [...record.students];
  registered.forEach((student) => { if (!rows.some((row) => row.studentId === student.id)) rows.push({ studentId: student.id, registrationType: "letter", grade: "", note: "" }); });
  const [comment, setComment] = useState(record.generalComment ?? "");
  useEffect(() => setComment(record.generalComment ?? ""), [courseId, record.generalComment]);
  if (!course) return <Panel title="Course grades" eyebrow="GRADE subsystem"><EmptyState title="No grade courses available">A faculty member must be assigned as the primary instructor, or an administrator must select a course.</EmptyState></Panel>;
  return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">GRADE subsystem</p><h2>Maintain course grades</h2><p className="muted">Enter valid letter, credit/no credit, or audit grades, and keep notes on updates.</p></div><div className="legend"><label className="check-label"><input type="checkbox" checked={endOfSemester} onChange={(event) => setEndOfSemester(event.target.checked)} /> End-of-semester period</label><Button variant="secondary" onClick={() => window.print()}>Print grade sheet</Button></div></div><Panel title="Course selection" eyebrow="Primary instructor access"><div className="filter-row"><label className="inline-select">Course <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>{available.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.title}</option>)}</select></label><Status tone="info">{course.department} · {course.schedule} · {course.units} units</Status></div></Panel><Panel title="Student grade sheet" eyebrow={`${course.id} · ${course.instructor}`}><div className="table-wrap"><table className="grades-table"><thead><tr><th>Student</th><th>Registration type</th><th>Grade</th><th>Student note</th><th>Last update</th><th /></tr></thead><tbody>{rows.map((row) => <GradeRow key={row.studentId} row={row} student={studentById(state, row.studentId)} onSave={(updated) => onSaveGrade(course.id, { ...updated, endOfSemester })} />)}</tbody></table></div>{rows.length === 0 && <EmptyState title="No enrolled students">Students registered for this course will appear here.</EmptyState>}</Panel><div className="two-column-layout"><Panel title="General course comment" eyebrow="Not linked to a specific student"><textarea className="large-textarea" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Enter a general course note" /><Button onClick={() => onUpdateComment(course.id, comment)}>Save comment</Button></Panel><Panel title="Grade access rules" eyebrow="CG04"><ul className="rule-list"><li>Normal faculty updates are allowed at the end of semester.</li><li>Administrators have special update privileges.</li><li>Every update stores the updater and timestamp.</li><li>Student-specific notes stay separate from the general comment.</li></ul></Panel></div></div>;
}

function GradeRow({ row, student, onSave }) {
  const [draft, setDraft] = useState(row);
  useEffect(() => setDraft(row), [row.studentId, row.grade, row.note, row.registrationType]);
  const grades = draft.registrationType === "letter" ? ["", "A", "B", "C", "D", "F"] : draft.registrationType === "credit/no credit" ? ["", "CR", "NC"] : ["", "AU"];
  return <tr><td><strong>{student?.name ?? draft.studentId}</strong><small>{draft.studentId}</small></td><td><select value={draft.registrationType} onChange={(event) => setDraft({ ...draft, registrationType: event.target.value, grade: "" })}><option>letter</option><option>credit/no credit</option><option>audit</option></select></td><td><select value={draft.grade} onChange={(event) => setDraft({ ...draft, grade: event.target.value })}>{grades.map((grade) => <option value={grade} key={grade}>{grade || "Select"}</option>)}</select></td><td><input value={draft.note ?? ""} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Optional note" /></td><td><small>{draft.updatedAt ? dateTime(draft.updatedAt) : "Not entered"}<br />{draft.updatedBy || "—"}</small></td><td><Button size="sm" disabled={!draft.grade} onClick={() => onSave(draft)}>Save</Button></td></tr>;
}

function ReportsPage({ state, role, activeStudentId }) {
  const [type, setType] = useState("student");
  const [studentId, setStudentId] = useState(activeStudentId);
  const [department, setDepartment] = useState("CS");
  const [courseId, setCourseId] = useState(state.courses[0]?.id ?? "");
  const student = studentById(state, studentId);
  const departments = [...new Set(state.courses.map((course) => course.department))];
  const report = type === "student" ? <StudentReport state={state} student={student} /> : type === "course" ? <CourseStatsReport state={state} courseId={courseId} /> : <AggregateStatsReport state={state} department={type === "department" ? department : null} />;
  function exportCsv() { const text = reportCsv(state, type, { studentId, courseId, department }); const blob = new Blob([text], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `signmeup-${type}-report.csv`; anchor.click(); URL.revokeObjectURL(url); }
  return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">Reporting center</p><h2>Preview and print reports</h2><p className="muted">Reports remain on the workstation until you choose print or CSV export.</p></div><div className="legend"><Button variant="secondary" onClick={() => window.print()}>Print preview</Button><Button variant="ghost" onClick={exportCsv}>Export CSV</Button></div></div><Panel title="Report selection" eyebrow="RP01"><div className="report-tabs">{[["student", "Student record"], ["course", "Course statistics"], ["department", "Department statistics"], ["university", "University statistics"]].map(([id, label]) => <button className={type === id ? "active" : ""} onClick={() => setType(id)} key={id}>{label}</button>)}</div><div className="filter-row report-filters">{type === "student" && <label className="inline-select">Student <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{state.students.filter((item) => role !== "student" || item.id === activeStudentId).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}{type === "course" && <label className="inline-select">Course <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>{state.courses.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.title}</option>)}</select></label>}{type === "department" && <label className="inline-select">Department <select value={department} onChange={(event) => setDepartment(event.target.value)}>{departments.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>}</div></Panel><Panel title="Report preview" eyebrow={`${type[0].toUpperCase()}${type.slice(1)} report`} className="report-preview">{report}</Panel></div>;
}

function StudentReport({ student }) { if (!student) return <EmptyState title="Student record required">Select a student with a complete record before generating this report.</EmptyState>; return <div className="print-report"><div className="report-header"><div><p className="eyebrow">SignMeUp student record</p><h3>{student.name}</h3><p>{student.id} · {student.major}{student.minor ? ` / ${student.minor}` : ""}</p></div><div className="report-badge">GPA <strong>{calculateGpa(student)}</strong></div></div><div className="report-summary-grid"><Info label="Telephone" value={student.telephone || "Not provided"} /><Info label="Address" value={student.address || "Not provided"} /><Info label="Date of birth" value={student.dateOfBirth || "Not provided"} /><Info label="Graduate status" value={student.graduateAccepted ? "Accepted" : "Not accepted"} /></div><CourseTable title="Completed courses" courses={[...student.completedCourses, ...student.transferCourses]} /><CourseTable title="Current enrollment" courses={student.currentEnrollment} /></div>; }
function CourseStatsReport({ state, courseId }) { const course = courseById(state, courseId); const rows = state.grades[courseId]?.students ?? []; return <StatsReport title={`${course.id} · ${course.title}`} rows={rows} courses={[course]} />; }
function AggregateStatsReport({ state, department }) { const courses = state.courses.filter((course) => !department || course.department === department); const rows = courses.flatMap((course) => state.grades[course.id]?.students ?? []); return <StatsReport title={department ? `${department} department statistics` : "University-wide statistics"} rows={rows} courses={courses} />; }
function StatsReport({ title, rows, courses }) { const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 }; rows.forEach((row) => { if (counts[row.grade] !== undefined) counts[row.grade] += 1; }); const letterRows = rows.filter((row) => gradePoints(row.grade) !== null); const average = letterRows.length ? (letterRows.reduce((sum, row) => sum + gradePoints(row.grade), 0) / letterRows.length).toFixed(2) : "0.00"; const passing = rows.filter((row) => ["A", "B", "C", "CR"].includes(row.grade)).length; const total = rows.length; return <div className="print-report"><div className="report-header"><div><p className="eyebrow">SignMeUp grade statistics</p><h3>{title}</h3><p>{courses.length} course offering(s)</p></div><div className="report-badge">Average <strong>{average}</strong></div></div><div className="stats-grid"><Info label="Registrations" value={total} /><Info label="Passing" value={passing} /><Info label="Average grade" value={average} /><Info label="A / B / C / D / F" value={`${counts.A} / ${counts.B} / ${counts.C} / ${counts.D} / ${counts.F}`} /></div><div className="bar-list">{Object.entries(counts).map(([grade, count]) => <div key={grade}><span>{grade}</span><div className="bar"><i style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></div><strong>{total ? Math.round((count / total) * 100) : 0}%</strong></div>)}</div></div>; }
function reportCsv(state, type, options) { if (type === "student") { const student = studentById(state, options.studentId); return ["Student ID,Name,Course,Semester,Units,Grade", ...(student?.completedCourses ?? []).map((course) => [student.id, student.name, course.courseId, course.semester, course.units, course.grade].join(","))].join("\n"); } const courses = state.courses.filter((course) => type !== "department" || course.department === options.department); const rows = courses.flatMap((course) => (state.grades[course.id]?.students ?? []).map((row) => [course.id, course.department, row.studentId, row.grade].join(","))); return ["Course,Department,Student ID,Grade", ...rows].join("\n"); }

function UsersPage({ state, onAddUser, onResetPassword }) { const [form, setForm] = useState({ name: "", username: "", password: "", role: "student" }); const [selected, setSelected] = useState(state.users[0]?.id ?? ""); const [newPassword, setNewPassword] = useState(""); return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">Framework administration</p><h2>Authorized users</h2><p className="muted">Maintain access areas and initialize or reset passwords. Passwords are never included in reports.</p></div><Status tone="warning">Admin only</Status></div><div className="two-column-layout"><Panel title="Create authorized user" eyebrow="SF03–SF04"><div className="form-stack"><Field label="User name" required><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Campus email" required><input type="email" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field><Field label="Initial password" required><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field><Field label="Role" required><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="student">Student</option><option value="faculty">Faculty</option><option value="advisor">Major Advisor</option><option value="admin">System Administrator</option></select></Field><Button onClick={() => { if (onAddUser(form)) setForm({ name: "", username: "", password: "", role: "student" }); }}>Create user</Button></div></Panel><Panel title="Reset password" eyebrow="SF07"><div className="form-stack"><Field label="User"><select value={selected} onChange={(event) => setSelected(event.target.value)}>{state.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.id}</option>)}</select></Field><Field label="Replacement password" required><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></Field><Button disabled={!newPassword.trim()} onClick={() => { onResetPassword(selected, newPassword); setNewPassword(""); }}>Reset password</Button></div></Panel></div><Panel title="User access report" eyebrow={`${state.users.length} authorized users`} actions={<Button variant="secondary" onClick={() => window.print()}>Print report</Button>}><div className="table-wrap"><table><thead><tr><th>Name</th><th>Employee / student ID</th><th>Role</th><th>Access areas</th></tr></thead><tbody>{state.users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.username}</small></td><td>{user.id}</td><td><Status tone="info">{ROLE_LABELS[user.role]}</Status></td><td>{user.access.join(", ") || "Not assigned"}</td></tr>)}</tbody></table></div></Panel></div>; }

function HelpPage({ page }) { const topics = [{ title: "Workspace navigation", text: "Use the left navigation to move directly between subsystems. Your role determines which screens are available." }, { title: "Registration eligibility", text: "Course cards explain every blocked condition. Eligibility checks prerequisites, seats, major or minor, graduate acceptance, approved outline status, schedule conflicts, and the 18-credit cap." }, { title: "Student records", text: "Student records include personal data, completed courses, transfer credit, current enrollment, GPA, and protected chronological notes. Notes cannot be deleted." }, { title: "Reports and printing", text: "Open Reports, choose a report type, review the preview, and then select Print preview or Export CSV. Any screen can also be printed from the browser." }, { title: "Security and roles", text: "Passwords are required at login. Role-based navigation limits access. Administrator actions and data changes are written to the audit trail." }]; return <div className="page-stack"><div className="intro-row"><div><p className="eyebrow">Context-sensitive help</p><h2>How can we help?</h2><p className="muted">This help center covers system functions, screens, and data fields. Use the ? marker beside a field for a short field definition.</p></div><Status tone="info">Current screen: {page}</Status></div><div className="help-grid">{topics.map((topic) => <article className="help-card" key={topic.title}><span className="help-card-icon">?</span><h3>{topic.title}</h3><p>{topic.text}</p></article>)}</div><Panel title="Field reference" eyebrow="HL03"><div className="table-wrap"><table><thead><tr><th>Field</th><th>Required</th><th>Meaning</th></tr></thead><tbody><tr><td>Campus email / ID</td><td>Yes</td><td>Assigned identifier used to validate a user before access is granted.</td></tr><tr><td>Course ID</td><td>Yes</td><td>Unique course identifier used to connect offerings, records, and reports.</td></tr><tr><td>Registration type</td><td>Yes</td><td>Determines whether a letter grade, credit/no credit, or audit value is valid.</td></tr><tr><td>Status date</td><td>Yes</td><td>Date an approved-outline action was entered and retained in history.</td></tr></tbody></table></div></Panel></div>; }

function Field({ label, required, children }) { return <label className="form-field"><span>{label}{required && <em>Required</em>} <FieldHelp>{required ? "This field is required." : "Optional field."}</FieldHelp></span>{children}</label>; }
function Info({ label, value }) { return <div className="info-item"><span>{label}</span><strong>{value}</strong></div>; }

function App() {
  const [state, setState] = useState(() => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : cloneInitialState(); } catch { return cloneInitialState(); } });
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("dashboard");
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  async function login(username, password) {
    const demoUser = getDemoUser(state, username, password);
    if (demoUser) {
      setSession(demoUser);
      setPage("dashboard");
      setState((previous) => ({ ...previous, auditLog: [{ id: Date.now(), userId: demoUser.id, action: "Signed in", at: new Date().toISOString() }, ...previous.auditLog] }));
      return demoUser;
    }
    try {
      const response = await fetch("/api/authorizedusers/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redId: username, password }) });
      if (!response.ok) return null;
      const apiUser = await response.json();
      const user = { id: String(apiUser.EmployeeNumber ?? apiUser.AccountNumber), username: apiUser.Email, name: apiUser.UserName, role: apiUser.AccountType || "student", title: apiUser.JobTitle || "Authorized user", access: [] };
      setSession(user);
      setPage("dashboard");
      return user;
    } catch {
      return null;
    }
  }
  function reset() { if (window.confirm("Reset the browser prototype data to its original demo state?")) setState(cloneInitialState()); }
  if (!session) return <LoginScreen onLogin={login} />;
  const effectiveRole = session.previewRole ?? session.role;
  return <AppShell state={state} session={session} effectiveRole={effectiveRole} page={page} setPage={setPage} setSession={setSession} setState={setState} onReset={reset} />;
}

export default App;
