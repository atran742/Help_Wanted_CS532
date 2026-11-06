export const GRADE_SCREEN_HELP = {
  entry: {
    title: "Grade entry help",
    purpose: "Enter, review, and submit final grades for students in a course.",
    instructions: [
      "Choose a course above, then select a grade for each student based on their registration type.",
      "Use Add note for a student-specific comment, or Course notes for a comment that applies to the whole course.",
      "Save draft to keep work in progress. Submit final grades requires a grade for every student and locks the course after submission.",
      "A disabled form means the grading window is closed or grades have already been submitted. Contact an authorized administrator if an update is needed.",
    ],
  },
  sheet: {
    title: "Grade sheet help",
    purpose: "Review a printable roster of the selected course and its saved grades.",
    instructions: [
      "Choose a course above to change which roster is shown.",
      "The sheet shows saved grades only; save a draft before opening this screen if you need to include recent edits.",
      "Select Print grade sheet to open the browser print dialog. The page is formatted to print only the grade sheet.",
    ],
  },
  stats: {
    title: "Statistics help",
    purpose: "Review grade completion and grade distributions for the selected course.",
    instructions: [
      "Choose Course, Department, or University to change the reporting scope.",
      "Choose Chart or Table to change how the A–F distribution is displayed.",
      "Course figures are calculated from saved grades. Credit/No Credit and Audit registrations are excluded from letter-grade averages and distributions.",
      "Department and university figures are sample data until the statistics service is connected.",
    ],
  },
};

export const GRADE_FIELD_HELP = {
  grade: (regType) => {
    const options =
      regType === "Graded"
        ? "Choose a letter grade from A through F, including plus/minus grades."
        : regType === "Credit/No Credit"
          ? "Choose CR or NC."
          : "Choose AU.";
    return `Required before final submission; optional while saving a draft. ${options}`;
  },
  studentNote:
    "Optional. Add a comment about this student's grade, up to 500 characters.",
  courseNotes:
    "Optional. Add a comment about the course as a whole, up to 1,000 characters.",
};
