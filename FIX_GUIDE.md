# HealthCare Home Web - Fixed Build Guide

## What was fixed

- Doctor sidebar moved to shared `components/DoctorNavigation.jsx`.
- Patient sidebar moved to shared `components/PatientNavigation.jsx`.
- Sidebar menu text/icons use explicit readable colors on the dark navy background.
- Desktop and mobile navigation now share the same menu definitions.
- Mobile drawer layering uses a backdrop below the sidebar (`z-[90]` / `z-[100]`).
- Mobile drawer locks page scrolling while open and closes with Escape.
- Active route highlighting is automatic.
- Doctor and patient mobile bottom navigation is shared and consistent.
- Doctor Dashboard, Appointments, Patients, Patient Details, Prescriptions and Profile were migrated to the shared navigation.
- Patient Dashboard, Request Care, Appointments, Prescriptions and Profile were migrated to the shared navigation.
- Doctor prescriptions no longer depend on `useSearchParams`, avoiding App Router Suspense/build issues for that page.
- Doctor appointments uses the object-style `submitBid(...)` call expected by `lib/api.js`.
- Patients and prescription patient selection use cleaner responsive table/list layouts.

## Important paths

- `components/DoctorNavigation.jsx`
- `components/PatientNavigation.jsx`
- `app/doctor/dashboard/page.jsx`
- `app/doctor/appointments/page.jsx`
- `app/doctor/patients/page.jsx`
- `app/doctor/patients/[patientId]/page.jsx`
- `app/doctor/prescriptions/page.jsx`
- `app/doctor/profile/page.jsx`
- `app/patient/dashboard/page.jsx`
- `app/patient/request-care/page.jsx`
- `app/patient/appointments/page.jsx`
- `app/patient/prescriptions/page.jsx`
- `app/patient/profile/page.jsx`

## How to use it on Windows

1. Keep a backup of your current project.
2. Extract this ZIP to a new folder, for example:
   `C:\Projects\healthcare-home-web-components-fixed`
3. Make sure XAMPP Apache and MySQL are running.
4. Open the extracted folder in VS Code.
5. In a terminal run:

```powershell
npm install
npm run dev
```

6. Open `http://localhost:3000`.

## Doctor pages to test

- `/doctor/dashboard`
- `/doctor/appointments`
- `/doctor/patients`
- `/doctor/prescriptions`
- `/doctor/profile`

## Patient pages to test

- `/patient/dashboard`
- `/patient/request-care`
- `/patient/appointments`
- `/patient/prescriptions`
- `/patient/profile`

## Verification performed

All JS/JSX files in this package were parsed with the Next.js bundled Babel parser after the fixes. Result: 26 files parsed, 0 syntax errors. All `@/...` imports used by the project resolve to existing project files.

A full `next build` could not be completed in the Linux sandbox because the uploaded `node_modules` was from Windows and Next attempted to download the Linux SWC binary; network access is disabled in the sandbox. Run `npm install` on your Windows machine before testing/building.

## Backend note

This package preserves the API contracts already used by your web project. Functional flows still depend on the PHP/XAMPP backend and database being the matching version. If a runtime API error appears (for example an ID mapping mismatch between `member`, `patients`, or provider IDs), capture the exact API response/error and fix that backend contract rather than randomly changing frontend IDs.
