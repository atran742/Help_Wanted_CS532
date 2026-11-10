import { useEffect, useState } from "react";
import { cloneInitialState, getDemoUser, ROLE_LABELS } from "./data";
import { AppShell } from "./subsystems/dashboard.jsx";
import { LoginScreen } from "./subsystems/LoginScreen.jsx";
import {
  Button,
  Field,
  Panel,
  Status,
} from "./shared.jsx";

const STORAGE_KEY = "signmeup-prototype-state-v2";

function UsersPage({ state, onAddUser, onResetPassword }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "student",
  });
  const [selected, setSelected] = useState(state.users[0]?.id ?? "");
  const [newPassword, setNewPassword] = useState("");
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">Framework administration</p>
          <h2>Authorized users</h2>
          <p className="muted">
            Maintain access areas and initialize or reset passwords. Passwords
            are never included in reports.
          </p>
        </div>
        <Status tone="warning">Admin only</Status>
      </div>
      <div className="two-column-layout">
        <Panel title="Create authorized user" eyebrow="SF03–SF04">
          <div className="form-stack">
            <Field label="User name" required>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </Field>
            <Field label="Campus email" required>
              <input
                type="email"
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </Field>
            <Field label="Initial password" required>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </Field>
            <Field label="Role" required>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="advisor">Major Advisor</option>
                <option value="admin">System Administrator</option>
              </select>
            </Field>
            <Button
              onClick={() => {
                if (onAddUser(form))
                  setForm({
                    name: "",
                    username: "",
                    password: "",
                    role: "student",
                  });
              }}
            >
              Create user
            </Button>
          </div>
        </Panel>
        <Panel title="Reset password" eyebrow="SF07">
          <div className="form-stack">
            <Field label="User">
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                {state.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} · {user.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Replacement password" required>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Field>
            <Button
              disabled={!newPassword.trim()}
              onClick={() => {
                onResetPassword(selected, newPassword);
                setNewPassword("");
              }}
            >
              Reset password
            </Button>
          </div>
        </Panel>
      </div>
      <Panel
        title="User access report"
        eyebrow={`${state.users.length} authorized users`}
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            Print report
          </Button>
        }
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee / student ID</th>
                <th>Role</th>
                <th>Access areas</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <small>{user.username}</small>
                  </td>
                  <td>{user.id}</td>
                  <td>
                    <Status tone="info">{ROLE_LABELS[user.role]}</Status>
                  </td>
                  <td>{user.access.join(", ") || "Not assigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function HelpPage({ page }) {
  const topics = [
    {
      title: "Workspace navigation",
      text: "Use the left navigation to move directly between subsystems. Your role determines which screens are available.",
    },
    {
      title: "Registration eligibility",
      text: "Course cards explain every blocked condition. Eligibility checks prerequisites, seats, major or minor, graduate acceptance, approved outline status, schedule conflicts, and the 18-credit cap.",
    },
    {
      title: "Student records",
      text: "Student records include personal data, completed courses, transfer credit, current enrollment, GPA, and protected chronological notes. Notes cannot be deleted.",
    },
    {
      title: "Reports and printing",
      text: "Open Reports, choose a report type, review the preview, and then select Print preview or Export CSV. Any screen can also be printed from the browser.",
    },
    {
      title: "Security and roles",
      text: "Passwords are required at login. Role-based navigation limits access. Administrator actions and data changes are written to the audit trail.",
    },
  ];
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">Context-sensitive help</p>
          <h2>How can we help?</h2>
          <p className="muted">
            This help center covers system functions, screens, and data fields.
            Use the ? marker beside a field for a short field definition.
          </p>
        </div>
        <Status tone="info">Current screen: {page}</Status>
      </div>
      <div className="help-grid">
        {topics.map((topic) => (
          <article className="help-card" key={topic.title}>
            <span className="help-card-icon">?</span>
            <h3>{topic.title}</h3>
            <p>{topic.text}</p>
          </article>
        ))}
      </div>
      <Panel title="Field reference" eyebrow="HL03">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Required</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Campus email / ID</td>
                <td>Yes</td>
                <td>
                  Assigned identifier used to validate a user before access is
                  granted.
                </td>
              </tr>
              <tr>
                <td>Course ID</td>
                <td>Yes</td>
                <td>
                  Unique course identifier used to connect offerings, records,
                  and reports.
                </td>
              </tr>
              <tr>
                <td>Registration type</td>
                <td>Yes</td>
                <td>
                  Determines whether a letter grade, credit/no credit, or audit
                  value is valid.
                </td>
              </tr>
              <tr>
                <td>Status date</td>
                <td>Yes</td>
                <td>
                  Date an approved-outline action was entered and retained in
                  history.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : cloneInitialState();
    } catch {
      return cloneInitialState();
    }
  });
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("dashboard");
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  async function login(username, password) {
    const demoUser = getDemoUser(state, username, password);
    if (demoUser) {
      setSession(demoUser);
      setPage("dashboard");
      setState((previous) => ({
        ...previous,
        auditLog: [
          {
            id: Date.now(),
            userId: demoUser.id,
            action: "Signed in",
            at: new Date().toISOString(),
          },
          ...previous.auditLog,
        ],
      }));
      return demoUser;
    }
    try {
      const response = await fetch("/api/authorizedusers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redId: username, password }),
      });
      if (!response.ok) return null;
      const apiUser = await response.json();
      const user = {
        id: String(apiUser.EmployeeNumber ?? apiUser.AccountNumber),
        username: apiUser.Email,
        name: apiUser.UserName,
        role: apiUser.AccountType || "student",
        title: apiUser.JobTitle || "Authorized user",
        access: [],
      };
      setSession(user);
      setPage("dashboard");
      return user;
    } catch {
      return null;
    }
  }
  function reset() {
    if (
      window.confirm(
        "Reset the browser prototype data to its original demo state?",
      )
    )
      setState(cloneInitialState());
  }
  if (!session) return <LoginScreen onLogin={login} />;
  const effectiveRole = session.previewRole ?? session.role;
  return (
    <AppShell
      state={state}
      session={session}
      effectiveRole={effectiveRole}
      page={page}
      setPage={setPage}
      setSession={setSession}
      setState={setState}
      onReset={reset}
      UsersPage={UsersPage}
      HelpPage={HelpPage}
    />
  );
}

export default App;
