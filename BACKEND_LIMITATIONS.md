# Backend & Database Limitations (`BACKEND_LIMITATIONS.md`)

Because the PHP backend (`where_is_my_doctor/api/`, `config/`, `admin/`) and MySQL database (`health_care_app_db`) are **strictly read-only**, this document records all backend and schema limitations encountered while building full feature parity on the Next.js website, how the website handles each case today, and what backend updates would be needed in a future backend release.

---

## 1. Medical Document Endpoints Restrict CORS Origins to `localhost` / `127.0.0.1`

- **Affected Files / Endpoints**:
  - `config/medical_doc_security.php` (`send_medical_doc_cors_headers()`)
  - `api/upload_medical_document.php`
  - `api/list_medical_documents.php`
  - `api/get_medical_document.php`
  - `api/delete_medical_document.php`
- **What is Missing / Limited**:
  - `send_medical_doc_cors_headers()` validates the `Origin` header against `/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i`.
  - This works in local development (`http://localhost:3000`), but when the Next.js website is deployed to a production HTTPS domain, browser requests to the 4 medical document endpoints will be blocked by CORS unless the PHP backend and website are served from the exact same origin.
- **Website Handling Today**:
  - Full medical document upload, listing, inline preview (PDF & images), download, and deletion are implemented in [`components/MedicalDocumentsSection.jsx`](file:///c:/health_care_app_website/components/MedicalDocumentsSection.jsx) via [`lib/api.js`](file:///c:/health_care_app_website/lib/api.js) and work out-of-the-box on `localhost` / `127.0.0.1`.
- **Recommended Backend Fix**:
  - Update `send_medical_doc_cors_headers()` in `config/medical_doc_security.php` to read an allowed origins list from an environment variable (e.g. `ALLOWED_WEB_ORIGINS`) in addition to `localhost` / `127.0.0.1`.

---

## 2. General Endpoints (`api_headers()`) Only Allow `Content-Type` and `Accept` Headers

- **Affected Files / Endpoints**:
  - `config/database.php` (`api_headers()`)
  - All endpoints except the 4 medical document endpoints (e.g., `login.php`, `register.php`, `get_patient_appointments.php`, `create_appointment.php`, `get_patient_invoices.php`, etc.)
- **What is Missing / Limited**:
  - `api_headers()` sends `Access-Control-Allow-Headers: Content-Type, Accept`.
  - If a browser client attaches `X-Session-Token` or `Authorization` globally to all API calls, the browser's CORS preflight (`OPTIONS`) check fails and blocks the request.
  - Furthermore, only the 4 medical document endpoints actually validate `X-Session-Token`; all other endpoints rely on `member_id` / `patient_id` / `provider_member_id` in the query string or request body.
- **Website Handling Today**:
  - [`lib/api.js`](file:///c:/health_care_app_website/lib/api.js) stores `session_token` from `login.php` in `localStorage` (`healthcare_session_token`) and sends the `X-Session-Token` header **exclusively** on calls to `upload_medical_document.php`, `list_medical_documents.php`, `get_medical_document.php`, and `delete_medical_document.php`.
- **Recommended Backend Fix**:
  - Add `X-Session-Token` to `Access-Control-Allow-Headers` in `config/database.php` (`api_headers()`) and enforce session token verification across all authenticated endpoints.

---

## 3. Nurse Role Uses Legacy `users` Table and Cannot Authenticate via `login.php`

- **Affected Files / Endpoints**:
  - `api/login.php`
  - `api/register.php`
  - `api/register_nurse.php`
  - `api/check_nurse.php`
- **What is Missing / Limited**:
  - The database mixes two identity systems: the current `member` table (`user_type = 1` Patient, `user_type = 2` Doctor) and the legacy `users` table.
  - `register.php` only accepts `user_type` `1` or `2`, and `login.php` only authenticates against the `member` table and only resolves `user_type` `1` (`patients`) and `2` (`doctors`).
  - `register_nurse.php` and `check_nurse.php` still reference `user_id` against the legacy `users` table (`nurses.user_id`), so a nurse account cannot be registered or logged in through `register.php` / `login.php`.
- **Website Handling Today**:
  - Per project scope, the website implements **Patient (`user_type = 1`)** and **Doctor (`user_type = 2`)** end-to-end and excludes Nurse registration/login.
- **Recommended Backend Fix**:
  - Migrate `nurses` to reference `member_id` (`member.user_type = 3`), update `register.php` and `login.php` to support `user_type = 3`, and update `register_nurse.php` / `check_nurse.php` to use `member_id`.

---

## 4. Caregiver Role Has No Backend Endpoints or Database Tables

- **Affected Files / Endpoints**:
  - None exist in `where_is_my_doctor/api/` or `health_care_app_db.sql` (Flutter's `caregiver_dashboard.dart` uses 100% hardcoded mock data).
- **Website Handling Today**:
  - Excluded from website scope per instructions.
- **Recommended Backend Fix**:
  - Create a `caregivers` table linked to `member.id` (`user_type = 4`) along with registration, profile check, and service assignment endpoints.

---

## 5. No Dedicated `get_provider_invoices.php` Endpoint for Doctor Earnings

- **Affected Files / Endpoints**:
  - `api/get_patient_invoices.php` (requires `patient_id`)
  - `api/create_invoice.php` (creates or returns an existing invoice for one `appointment_id`)
  - `api/get_provider_appointments.php`
- **What is Missing / Limited**:
  - There is no endpoint to list all rows in the `invoices` table for a specific doctor (`provider_member_id`).
- **Website Handling Today**:
  - Exactly like Flutter's `doctor_payments_screen.dart`, [`app/doctor/payments/page.jsx`](file:///c:/health_care_app_website/app/doctor/payments/page.jsx) aggregates completed and pending visit earnings from `getProviderAppointments(memberId)` (`accepted_bid_fee` / `proposed_fee`) and `getProviderPrescriptions(memberId)`, and allows doctors to verify/create an official invoice record for any completed appointment via `createInvoice()` (`create_invoice.php`) and download a PDF statement via [`lib/pdfGenerator.js`](file:///c:/health_care_app_website/lib/pdfGenerator.js).
- **Recommended Backend Fix**:
  - Add `api/get_provider_invoices.php?provider_member_id=...` joining `invoices`, `appointments`, and `patients`.

---

## 6. `start_consultation.php` Requires `status === 'Arrived'` Set by the Patient

- **Affected Files / Endpoints**:
  - `api/start_consultation.php`
  - `api/mark_appointment_arrived.php`
  - `api/complete_appointment.php`
- **What is Missing / Limited**:
  - `start_consultation.php` only allows a doctor (`provider_member_id`) to transition an appointment from `'Arrived'` to `'Consultation Started'`, and returns HTTP 400 (`"The patient must confirm the provider has arrived before consultation can start"`) if the appointment is still in `'Accepted'` or `'On The Way'`.
  - Meanwhile, `mark_appointment_arrived.php` requires `patient_id` and transitions `'Accepted'` / `'On The Way'` -> `'Arrived'`.
  - However, `complete_appointment.php` (when called with `role: 'Doctor'`) allows completing an appointment from any active status (`'Accepted'`, `'On The Way'`, `'Arrived'`, or `'Consultation Started'`).
- **Website Handling Today**:
  - On the patient side, both [`app/patient/appointments/page.jsx`](file:///c:/health_care_app_website/app/patient/appointments/page.jsx) and [`app/patient/tracking/page.jsx`](file:///c:/health_care_app_website/app/patient/tracking/page.jsx) provide a **"Confirm Doctor Arrived"** button calling `markAppointmentArrived(appointmentId, patientId)`.
  - On the doctor side, [`components/DoctorConsultationModal.jsx`](file:///c:/health_care_app_website/components/DoctorConsultationModal.jsx) provides a **"Start Consultation"** button when `status === 'Arrived'` (and explains if waiting on patient arrival confirmation), while still allowing the doctor to record clinical notes, issue e-prescriptions (`create_prescription.php`), complete the visit (`complete_appointment.php`), and generate the invoice (`create_invoice.php`) at any active consultation stage.
- **Recommended Backend Fix**:
  - Allow doctors to mark themselves as `'On The Way'` / `'Arrived'` via a provider status update endpoint, or allow `start_consultation.php` to transition directly from `'Accepted'` / `'On The Way'`.

---

## 7. No Live Provider GPS Telemetry Table or Endpoint

- **Affected Files / Endpoints**:
  - `api/get_patient_appointments.php`
- **What is Missing / Limited**:
  - The `appointments` table stores the patient's destination `latitude` and `longitude`, but there is no backend table or endpoint storing real-time provider GPS coordinates, ETA, or vehicle plate numbers.
- **Website Handling Today**:
  - Mirrors Flutter's `tracking_screen.dart` in [`app/patient/tracking/page.jsx`](file:///c:/health_care_app_website/app/patient/tracking/page.jsx): combines real backend appointment polling (`getPatientAppointments`) and real lifecycle mutations (`markAppointmentArrived`, `completeAppointment`) with simulated live GPS telemetry, ETA countdown, and route progress visualization.
- **Recommended Backend Fix**:
  - Add a `provider_locations` table and `update_provider_location.php` / `get_provider_location.php` endpoints.

---

## 8. Doctor Service Area & Visiting Hours Are Not Persisted in the Database

- **Affected Files / Endpoints**:
  - `api/register_doctor.php`
  - `api/check_doctor.php`
- **What is Missing / Limited**:
  - The `doctors` table does not have columns for `service_radius_km`, `service_cities`, `visiting_hours`, or `is_available`.
- **Website Handling Today**:
  - Mirrors Flutter's `doctor_dashboard.dart` in [`app/doctor/dashboard/page.jsx`](file:///c:/health_care_app_website/app/doctor/dashboard/page.jsx) by providing interactive Service Area and Visiting Hours modals and persisting those settings in `localStorage` (`doctor_practice_prefs_<memberId>`).
- **Recommended Backend Fix**:
  - Add `is_available`, `service_radius_km`, `service_cities`, and `visiting_hours` columns to `doctors` and expose an `update_doctor_preferences.php` endpoint.

---

## 9. Inconsistent File Path Prefixes & Nullable `full_name` Values in the Database

- **Affected Tables / Endpoints**:
  - `doctors.degree_certificate`, `doctors.license_certificate`, `doctors.identity_document` (`api/check_doctor.php`, `api/register_doctor.php`)
  - `member.full_name`, `patients.full_name`, `doctors.full_name`
- **What is Missing / Limited**:
  - Some rows in `doctors` store bare filenames (e.g. `degree_1773131797_7872.jpg`) while others store relative paths (`uploads/doctors/degree_...`).
  - Newly registered accounts (prior to profile completion) and several existing test rows have `full_name = NULL` or empty strings.
- **Website Handling Today**:
  - `resolveUploadUrl()` in [`lib/api.js`](file:///c:/health_care_app_website/lib/api.js) and [`lib/formatters.js`](file:///c:/health_care_app_website/lib/formatters.js) normalizes bare filenames and relative paths against `API_ROOT_URL`.
  - `displayName()`, `formatPatientName()`, and `formatDoctorName()` in [`lib/formatters.js`](file:///c:/health_care_app_website/lib/formatters.js) guarantee safe fallbacks (`Patient #ID`, `Doctor #ID`, NIC, or phone) so `"null"` or blank names are never rendered.

