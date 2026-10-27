# SignMeUp Prototype Implementation Status

This update turns the login-only repository into a browser-run SignMeUp prototype with demo data, role-based views, local persistence, and a PostgreSQL-ready backend contract.

## Implemented in the prototype

| Requirement area | Implementation |
| --- | --- |
| FR01, FR02, NV01-NV03 | Shared desktop workspace with a direct menu for each subsystem, resizable panels, responsive layout, and consistent navigation. |
| SC01, SF02 | Password-protected login with invalid and missing credential messages. Demo accounts represent student, faculty, advisor, and administrator roles. |
| ER01, ER02, CL01, CL02 | Required-field help, reasoned validation messages, cancel/drop actions, and local-state changes that can be reset before the browser prototype is committed to a database. |
| HL01-HL03 | Help Center, current-screen context, field-level `?` help, and a field reference table. |
| PR01, RP01 | Browser print controls, print-friendly CSS, report preview, and CSV export. |
| SF01, SF03-SF07 | Shared shell, role-based menu, administrator user creation, password reset, access report without passwords, and the administrator-only View as switcher. |
| ES01-ES05 | Student personal data, university and transfer course history, current enrollment, GPA, protected chronological notes, and student-record report. |
| CR01-CR09 | Course offerings, department filters, seat counts, one-course-at-a-time registration, prerequisite/major/minor/graduate/outline/seat/conflict/credit checks, cancellation, and schedule views. |
| MJ01-MJ05 | Major requirements, required/elective courses, approved outlines, approved/dropped/waived status, advisor/admin editing, protected history, and access-rule explanation. |
| FC01-FC07 | Faculty records, office details, teaching departments, qualified-course lists, ID/name/title queries, wildcard search, department filters, and directory results. |
| CG01-CG09 | Primary-instructor/admin grade access, letter/credit-no-credit/audit validation, student and general notes, end-of-semester restriction, updater/timestamp audit, grade sheet, and course/department/university statistics. |
| DB01-DB04, SD01, SE01 | Expanded relational PostgreSQL schema with many-to-many tables, separate subsystem schemas, audit table, row-level-security enablement, and a modular API entry point. |

## Deliberate prototype boundaries

- The browser prototype uses localStorage, as specified in the project notebook, so it can be demonstrated without a live Neon database.
- The PostgreSQL script now creates the subsystem schemas and tables, but production RLS policies still need to be connected to the deployment's non-owner application role and authenticated session variables.
- DB05's five-second target should be measured after the Neon connection, indexes, and representative data are deployed.
- SD02 is a process requirement. The repository can document the JAD/Agile process, but it cannot enforce team meetings or intermediate design reviews at runtime.
- ES06 remains dependent on the electronic student-record standard selected by the team or professor.

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Student | student@example.edu | student123 |
| Faculty | faculty@example.edu | faculty123 |
| Major Advisor | advisor@example.edu | advisor123 |
| System Administrator | admin@example.edu | admin123 |

These credentials are demonstration data only and must be replaced before deployment.
