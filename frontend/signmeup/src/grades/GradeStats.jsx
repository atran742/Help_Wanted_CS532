import { useState } from "react";
import { computeStats, pointsToLetter, SAMPLE_SCOPES } from "./gradeData";

const SCOPES = [
  { key: "course", label: "Course" },
  { key: "department", label: "Department" },
  { key: "university", label: "University" },
];

const SCOPE_NOUN = {
  course: "this course",
  department: "department courses",
  university: "university courses",
};

const fmt = (n) => n.toLocaleString("en-US");

// Course numbers are computed from the saved grades. Department and university numbers are sample data.
export default function GradeStats({ course, record }) {
  const [scope, setScope] = useState("course");
  const [view, setView] = useState("chart");
  const [hovered, setHovered] = useState(null);

  const stats =
    scope === "course" ? computeStats(record.rows) : SAMPLE_SCOPES[scope];
  const scopeName =
    scope === "course"
      ? `${course.id} · ${course.title}`
      : scope === "department"
        ? course.department
        : "All departments";

  const empty = scope === "course" && stats.gradedCount === 0;
  const passPct = stats.registered
    ? Math.round((stats.passing / stats.registered) * 100)
    : 0;

  // Leave headroom so the value label at the end of the longest bar always fits.
  const maxPct = Math.max(...stats.distribution.map((d) => d.pct));
  const axisMax = Math.max(20, Math.ceil((maxPct * 1.15) / 10) * 10);
  const ticks = Array.from({ length: axisMax / 10 + 1 }, (_, i) => i * 10);

  return (
    <section aria-labelledby="stats-heading">
      <div className="gr-stats-head">
        <div>
          <h2 id="stats-heading" className="gr-h2">
            Statistics
          </h2>
          <p className="gr-muted">{scopeName}</p>
        </div>
        <div className="gr-seg" role="group" aria-label="Statistics scope">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={scope === s.key}
              onClick={() => setScope(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gr-tiles">
        <div className="gr-tile">
          <p className="gr-tile-label">Registered</p>
          <p className="gr-tile-value">{fmt(stats.registered)}</p>
          <p className="gr-tile-note">
            students registered for {SCOPE_NOUN[scope]}
          </p>
        </div>
        <div className="gr-tile">
          <p className="gr-tile-label">Completed with a passing grade</p>
          <p className="gr-tile-value">{fmt(stats.passing)}</p>
          <p className="gr-tile-note">{passPct}% of those registered</p>
        </div>
        <div className="gr-tile">
          <p className="gr-tile-label">Average grade</p>
          <p className="gr-tile-value">
            {stats.average == null ? "—" : stats.average.toFixed(2)}
          </p>
          <p className="gr-tile-note">
            {stats.average == null
              ? "No letter grades yet"
              : `Roughly a ${pointsToLetter(stats.average)}`}
          </p>
        </div>
      </div>

      <div className="gr-card">
        <div className="gr-card-head">
          <div>
            <h3 className="gr-h3">Grade distribution</h3>
            <p className="gr-muted">Share of letter grades in each A–F band</p>
          </div>
          <div className="gr-seg" role="group" aria-label="Distribution view">
            <button
              type="button"
              aria-pressed={view === "chart"}
              onClick={() => setView("chart")}
            >
              Chart
            </button>
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              Table
            </button>
          </div>
        </div>

        {empty && (
          <p className="gr-empty">
            No letter grades have been saved for this course yet. Statistics
            appear once grades are saved.
          </p>
        )}

        {!empty && view === "chart" && (
          <div className="gr-dist">
            <ul className="gr-dist-rows">
              {stats.distribution.map((d) => (
                <li
                  key={d.band}
                  className="gr-dist-row"
                  tabIndex={0}
                  aria-label={`Grade ${d.band}: ${d.pct}%, ${fmt(d.count)} ${d.count === 1 ? "student" : "students"}`}
                  onMouseEnter={() => setHovered(d.band)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(d.band)}
                  onBlur={() => setHovered(null)}
                >
                  <span className="gr-dist-label">{d.band}</span>
                  <span
                    className="gr-dist-plot"
                    style={{
                      "--w": (d.pct / axisMax) * 100,
                      "--segments": ticks.length - 1,
                    }}
                  >
                    <span className="gr-dist-bar" />
                    <span className="gr-dist-value">{d.pct}%</span>
                    {hovered === d.band && (
                      <span className="gr-dist-tip" role="tooltip">
                        Grade {d.band} · {d.pct}% · {fmt(d.count)}{" "}
                        {d.count === 1 ? "student" : "students"}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="gr-dist-axis" aria-hidden="true">
              {ticks.map((t) => (
                <span key={t}>{t}%</span>
              ))}
            </div>
          </div>
        )}

        {!empty && view === "table" && (
          <div className="gr-table-wrap">
            <table className="gr-table gr-table-compact">
              <thead>
                <tr>
                  <th scope="col">Grade</th>
                  <th scope="col" className="gr-right">
                    Students
                  </th>
                  <th scope="col" className="gr-right">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.distribution.map((d) => (
                  <tr key={d.band}>
                    <td>{d.band}</td>
                    <td className="gr-num gr-right">{fmt(d.count)}</td>
                    <td className="gr-num gr-right">{d.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="gr-footnote">
        Course figures use saved grades. Credit/No Credit and Audit entries are
        not part of the average or the A–F shares. Department and university
        figures are sample data until the backend is connected.
      </p>
    </section>
  );
}
