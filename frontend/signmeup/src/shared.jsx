export function Button({ children, variant = "primary", size = "md", ...props }) {
  return (
    <button className={`button button-${variant} button-${size}`} {...props}>
      {children}
    </button>
  );
}

export function Panel({ title, eyebrow, actions, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2>{title}</h2>}
        </div>
        {actions && <div className="panel-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function FieldHelp({ children }) {
  return (
    <span
      className="field-help"
      title={children}
      aria-label={`Help: ${children}`}
    >
      ?
    </span>
  );
}

export function Status({ children, tone = "neutral" }) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">◌</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Field({ label, required, children }) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required && <em>Required</em>}{" "}
        <FieldHelp>
          {required ? "This field is required." : "Optional field."}
        </FieldHelp>
      </span>
      {children}
    </label>
  );
}

export function Info({ label, value }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
