import { useEffect, useState } from "react";
import { courseById, studentById } from "../data.js";
import { Button, EmptyState, Panel, Status } from "../shared.jsx";
import { dateTime } from "../utils.js";

export function GradesPage({
  state,
  role,
  currentUser,
  onSaveGrade,
  onUpdateComment,
}) {
  const available = state.courses.filter(
    (course) => role === "admin" || course.instructorId === currentUser.id,
  );
  const [courseId, setCourseId] = useState(available[0]?.id ?? "");
  const [endOfSemester, setEndOfSemester] = useState(true);
  const course = courseById(state, courseId);
  const record = state.grades[courseId] ?? { generalComment: "", students: [] };
  const registered = state.students.filter((student) =>
    student.currentEnrollment.some((item) => item.courseId === courseId),
  );
  const rows = [...record.students];
  registered.forEach((student) => {
    if (!rows.some((row) => row.studentId === student.id))
      rows.push({
        studentId: student.id,
        registrationType: "letter",
        grade: "",
        note: "",
      });
  });
  const [comment, setComment] = useState(record.generalComment ?? "");
  useEffect(
    () => setComment(record.generalComment ?? ""),
    [courseId, record.generalComment],
  );
  if (!course)
    return (
      <Panel title="Course grades" eyebrow="GRADE subsystem">
        <EmptyState title="No grade courses available">
          A faculty member must be assigned as the primary instructor, or an
          administrator must select a course.
        </EmptyState>
      </Panel>
    );
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">GRADE subsystem</p>
          <h2>Maintain course grades</h2>
          <p className="muted">
            Enter valid letter, credit/no credit, or audit grades, and keep
            notes on updates.
          </p>
        </div>
        <div className="legend">
          <label className="check-label">
            <input
              type="checkbox"
              checked={endOfSemester}
              onChange={(event) => setEndOfSemester(event.target.checked)}
            />{" "}
            End-of-semester period
          </label>
          <Button variant="secondary" onClick={() => window.print()}>
            Print grade sheet
          </Button>
        </div>
      </div>
      <Panel title="Course selection" eyebrow="Primary instructor access">
        <div className="filter-row">
          <label className="inline-select">
            Course{" "}
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              {available.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.id} · {item.title}
                </option>
              ))}
            </select>
          </label>
          <Status tone="info">
            {course.department} · {course.schedule} · {course.units} units
          </Status>
        </div>
      </Panel>
      <Panel
        title="Student grade sheet"
        eyebrow={`${course.id} · ${course.instructor}`}
      >
        <div className="table-wrap">
          <table className="grades-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Registration type</th>
                <th>Grade</th>
                <th>Student note</th>
                <th>Last update</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <GradeRow
                  key={row.studentId}
                  row={row}
                  student={studentById(state, row.studentId)}
                  onSave={(updated) =>
                    onSaveGrade(course.id, { ...updated, endOfSemester })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <EmptyState title="No enrolled students">
            Students registered for this course will appear here.
          </EmptyState>
        )}
      </Panel>
      <div className="two-column-layout">
        <Panel
          title="General course comment"
          eyebrow="Not linked to a specific student"
        >
          <textarea
            className="large-textarea"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Enter a general course note"
          />
          <Button onClick={() => onUpdateComment(course.id, comment)}>
            Save comment
          </Button>
        </Panel>
        <Panel title="Grade access rules" eyebrow="CG04">
          <ul className="rule-list">
            <li>Normal faculty updates are allowed at the end of semester.</li>
            <li>Administrators have special update privileges.</li>
            <li>Every update stores the updater and timestamp.</li>
            <li>
              Student-specific notes stay separate from the general comment.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function GradeRow({ row, student, onSave }) {
  const [draft, setDraft] = useState(row);
  useEffect(
    () => setDraft(row),
    [row.studentId, row.grade, row.note, row.registrationType],
  );
  const grades =
    draft.registrationType === "letter"
      ? ["", "A", "B", "C", "D", "F"]
      : draft.registrationType === "credit/no credit"
        ? ["", "CR", "NC"]
        : ["", "AU"];
  return (
    <tr>
      <td>
        <strong>{student?.name ?? draft.studentId}</strong>
        <small>{draft.studentId}</small>
      </td>
      <td>
        <select
          value={draft.registrationType}
          onChange={(event) =>
            setDraft({
              ...draft,
              registrationType: event.target.value,
              grade: "",
            })
          }
        >
          <option>letter</option>
          <option>credit/no credit</option>
          <option>audit</option>
        </select>
      </td>
      <td>
        <select
          value={draft.grade}
          onChange={(event) =>
            setDraft({ ...draft, grade: event.target.value })
          }
        >
          {grades.map((grade) => (
            <option value={grade} key={grade}>
              {grade || "Select"}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          value={draft.note ?? ""}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          placeholder="Optional note"
        />
      </td>
      <td>
        <small>
          {draft.updatedAt ? dateTime(draft.updatedAt) : "Not entered"}
          <br />
          {draft.updatedBy || "—"}
        </small>
      </td>
      <td>
        <Button size="sm" disabled={!draft.grade} onClick={() => onSave(draft)}>
          Save
        </Button>
      </td>
    </tr>
  );
}
