// Sample data and helpers for the GRADE screens
// Everything below is example data. Replacfe with api and database calls.

export const CURRENT_USER = {
  name: "Example Instructor",
  role: "Faculty",
  initials: "EI",
  employeeId: "E-20418",
};

export const GRADING_WINDOW = {
  opens: "May 12",
  closes: "May 20",
  isOpen: true,
};

export const GRADE_BANDS = ["A", "B", "C", "D", "F"];

const LETTER_GRADES = [
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

export const GRADE_OPTIONS = {
  Graded: LETTER_GRADES,
  "Credit/No Credit": ["CR", "NC"],
  Audit: ["AU"],
};

const GRADE_POINTS = {
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  "D-": 0.7,
  F: 0,
};

const isLetter = (grade) => GRADE_POINTS[grade] !== undefined;

export function gradeBand(grade) {
  return isLetter(grade) ? grade[0] : null;
}

export function isPassing(grade) {
  return isLetter(grade) ? grade !== "F" : grade === "CR";
}

export function pointsToLetter(points) {
  const cutoffs = [
    [3.85, "A"],
    [3.5, "A-"],
    [3.15, "B+"],
    [2.85, "B"],
    [2.5, "B-"],
    [2.15, "C+"],
    [1.85, "C"],
    [1.5, "C-"],
    [1.15, "D+"],
    [0.85, "D"],
    [0.5, "D-"],
  ];
  const hit = cutoffs.find(([min]) => points >= min);
  return hit ? hit[1] : "F";
}

// Credit/No Credit and Audit rows count as registered, but not toward the average or A-F shares.
export function computeStats(rows) {
  const letterRows = rows.filter((r) => isLetter(r.grade));
  const total = letterRows.reduce((sum, r) => sum + GRADE_POINTS[r.grade], 0);
  return {
    registered: rows.length,
    passing: rows.filter((r) => isPassing(r.grade)).length,
    average: letterRows.length ? total / letterRows.length : null,
    gradedCount: letterRows.length,
    distribution: GRADE_BANDS.map((band) => {
      const count = letterRows.filter(
        (r) => gradeBand(r.grade) === band,
      ).length;
      return {
        band,
        count,
        pct: letterRows.length
          ? Math.round((count / letterRows.length) * 100)
          : 0,
      };
    }),
  };
}

function sampleScope(registered, passing, average, pcts) {
  return {
    registered,
    passing,
    average,
    gradedCount: registered,
    distribution: GRADE_BANDS.map((band, i) => ({
      band,
      pct: pcts[i],
      count: Math.round((pcts[i] / 100) * registered),
    })),
  };
}

export const SAMPLE_SCOPES = {
  department: sampleScope(842, 771, 2.94, [29, 34, 22, 9, 6]),
  university: sampleScope(41260, 37904, 2.88, [27, 33, 24, 9, 7]),
};

const student = (id, name, regType, grade = "", extra = {}) => ({
  id,
  name,
  regType,
  grade,
  note: "",
  updatedOn: grade ? "May 12" : "",
  updatedBy: grade ? "Example Instructor 1" : "",
  override: false,
  ...extra,
});

export const COURSES = [
  {
    id: "CS 210",
    title: "Data Structures",
    department: "Computer Science",
    section: "02",
    schedule: "21045",
    meets: "Mon/Wed 10:00 – 11:15 AM",
    units: 3,
    instructor: "Example Instructor 1",
    instructorId: "E-20418",
    generalNotes: "Curve applied to Midterm 2 (+4 points).",
    roster: [
      student("912040117", "Maya Okafor", "Graded", "A"),
      student("912040233", "Liam Chen", "Graded", "A-", {
        note: "Excellent final project; strong code review feedback.",
      }),
      student("912041006", "Sofia Ramirez", "Graded", "B+"),
      student("912041142", "Noah Patel", "Graded", "B"),
      student("912041389", "Ava Nguyen", "Graded", "B"),
      student("912041575", "Ethan Kowalski", "Graded", "B-", {
        updatedOn: "May 14",
        updatedBy: "A. Chen (Registrar)",
        override: true,
      }),
      student("912041760", "Isabella Rossi", "Graded", "C+"),
      student("912042018", "Jamal Washington", "Graded", "C", {
        note: "Late submission penalty applied to project 3.",
      }),
      student("912042254", "Priya Raman", "Graded", "D+"),
      student("912042391", "Lucas Andersson", "Credit/No Credit"),
      student("912042617", "Hana Kim", "Audit"),
      student("912042880", "Mateo Silva", "Graded"),
    ],
  },
  {
    id: "CS 450",
    title: "Intro to AI",
    department: "Computer Science",
    section: "01",
    schedule: "21190",
    meets: "Tue/Thu 1:00 – 2:15 PM",
    units: 3,
    instructor: "Example Instructor 1",
    instructorId: "E-20418",
    generalNotes: "",
    roster: [
      student("913010452", "Chloe Park", "Graded", "A"),
      student("913010688", "Omar Haddad", "Graded", "A-"),
      student("913011204", "Ruth Mensah", "Graded", "B+"),
      student("913011377", "Diego Alvarez", "Graded", "B"),
      student("913011590", "Yuki Tanaka", "Graded", "A"),
      student("913011933", "Tomas Novak", "Graded", "C+"),
      student("913012046", "Elena Petrova", "Graded"),
      student("913012281", "Marcus Bell", "Graded"),
    ],
  },
  {
    id: "CS 596",
    title: "Independent Study",
    department: "Computer Science",
    section: "07",
    schedule: "21877",
    meets: "Arranged",
    units: 1,
    instructor: "Example Instructor 1",
    instructorId: "E-20418",
    generalNotes: "",
    roster: [
      student("914020115", "Ben Whitaker", "Credit/No Credit", "CR"),
      student("914020342", "Nadia Volkov", "Credit/No Credit", "CR"),
      student("914020779", "Tariq Aziz", "Credit/No Credit"),
    ],
  },
];

export function buildRecords() {
  return Object.fromEntries(
    COURSES.map((c) => [
      c.id,
      {
        rows: c.roster.map((r) => ({ ...r })),
        generalNotes: c.generalNotes,
        status: "In progress",
      },
    ]),
  );
}
