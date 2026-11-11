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

  const [reportType, setReportType] = useState("schedule");
  const [reportDepartment, setReportDepartment] = useState("all");
  const [reportStudentId, setReportStudentId] = useState(activeStudentId);
  const [generatedReport, setGeneratedReport] = useState(null);

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

  function generateReport() {
    let report;

    if (reportType === "schedule") {
      const selectedStudent = studentById(
        state,
        role === "student" ? activeStudentId : reportStudentId,
      );
      if (!selectedStudent) return;

      const enrolledCourses = selectedStudent.currentEnrollment.map((item) => {
        const course = courseById(state, item.courseId);

        return {
          ...item,
          description: course?.description || "No description available.",
          department: course?.department || "N/A",
        };
      });

      report = {
        title: "Student Schedule Report",
        subtitle: `${selectedStudent.name} (${selectedStudent.id})`,
        courses: enrolledCourses,
        type: "schedule",
      };
    }

    if (reportType === "department") {
      const departmentCourses = state.courses.filter(
        (course) =>
          reportDepartment === "all" || course.department === reportDepartment,
      );

      report = {
        title: "Department Course Listing",
        subtitle:
          reportDepartment === "all"
            ? "All Departments"
            : `Department: ${reportDepartment}`,
        courses: departmentCourses,
        type: "department",
      };
    }

    if (reportType === "available") {
      const availableCourses = state.courses.filter(
        (course) =>
          course.seats > 0 &&
          (reportDepartment === "all" ||
            course.department === reportDepartment),
      );

      report = {
        title: "Available Courses Report",
        subtitle:
          reportDepartment === "all"
            ? "All Departments"
            : `Department: ${reportDepartment}`,
        courses: availableCourses,
        type: "available",
      };
    }

    report.generatedAt = new Date().toLocaleString();
    setGeneratedReport(report);
  }

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

      <Panel title="Schedule Reports" eyebrow="REG report generation">
        <div className="form-grid">
          <label className="form-field">
            <span>Report type</span>
            <select
              value={reportType}
              onChange={(event) => {
                setReportType(event.target.value);
                setGeneratedReport(null);
              }}
            >
              <option value="schedule">Student Schedule</option>
              <option value="department">Department Course Listing</option>
              <option value="available">Available Courses</option>
            </select>
          </label>

          {reportType === "schedule" && role !== "student" && (
            <label className="form-field">
              <span>Student</span>
              <select
                value={reportStudentId}
                onChange={(event) => {
                  setReportStudentId(event.target.value);
                  setGeneratedReport(null);
                }}
              >
                {state.students.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </option>
                ))}
              </select>
            </label>
          )}

          {(reportType === "department" || reportType === "available") && (
            <label className="form-field">
              <span>Department</span>
              <select
                value={reportDepartment}
                onChange={(event) => {
                  setReportDepartment(event.target.value);
                  setGeneratedReport(null);
                }}
              >
                {reportType === "available" && (
                  <option value="all">All Departments</option>
                )}
                <option value="all" disabled={reportType === "department"}>
                  Select a department
                </option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="full-span">
            <Button
              onClick={generateReport}
              disabled={
                reportType === "department" && reportDepartment === "all"
              }
            >
              Generate Report
            </Button>
          </div>
        </div>
      </Panel>

      {generatedReport && (
        <div className="report-preview-overlay">
          <div className="report-preview-window">
            <div className="report-toolbar">
              <div>
                <p className="eyebrow">REG subsystem</p>
                <h2>{generatedReport.title}</h2>
                <p className="muted small">
                  Configure and review the report before printing.
                </p>
              </div>

              <Button variant="ghost" onClick={() => setGeneratedReport(null)}>
                Close
              </Button>
            </div>

            <div className="report-document">
              <div className="report-header">
                <h1>{generatedReport.title}</h1>
                <p>SignMeUp Student Information System</p>
                <p>{generatedReport.subtitle}</p>
                <p>Generated: {generatedReport.generatedAt}</p>
              </div>

              <section className="report-section">
                <h2>Course Information</h2>

                {generatedReport.courses.length > 0 ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Course ID</th>
                          <th>Course Title</th>

                          {generatedReport.type === "schedule" && (
                            <th>Description</th>
                          )}

                          {generatedReport.type !== "schedule" && (
                            <>
                              <th>Department</th>
                              <th>Description</th>
                              <th>Prerequisites</th>
                            </>
                          )}

                          <th>Units</th>
                          <th>Schedule</th>

                          {generatedReport.type === "available" && (
                            <th>Available Seats</th>
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {generatedReport.courses.map((course, index) => (
                          <tr key={`${course.id || course.courseId}-${index}`}>
                            <td>{course.id || course.courseId}</td>
                            <td>{course.title}</td>

                            {generatedReport.type === "schedule" && (
                              <td>{course.description}</td>
                            )}

                            {generatedReport.type !== "schedule" && (
                              <>
                                <td>{course.department}</td>
                                <td>{course.description}</td>
                                <td>
                                  {course.prerequisites?.join(", ") || "None"}
                                </td>
                              </>
                            )}

                            <td>{course.units}</td>
                            <td>{course.schedule || "Not specified"}</td>

                            {generatedReport.type === "available" && (
                              <td>{course.seats}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No courses available for this report.</p>
                )}
              </section>
            </div>

            <div className="report-preview-actions">
              <Button
                variant="secondary"
                onClick={() => setGeneratedReport(null)}
              >
                Close Preview
              </Button>

              <Button onClick={() => window.print()}>Print Report</Button>
            </div>
          </div>
        </div>
      )}

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
