import Icon from "./Icon";
import "./AppShell.css";

export default function AppShell({
  navItems,
  activeKey,
  onNavigate,
  onHelp,
  helpOpen = false,
  user,
  breadcrumb = [],
  children,
}) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <p className="app-wordmark">
            College <span>SignMeUp</span>
          </p>
          <p className="app-tagline">University portal</p>
        </div>

        <nav className="app-nav" aria-label="Primary">
          <p className="app-nav-label">Workspace</p>
          <ul>
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`app-nav-item${item.key === activeKey ? " is-active" : ""}`}
                  aria-current={item.key === activeKey ? "page" : undefined}
                  onClick={() => onNavigate?.(item.key)}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="app-sidebar-foot">
          <div className="app-help">
            <p className="app-help-title">A little guidance?</p>
            <p className="app-help-copy">We're here for your next step.</p>
            <button
              type="button"
              className="app-help-link"
              aria-expanded={helpOpen}
              aria-controls="grade-screen-help"
              onClick={() => onHelp?.()}
            >
              Help for this screen <Icon name="arrow" size={12} />
            </button>
          </div>
          <div className="app-user">
            <span className="app-avatar" aria-hidden="true">
              {user.initials}
            </span>
            <div>
              <p className="app-user-name">{user.name}</p>
              <p className="app-user-role">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <nav aria-label="Breadcrumb">
            <ol className="app-crumbs">
              {breadcrumb.map((label, i) => (
                <li
                  key={label}
                  aria-current={
                    i === breadcrumb.length - 1 ? "page" : undefined
                  }
                >
                  {label}
                </li>
              ))}
            </ol>
          </nav>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
