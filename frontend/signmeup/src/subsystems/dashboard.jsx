import { useEffect, useState } from "react";
import {
  NAV_ITEMS,
  ROLE_LABELS,
  calculateGpa,
  checkEligibility,
  courseById,
  studentById,
} from "../data.js";
import {
  Button,
  EmptyState,
  Panel,
} from "../shared.jsx";
import { dateTime } from "../utils.js";
import { GradesPage } from "./Grade.jsx";
import { MajorsPage } from "./Major.jsx";
import { RecordsPage } from "./Er.jsx";
import { FacultyPage } from "./fci.jsx";
import { RegistrationPage } from "./reg.jsx";
import { ReportsPage } from "./reports.jsx";

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function notify(setToast, message, tone = "success") {
  setToast({ message, tone, id: Date.now() });
}

export function AppShell({
  state,
  session,
  effectiveRole,
  page,
  setPage,
  setSession,
  setState,
  onReset,
  UsersPage,
  HelpPage,
}) {
  const [toast, setToast] = useState(null);
  const currentUser =
    state.users.find((user) => user.id === session.id) ?? session;
  const activeNav = NAV_ITEMS.find((item) => item.id === page);
  const visibleNav = NAV_ITEMS.filter((item) =>
    item.roles.includes(effectiveRole),
  );
  const activeStudentId =
    effectiveRole === "student" &&
    state.students.some((student) => student.id === currentUser.id)
      ? currentUser.id
      : state.students[0]?.id;

  useEffect(() => {
    if (!visibleNav.some((item) => item.id === page)) setPage("dashboard");
  }, [effectiveRole, page, setPage, visibleNav]);

  function mutate(mutator, successMessage) {
    setState((previous) => {
      const next = copy(previous);
      mutator(next);
      if (successMessage)
        next.auditLog.unshift({
          id: Date.now(),
          userId: currentUser.id,
          action: successMessage,
          at: new Date().toISOString(),
        });
      return next;
    });
    if (successMessage) notify(setToast, successMessage);
  }

  function registerCourse(studentId, courseId) {
    const eligibility = checkEligibility(state, studentId, courseId);
    if (!eligibility.eligible) {
      notify(setToast, eligibility.reasons[0], "error");
      return;
    }
    mutate((next) => {
      const student = studentById(next, studentId);
      const course = courseById(next, courseId);
      student.currentEnrollment.push({
        courseId: course.id,
        title: course.title,
        units: course.units,
        schedule: course.schedule,
        semester: "Fall 2026",
      });
      course.seats -= 1;
    }, `Registered ${studentId} for ${courseId}`);
  }

  function dropCourse(studentId, courseId) {
    mutate((next) => {
      const student = studentById(next, studentId);
      const course = courseById(next, courseId);
      student.currentEnrollment = student.currentEnrollment.filter(
        (item) => item.courseId !== courseId,
      );
      if (course) course.seats += 1;
    }, `Canceled registration for ${courseId}`);
  }

  function updateStudent(studentId, changes) {
    mutate(
      (next) => Object.assign(studentById(next, studentId), changes),
      `Updated student record ${studentId}`,
    );
  }

  function addStudentNote(studentId, text) {
    if (!["faculty", "advisor", "admin"].includes(effectiveRole)) {
      notify(setToast, "You are not authorized to add student notes.", "error");
      return;
    }

    mutate((next) => {
      studentById(next, studentId).notes.push({
        id: `N${Date.now()}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        employeeId: currentUser.id,
      });
    }, `Added a protected note to student ${studentId}`);
  }

  function updateOutline(studentId, action, payload = {}) {
    const isAuthorized =
      effectiveRole === "admin" || effectiveRole === "advisor";

    if (!isAuthorized) {
      notify(
        setToast,
        "You are not authorized to modify this outline.",
        "error",
      );
      return;
    }

    mutate((next) => {
      const outline = next.outlines[studentId];

      if (!outline) return;

      const now = new Date().toISOString();

      if (action === "add") {
        const alreadyExists = outline.entries.some(
          (entry) => entry.courseId === payload.courseId,
        );

        if (alreadyExists) return;

        outline.entries.push({
          courseId: payload.courseId,
          status: "approved",
          statusDate: now.slice(0, 10),
          approvedBy: currentUser.id,
        });

        outline.history.unshift({
          courseId: payload.courseId,
          action: "course_added",
          from: null,
          to: "approved",
          changedBy: currentUser.id,
          changedAt: now,
        });
      }

      if (action === "status") {
        const entry = outline.entries.find(
          (item) => item.courseId === payload.courseId,
        );

        if (!entry || entry.status === payload.status) return;

        const previousStatus = entry.status;

        entry.status = payload.status;
        entry.statusDate = now.slice(0, 10);
        entry.approvedBy = currentUser.id;

        outline.history.unshift({
          courseId: payload.courseId,
          action: "status_changed",
          from: previousStatus,
          to: payload.status,
          changedBy: currentUser.id,
          changedAt: now,
        });
      }

      if (action === "approve") {
        outline.approvedBy = currentUser.id;
        outline.lastApproved = now.slice(0, 10);

        outline.history.unshift({
          courseId: null,
          action: "outline_approved",
          from: null,
          to: "approved",
          changedBy: currentUser.id,
          changedAt: now,
        });
      }
    }, `Updated major outline for ${studentId}`);
  }

  function saveGrade(courseId, row) {
    const course = courseById(state, courseId);
    const canEdit =
      effectiveRole === "admin" ||
      (effectiveRole === "faculty" && course?.instructorId === currentUser.id);
    if (!canEdit) {
      notify(
        setToast,
        "Only the primary instructor or a specially authorized user may update this grade.",
        "error",
      );
      return;
    }
    if (effectiveRole !== "admin" && !row.endOfSemester) {
      notify(
        setToast,
        "Grade entry is restricted until the end of the semester.",
        "error",
      );
      return;
    }
    mutate((next) => {
      const record = next.grades[courseId] ?? {
        generalComment: "",
        students: [],
      };
      next.grades[courseId] = record;
      const existing = record.students.find(
        (item) => item.studentId === row.studentId,
      );
      const update = {
        studentId: row.studentId,
        registrationType: row.registrationType,
        grade: row.grade,
        note: row.note || "",
        updatedBy: currentUser.id,
        updatedAt: new Date().toISOString(),
      };
      if (existing) Object.assign(existing, update);
      else record.students.push(update);
    }, `Updated ${courseId} grade for ${row.studentId}`);
  }

  function addUser(form) {
    if (
      !form.name.trim() ||
      !form.username.trim() ||
      !form.password ||
      !form.role
    ) {
      notify(
        setToast,
        "Name, email, password, and role are required.",
        "error",
      );
      return false;
    }
    mutate((next) => {
      const id =
        form.role === "student"
          ? `S${Date.now().toString().slice(-4)}`
          : `U${Date.now().toString().slice(-4)}`;
      next.users.push({
        id,
        username: form.username.trim(),
        password: form.password,
        name: form.name.trim(),
        role: form.role,
        title: ROLE_LABELS[form.role],
        access: [],
      });
      if (form.role === "student")
        next.students.push({
          id,
          name: form.name.trim(),
          telephone: "",
          address: "",
          dateOfBirth: "",
          major: "",
          minor: "",
          graduateAccepted: false,
          completedCourses: [],
          transferCourses: [],
          currentEnrollment: [],
          notes: [],
        });
    }, `Created authorized user ${form.username}`);
    return true;
  }

  function resetPassword(userId, password) {
    if (password.trim())
      mutate((next) => {
        next.users.find((user) => user.id === userId).password = password;
      }, `Reset password for ${userId}`);
  }

  const content =
    {
      dashboard: (
        <Dashboard
          state={state}
          currentUser={currentUser}
          effectiveRole={effectiveRole}
          setPage={setPage}
          onReset={onReset}
        />
      ),
      registration: (
        <RegistrationPage
          state={state}
          role={effectiveRole}
          activeStudentId={activeStudentId}
          onRegister={registerCourse}
          onDrop={dropCourse}
        />
      ),
      records: (
        <RecordsPage
          state={state}
          role={effectiveRole}
          activeStudentId={activeStudentId}
          onUpdate={updateStudent}
          onAddNote={addStudentNote}
        />
      ),
      majors: (
        <MajorsPage
          state={state}
          role={effectiveRole}
          activeStudentId={activeStudentId}
          currentUser={currentUser}
          onUpdateOutline={updateOutline}
        />
      ),
      faculty: <FacultyPage state={state} />,
      grades: (
        <GradesPage
          state={state}
          role={effectiveRole}
          currentUser={currentUser}
          onSaveGrade={saveGrade}
          onUpdateComment={(courseId, comment) =>
            mutate((next) => {
              (next.grades[courseId] ??= { students: [] }).generalComment =
                comment;
            }, `Updated ${courseId} course comment`)
          }
        />
      ),
      reports: (
        <ReportsPage
          state={state}
          role={effectiveRole}
          activeStudentId={activeStudentId}
        />
      ),
      users: (
        <UsersPage
          state={state}
          onAddUser={addUser}
          onResetPassword={resetPassword}
        />
      ),
      help: <HelpPage page={page} />,
    }[page] ?? null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SignMeUp</strong>
            <small>University portal</small>
          </div>
        </div>
        <div className="sidebar-section-label">Workspace</div>
        <nav aria-label="Primary navigation">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-note">
            <span>●</span>
            <div>
              <strong>Protected workspace</strong>
              <small>Activity is logged</small>
            </div>
          </div>
          <button className="signout" onClick={() => setSession(null)}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              SignMeUp / {activeNav?.label ?? "Overview"}
            </p>
            <h1>{activeNav?.label ?? "Overview"}</h1>
          </div>
          <div className="topbar-actions">
            {session.role === "admin" && (
              <label className="view-as">
                View as{" "}
                <select
                  value={effectiveRole}
                  onChange={(event) => {
                    setPage("dashboard");
                    setSession({ ...session, previewRole: event.target.value });
                  }}
                >
                  <option value="admin">Administrator</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="advisor">Advisor</option>
                </select>
              </label>
            )}
            <button
              className="help-button"
              onClick={() => setPage("help")}
              aria-label="Open help"
            >
              ?
            </button>
            <div className="profile-chip">
              <span className="avatar">{currentUser.name?.slice(0, 1)}</span>
              <div>
                <strong>{currentUser.name}</strong>
                <small>{ROLE_LABELS[effectiveRole]}</small>
              </div>
            </div>
          </div>
        </header>
        <div className="content-area">{content}</div>
      </main>
      {toast && (
        <div
          className={`toast toast-${toast.tone}`}
          role="status"
          key={toast.id}
        >
          <span>{toast.tone === "error" ? "!" : "✓"}</span>
          {toast.message}
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </div>
  );
}

function Dashboard({ state, currentUser, effectiveRole, setPage, onReset }) {
  const [todayLabel] = useState(() =>
    new Date().toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  );
  const studentId = state.students.some((item) => item.id === currentUser.id)
    ? currentUser.id
    : state.students[0]?.id;
  const student =
    effectiveRole === "student"
      ? studentById(state, studentId)
      : state.students[0];
  const registered = student?.currentEnrollment.length ?? 0;
  const seats = state.courses.reduce((sum, course) => sum + course.seats, 0);
  const actions =
    effectiveRole === "student"
      ? [
          [
            "registration",
            "Register for classes",
            "Browse upcoming offerings and check eligibility.",
          ],
          ["records", "Open my record", "Review courses, notes, and GPA."],
          [
            "majors",
            "View my major plan",
            "See approved courses and completion status.",
          ],
        ]
      : [
          [
            "records",
            "Review student records",
            "Open protected student information.",
          ],
          ["reports", "Open reports", "Preview and print operational reports."],
          [
            "faculty",
            "Search directory",
            "Find faculty and course information.",
          ],
        ];
  return (
    <div className="page-stack">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{todayLabel}</p>
          <h2>Good morning, {currentUser.name.split(" ")[0]}.</h2>
          <p className="muted">
            Your {ROLE_LABELS[effectiveRole].toLowerCase()} workspace is ready.
          </p>
        </div>
        <div className="welcome-actions">
          <Button variant="secondary" onClick={() => window.print()}>
            Print this display
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Reset demo data
          </Button>
        </div>
      </div>
      <div className="metric-grid">
        <Metric
          label="Registered courses"
          value={registered}
          detail={
            student
              ? `${student.currentEnrollment.reduce((sum, item) => sum + item.units, 0)} credits this term`
              : "Shared workspace"
          }
          accent="maroon"
        />
        <Metric
          label="Available seats"
          value={seats}
          detail="Across all departments"
          accent="blue"
        />
        <Metric
          label="Student GPA"
          value={student ? calculateGpa(student) : "—"}
          detail={student ? "Current calculated GPA" : "Select a record"}
          accent="green"
        />
        <Metric
          label="Audit events"
          value={state.auditLog.length}
          detail="Logged workspace actions"
          accent="gold"
        />
      </div>
      <div className="dashboard-grid">
        <Panel title="Start with a task" eyebrow="Quick access">
          <div className="quick-action-grid">
            {actions.map(([id, title, description]) => (
              <button
                key={id}
                className="quick-action"
                onClick={() => setPage(id)}
              >
                <span className="quick-arrow">↗</span>
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="System status" eyebrow="Operational overview">
          <div className="status-list">
            <div>
              <span className="status-dot green" />
              Database prototype <strong>Ready</strong>
            </div>
            <div>
              <span className="status-dot green" />
              Security logging <strong>Active</strong>
            </div>
            <div>
              <span className="status-dot green" />
              Local persistence <strong>Enabled</strong>
            </div>
            <div>
              <span className="status-dot gold" />
              Neon database <strong>Integration pending</strong>
            </div>
          </div>
          <p className="panel-footnote">
            The prototype keeps changes in this browser using localStorage. The
            backend contract is ready for PostgreSQL integration.
          </p>
        </Panel>
      </div>
      <Panel
        title="Recent activity"
        eyebrow="Audit trail"
        actions={
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        }
      >
        {state.auditLog.length === 0 ? (
          <EmptyState title="No activity yet">
            Actions you take in this session will appear here.
          </EmptyState>
        ) : (
          <div className="activity-list">
            {state.auditLog.slice(0, 6).map((item) => (
              <div className="activity-row" key={item.id}>
                <span className="activity-icon">✓</span>
                <div>
                  <strong>{item.action}</strong>
                  <small>
                    {item.userId} · {dateTime(item.at)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Metric({ label, value, detail, accent }) {
  return (
    <div className={`metric-card metric-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
