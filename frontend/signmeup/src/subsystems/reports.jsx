import { useState } from "react";
import {
  calculateGpa,
  courseById,
  gradePoints,
  studentById,
} from "../data.js";
import { CourseTable } from "./Er.jsx";
import { Button, EmptyState, Info, Panel } from "../shared.jsx";

export function ReportsPage({ state, role, activeStudentId }) {
  const [type, setType] = useState("student");
  const [studentId, setStudentId] = useState(activeStudentId);
  const [department, setDepartment] = useState("CS");
  const [courseId, setCourseId] = useState(state.courses[0]?.id ?? "");
  const student = studentById(state, studentId);
  const departments = [
    ...new Set(state.courses.map((course) => course.department)),
  ];
  const report =
    type === "student" ? (
      <StudentReport state={state} student={student} />
    ) : type === "course" ? (
      <CourseStatsReport state={state} courseId={courseId} />
    ) : (
      <AggregateStatsReport
        state={state}
        department={type === "department" ? department : null}
      />
    );
  function exportCsv() {
    const text = reportCsv(state, type, { studentId, courseId, department });
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `signmeup-${type}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">Reporting center</p>
          <h2>Preview and print reports</h2>
          <p className="muted">
            Reports remain on the workstation until you choose print or CSV
            export.
          </p>
        </div>
        <div className="legend">
          <Button variant="secondary" onClick={() => window.print()}>
            Print preview
          </Button>
          <Button variant="ghost" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>
      <Panel title="Report selection" eyebrow="RP01">
        <div className="report-tabs">
          {[
            ["student", "Student record"],
            ["course", "Course statistics"],
            ["department", "Department statistics"],
            ["university", "University statistics"],
          ].map(([id, label]) => (
            <button
              className={type === id ? "active" : ""}
              onClick={() => setType(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filter-row report-filters">
          {type === "student" && (
            <label className="inline-select">
              Student{" "}
              <select
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              >
                {state.students
                  .filter(
                    (item) => role !== "student" || item.id === activeStudentId,
                  )
                  .map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {type === "course" && (
            <label className="inline-select">
              Course{" "}
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                {state.courses.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.id} · {item.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {type === "department" && (
            <label className="inline-select">
              Department{" "}
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                {departments.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </Panel>
      <Panel
        title="Report preview"
        eyebrow={`${type[0].toUpperCase()}${type.slice(1)} report`}
        className="report-preview"
      >
        {report}
      </Panel>
    </div>
  );
}

function StudentReport({ student }) {
  if (!student)
    return (
      <EmptyState title="Student record required">
        Select a student with a complete record before generating this report.
      </EmptyState>
    );
  return (
    <div className="print-report">
      <div className="report-header">
        <div>
          <p className="eyebrow">SignMeUp student record</p>
          <h3>{student.name}</h3>
          <p>
            {student.id} · {student.major}
            {student.minor ? ` / ${student.minor}` : ""}
          </p>
        </div>
        <div className="report-badge">
          GPA <strong>{calculateGpa(student)}</strong>
        </div>
      </div>
      <div className="report-summary-grid">
        <Info label="Telephone" value={student.telephone || "Not provided"} />
        <Info label="Address" value={student.address || "Not provided"} />
        <Info
          label="Date of birth"
          value={student.dateOfBirth || "Not provided"}
        />
        <Info
          label="Graduate status"
          value={student.graduateAccepted ? "Accepted" : "Not accepted"}
        />
      </div>
      <CourseTable
        title="Completed courses"
        courses={[...student.completedCourses, ...student.transferCourses]}
      />
      <CourseTable
        title="Current enrollment"
        courses={student.currentEnrollment}
      />
    </div>
  );
}
function CourseStatsReport({ state, courseId }) {
  const course = courseById(state, courseId);
  const rows = state.grades[courseId]?.students ?? [];
  return (
    <StatsReport
      title={`${course.id} · ${course.title}`}
      rows={rows}
      courses={[course]}
    />
  );
}
function AggregateStatsReport({ state, department }) {
  const courses = state.courses.filter(
    (course) => !department || course.department === department,
  );
  const rows = courses.flatMap(
    (course) => state.grades[course.id]?.students ?? [],
  );
  return (
    <StatsReport
      title={
        department
          ? `${department} department statistics`
          : "University-wide statistics"
      }
      rows={rows}
      courses={courses}
    />
  );
}
function StatsReport({ title, rows, courses }) {
  const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  rows.forEach((row) => {
    if (counts[row.grade] !== undefined) counts[row.grade] += 1;
  });
  const letterRows = rows.filter((row) => gradePoints(row.grade) !== null);
  const average = letterRows.length
    ? (
        letterRows.reduce((sum, row) => sum + gradePoints(row.grade), 0) /
        letterRows.length
      ).toFixed(2)
    : "0.00";
  const passing = rows.filter((row) =>
    ["A", "B", "C", "CR"].includes(row.grade),
  ).length;
  const total = rows.length;
  return (
    <div className="print-report">
      <div className="report-header">
        <div>
          <p className="eyebrow">SignMeUp grade statistics</p>
          <h3>{title}</h3>
          <p>{courses.length} course offering(s)</p>
        </div>
        <div className="report-badge">
          Average <strong>{average}</strong>
        </div>
      </div>
      <div className="stats-grid">
        <Info label="Registrations" value={total} />
        <Info label="Passing" value={passing} />
        <Info label="Average grade" value={average} />
        <Info
          label="A / B / C / D / F"
          value={`${counts.A} / ${counts.B} / ${counts.C} / ${counts.D} / ${counts.F}`}
        />
      </div>
      <div className="bar-list">
        {Object.entries(counts).map(([grade, count]) => (
          <div key={grade}>
            <span>{grade}</span>
            <div className="bar">
              <i style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
            </div>
            <strong>{total ? Math.round((count / total) * 100) : 0}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
function reportCsv(state, type, options) {
  if (type === "student") {
    const student = studentById(state, options.studentId);
    return [
      "Student ID,Name,Course,Semester,Units,Grade",
      ...(student?.completedCourses ?? []).map((course) =>
        [
          student.id,
          student.name,
          course.courseId,
          course.semester,
          course.units,
          course.grade,
        ].join(","),
      ),
    ].join("\n");
  }
  const courses = state.courses.filter(
    (course) =>
      type !== "department" || course.department === options.department,
  );
  const rows = courses.flatMap((course) =>
    (state.grades[course.id]?.students ?? []).map((row) =>
      [course.id, course.department, row.studentId, row.grade].join(","),
    ),
  );
  return ["Course,Department,Student ID,Grade", ...rows].join("\n");
}
