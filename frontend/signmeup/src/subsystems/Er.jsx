import { useEffect, useState } from "react";
import { calculateGpa, studentById } from "../data.js";
import { Button, EmptyState, Field, Info, Panel } from "../shared.jsx";

export function RecordsPage({
  state,
  role,
  activeStudentId,
  onUpdate,
  onAddNote,
}) {
  const selectable =
    role === "student"
      ? state.students.filter((student) => student.id === activeStudentId)
      : state.students;
  const [studentId, setStudentId] = useState(activeStudentId);
  const student = studentById(state, studentId);
  const canEdit = role === "admin" || role === "advisor";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(student ?? {});
  const [note, setNote] = useState("");

  const [showReport, setShowReport] = useState(false);
  const [includeCourseDetails, setIncludeCourseDetails] = useState(true);
  const [courseScope, setCourseScope] = useState("all");

  useEffect(() => {
    setDraft(student ?? {});
    setEditing(false);
  }, [studentId, state.students]);
  if (!student)
    return (
      <Panel title="Student records" eyebrow="ER subsystem">
        <EmptyState title="Student record required">
          This function cannot continue until the required student information
          exists.
        </EmptyState>
      </Panel>
    );
  function save() {
    if (!draft.name?.trim() || !draft.major?.trim()) return;
    onUpdate(student.id, {
      name: draft.name,
      telephone: draft.telephone,
      address: draft.address,
      dateOfBirth: draft.dateOfBirth,
      major: draft.major,
      minor: draft.minor,
      graduateAccepted: draft.graduateAccepted,
    });
    setEditing(false);
  }
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">ER subsystem</p>
          <h2>Electronic student records</h2>
          <p className="muted">
            General student information, course completion, transfer credit,
            current enrollment, GPA, and append-only notes.
          </p>
        </div>
        {role !== "student" && (
          <label className="inline-select">
            Student{" "}
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              {selectable.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} ({item.id})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="record-layout">
        <div className="wide-column">
          <Panel
            title={student.name}
            eyebrow={`Student ID ${student.id}`}
            actions={
              <>
                <Button variant="secondary" onClick={() => setShowReport(true)}>
                  Generate report
                </Button>
                {canEdit && (
                  <Button
                    variant={editing ? "ghost" : "primary"}
                    onClick={() => setEditing((value) => !value)}
                  >
                    {editing ? "Cancel edit" : "Edit record"}
                  </Button>
                )}
              </>
            }
          >
            {editing ? (
              <div className="form-grid">
                <Field label="Student name" required>
                  <input
                    value={draft.name ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Telephone">
                  <input
                    value={draft.telephone ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, telephone: event.target.value })
                    }
                  />
                </Field>
                <Field label="Address">
                  <input
                    value={draft.address ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, address: event.target.value })
                    }
                  />
                </Field>
                <Field label="Date of birth" required>
                  <input
                    type="date"
                    value={draft.dateOfBirth ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, dateOfBirth: event.target.value })
                    }
                  />
                </Field>
                <Field label="Major" required>
                  <input
                    value={draft.major ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, major: event.target.value })
                    }
                  />
                </Field>
                <Field label="Minor">
                  <input
                    value={draft.minor ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, minor: event.target.value })
                    }
                  />
                </Field>
                <label className="check-label full-span">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.graduateAccepted)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        graduateAccepted: event.target.checked,
                      })
                    }
                  />{" "}
                  Accepted into graduate program
                </label>
                <div className="full-span">
                  <Button onClick={save}>Save record</Button>
                </div>
              </div>
            ) : (
              <div className="record-summary">
                <Info label="Student ID" value={student.id} />
                <Info
                  label="Telephone"
                  value={student.telephone || "Not provided"}
                />
                <Info
                  label="Address"
                  value={student.address || "Not provided"}
                />
                <Info
                  label="Date of birth"
                  value={student.dateOfBirth || "Not provided"}
                />
                <Info label="Major" value={student.major || "Not provided"} />
                <Info label="Minor" value={student.minor || "Not provided"} />
                <Info label="GPA" value={calculateGpa(student)} />
                <Info
                  label="Graduate status"
                  value={student.graduateAccepted ? "Accepted" : "Not accepted"}
                />
              </div>
            )}
          </Panel>
          <Panel
            title="Course history"
            eyebrow="Current university and transfer credit"
          >
            <CourseTable
              title="Completed at this university"
              courses={student.completedCourses}
            />
            <CourseTable
              title="Completed at another university"
              courses={student.transferCourses}
              transfer
            />
          </Panel>
          <Panel title="Current enrollment" eyebrow="Upcoming semester">
            {student.currentEnrollment.length ? (
              <CourseTable courses={student.currentEnrollment} />
            ) : (
              <p className="muted">
                No current courses. Open Course Registration to select one
                course at a time.
              </p>
            )}
          </Panel>
        </div>
        <div className="side-column">
          <Panel
            title="Protected notes"
            eyebrow="Chronological and append-only"
          >
            {["faculty", "advisor", "admin"].includes(role) && (
              <div className="note-form">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a formal student note"
                  aria-label="Student note"
                />

                <Button
                  disabled={!note.trim()}
                  onClick={() => {
                    onAddNote(student.id, note.trim());
                    setNote("");
                  }}
                >
                  Add note
                </Button>
              </div>
            )}

            {role === "student" && (
              <p className="muted small">
                You can view protected notes posted by authorized campus
                employees, but you cannot add or modify notes.
              </p>
            )}

            {/* Display saved notes to all roles */}
            <div className="notes-list">
              {student.notes && student.notes.length > 0 ? (
                [...student.notes]
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((savedNote) => (
                    <div className="note-item" key={savedNote.id}>
                      <p>{savedNote.text}</p>

                      <span className="muted small">
                        Posted by Employee {savedNote.employeeId} ·{" "}
                        {new Date(savedNote.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="muted small">No protected notes available.</p>
              )}
            </div>
            <p className="panel-footnote">
              Notes cannot be deleted. Each entry records the time and employee
              ID.
            </p>
          </Panel>
        </div>
      </div>

      {showReport && (
        <div className="report-preview-overlay">
          <div className="report-preview-window">
            <div className="report-toolbar">
              <div>
                <p className="eyebrow">ER subsystem</p>
                <h2>Student Record Report</h2>
                <p className="muted small">
                  Configure and review the report before printing.
                </p>
              </div>

              <Button variant="ghost" onClick={() => setShowReport(false)}>
                Close
              </Button>
            </div>

            <div className="report-options">
              <h3>Report options</h3>

              <label className="check-label">
                <input
                  type="checkbox"
                  checked={includeCourseDetails}
                  onChange={(event) =>
                    setIncludeCourseDetails(event.target.checked)
                  }
                />
                Include detailed course information
              </label>

              {includeCourseDetails && (
                <div className="report-scope-options">
                  <label className="check-label">
                    <input
                      type="radio"
                      name="courseScope"
                      value="current"
                      checked={courseScope === "current"}
                      onChange={() => setCourseScope("current")}
                    />
                    Current university courses only
                  </label>

                  <label className="check-label">
                    <input
                      type="radio"
                      name="courseScope"
                      value="all"
                      checked={courseScope === "all"}
                      onChange={() => setCourseScope("all")}
                    />
                    All universities, including transfer courses
                  </label>
                </div>
              )}
            </div>

            <div className="report-document">
              <div className="report-header">
                <h1>Student Record Report</h1>
                <p>SignMeUp Student Information System</p>
                <p>Generated: {new Date().toLocaleString()}</p>
              </div>

              <section className="report-section">
                <h2>Student Information</h2>

                <div className="record-summary">
                  <Info label="Student ID" value={student.id} />
                  <Info label="Name" value={student.name} />
                  <Info
                    label="Telephone"
                    value={student.telephone || "Not provided"}
                  />
                  <Info
                    label="Address"
                    value={student.address || "Not provided"}
                  />
                  <Info
                    label="Date of Birth"
                    value={student.dateOfBirth || "Not provided"}
                  />
                  <Info label="Major" value={student.major || "Not provided"} />
                  <Info label="Minor" value={student.minor || "Not provided"} />
                  <Info
                    label="Graduate Status"
                    value={
                      student.graduateAccepted ? "Accepted" : "Not accepted"
                    }
                  />
                  <Info label="Overall GPA" value={calculateGpa(student)} />
                </div>
              </section>

              {includeCourseDetails && (
                <section className="report-section">
                  <h2>Course Information</h2>

                  <CourseTable
                    title="Completed at this university"
                    courses={student.completedCourses}
                  />

                  {courseScope === "all" && (
                    <CourseTable
                      title="Completed at another university"
                      courses={student.transferCourses}
                      transfer
                    />
                  )}

                  <CourseTable
                    title="Current Enrollment"
                    courses={student.currentEnrollment}
                  />
                </section>
              )}

              <section className="report-section">
                <h2>Protected Notes</h2>

                {student.notes?.length > 0 ? (
                  [...student.notes]
                    .sort(
                      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
                    )
                    .map((savedNote) => (
                      <div className="report-note" key={savedNote.id}>
                        <p>{savedNote.text}</p>
                        <span>
                          Employee ID: {savedNote.employeeId} ·{" "}
                          {new Date(savedNote.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                ) : (
                  <p>No protected notes available.</p>
                )}
              </section>
            </div>

            <div className="report-preview-actions">
              <Button variant="secondary" onClick={() => setShowReport(false)}>
                Close Preview
              </Button>

              <Button onClick={() => window.print()}>Print Report</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CourseTable({ title, courses = [], transfer = false }) {
  return (
    <div className="course-table-block">
      <h3>{title}</h3>
      {courses.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Title</th>
                <th>Semester</th>
                <th>Units</th>
                <th>Grade</th>
                {transfer && <th>University</th>}
              </tr>
            </thead>
            <tbody>
              {courses.map((item, index) => (
                <tr key={`${item.courseId}-${index}`}>
                  <td>
                    <strong>{item.courseId}</strong>
                  </td>
                  <td>{item.title}</td>
                  <td>{item.semester || "Fall 2026"}</td>
                  <td>{item.units}</td>
                  <td>{item.grade || "—"}</td>
                  {transfer && (
                    <td>
                      {item.university} · {item.location}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted small">No course entries.</p>
      )}
    </div>
  );
}
