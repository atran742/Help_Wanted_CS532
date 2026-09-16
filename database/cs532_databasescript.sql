CREATE TABLE reg."Course"(
	"CourseID" integer NOT NULL,
	"Units" integer,
	"Title" varchar,
	CONSTRAINT "Course_pkey" PRIMARY KEY("CourseID")
);


CREATE TABLE reg."Prerequisite"(
	"PrerequisiteID" integer NOT NULL,
	"CourseID" integer,
	"PrereqID" integer,
	CONSTRAINT "Prerequisite_pkey" PRIMARY KEY("PrerequisiteID")
);


COMMENT ON TABLE reg."Prerequisite" IS 'bridge table showing course prereqs';


CREATE TABLE reg."Class"(
	"ClassID" integer NOT NULL,
	"Instructor" varchar NOT NULL,
	"Semester" daterange NOT NULL,
	"CourseID" integer NOT NULL,
	"Location" varchar NOT NULL,
	CONSTRAINT "Class_pkey" PRIMARY KEY("ClassID")
);


COMMENT ON TABLE reg."Class" IS
	'An instance of a Course, which students can take'
;


CREATE TABLE er."TransferCourse"(
	"TransferCourseID" integer NOT NULL,
	"CourseID" integer NOT NULL,
	"UniversityName" varchar NOT NULL,
	"UniversityLocation" varchar NOT NULL,
	CONSTRAINT "TransferCourse_pkey" PRIMARY KEY("TransferCourseID"),
	CONSTRAINT "TransferCourse_CourseID_key" UNIQUE("CourseID")
);


COMMENT ON COLUMN er."TransferCourse"."TransferCourseID" IS
	'Any Transcript rows should use the equivalent CourseID and not the transferCourseID to prevent collisions'
;


COMMENT ON TABLE er."TransferCourse" IS
	'Courses not taken at this university with the information and equivalent course'
;


CREATE TABLE signmeup."AuthorizedUser"(
	"EmployeeNumber" integer NOT NULL,
	"Name" varchar NOT NULL,
	"Password" varchar NOT NULL,
	"JobTitle" varchar NOT NULL,
	CONSTRAINT "AuthorizedUser_pkey" PRIMARY KEY("EmployeeNumber")
);


ALTER TABLE signmeup."AuthorizedUser" ENABLE ROW LEVEL SECURITY;


COMMENT ON TABLE signmeup."AuthorizedUser" IS
	'Represents someone logged into the system'
;


CREATE TABLE signmeup."SubsystemAccess"(
"EmployeeNumber" integer NOT NULL, "SubsystemID" integer NOT NULL,
	CONSTRAINT "SubsystemAccess_pkey" PRIMARY KEY("EmployeeNumber")
);


ALTER TABLE signmeup."SubsystemAccess" ENABLE ROW LEVEL SECURITY;


COMMENT ON TABLE signmeup."SubsystemAccess" IS
	'table showing connection between users and the subsystems they''re authorized to use'
;


CREATE TABLE signmeup."Subsystem"(
"SubsystemID" integer NOT NULL,
	CONSTRAINT "Subsystem_pkey" PRIMARY KEY("SubsystemID")
);


COMMENT ON TABLE signmeup."Subsystem" IS 'normalized view of subsystems';


CREATE TABLE er."Student"(
	"StudentID" integer NOT NULL,
	"Name" varchar NOT NULL,
	"Telephone" varchar,
	"Address" varchar,
	"DateOfBirth" date NOT NULL,
	"Major" varchar NOT NULL,
	"Minor" varchar,
	CONSTRAINT "Student_pkey" PRIMARY KEY("StudentID")
);


ALTER TABLE er."Student" ENABLE ROW LEVEL SECURITY;


COMMENT ON TABLE er."Student" IS 'An instance of a student';


CREATE TABLE er."StudentNote"(
	"StudentID" integer NOT NULL,
	"Note" varchar NOT NULL,
	"CreateDate" timestamp NOT NULL,
	"EmployeeID" integer NOT NULL,
	CONSTRAINT "StudentNote_pkey" PRIMARY KEY
		("EmployeeID", "CreateDate", "StudentID")
);


ALTER TABLE er."StudentNote" ENABLE ROW LEVEL SECURITY;


COMMENT ON TABLE er."StudentNote" IS 'allows 1:many notes per student';


CREATE TABLE er."Transcript"(
	"TranscriptID" integer NOT NULL,
	"StudentID" integer NOT NULL,
	"CourseID" integer NOT NULL,
	CONSTRAINT "Transcript_pkey" PRIMARY KEY("TranscriptID")
);


ALTER TABLE er."Transcript" ENABLE ROW LEVEL SECURITY;


COMMENT ON TABLE er."Transcript" IS 'StudentXCourse';


ALTER TABLE reg."Prerequisite"
	ADD CONSTRAINT "Prerequisite_CourseID_fkey"
		FOREIGN KEY ("CourseID") REFERENCES reg."Course" ("CourseID")
;


COMMENT ON CONSTRAINT "Prerequisite_CourseID_fkey" ON reg."Prerequisite" IS
	'One course can have multiple prereqs, but aren''t required'
;


ALTER TABLE reg."Class"
	ADD CONSTRAINT "Class_CourseID_fkey"
		FOREIGN KEY ("CourseID") REFERENCES reg."Course" ("CourseID")
;


COMMENT ON CONSTRAINT "Class_CourseID_fkey" ON reg."Class" IS
	'Each class must have an underlying course, and each course can have multiple instances of classes'
;


ALTER TABLE er."TransferCourse"
	ADD CONSTRAINT "TransferCourse_CourseID_fkey"
		FOREIGN KEY ("CourseID") REFERENCES reg."Course" ("CourseID") ON DELETE Set null
			ON UPDATE Cascade
;


COMMENT ON CONSTRAINT "TransferCourse_CourseID_fkey" ON er."TransferCourse" IS
	'Relationship between a transferred course and its equivalent course'
;


ALTER TABLE signmeup."SubsystemAccess"
	ADD CONSTRAINT "SubsystemAccess_SubsystemID_fkey"
		FOREIGN KEY ("SubsystemID") REFERENCES signmeup."Subsystem" ("SubsystemID")
;


ALTER TABLE signmeup."SubsystemAccess"
	ADD CONSTRAINT "SubsystemAccess_EmployeeNumber_fkey"
		FOREIGN KEY ("EmployeeNumber")
			REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber")
;


ALTER TABLE er."StudentNote"
	ADD CONSTRAINT "StudentNote_StudentID_fkey"
		FOREIGN KEY ("StudentID") REFERENCES er."Student" ("StudentID")
;


ALTER TABLE er."StudentNote"
	ADD CONSTRAINT "StudentNote_EmployeeID_fkey"
		FOREIGN KEY ("EmployeeID")
			REFERENCES signmeup."AuthorizedUser" ("EmployeeNumber")
;


ALTER TABLE er."Transcript"
	ADD CONSTRAINT "Transcript_StudentID_fkey"
		FOREIGN KEY ("StudentID") REFERENCES er."Student" ("StudentID")
;


ALTER TABLE er."Transcript"
	ADD CONSTRAINT "Transcript_CourseID_fkey"
		FOREIGN KEY ("CourseID") REFERENCES reg."Course" ("CourseID")
;

