import { useState } from "react";
import { EmptyState, Panel, Status } from "../shared.jsx";

export function FacultyPage({ state }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const faculty = state.faculty.filter(
    (item) =>
      (department === "all" || item.department === department) &&
      (wildcardMatch(item.id, query) || wildcardMatch(item.name, query)),
  );
  const courses = state.courses.filter(
    (course) =>
      (department === "all" || course.department === department) &&
      (wildcardMatch(course.id, query) || wildcardMatch(course.title, query)),
  );
  const departments = [
    ...new Set(state.courses.map((course) => course.department)),
  ];
  return (
    <div className="page-stack">
      <div className="intro-row">
        <div>
          <p className="eyebrow">FCI subsystem</p>
          <h2>Faculty and course information</h2>
          <p className="muted">
            Search by faculty ID, faculty name, course ID, or course title. Use
            * for wildcard searches.
          </p>
        </div>
        <div className="legend">
          <Status tone="info">Wildcard search enabled</Status>
        </div>
      </div>
      <Panel title="Directory search" eyebrow="FC04">
        <div className="filter-row">
          <label className="search-input wide">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Smith, U2001, CS*, or Algorithms"
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
        </div>
      </Panel>
      <div className="two-column-layout">
        <Panel title="Faculty matches" eyebrow={`${faculty.length} results`}>
          <div className="directory-list">
            {faculty.map((item) => (
              <article className="directory-card" key={item.id}>
                <div className="directory-avatar">{item.name.slice(0, 1)}</div>
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.id} · {item.position}
                  </span>
                  <small>
                    {item.department} · Office {item.office} · {item.telephone}
                  </small>
                  <small>Office hours: {item.officeHours}</small>
                  <p>Authorized courses: {item.qualifiedCourses.join(", ")}</p>
                </div>
              </article>
            ))}
            {faculty.length === 0 && (
              <EmptyState title="No faculty matches">
                Try a different identifier or wildcard.
              </EmptyState>
            )}
          </div>
        </Panel>
        <Panel title="Course matches" eyebrow={`${courses.length} results`}>
          <div className="directory-list">
            {courses.map((course) => (
              <article
                className="directory-card course-directory"
                key={course.id}
              >
                <div className="course-code large">{course.id}</div>
                <div>
                  <strong>{course.title}</strong>
                  <span>
                    {course.department} · {course.units} units · {course.level}
                  </span>
                  <small>{course.description}</small>
                  <small>
                    Prerequisites: {course.prerequisites.join(", ") || "None"}
                  </small>
                  <p>
                    Qualified faculty:{" "}
                    {state.faculty
                      .filter((item) =>
                        item.qualifiedCourses.includes(course.id),
                      )
                      .map((item) => item.name)
                      .join(", ") || "Not assigned"}
                  </p>
                </div>
              </article>
            ))}
            {courses.length === 0 && (
              <EmptyState title="No course matches">
                Try a different course ID or title.
              </EmptyState>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function wildcardMatch(value, pattern) {
  if (!pattern.trim()) return true;

  const escaped = pattern
    .trim()
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");

  return new RegExp(escaped, "i").test(String(value ?? ""));
}
