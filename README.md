# Where Is My Doctor — Next.js Web Application

This is the Next.js App Router web portal for **Where Is My Doctor** (Home-Visit Healthcare Platform). It shares the **exact same PHP 8 + PDO backend** (`where_is_my_doctor/api/`) and **MySQL database** (`health_care_app_db`) as the Flutter mobile application.

An account registered on the Flutter mobile app works seamlessly on this website and vice versa (`member` table authentication via Phone Number + NIC + Password).

---

## 1. Prerequisites & XAMPP Backend Setup

1. **XAMPP (Apache + MySQL)**:
   - Ensure the PHP backend is located at `C:\xampp\htdocs\where_is_my_doctor` (served at `http://localhost/where_is_my_doctor/api`).
   - Start **Apache** and **MySQL** in the XAMPP Control Panel.
   - Ensure the database `health_care_app_db` is imported from `C:\xampp\htdocs\where_is_my_doctor\health_care_app_db.sql` (do **not** run `setup/create_table.php` as it contains `DROP TABLE`).
2. **Node.js**:
   - Node.js 18+ and npm.

---

## 2. Environment Configuration

Copy [`.env.example`](file:///c:/health_care_app_website/.env.example) to `.env.local`:

```bash
cp .env.example .env.local
```

Default environment variable in [`.env.example`](file:///c:/health_care_app_website/.env.example):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost/where_is_my_doctor/api
```

All HTTP calls across the entire application go through the single shared client in [`lib/api.js`](file:///c:/health_care_app_website/lib/api.js), which reads `process.env.NEXT_PUBLIC_API_BASE_URL`.

---

## 3. Install & Run

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build production bundle
npm run build
npm start
```

Open `http://localhost:3000` in your browser (`localhost` or `127.0.0.1` is required by the backend's CORS policy for medical document uploads/downloads; see [`BACKEND_LIMITATIONS.md`](file:///c:/health_care_app_website/BACKEND_LIMITATIONS.md)).

---

## 4. Feature Flags (`lib/featureFlags.js`)

To match the Flutter app's [`lib/config/feature_flags.dart`](file:///C:/xampp/htdocs/where_is_my_doctor/frontend/lib/config/feature_flags.dart), [`lib/featureFlags.js`](file:///c:/health_care_app_website/lib/featureFlags.js) defines 6 boolean flags for the Patient Dashboard (all defaulting to `false` for the current release):

- `showPatientOngoingVisit`
- `showPatientSearchBar`
- `showPatientNearbyProviders`
- `showPatientServicesGrid`
- `showPatientReminders`
- `showPatientPendingPaymentsCard`

> **Note:** Even with these dashboard cards hidden by default, all underlying pages and workflows (`/patient/request-care`, `/patient/appointments`, `/patient/tracking`, `/patient/payments`, `/patient/prescriptions`, `/patient/profile`) are fully built and accessible from the navigation menu or by toggling the flags in [`lib/featureFlags.js`](file:///c:/health_care_app_website/lib/featureFlags.js) to `true`.

---

## 5. Feature Parity & Route Map

### Authentication
- `/login` — Sign in with Phone + NIC + Password (`login.php`), stores `session_token`, routes by `user_type` (`1` = Patient, `2` = Doctor), and checks profile completion status.
- `/register` — Register a new Patient (`user_type = 1`) or Doctor (`user_type = 2`) account (`register.php`) and automatically redirect to the profile completion wizard.

### Patient Portal (`user_type = 1`)
- `/patient/complete-profile` — 3-step Patient Registration & Medical Profile completion wizard (`register_patient.php`).
- `/patient/dashboard` — Active patient switcher (`Self` + family members/children), add family member modal (`AddFamilyMemberModal`), quick access to Prescriptions & Payments, and feature-flagged home-visit sections.
- `/patient/request-care` — Book home-visit services (`Doctor Consultation`, `Nurse Care`, `Injection Service`, `Elderly Care`, `Wound Dressing`, `Physiotherapy`) with urgency levels (`Normal`, `Urgent`, `Emergency`), GPS coordinates, and preferred visit date/time (`create_appointment.php`).
- `/patient/appointments` — View appointments for the active patient profile, inspect & accept competing doctor bids (`get_appointment_bids.php`, `accept_bid.php`), confirm doctor arrival (`mark_appointment_arrived.php`), complete or cancel visits (`complete_appointment.php`, `cancel_appointment.php`), and launch live tracking.
- `/patient/tracking` — Live visit tracking (`tracking_screen.dart` parity) with simulated GPS telemetry, 6-step appointment progress bar, arrival confirmation, and visit completion.
- `/patient/prescriptions` — View `Active` and `Expired` e-prescriptions (`get_patient_prescriptions.php`) and download/print formatted PDF prescriptions (`downloadPrescriptionPdf` in [`lib/pdfGenerator.js`](file:///c:/health_care_app_website/lib/pdfGenerator.js)).
- `/patient/payments` — View `Pending Bills` and `Payment History` (`get_patient_invoices.php`), pay invoices via `Cash` or `Card` (`mark_invoice_paid.php`), and download PDF receipts (`downloadReceiptPdf`).
- `/patient/profile` — View and edit medical profile (`register_patient.php`), switch or add family members/children (`get_patients.php`), and upload/view/download/delete medical documents (`upload_`, `list_`, `get_`, `delete_medical_document.php` with `X-Session-Token`).

### Doctor Portal (`user_type = 2`)
- `/doctor/register-profile` — 3-step Doctor credential & profile submission (`register_doctor.php`) with dynamic speciality dropdown (`get_doctor_specialities.php`) and file uploads (`degree_certificate`, `license_certificate`, `identity_document`).
- `/doctor/dashboard` — Verification status gate (`Pending`, `Rejected`, `Correction Required`, `Approved`), Service Area & Visiting Hours configuration modals, incoming home-visit requests with fee bidding (`get_available_appointments.php`, `submit_bid.php`), and active visits.
- `/doctor/appointments` — Manage assigned visits (`get_provider_appointments.php`), submit bids on open requests, start consultations (`start_consultation.php`), open the full **Consultation Workspace** (`DoctorConsultationModal`), complete visits (`complete_appointment.php`), and generate invoices (`create_invoice.php`).
- `/doctor/patients` & `/doctor/patients/[patientId]` — Search patients (`get_patients.php`), register new adult or child patients (`doctor_add_patient.php` with temporary password display), inspect full medical profile, view/upload/delete patient medical documents, and review/download patient prescriptions.
- `/doctor/prescriptions` — Issue multi-medicine e-prescriptions (`create_prescription.php`), view prescriptions for a selected patient or all prescriptions issued by the logged-in doctor (`get_provider_prescriptions.php`), and download PDF prescriptions.
- `/doctor/medicines` — Manage the doctor's personal medicine catalog (`get_doctor_drugs.php`, `add_doctor_drug.php`).
- `/doctor/payments` — Track completed visit earnings, pending collections, verify/generate invoices (`create_invoice.php`), and download PDF earning statements.
- `/doctor/profile` — View professional profile (`check_doctor.php`), verification status badge, uploaded credential documents (`resolveUploadUrl`), and link to update/resubmit credentials.

---

## 6. Test Accounts & Notes

You can register a fresh **Patient** or **Doctor** account at `/register` using:
- **Phone Number**: 9–15 digits (e.g. `0771234567`)
- **NIC Number**: 9 digits + `V`/`X` (e.g. `991234567V`) or 12 digits (e.g. `199912345678`)
- **Password**: minimum 6 characters

Existing accounts in `health_care_app_db.sql` (`member` table) can also log in directly if their password is known, or a doctor can register a new patient via **Doctor Portal → Patients → + Register Patient**, which generates and displays a one-time temporary login password for that patient.

See [`BACKEND_LIMITATIONS.md`](file:///c:/health_care_app_website/BACKEND_LIMITATIONS.md) for documented constraints of the read-only PHP backend.
