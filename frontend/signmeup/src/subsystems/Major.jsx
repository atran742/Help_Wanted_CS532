import { useState } from "react";
import { courseById, studentById } from "../data.js";
import { Button, EmptyState, Info, Panel, Status } from "../shared.jsx";

export function MajorsPage({
  state,
  role,
  activeStudentId,
  currentUser,
  onUpdateOutline,
}) {
  const [activeTab, setActiveTab] = useState("catalog");
  const [majorId, setMajorId] = useState(state.majors[0]?.id ?? "");
  const [studentId, setStudentId] = useState(activeStudentId ?? "");
  const [reportType, setReportType] = useState("required");

  const selectedMajor = state.majors.find((major) => major.id === majorId);

  const selectedStudent = studentById(state, studentId);
  const outline = state.outlines[studentId];

  const outlineMajor = state.majors.find(
    (major) => major.id === outline?.majorId,
  );

  const isAdmin = role === "admin";
  const isAdvisor = role === "advisor";
  const isStudent = role === "student";

  // Advisors can see students whose major lists them as an advisor.
  const selectableStudents = isStudent
    ? state.students.filter((student) => student.id === activeStudentId)
    : isAdmin
      ? state.students
      : state.students.filter((student) => {
          const studentOutline = state.outlines[student.id];
          const major = state.majors.find(
            (item) => item.id === (studentOutline?.majorId || student.major),
          );

          return major?.advisors.includes(currentUser.id);
        });

  const canEditOutline = isAdmin || isAdvisor;

  const canViewStudentReport =
    isAdmin ||
    (isStudent && studentId === activeStudentId) ||
    (isAdvisor && outlineMajor?.advisors.includes(currentUser.id));

  const requiredCourses = selectedMajor
    ? selectedMajor.requiredCourses.map((id) => courseById(state, id))
    : [];

  const electiveCourses = selectedMajor
    ? selectedMajor.electiveCourses.map((id) => courseById(state, id))
    : [];

  const completedRequiredCourses =
    selectedMajor && selectedStudent
      ? selectedStudent.completedCourses.filter((course) =>
          selectedMajor.requiredCourses.includes(course.courseId),
        )
      : [];

  const outlineEntries = outline?.entries ?? [];

  const history = outline?.history ?? [];

  function courseName(courseId) {
    return courseById(state, courseId)?.title ?? "Course not in catalog";
  }

  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">MAJOR</p>
          <h2>Major Course Requirements</h2>
          <p className="muted">
            View academic major requirements, maintain student outlines, and
            generate major progress reports.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="filter-row">
        <Button
          variant={activeTab === "catalog" ? "primary" : "secondary"}
          onClick={() => setActiveTab("catalog")}
        >
          Major Catalog
        </Button>

        <Button
          variant={activeTab === "outlines" ? "primary" : "secondary"}
          onClick={() => setActiveTab("outlines")}
        >
          Student Outlines
        </Button>

        <Button
          variant={activeTab === "reports" ? "primary" : "secondary"}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </Button>
      </div>

      {/* Student Major Outlines */}

      {activeTab === "catalog" && (
        <div className="page-stack">
          <Panel title="Academic Major Catalog" eyebrow="MA01">
            <p className="muted">
              View the required courses, electives, units, and advisors for each
              academic major.
            </p>

            <label
              className="inline-select"
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                width: "fit-content",
              }}
            >
              Select Major
              <select
                style={{ width: "280px", maxWidth: "100%" }}
                value={majorId}
                onChange={(event) => setMajorId(event.target.value)}
              >
                {state.majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.title} ({major.id})
                  </option>
                ))}
              </select>
            </label>

            {selectedMajor && (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <div className="record-summary">
                    <Info label="Major ID" value={selectedMajor.id} />
                    <Info label="Major Title" value={selectedMajor.title} />
                    <Info label="Department" value={selectedMajor.department} />
                    <Info
                      label="Required Units"
                      value={selectedMajor.requiredUnits}
                    />
                  </div>
                </div>

                <div className="course-table-block">
                  <h3>Required Courses</h3>

                  {requiredCourses.length > 0 ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Course ID</th>
                            <th>Course Title</th>
                            <th>Units</th>
                          </tr>
                        </thead>

                        <tbody>
                          {requiredCourses.map((course, index) => (
                            <tr key={`${selectedMajor.id}-${index}`}>
                              <td>{selectedMajor.requiredCourses[index]}</td>
                              <td>{course?.title ?? "Course not found"}</td>
                              <td>{course?.units ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState title="No required courses">
                      No required courses are currently listed for this major.
                    </EmptyState>
                  )}
                </div>

                <div className="course-table-block">
                  <h3>Elective Courses</h3>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Course ID</th>
                          <th>Course Title</th>
                          <th>Units</th>
                        </tr>
                      </thead>

                      <tbody>
                        {electiveCourses.map((course, index) => (
                          <tr key={`${selectedMajor.id}-elective-${index}`}>
                            <td>{selectedMajor.electiveCourses[index]}</td>
                            <td>{course?.title ?? "Course not found"}</td>
                            <td>{course?.units ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="course-table-block">
                  <h3>Major Advisors</h3>

                  {selectedMajor.advisors.map((advisorId) => {
                    const advisor = state.faculty.find(
                      (item) => item.id === advisorId,
                    );

                    return <p key={advisorId}>{advisor?.name ?? advisorId}</p>;
                  })}
                </div>

                <Button variant="secondary" onClick={() => window.print()}>
                  Print Major Requirements
                </Button>
              </>
            )}
          </Panel>
        </div>
      )}

      {/* Student Major Outlines */}

      {activeTab === "outlines" && (
        <div className="page-stack">
          <Panel title="Student Major Outlines" eyebrow="MA02">
            <label
              className="inline-select"
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                width: "fit-content",
              }}
            >
              Select Student
              <select
                style={{ width: "280px", maxWidth: "100%" }}
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              >
                {selectableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </select>
            </label>

            {!selectedStudent || !outline || !outlineMajor ? (
              <EmptyState title="No approved outline">
                This student does not currently have a major outline.
              </EmptyState>
            ) : (
              <>
                <div className="record-summary">
                  <Info label="Student" value={selectedStudent.name} />
                  <Info label="Major" value={outlineMajor.title} />
                  <Info
                    label="Approved By"
                    value={
                      state.faculty.find(
                        (item) => item.id === outline.approvedBy,
                      )?.name ?? outline.approvedBy
                    }
                  />
                  <Info label="Last Approved" value={outline.lastApproved} />
                </div>

                <div className="outline-list">
                  <h3>Selected Major Courses</h3>

                  {outlineEntries.map((entry) => (
                    <div className="outline-row" key={entry.courseId}>
                      <div>
                        <strong>{entry.courseId}</strong>
                        <span>{courseName(entry.courseId)}</span>
                        <small>Status date: {entry.statusDate}</small>
                      </div>

                      {canEditOutline ? (
                        <select
                          value={entry.status}
                          onChange={(event) =>
                            onUpdateOutline(studentId, "status", {
                              courseId: entry.courseId,
                              status: event.target.value,
                            })
                          }
                        >
                          <option value="approved">Approved</option>
                          <option value="dropped">Dropped</option>
                          <option value="waived">Waived</option>
                        </select>
                      ) : (
                        <Status
                          tone={
                            entry.status === "approved" ? "success" : "warning"
                          }
                        >
                          {entry.status}
                        </Status>
                      )}
                    </div>
                  ))}
                </div>

                {canEditOutline && (
                  <>
                    <div className="course-table-block">
                      <h3>Add a Course to the Outline</h3>

                      <select id="add-major-course" defaultValue="">
                        <option value="" disabled>
                          Select a course
                        </option>

                        {[
                          ...outlineMajor.requiredCourses,
                          ...outlineMajor.electiveCourses,
                        ]
                          .filter(
                            (courseId) =>
                              !outlineEntries.some(
                                (entry) => entry.courseId === courseId,
                              ),
                          )
                          .map((courseId) => (
                            <option key={courseId} value={courseId}>
                              {courseId} — {courseName(courseId)}
                            </option>
                          ))}
                      </select>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          const select =
                            document.getElementById("add-major-course");

                          if (!select.value) return;

                          onUpdateOutline(studentId, "add", {
                            courseId: select.value,
                          });

                          select.value = "";
                        }}
                      >
                        Add Course
                      </Button>
                    </div>

                    <Button
                      onClick={() => onUpdateOutline(studentId, "approve")}
                    >
                      Approve Major Outline
                    </Button>
                  </>
                )}
              </>
            )}
          </Panel>
        </div>
      )}

      {/* Major Reports */}

      {activeTab === "reports" && (
        <div className="page-stack">
          <Panel title="Major Requirements Reports" eyebrow="MA03">
            <label
              className="inline-select"
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                width: "fit-content",
              }}
            >
              Select Report
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                <option value="required">Required Courses by Major</option>
                <option value="completed">Completed Required Courses</option>
                <option value="status">Student Outline Status</option>
                <option value="history">Outline Change History</option>
              </select>
            </label>

            {(reportType === "required" ||
              reportType === "completed" ||
              reportType === "status" ||
              reportType === "history") && (
              <label
                className="inline-select"
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  width: "fit-content",
                }}
              >
                Select Major
                <select
                  value={majorId}
                  onChange={(event) => setMajorId(event.target.value)}
                >
                  {state.majors.map((major) => (
                    <option key={major.id} value={major.id}>
                      {major.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reportType !== "required" && (
              <label
                className="inline-select"
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "20px",
                  width: "fit-content",
                }}
              >
                Select Student
                <select
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  {selectableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {reportType === "required" && selectedMajor && (
              <>
                <h3>Required Courses — {selectedMajor.title}</h3>
                <ul>
                  {selectedMajor.requiredCourses.map((courseId) => (
                    <li key={courseId}>
                      {courseId} — {courseName(courseId)}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {reportType !== "required" && !canViewStudentReport && (
              <EmptyState title="Access restricted">
                You are not authorized to view this student's private major
                report.
              </EmptyState>
            )}

            {reportType === "completed" &&
              canViewStudentReport &&
              selectedMajor &&
              selectedStudent && (
                <>
                  <h3>Completed Required Courses — {selectedStudent.name}</h3>

                  {completedRequiredCourses.length ? (
                    <ul>
                      {completedRequiredCourses.map((course) => (
                        <li key={course.courseId}>
                          {course.courseId} — {course.title}
                          {" · "}
                          Grade: {course.grade}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No required courses have been completed.</p>
                  )}
                </>
              )}

            {reportType === "status" &&
              canViewStudentReport &&
              selectedStudent &&
              outline && (
                <>
                  <h3>Major Outline Status</h3>

                  {outlineEntries.map((entry) => {
                    const completed = selectedStudent.completedCourses.some(
                      (course) => course.courseId === entry.courseId,
                    );

                    return (
                      <div className="outline-row" key={entry.courseId}>
                        <div>
                          <strong>{entry.courseId}</strong>
                          <span>{courseName(entry.courseId)}</span>
                          <small>
                            Completion:{" "}
                            {completed ? "Completed" : "Not completed"}
                          </small>
                        </div>

                        <Status
                          tone={
                            entry.status === "approved" ? "success" : "warning"
                          }
                        >
                          {entry.status}
                        </Status>
                      </div>
                    );
                  })}
                </>
              )}

            {reportType === "history" && canViewStudentReport && outline && (
              <>
                <h3>Outline Change History</h3>

                {history.length ? (
                  <div className="history-list">
                    {history.map((item, index) => (
                      <div
                        className="history-item"
                        key={`${item.courseId}-${item.changedAt}-${index}`}
                      >
                        <strong>{item.courseId ?? "Entire outline"}</strong>

                        <span>
                          {item.action ?? "status_changed"}: {item.from ?? "—"}{" "}
                          → {item.to ?? "—"}
                        </span>

                        <small>
                          {dateTime(item.changedAt)} · {item.changedBy}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No outline changes have been recorded.</p>
                )}
              </>
            )}

            <Button variant="secondary" onClick={() => window.print()}>
              Print Report
            </Button>
          </Panel>
        </div>
      )}
    </div>
  );
}
