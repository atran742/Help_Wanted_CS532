import Icon from "../components_Grades/Icon";

// Shows the saved grades only, so what prints matches what is in the system.
export default function GradeSheet({ course, record }) {
  const printedOn = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section aria-label="Grade sheet preview">
      <div className="gr-sheet-toolbar">
        <p className="gr-muted">
          Preview of the printed sheet. It lists saved grades only.
        </p>
        <button
          type="button"
          className="gr-btn gr-btn-primary"
          onClick={() => window.print()}
        >
          <Icon name="print" size={15} />
          Print grade sheet
        </button>
      </div>

      <article className="gr-sheet">
        <header className="gr-sheet-head">
          <p className="gr-sheet-kicker">College SignMeUp</p>
          <h2 className="gr-sheet-title">Grade sheet</h2>
        </header>

        <dl className="gr-sheet-meta">
          <div>
            <dt>Course ID</dt>
            <dd>{course.id}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{course.department}</dd>
          </div>
          <div>
            <dt>Schedule number</dt>
            <dd>{course.schedule}</dd>
          </div>
          <div>
            <dt>Date and time held</dt>
            <dd>{course.meets}</dd>
          </div>
          <div>
            <dt>Instructor</dt>
            <dd>{course.instructor}</dd>
          </div>
          <div>
            <dt>Units</dt>
            <dd>{course.units}</dd>
          </div>
        </dl>

        <table className="gr-sheet-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Student ID</th>
              <th scope="col">Student name</th>
              <th scope="col" className="gr-right">
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {record.rows.map((row, i) => (
              <tr key={row.id}>
                <td className="gr-num">{i + 1}</td>
                <td className="gr-num">{row.id}</td>
                <td>{row.name}</td>
                <td className="gr-right gr-grade-cell">{row.grade || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="gr-sheet-foot">
          <span>Printed {printedOn}</span>
          <span>Status: {record.status}</span>
        </footer>
      </article>
    </section>
  );
}
