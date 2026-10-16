import { useState } from "react";
import "./LoginPage.css";

export default function LoginPage() {
  const [redId, setRedId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ redId: false, password: false });
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showForgotTip, setShowForgotTip] = useState(false);

  function validate() {
    const next = {
      redId: !redId.trim(),
      password: !password,
    };
    setErrors(next);
    return !next.redId && !next.password;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setShowBanner(false);
    if (!validate()) return;

    setLoading(true);
    try {
      //TODO: note that /api/authorizedusers/create takes the same parameters but will make an account (will need to include accountType going forward)
      const res = await fetch("/api/authorizedusers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redId, password }),
      });
      if (!res.ok) {
        setShowBanner(true); // invalid login - shows the error state
        throw new Error(
          "Error retrieving authorized user with ID " + redId + ".",
        );
      }
      const user = await res.json();
      if (!user.AccountNumber) {
        // primary key, but if this isn't found then don't continue
        throw new Error(
          "Found a matching record, but not enough data for user associated with ID " +
            redId +
            ".",
        );
      } else {
        //TODO: navigate to another screen here
        console.log("success!");
      }
      //await new Promise((resolve) => setTimeout(resolve, 900));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <section className="brand">
        <div>
          <p className="wordmark">
            College <span>SignMeUp</span>
          </p>
          <p className="tagline">University Portal</p>
        </div>

        <div className="brand-copy">
          <h2>Your next chapter starts here.</h2>
          <p>
            Register for classes, track your degree progress, and plan the
            semester ahead.
          </p>
        </div>

        <div className="term-row">
          <div className="term">
            <b>Jan 15</b>
            <span>Registration opens</span>
          </div>
          <div className="term">
            <b>Jan 28</b>
            <span>Registration closes</span>
          </div>
          <div className="term">
            <b>May 20</b>
            <span>Grades Due</span>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="form-card">
          <h1>Log in with your Student ID or campus email</h1>
          <br></br>
          {showBanner && (
            <div className="banner show" role="alert">
              <span>⚠</span>
              <span>
                Your Student ID or password wasn't recognized. Check both and
                try again.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="redId">Student ID or email</label>
              <div className="input-wrap">
                <input
                  type="text"
                  id="redId"
                  autoComplete="username"
                  placeholder="Enter your Student ID or campus email"
                  value={redId}
                  onChange={(e) => {
                    setRedId(e.target.value);
                    setErrors((p) => ({ ...p, redId: false }));
                    setShowBanner(false);
                  }}
                  className={errors.redId ? "invalid" : ""}
                />
              </div>
              {errors.redId && (
                <p className="error-text show">
                  Enter your Student ID or campus email.
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: false }));
                    setShowBanner(false);
                  }}
                  className={errors.password ? "invalid" : ""}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="error-text show">Enter your password.</p>
              )}
            </div>

            <div className="row-between">
              {/* <label className="remember">
                <input type="checkbox" />
                Remember me
              </label> */}
              <div className="forgot-wrap">
                <button
                  type="button"
                  className="forgot"
                  onClick={() => setShowForgotTip((s) => !s)}
                >
                  Forgot password?
                </button>
                {showForgotTip && (
                  <div className="forgot-tip" role="tooltip">
                    <p>
                      Passwords are reset by a system administrator. Email the
                      registrar's office from your campus account to request a
                      reset.
                    </p>
                    <button
                      type="button"
                      className="forgot-tip-close"
                      onClick={() => setShowForgotTip(false)}
                    >
                      Got it
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={`submit${loading ? " loading" : ""}`}
              disabled={loading}
            >
              <span className="spinner" />
              <span className="btn-text">Sign in</span>
            </button>
          </form>

          <div className="divider">or</div>
          <p className="help-link">
            Need an account?{" "}
            <a href="mailto:registrar@email.edu?">
              Contact the registrar's office
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
