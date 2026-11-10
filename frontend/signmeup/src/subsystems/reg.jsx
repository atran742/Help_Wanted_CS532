import { useState } from "react";
import { checkEligibility, studentById } from "../data.js";
import { Button, EmptyState, Panel, Status } from "../shared.jsx";

export function RegistrationPage({
  state,
  role,
  activeStudentId,
  onRegister,
  onDrop,
}) {
  const [studentId, setStudentId] = useState(activeStudentId);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [outlineOnly, setOutlineOnly] = useState(false);
  const student = studentById(state, studentId);
  const departments = [
    ...new Set(state.courses.map((course) => course.department)),
  ];
  const courses = state.courses.filter((course) => {
    const matchesQuery = `${course.id} ${course.title} ${course.description}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesDepartment =
      department === "all" || course.department === department;
    const result = checkEligibility(state, studentId, course.id, {
      requireOutline: outlineOnly,
    });
    return (
      matchesQuery && matchesDepartment && (!eligibleOnly || result.eligible)
    );
  });
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">REG subsystem</p>
          <h2>Build an upcoming schedule</h2>
          <p className="muted">
            Courses are checked one at a time against prerequisites, seats,
            major/minor rules, approved outlines, conflicts, and the 18-credit
            limit.
          </p>
        </div>
        <div className="legend">
          <Status tone="success">Eligible</Status>
          <Status tone="error">Needs attention</Status>
        </div>
      </div>
      <div className="two-column-layout">
        <div className="wide-column">
          <Panel
            title="Course offerings"
            eyebrow="Fall 2026"
            actions={
              role !== "student" && (
                <label className="inline-select">
                  Student{" "}
                  <select
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                  >
                    {state.students.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.id})
                      </option>
                    ))}
                  </select>
                </label>
              )
            }
          >
            <div className="filter-row">
              <label className="search-input">
                <span>⌕</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search course ID or title"
                />
              </label>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option value="all">All departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(event) => setEligibleOnly(event.target.checked)}
                />{" "}
                Eligible only
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={outlineOnly}
                  onChange={(event) => setOutlineOnly(event.target.checked)}
                />{" "}
                Approved outline
              </label>
            </div>
            <div className="course-list">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  eligibility={checkEligibility(state, studentId, course.id, {
                    requireOutline: outlineOnly,
                  })}
                  onRegister={() => onRegister(studentId, course.id)}
                />
              ))}
              {courses.length === 0 && (
                <EmptyState title="No matching offerings">
                  Try a different search or filter.
                </EmptyState>
              )}
            </div>
          </Panel>
        </div>
        <div className="side-column">
          <Panel
            title="Current schedule"
            eyebrow={
              student
                ? `${student.name} · ${student.id}`
                : "Student record required"
            }
            actions={
              student && (
                <Status tone="info">
                  {student.currentEnrollment.reduce(
                    (sum, item) => sum + item.units,
                    0,
                  )}{" "}
                  / 18 credits
                </Status>
              )
            }
          >
            {!student ? (
              <EmptyState title="Student record required">
                A student record must exist before registration can begin.
              </EmptyState>
            ) : student.currentEnrollment.length === 0 ? (
              <EmptyState title="Schedule is empty">
                Select an eligible offering to register one course at a time.
              </EmptyState>
            ) : (
              <div className="schedule-list">
                {student.currentEnrollment.map((item) => (
                  <div className="schedule-row" key={item.courseId}>
                    <div>
                      <strong>{item.courseId}</strong>
                      <span>{item.title}</span>
                      <small>
                        {item.schedule} · {item.units} units
                      </small>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDrop(student.id, item.courseId)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Eligibility rules" eyebrow="How registration works">
            <ul className="rule-list">
              <li>Prerequisites must be completed.</li>
              <li>Upper-division courses must match the major or minor.</li>
              <li>Graduate courses require graduate acceptance.</li>
              <li>Approved-outline mode requires an approved course entry.</li>
              <li>Seats, conflicts, and the 18-credit cap are checked.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, eligibility, onRegister }) {
  return (
    <article className="course-card">
      <div className="course-card-main">
        <div className="course-title-row">
          <span className="course-code">{course.id}</span>
          <Status tone={eligibility.eligible ? "success" : "error"}>
            {eligibility.eligible ? "Eligible" : "Review rules"}
          </Status>
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span>
            {course.department} · {course.units} units
          </span>
          <span>{course.schedule}</span>
          <span>{course.seats} seats left</span>
        </div>
        {!eligibility.eligible && (
          <details className="eligibility-details">
            <summary>Why registration is blocked</summary>
            <ul>
              {eligibility.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <Button disabled={!eligibility.eligible} onClick={onRegister}>
        {eligibility.eligible ? "Register" : "Unavailable"}
      </Button>
    </article>
  );
}
