import { Fragment, useMemo, useState } from "react";
import Icon from "../components_Grades/Icon";
import { GRADE_OPTIONS } from "./gradeData";
import { GRADE_FIELD_HELP } from "./gradeHelp";

const TODAY = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
});

export default function GradeEntry({
  course,
  record,
  canEdit,
  lockReason,
  currentUser,
  onSave,
}) {
  const [rows, setRows] = useState(record.rows);
  const [generalNotes, setGeneralNotes] = useState(record.generalNotes);
  const [openNote, setOpenNote] = useState(null);
  const [message, setMessage] = useState(null);
  const [fieldHelp, setFieldHelp] = useState("");

  const savedById = useMemo(
    () => Object.fromEntries(record.rows.map((r) => [r.id, r])),
    [record.rows],
  );
  const isChanged = (row) =>
    savedById[row.id].grade !== row.grade ||
    savedById[row.id].note !== row.note;

  const dirty = rows.some(isChanged) || generalNotes !== record.generalNotes;
  const gradedCount = rows.filter((r) => r.grade).length;
  const missing = rows.filter((r) => !r.grade);
  const showMissing = message?.kind === "error";
  const fieldHelpId = `grade-field-help-${course.id.replace(/\s+/g, "-")}`;

  function updateRow(id, patch) {
    setMessage(null);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function stamp(nextRows) {
    return nextRows.map((r) => {
      if (savedById[r.id].grade === r.grade) return r;
      return {
        ...r,
        updatedOn: TODAY,
        updatedBy: currentUser.name,
        override: currentUser.employeeId !== course.instructorId,
      };
    });
  }

  function handleCancel() {
    setRows(record.rows);
    setGeneralNotes(record.generalNotes);
    setOpenNote(null);
    setMessage(null);
  }

  function handleSaveDraft() {
    const next = stamp(rows);
    setRows(next);
    onSave({ ...record, rows: next, generalNotes });
    setMessage({ kind: "success", text: "Draft saved." });
  }

  function handleSubmit() {
    if (missing.length > 0) {
      const who =
        missing.length === 1
          ? "1 student has"
          : `${missing.length} students have`;
      setMessage({
        kind: "error",
        text: "Grades can't be submitted yet.",
        details: `${who} no grade. Enter a grade for every student (a letter grade, CR/NC or AU, depending on how they registered), then submit again.`,
      });
      return;
    }
    const next = stamp(rows);
    setRows(next);
    onSave({ ...record, rows: next, generalNotes, status: "Submitted" });
    setMessage({ kind: "success", text: "Final grades submitted." });
  }

  return (
    <section aria-labelledby={`entry-${course.id}`}>
      <div className="gr-entry-head">
        <div>
          <h2 id={`entry-${course.id}`} className="gr-h2">
            {course.id} · {course.title}
          </h2>
          <p className="gr-muted">
            Section {course.section} · {course.meets} · {course.units}{" "}
            {course.units === 1 ? "unit" : "units"}
          </p>
        </div>
        <div className="gr-progress">
          <p>
            <strong>{gradedCount}</strong> of {rows.length} graded
          </p>
          <div
            className="gr-meter"
            role="img"
            aria-label={`${gradedCount} of ${rows.length} students graded`}
          >
            <span style={{ width: `${(gradedCount / rows.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {!canEdit && (
        <div className="gr-banner gr-banner-info" role="status">
          <Icon name="info" />
          <p>{lockReason}</p>
        </div>
      )}

      {message && (
        <div
          className={`gr-banner gr-banner-${message.kind}`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          <Icon name={message.kind === "error" ? "warn" : "check"} />
          <div>
            <p className="gr-banner-title">{message.text}</p>
            {message.details && <p>{message.details}</p>}
          </div>
        </div>
      )}

      <p
        id={fieldHelpId}
        className="gr-field-help"
        role="status"
        aria-live="polite"
      >
        {fieldHelp ||
          "Focus a grade, student note, or course notes field for field-specific help."}
      </p>

      <div className="gr-table-wrap">
        <table className="gr-table">
          <thead>
            <tr>
              <th scope="col">Student ID</th>
              <th scope="col">Name</th>
              <th scope="col">Registered as</th>
              <th scope="col">Grade</th>
              <th scope="col">Note</th>
              <th scope="col">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr className={isChanged(row) ? "is-changed" : ""}>
                  <td className="gr-num">{row.id}</td>
                  <td className="gr-name">{row.name}</td>
                  <td>
                    <span className="gr-chip">{row.regType}</span>
                  </td>
                  <td>
                    <select
                      className={`gr-select${showMissing && !row.grade ? " is-missing" : ""}`}
                      aria-label={`Grade for ${row.name}`}
                      aria-describedby={fieldHelpId}
                      value={row.grade}
                      disabled={!canEdit}
                      onFocus={() =>
                        setFieldHelp(GRADE_FIELD_HELP.grade(row.regType))
                      }
                      onChange={(e) =>
                        updateRow(row.id, { grade: e.target.value })
                      }
                    >
                      <option value="">Select</option>
                      {GRADE_OPTIONS[row.regType].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="gr-note-btn"
                      aria-expanded={openNote === row.id}
                      onClick={() =>
                        setOpenNote(openNote === row.id ? null : row.id)
                      }
                    >
                      <Icon name="note" size={14} />
                      {row.note ? "View note" : "Add note"}
                    </button>
                  </td>
                  <td className="gr-updated">
                    {row.updatedOn ? (
                      <>
                        <span>{row.updatedOn}</span>
                        <span className="gr-muted"> · {row.updatedBy}</span>
                        {row.override && (
                          <span className="gr-chip gr-chip-warn">
                            Not the instructor
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="gr-muted">—</span>
                    )}
                  </td>
                </tr>
                {openNote === row.id && (
                  <tr className="gr-note-row">
                    <td colSpan={6}>
                      <label htmlFor={`note-${course.id}-${row.id}`}>
                        Note for {row.name}
                      </label>
                      <textarea
                        id={`note-${course.id}-${row.id}`}
                        className="gr-textarea"
                        aria-describedby={fieldHelpId}
                        value={row.note}
                        maxLength={500}
                        disabled={!canEdit}
                        placeholder="Add a note about this grade"
                        onFocus={() =>
                          setFieldHelp(GRADE_FIELD_HELP.studentNote)
                        }
                        onChange={(e) =>
                          updateRow(row.id, { note: e.target.value })
                        }
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gr-general">
        <label htmlFor={`general-${course.id}`}>Course notes</label>
        <p className="gr-muted">
          Comments about the whole course, not tied to one student.
        </p>
        <textarea
          id={`general-${course.id}`}
          className="gr-textarea"
          aria-describedby={fieldHelpId}
          value={generalNotes}
          maxLength={1000}
          disabled={!canEdit}
          placeholder="Add a note about the course"
          onFocus={() => setFieldHelp(GRADE_FIELD_HELP.courseNotes)}
          onChange={(e) => {
            setMessage(null);
            setGeneralNotes(e.target.value);
          }}
        />
      </div>

      <div className="gr-actions">
        <p className="gr-muted" aria-live="polite">
          {dirty ? "You have unsaved changes." : "All changes saved."}
        </p>
        <div className="gr-actions-buttons">
          <button
            type="button"
            className="gr-btn gr-btn-quiet"
            disabled={!canEdit || !dirty}
            onClick={handleCancel}
          >
            Cancel changes
          </button>
          <button
            type="button"
            className="gr-btn gr-btn-outline"
            disabled={!canEdit || !dirty}
            onClick={handleSaveDraft}
          >
            Save draft
          </button>
          <button
            type="button"
            className="gr-btn gr-btn-primary"
            disabled={!canEdit}
            onClick={handleSubmit}
          >
            Submit final grades
          </button>
        </div>
      </div>
    </section>
  );
}
