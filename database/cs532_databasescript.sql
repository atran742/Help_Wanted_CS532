-- SignMeUp PostgreSQL schema
-- The application uses PostgreSQL/Neon and keeps subsystem tables in separate schemas.

CREATE SCHEMA IF NOT EXISTS signmeup;
CREATE SCHEMA IF NOT EXISTS er;
CREATE SCHEMA IF NOT EXISTS reg;
CREATE SCHEMA IF NOT EXISTS major;
CREATE SCHEMA IF NOT EXISTS fci;
CREATE SCHEMA IF NOT EXISTS grade;

CREATE TABLE IF NOT EXISTS signmeup."AuthorizedUser" (
  "AccountNumber" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "EmployeeNumber" integer NOT NULL UNIQUE,
  "UserName" varchar(160) NOT NULL,
  "Email" varchar(320) NOT NULL UNIQUE,
  "PasswordHash" varchar(200) NOT NULL,
  "JobTitle" varchar(160) NOT NULL,
  "AccountType" varchar(40) NOT NULL CHECK ("AccountType" IN ('student', 'faculty', 'advisor', 'admin')),
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signmeup."Subsystem" (
  "SubsystemID" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "SubsystemCode" varchar(20) NOT NULL UNIQUE,
  "SubsystemName" varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS signmeup."SubsystemAccess" (
  "EmployeeNumber" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber") ON DELETE CASCADE,
  "SubsystemID" integer NOT NULL REFERENCES signmeup."Subsystem" ("SubsystemID") ON DELETE CASCADE,
  PRIMARY KEY ("EmployeeNumber", "SubsystemID")
);

CREATE TABLE IF NOT EXISTS signmeup."TransactionAudit" (
  "AuditID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "EmployeeNumber" integer REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "Action" varchar(300) NOT NULL,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS er."Student" (
  "StudentID" integer PRIMARY KEY,
  "Name" varchar(200) NOT NULL,
  "Telephone" varchar(40),
  "Address" varchar(300),
  "DateOfBirth" date NOT NULL,
  "Major" varchar(30) NOT NULL,
  "Minor" varchar(30),
  "GraduateAccepted" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS er."StudentNote" (
  "StudentID" integer NOT NULL REFERENCES er."Student" ("StudentID"),
  "Note" varchar(2000) NOT NULL,
  "CreateDate" timestamptz NOT NULL DEFAULT now(),
  "EmployeeID" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  PRIMARY KEY ("EmployeeID", "CreateDate", "StudentID")
);

CREATE TABLE IF NOT EXISTS reg."Department" (
  "DepartmentCode" varchar(30) PRIMARY KEY,
  "DepartmentName" varchar(160) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS reg."Course" (
  "CourseID" varchar(30) PRIMARY KEY,
  "Units" integer NOT NULL CHECK ("Units" > 0),
  "Title" varchar(200) NOT NULL,
  "Description" varchar(2000),
  "DepartmentCode" varchar(30) NOT NULL REFERENCES reg."Department" ("DepartmentCode"),
  "CourseLevel" varchar(20) NOT NULL DEFAULT 'lower' CHECK ("CourseLevel" IN ('lower', 'upper', 'graduate'))
);

CREATE TABLE IF NOT EXISTS reg."Prerequisite" (
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID") ON DELETE CASCADE,
  "PrereqID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  PRIMARY KEY ("CourseID", "PrereqID")
);

CREATE TABLE IF NOT EXISTS reg."Class" (
  "ClassID" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "ScheduleNumber" varchar(30) NOT NULL UNIQUE,
  "InstructorEmployeeNumber" integer REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "SemesterStart" date NOT NULL,
  "SemesterEnd" date NOT NULL,
  "MeetingTime" varchar(160) NOT NULL,
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  "Location" varchar(160) NOT NULL,
  "Capacity" integer NOT NULL CHECK ("Capacity" >= 0),
  CHECK ("SemesterEnd" >= "SemesterStart")
);

CREATE TABLE IF NOT EXISTS reg."Enrollment" (
  "StudentID" integer NOT NULL REFERENCES er."Student" ("StudentID"),
  "ClassID" integer NOT NULL REFERENCES reg."Class" ("ClassID"),
  "RegistrationType" varchar(30) NOT NULL DEFAULT 'letter' CHECK ("RegistrationType" IN ('letter', 'credit/no credit', 'audit')),
  "RegisteredAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("StudentID", "ClassID")
);

CREATE TABLE IF NOT EXISTS er."TransferCourse" (
  "TransferCourseID" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "StudentID" integer NOT NULL REFERENCES er."Student" ("StudentID"),
  "EquivalentCourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  "UniversityName" varchar(200) NOT NULL,
  "UniversityLocation" varchar(200) NOT NULL,
  "SemesterCompleted" varchar(60),
  "Units" integer NOT NULL CHECK ("Units" > 0),
  "Grade" varchar(10)
);

CREATE TABLE IF NOT EXISTS er."Transcript" (
  "TranscriptID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "StudentID" integer NOT NULL REFERENCES er."Student" ("StudentID"),
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  "SemesterCompleted" varchar(60) NOT NULL,
  "Grade" varchar(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS major."Major" (
  "MajorID" varchar(30) PRIMARY KEY,
  "MajorTitle" varchar(160) NOT NULL,
  "DepartmentCode" varchar(30) NOT NULL REFERENCES reg."Department" ("DepartmentCode"),
  "RequiredUnits" integer NOT NULL CHECK ("RequiredUnits" > 0)
);

CREATE TABLE IF NOT EXISTS major."MajorCourse" (
  "MajorID" varchar(30) NOT NULL REFERENCES major."Major" ("MajorID") ON DELETE CASCADE,
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  "CourseType" varchar(20) NOT NULL CHECK ("CourseType" IN ('required', 'elective')),
  PRIMARY KEY ("MajorID", "CourseID")
);

CREATE TABLE IF NOT EXISTS major."MajorAdvisor" (
  "MajorID" varchar(30) NOT NULL REFERENCES major."Major" ("MajorID") ON DELETE CASCADE,
  "EmployeeNumber" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  PRIMARY KEY ("MajorID", "EmployeeNumber")
);

CREATE TABLE IF NOT EXISTS major."ApprovedOutline" (
  "OutlineID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "StudentID" integer NOT NULL REFERENCES er."Student" ("StudentID"),
  "MajorID" varchar(30) NOT NULL REFERENCES major."Major" ("MajorID"),
  "ApprovedBy" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "LastApproved" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS major."OutlineEntry" (
  "OutlineID" bigint NOT NULL REFERENCES major."ApprovedOutline" ("OutlineID") ON DELETE CASCADE,
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  "Status" varchar(20) NOT NULL CHECK ("Status" IN ('approved', 'dropped', 'waived')),
  "StatusDate" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("OutlineID", "CourseID")
);

CREATE TABLE IF NOT EXISTS major."OutlineHistory" (
  "HistoryID" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "OutlineID" bigint NOT NULL REFERENCES major."ApprovedOutline" ("OutlineID"),
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID"),
  "PreviousStatus" varchar(20),
  "NewStatus" varchar(20) NOT NULL,
  "ChangedBy" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "ChangedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fci."Faculty" (
  "FacultyID" integer PRIMARY KEY REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "Name" varchar(200) NOT NULL,
  "PositionTitle" varchar(160) NOT NULL,
  "OfficeTelephone" varchar(40),
  "OfficeNumber" varchar(80),
  "OfficeHours" varchar(160),
  "AssignedDepartment" varchar(30) REFERENCES reg."Department" ("DepartmentCode")
);

CREATE TABLE IF NOT EXISTS fci."FacultyTeachingDepartment" (
  "FacultyID" integer NOT NULL REFERENCES fci."Faculty" ("FacultyID") ON DELETE CASCADE,
  "DepartmentCode" varchar(30) NOT NULL REFERENCES reg."Department" ("DepartmentCode"),
  PRIMARY KEY ("FacultyID", "DepartmentCode")
);

CREATE TABLE IF NOT EXISTS fci."QualifiedFaculty" (
  "FacultyID" integer NOT NULL REFERENCES fci."Faculty" ("FacultyID") ON DELETE CASCADE,
  "CourseID" varchar(30) NOT NULL REFERENCES reg."Course" ("CourseID") ON DELETE CASCADE,
  PRIMARY KEY ("FacultyID", "CourseID")
);

CREATE TABLE IF NOT EXISTS grade."CourseGrade" (
  "ClassID" integer NOT NULL REFERENCES reg."Class" ("ClassID") ON DELETE CASCADE,
  "StudentID" integer NOT NULL REFERENCES er."Student" ("StudentID"),
  "Grade" varchar(10) NOT NULL,
  "GradeNote" varchar(2000),
  "UpdatedBy" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("ClassID", "StudentID")
);

CREATE TABLE IF NOT EXISTS grade."CourseComment" (
  "ClassID" integer PRIMARY KEY REFERENCES reg."Class" ("ClassID") ON DELETE CASCADE,
  "Comment" varchar(4000) NOT NULL,
  "UpdatedBy" integer NOT NULL REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber"),
  "UpdatedAt" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO signmeup."Subsystem" ("SubsystemCode", "SubsystemName") VALUES
  ('ER', 'Electronic Student Record'),
  ('REG', 'Course Registration'),
  ('MAJOR', 'Major Course Requirements'),
  ('FCI', 'Faculty and Course Information'),
  ('GRADE', 'Course Grades')
ON CONFLICT ("SubsystemCode") DO NOTHING;

-- RLS is enabled on every application table. Production policies should be
-- paired with a non-owner application role and app.user_id/app.user_role
-- session variables set by the authenticated API request.
DO $$
DECLARE
  table_name text;
  schema_name text;
BEGIN
  FOR schema_name, table_name IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname IN ('signmeup', 'er', 'reg', 'major', 'fci', 'grade')
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_name, table_name);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS "StudentNote_student_date_idx" ON er."StudentNote" ("StudentID", "CreateDate");
CREATE INDEX IF NOT EXISTS "Course_department_idx" ON reg."Course" ("DepartmentCode");
CREATE INDEX IF NOT EXISTS "Class_course_idx" ON reg."Class" ("CourseID");

CREATE OR REPLACE FUNCTION signmeup.reject_protected_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'This record is protected and cannot be deleted';
END;
$$;

DROP TRIGGER IF EXISTS "StudentNote_no_delete" ON er."StudentNote";
CREATE TRIGGER "StudentNote_no_delete"
BEFORE DELETE ON er."StudentNote"
FOR EACH ROW EXECUTE FUNCTION signmeup.reject_protected_delete();

DROP TRIGGER IF EXISTS "OutlineHistory_no_delete" ON major."OutlineHistory";
CREATE TRIGGER "OutlineHistory_no_delete"
BEFORE DELETE ON major."OutlineHistory"
FOR EACH ROW EXECUTE FUNCTION signmeup.reject_protected_delete();
