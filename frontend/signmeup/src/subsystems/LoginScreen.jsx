import { useState } from "react";
import { Button, FieldHelp } from "../shared.jsx";

export function LoginScreen({ onLogin }) {
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
      if (!user)
        setError(
          "The credentials were not recognized. Check both values and try again.",
        );
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(user, demoPassword) {
    setUsername(user);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <main className="login-shell">
      <section className="login-brand">
        <div>
          <p className="wordmark">
            College <span>SignMeUp</span>
          </p>
          <p className="tagline">University portal</p>
        </div>
        <div className="login-copy">
          <p className="eyebrow">One connected campus workspace</p>
          <h1>Your next chapter starts here.</h1>
          <p>
            Register for classes, track degree progress, maintain student
            records, and support faculty workflows from one secure workspace.
          </p>
        </div>
        <div className="login-metrics">
          <div>
            <strong>5</strong>
            <span>subsystems</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>web access</span>
          </div>
          <div>
            <strong>1</strong>
            <span>shared record</span>
          </div>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">Secure access</p>
          <h2>Sign in to SignMeUp</h2>
          <p className="muted">
            Use a campus email or demo account to continue.
          </p>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit} noValidate>
            <label htmlFor="login-username">
              Student ID or campus email{" "}
              <FieldHelp>
                Required. Use your assigned campus identifier.
              </FieldHelp>
            </label>
            <input
              id="login-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="student@example.edu"
            />
            <label htmlFor="login-password">
              Password{" "}
              <FieldHelp>
                Required. Passwords are validated before access is granted.
              </FieldHelp>
            </label>
            <div className="password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="inline-button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Checking…" : "Sign in"}
            </Button>
          </form>
          <div className="demo-login">
            <div className="divider">
              <span>Demo accounts</span>
            </div>
            <p className="muted small">
              Choose a role to prefill its credentials.
            </p>
            <div className="demo-grid">
              {[
                ["Student", "student@example.edu", "student123"],
                ["Faculty", "faculty@example.edu", "faculty123"],
                ["Advisor", "advisor@example.edu", "advisor123"],
                ["Admin", "admin@example.edu", "admin123"],
              ].map(([label, user, pass]) => (
                <button
                  type="button"
                  className="demo-account"
                  key={label}
                  onClick={() => fillDemo(user, pass)}
                >
                  <strong>{label}</strong>
                  <span>{user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
