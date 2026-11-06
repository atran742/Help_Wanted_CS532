import { useState } from "react";
import AppShell from "../components_Grades/AppShell";
import Icon from "../components_Grades/Icon";
import GradeEntry from "./GradeEntry";
import GradeHelpPanel from "./GradeHelpPanel";
import GradeSheet from "./GradeSheet";
import GradeStats from "./GradeStats";
import {
  COURSES,
  CURRENT_USER,
  GRADING_WINDOW,
  buildRecords,
} from "./gradeData";
import "./GradesPage.css";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "overview" },
  { key: "grades", label: "Grades", icon: "grades" },
  { key: "faculty", label: "Faculty directory", icon: "faculty" },
  { key: "reports", label: "Reports", icon: "reports" },
];

const TABS = [
  { key: "entry", label: "Grade entry" },
  { key: "sheet", label: "Grade sheet" },
  { key: "stats", label: "Statistics" },
];

export default function GradesPage({
  gradingOpen = GRADING_WINDOW.isOpen,
  hasSpecialPrivileges = false,
  canEditHelp = false,
  user = CURRENT_USER,
}) {
  const [courseId, setCourseId] = useState(COURSES[0].id);
  const [tab, setTab] = useState("entry");
  const [records, setRecords] = useState(buildRecords);
  const [helpOpen, setHelpOpen] = useState(false);

  const course = COURSES.find((c) => c.id === courseId);
  const record = records[courseId];

  function saveRecord(id, next) {
    setRecords((prev) => ({ ...prev, [id]: next }));
  }

  function editState(rec) {
    const submitted = rec.status === "Submitted";
    const canEdit = hasSpecialPrivileges || (gradingOpen && !submitted);
    let lockReason = "";
    if (!canEdit) {
      lockReason = submitted
        ? "Final grades have been submitted. Only users with special update privileges can change them."
        : `Grade entry is open from ${GRADING_WINDOW.opens} to ${GRADING_WINDOW.closes}. Only users with special update privileges can enter grades outside that window.`;
    }
    return { canEdit, lockReason };
  }

  return (
    <AppShell
      navItems={NAV_ITEMS}
      activeKey="grades"
      user={user}
      breadcrumb={["My campus", "Grades"]}
      helpOpen={helpOpen}
      onHelp={() => setHelpOpen((open) => !open)}
    >
      <div className="gr-page">
        <header className="gr-head">
          <div>
            <h1 className="gr-h1">Course grades</h1>
            <p className="gr-muted">
              Enter grades, print grade sheets and review statistics for the
              courses you teach.
            </p>
          </div>
          <span className="gr-term">Spring 2027</span>
        </header>

        <GradeHelpPanel
          screen={tab}
          open={helpOpen}
          canEditHelp={canEditHelp}
          onClose={() => setHelpOpen(false)}
        />

        <div className="gr-courses" role="group" aria-label="Your courses">
          {COURSES.map((c) => {
            const rec = records[c.id];
            const graded = rec.rows.filter((r) => r.grade).length;
            const submitted = rec.status === "Submitted";
            return (
              <button
                key={c.id}
                type="button"
                className="gr-course"
                aria-pressed={c.id === courseId}
                onClick={() => setCourseId(c.id)}
              >
                <span className="gr-course-top">
                  <strong>{c.id}</strong>
                  {submitted ? (
                    <span className="gr-chip gr-chip-ok">
                      <Icon name="check" size={12} /> Submitted
                    </span>
                  ) : (
                    <span className="gr-chip">In progress</span>
                  )}
                </span>
                <span className="gr-course-title">{c.title}</span>
                <span className="gr-muted">{c.meets}</span>
                <span className="gr-course-count">
                  {graded} of {rec.rows.length} graded
                </span>
              </button>
            );
          })}
        </div>

        <div className="gr-tabs" role="tablist" aria-label="Grade views">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="gr-panel">
          <div
            id="panel-entry"
            role="tabpanel"
            aria-labelledby="tab-entry"
            hidden={tab !== "entry"}
          >
            {COURSES.map((c) => {
              const { canEdit, lockReason } = editState(records[c.id]);
              return (
                <div key={c.id} hidden={c.id !== courseId}>
                  <GradeEntry
                    course={c}
                    record={records[c.id]}
                    canEdit={canEdit}
                    lockReason={lockReason}
                    currentUser={user}
                    onSave={(next) => saveRecord(c.id, next)}
                  />
                </div>
              );
            })}
          </div>

          <div
            id="panel-sheet"
            role="tabpanel"
            aria-labelledby="tab-sheet"
            hidden={tab !== "sheet"}
          >
            {tab === "sheet" && <GradeSheet course={course} record={record} />}
          </div>

          <div
            id="panel-stats"
            role="tabpanel"
            aria-labelledby="tab-stats"
            hidden={tab !== "stats"}
          >
            {tab === "stats" && (
              <GradeStats key={courseId} course={course} record={record} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
