export const DEMO_USERS = [
  {
    id: "S1001",
    username: "student@example.edu",
    password: "student123",
    name: "Alex Rivera",
    role: "student",
    title: "Student",
    access: ["records", "registration", "majors", "faculty", "reports"],
  },
  {
    id: "U2001",
    username: "faculty@example.edu",
    password: "faculty123",
    name: "Dr. Jane Smith",
    role: "faculty",
    title: "Professor",
    access: ["records", "registration", "faculty", "grades", "reports"],
  },
  {
    id: "U3001",
    username: "advisor@example.edu",
    password: "advisor123",
    name: "Dr. Priya Shah",
    role: "advisor",
    title: "Major Advisor",
    access: ["records", "registration", "majors", "faculty", "reports"],
  },
  {
    id: "A0001",
    username: "admin@example.edu",
    password: "admin123",
    name: "System Administrator",
    role: "admin",
    title: "System Administrator",
    access: [
      "records",
      "registration",
      "majors",
      "faculty",
      "registration",
      "grades",
      "reports",
      "users",
    ],
  },
];

export const INITIAL_STATE = {
  users: DEMO_USERS,
  students: [
    {
      id: "S1001",
      name: "Alex Rivera",
      telephone: "555-0101",
      address: "100 Campus Way",
      dateOfBirth: "2005-04-18",
      major: "CS",
      minor: "MATH",
      graduateAccepted: false,
      completedCourses: [
        { courseId: "CS101", title: "Programming Fundamentals", semester: "Fall 2025", units: 3, grade: "A" },
        { courseId: "CS201", title: "Data Structures", semester: "Spring 2026", units: 3, grade: "B" },
        { courseId: "MATH101", title: "Calculus I", semester: "Fall 2025", units: 4, grade: "B" },
      ],
      transferCourses: [
        { courseId: "CS150", title: "Intro to Computing", semester: "Summer 2024", units: 3, grade: "A", university: "Riverside College", location: "Riverside, CA" },
      ],
      currentEnrollment: [],
      notes: [
        { id: "N1", text: "Honor roll recognition.", createdAt: "2026-05-20T10:30:00.000Z", employeeId: "U3001" },
      ],
    },
    {
      id: "S1002",
      name: "Morgan Chen",
      telephone: "555-0102",
      address: "200 College Avenue",
      dateOfBirth: "2004-09-12",
      major: "BIO",
      minor: "CHEM",
      graduateAccepted: true,
      completedCourses: [
        { courseId: "BIO101", title: "Biology I", semester: "Fall 2025", units: 4, grade: "A" },
        { courseId: "CHEM101", title: "General Chemistry", semester: "Spring 2026", units: 4, grade: "B" },
      ],
      transferCourses: [],
      currentEnrollment: [],
      notes: [],
    },
  ],
  courses: [
    { id: "CS301", title: "Algorithms", description: "Algorithm design and analysis.", department: "CS", units: 3, level: "upper", prerequisites: ["CS201"], seats: 4, capacity: 30, instructorId: "U2001", instructor: "Dr. Jane Smith", schedule: "Mon/Wed 10:00 AM", location: "Science 204" },
    { id: "CS350", title: "Database Systems", description: "Relational database design and SQL.", department: "CS", units: 3, level: "upper", prerequisites: ["CS201"], seats: 2, capacity: 25, instructorId: "U2001", instructor: "Dr. Jane Smith", schedule: "Tue/Thu 1:00 PM", location: "Science 210" },
    { id: "CS401", title: "Artificial Intelligence", description: "Foundations of intelligent systems.", department: "CS", units: 3, level: "graduate", prerequisites: ["CS301"], seats: 8, capacity: 20, instructorId: "U2001", instructor: "Dr. Jane Smith", schedule: "Fri 2:00 PM", location: "Science 215" },
    { id: "BIO201", title: "Genetics", description: "Principles of heredity and molecular genetics.", department: "BIO", units: 4, level: "upper", prerequisites: ["BIO101"], seats: 10, capacity: 28, instructorId: "U2001", instructor: "Dr. Jane Smith", schedule: "Mon/Wed 1:00 PM", location: "Life Sciences 101" },
    { id: "MATH201", title: "Discrete Mathematics", description: "Logic, proofs, sets, and combinatorics.", department: "MATH", units: 3, level: "upper", prerequisites: ["MATH101"], seats: 0, capacity: 25, instructorId: "U2001", instructor: "Dr. Jane Smith", schedule: "Tue/Thu 9:00 AM", location: "Math 115" },
  ],
  majors: [
    {
      id: "CS",
      title: "Computer Science",
      department: "CS",
      requiredUnits: 120,
      requiredCourses: ["CS201", "CS301", "CS350"],
      electiveCourses: ["CS401"],
      advisors: ["U3001"],
    },
    {
      id: "BIO",
      title: "Biology",
      department: "BIO",
      requiredUnits: 120,
      requiredCourses: ["BIO101", "BIO201"],
      electiveCourses: [],
      advisors: ["U3001"],
    },
  ],
  outlines: {
    S1001: {
      majorId: "CS",
      entries: [
        { courseId: "CS201", status: "approved", statusDate: "2026-01-10", approvedBy: "U3001" },
        { courseId: "CS301", status: "approved", statusDate: "2026-01-10", approvedBy: "U3001" },
        { courseId: "CS350", status: "approved", statusDate: "2026-01-10", approvedBy: "U3001" },
      ],
      approvedBy: "U3001",
      lastApproved: "2026-01-10",
      history: [],
    },
    S1002: {
      majorId: "BIO",
      entries: [
        { courseId: "BIO101", status: "approved", statusDate: "2026-01-10", approvedBy: "U3001" },
        { courseId: "BIO201", status: "approved", statusDate: "2026-01-10", approvedBy: "U3001" },
      ],
      approvedBy: "U3001",
      lastApproved: "2026-01-10",
      history: [],
    },
  },
  faculty: [
    { id: "U2001", name: "Dr. Jane Smith", position: "Professor", telephone: "555-0201", office: "Science 310", officeHours: "Tue/Thu 3-4 PM", department: "CS", teachingDepartments: ["CS", "MATH"], qualifiedCourses: ["CS301", "CS350", "CS401", "BIO201", "MATH201"] },
    { id: "U2002", name: "Dr. Luis Gomez", position: "Associate Professor", telephone: "555-0202", office: "Life Sciences 220", officeHours: "Mon 2-4 PM", department: "BIO", teachingDepartments: ["BIO"], qualifiedCourses: ["BIO201"] },
  ],
  grades: {
    CS301: {
      generalComment: "Grades are due at the end of the semester.",
      students: [
        { studentId: "S1001", registrationType: "letter", grade: "B", note: "Strong final project.", updatedBy: "U2001", updatedAt: "2026-05-20T12:00:00.000Z" },
      ],
    },
    CS350: { generalComment: "", students: [] },
  },
  auditLog: [],
};

export const ROLE_LABELS = {
  student: "Student",
  faculty: "Faculty",
  advisor: "Major Advisor",
  admin: "System Administrator",
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "Overview", icon: "⌂", roles: ["student", "faculty", "advisor", "admin"] },
  { id: "registration", label: "Course Registration", icon: "＋", roles: ["student", "faculty", "advisor", "admin"] },
  { id: "records", label: "Student Records", icon: "▤", roles: ["student", "faculty", "advisor", "admin"] },
  { id: "majors", label: "Major Plans", icon: "◇", roles: ["student", "advisor", "admin"] },
  { id: "faculty", label: "Faculty & Courses", icon: "◎", roles: ["student", "faculty", "advisor", "admin"] },
  { id: "grades", label: "Course Grades", icon: "✓", roles: ["faculty", "admin"] },
  { id: "reports", label: "Reports", icon: "▥", roles: ["student", "faculty", "advisor", "admin"] },
  { id: "users", label: "Authorized Users", icon: "♙", roles: ["admin"] },
  { id: "help", label: "Help Center", icon: "?", roles: ["student", "faculty", "advisor", "admin"] },
];

export function cloneInitialState() {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

export function courseById(state, id) {
  return state.courses.find((course) => course.id === id);
}

export function studentById(state, id) {
  return state.students.find((student) => student.id === id);
}

export function gradePoints(grade) {
  return { A: 4, B: 3, C: 2, D: 1, F: 0 }[grade] ?? null;
}

export function calculateGpa(student) {
  const graded = [...(student?.completedCourses ?? []), ...(student?.transferCourses ?? [])]
    .filter((course) => gradePoints(course.grade) !== null);
  const units = graded.reduce((sum, course) => sum + Number(course.units || 0), 0);
  if (!units) return "0.00";
  const points = graded.reduce((sum, course) => sum + gradePoints(course.grade) * Number(course.units || 0), 0);
  return (points / units).toFixed(2);
}

export function checkEligibility(state, studentId, courseId, { requireOutline = false } = {}) {
  const student = studentById(state, studentId);
  const course = courseById(state, courseId);
  const reasons = [];
  if (!student) reasons.push("A student record is required before registration.");
  if (!course) reasons.push("The selected course could not be found.");
  if (!student || !course) return { eligible: false, reasons };

  const completedIds = new Set(student.completedCourses.map((item) => item.courseId));
  const enrolledIds = new Set(student.currentEnrollment.map((item) => item.courseId));
  if (enrolledIds.has(course.id)) reasons.push("The student is already registered for this course.");
  if (course.seats <= 0) reasons.push("There are no seats available.");
  const missing = course.prerequisites.filter((prerequisite) => !completedIds.has(prerequisite));
  if (missing.length) reasons.push(`Missing prerequisite(s): ${missing.join(", ")}.`);
  if (course.level === "upper" && ![student.major, student.minor].includes(course.department)) {
    reasons.push("Upper-division courses are limited to the declared major or minor.");
  }
  if (course.level === "graduate" && !student.graduateAccepted) {
    reasons.push("The student is not marked as accepted into the graduate program.");
  }
  if (requireOutline) {
    const approved = state.outlines[student.id]?.entries.some(
      (entry) => entry.courseId === course.id && entry.status === "approved",
    );
    if (!approved) reasons.push("The course is not on the student’s approved major outline.");
  }
  const enrolledUnits = student.currentEnrollment.reduce((sum, item) => sum + Number(item.units || 0), 0);
  if (enrolledUnits + Number(course.units) > 18) reasons.push("Registration would exceed the 18-credit limit.");
  const conflict = student.currentEnrollment.some((item) => item.schedule === course.schedule);
  if (conflict) reasons.push("The course conflicts with an existing schedule.");
  return { eligible: reasons.length === 0, reasons };
}

export function getDemoUser(state, username, password) {
  return state.users.find(
    (user) => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password,
  );
}
