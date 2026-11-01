// lib/api.js
// Shared API client for the Next.js web application.
// Aligned with the Flutter app and PHP backend architecture.

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost/where_is_my_doctor/api'
).replace(/\/+$/, '');

export const API_ROOT_URL = API_BASE_URL.replace(
  /\/api$/i,
  ''
);

export const SESSION_TOKEN_KEY =
  'healthcare_session_token';

// ============================================================
// SESSION TOKEN STORAGE HELPERS
// ============================================================

export function getSessionToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem(SESSION_TOKEN_KEY) ||
    ''
  ).trim();
}

export function setSessionToken(token) {
  if (typeof window === 'undefined') {
    return;
  }

  const cleaned = String(token || '').trim();

  if (cleaned) {
    localStorage.setItem(
      SESSION_TOKEN_KEY,
      cleaned
    );
  } else {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export function clearSessionToken() {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(SESSION_TOKEN_KEY);
}

// ============================================================
// CORE REQUEST HELPERS
// ============================================================

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        query.set(key, String(value));
      }
    }
  );

  return query.toString();
}

/**
 * Standard JSON / FormData request helper.
 * IMPORTANT: Never attaches X-Session-Token globally because api_headers()
 * in the PHP backend only allows Content-Type and Accept in CORS preflight.
 */
async function request(endpoint, options = {}) {
  try {
    const isFormData =
      typeof FormData !== 'undefined' &&
      options.body instanceof FormData;

    const isUrlEncoded =
      typeof URLSearchParams !== 'undefined' &&
      options.body instanceof URLSearchParams;

    const defaultHeaders = {
      Accept: 'application/json',
    };

    if (
      options.body !== undefined &&
      !isFormData &&
      !isUrlEncoded
    ) {
      defaultHeaders['Content-Type'] =
        'application/json';
    } else if (isUrlEncoded) {
      defaultHeaders['Content-Type'] =
        'application/x-www-form-urlencoded;charset=UTF-8';
    }

    const response = await fetch(
      `${API_BASE_URL}/${endpoint}`,
      {
        ...options,
        cache: options.cache ?? 'no-store',
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      }
    );

    const text = await response.text();

    let data;

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return {
        success: false,
        message: 'Invalid server response',
        http_status: response.status,
        raw_response: text,
      };
    }

    if (
      !response.ok &&
      data.success !== false
    ) {
      return {
        ...data,
        success: false,
        message:
          data.message ||
          `Request failed with status ${response.status}`,
        http_status: response.status,
      };
    }

    if (data && typeof data === 'object') {
      data.http_status = response.status;
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: `Network error: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    };
  }
}

// ============================================================
// AUTH
// ============================================================

export async function registerMember({
  phone,
  nic,
  password,
  userType,
}) {
  return request('register.php', {
    method: 'POST',
    body: JSON.stringify({
      phone: String(phone ?? '').trim(),
      nic: String(nic ?? '')
        .trim()
        .toUpperCase(),
      password,
      user_type: Number(userType),
    }),
  });
}

export async function loginMember({
  phone,
  nic,
  password,
}) {
  const result = await request('login.php', {
    method: 'POST',
    body: JSON.stringify({
      phone: String(phone ?? '').trim(),
      nic: String(nic ?? '')
        .trim()
        .toUpperCase(),
      password,
    }),
  });

  if (
    result?.success &&
    result?.session_token
  ) {
    setSessionToken(result.session_token);
  }

  return result;
}

// ============================================================
// DOCTOR PROFILE
// ============================================================

export async function checkDoctorProfile(
  memberId
) {
  return request(
    `check_doctor.php?${buildQuery({
      member_id: memberId,
    })}`,
    {
      method: 'GET',
    }
  );
}

export async function getDoctorSpecialities() {
  return request(
    'get_doctor_specialities.php',
    {
      method: 'GET',
    }
  );
}

/**
 * Registers or resubmits a doctor's profile using multipart/form-data.
 * Matches register_doctor.php ($_POST + $_FILES).
 */
export async function registerDoctorProfile({
  memberId,
  fullName,
  email,
  phoneNumber,
  clinicAddress,
  dateOfBirth,
  gender,
  medicalRegNo,
  medicalCouncil,
  qualification,
  university,
  specialityId = null,
  specialization = '',
  experienceYears,
  hospitalAffiliation = '',
  degreeCertificate = null,
  licenseCertificate = null,
  identityDocument = null,
}) {
  const formData = new FormData();

  formData.append(
    'member_id',
    String(memberId ?? '')
  );
  formData.append(
    'full_name',
    String(fullName ?? '').trim()
  );
  formData.append(
    'email',
    String(email ?? '').trim()
  );
  formData.append(
    'phone_number',
    String(phoneNumber ?? '').trim()
  );
  formData.append(
    'clinic_address',
    String(clinicAddress ?? '').trim()
  );
  formData.append(
    'date_of_birth',
    String(dateOfBirth ?? '').trim()
  );
  formData.append(
    'gender',
    String(gender ?? '').trim()
  );
  formData.append(
    'medical_reg_no',
    String(medicalRegNo ?? '').trim()
  );
  formData.append(
    'medical_council',
    String(medicalCouncil ?? '').trim()
  );
  formData.append(
    'qualification',
    String(qualification ?? '').trim()
  );
  formData.append(
    'university',
    String(university ?? '').trim()
  );

  if (
    specialityId !== null &&
    specialityId !== undefined &&
    String(specialityId).trim() !== ''
  ) {
    formData.append(
      'speciality_id',
      String(specialityId).trim()
    );
  }

  if (specialization) {
    formData.append(
      'specialization',
      String(specialization).trim()
    );
  }

  formData.append(
    'experience_years',
    String(experienceYears ?? 0).trim()
  );
  formData.append(
    'hospital_affiliation',
    String(hospitalAffiliation ?? '').trim()
  );

  if (degreeCertificate instanceof Blob) {
    formData.append(
      'degree_certificate',
      degreeCertificate,
      degreeCertificate.name ||
        'degree_certificate.pdf'
    );
  }

  if (licenseCertificate instanceof Blob) {
    formData.append(
      'license_certificate',
      licenseCertificate,
      licenseCertificate.name ||
        'license_certificate.pdf'
    );
  }

  if (identityDocument instanceof Blob) {
    formData.append(
      'identity_document',
      identityDocument,
      identityDocument.name ||
        'identity_document.pdf'
    );
  }

  return request('register_doctor.php', {
    method: 'POST',
    body: formData,
  });
}

// ============================================================
// PATIENT / FAMILY PROFILES
// ============================================================

export async function getPatients(
  userId,
  { useMemberId = true } = {}
) {
  return request(
    `get_patients.php?${buildQuery(
      useMemberId
        ? { member_id: userId }
        : { managed_by_user_id: userId }
    )}`,
    {
      method: 'GET',
    }
  );
}

/**
 * Creates or updates a patient profile (Self or family member) via register_patient.php.
 */
export async function registerPatient({
  memberId = null,
  managedByMemberId = null,
  patientId = null,
  fullName = '',
  dateOfBirth = '',
  gender = '',
  email = '',
  phone = '',
  homeAddress = '',
  city = '',
  postalCode = '',
  bloodGroup = '',
  emergencyContact = '',
  allergies = '',
  existingDiseases = '',
  currentMedications = '',
  relationshipToUser = 'Self',
  nicNo = '',
}) {
  const payload = {
    full_name: String(fullName ?? '').trim(),
    date_of_birth: String(
      dateOfBirth ?? ''
    ).trim(),
    gender: String(gender ?? '').trim(),
    email: String(email ?? '').trim(),
    phone: String(phone ?? '').trim(),
    home_address: String(
      homeAddress ?? ''
    ).trim(),
    city: String(city ?? '').trim(),
    postal_code: String(
      postalCode ?? ''
    ).trim(),
    blood_group: String(
      bloodGroup ?? ''
    ).trim(),
    emergency_contact: String(
      emergencyContact ?? ''
    ).trim(),
    allergies: String(allergies ?? '').trim(),
    existing_diseases: String(
      existingDiseases ?? ''
    ).trim(),
    current_medications: String(
      currentMedications ?? ''
    ).trim(),
    relationship_to_user:
      String(
        relationshipToUser ?? 'Self'
      ).trim() || 'Self',
  };

  if (memberId && Number(memberId) > 0) {
    payload.member_id = Number(memberId);
  }

  if (
    managedByMemberId &&
    Number(managedByMemberId) > 0
  ) {
    payload.managed_by_member_id = Number(
      managedByMemberId
    );
  } else if (
    memberId &&
    Number(memberId) > 0
  ) {
    payload.managed_by_member_id =
      Number(memberId);
  }

  if (patientId && Number(patientId) > 0) {
    payload.patient_id = Number(patientId);
  }

  if (nicNo && String(nicNo).trim() !== '') {
    payload.nic_no = String(nicNo)
      .trim()
      .toUpperCase();
  }

  return request('register_patient.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addFamilyMember({
  managedByMemberId,
  fullName,
  dateOfBirth,
  gender,
  relationshipToUser = 'Child',
  email = '',
  phone = '',
  homeAddress = '',
  city = '',
  postalCode = '',
  bloodGroup = '',
  emergencyContact = '',
  allergies = '',
  existingDiseases = '',
  currentMedications = '',
  nicNo = '',
}) {
  return registerPatient({
    memberId: managedByMemberId,
    managedByMemberId,
    fullName,
    dateOfBirth,
    gender,
    relationshipToUser,
    email,
    phone,
    homeAddress,
    city,
    postalCode,
    bloodGroup,
    emergencyContact,
    allergies,
    existingDiseases,
    currentMedications,
    nicNo,
  });
}

export async function getAllPatients(
  providerId = null,
  { role = 'Doctor' } = {}
) {
  if (!providerId || Number(providerId) <= 0) {
    return request('get_all_patients.php', {
      method: 'GET',
    });
  }

  const normalizedRole = role.toLowerCase();

  return request(
    `get_all_patients.php?${buildQuery({
      role,
      ...(normalizedRole === 'doctor'
        ? { member_id: providerId }
        : { user_id: providerId }),
    })}`,
    {
      method: 'GET',
    }
  );
}

export async function doctorAddPatient({
  doctorMemberId,
  fullName,
  dateOfBirth,
  gender,
  email,
  phone,
  homeAddress,
  nicNo = '',
}) {
  return request('doctor_add_patient.php', {
    method: 'POST',
    body: JSON.stringify({
      doctor_member_id: doctorMemberId,
      full_name: String(fullName ?? '').trim(),
      date_of_birth: String(
        dateOfBirth ?? ''
      ).trim(),
      gender: String(gender ?? '').trim(),
      email: String(email ?? '').trim(),
      phone: String(phone ?? '').trim(),
      home_address: String(
        homeAddress ?? ''
      ).trim(),
      nic_no: String(nicNo ?? '')
        .trim()
        .toUpperCase(),
    }),
  });
}

// ============================================================
// APPOINTMENTS
// ============================================================

/**
 * Creates a care request / appointment.
 * IMPORTANT: In create_appointment.php, if `member_id` is sent (> 0),
 * the backend overwrites `patient_id` with the Self patient profile.
 * Therefore, just like Flutter's AuthService.createAppointment, we send
 * `patient_id` when available and only send `member_id` as a fallback.
 */
export async function createAppointment({
  memberId = null,
  patientId = null,
  serviceType,
  diseaseDescription = '',
  symptoms,
  urgencyLevel,
  preferredTime,
  deliveryAddress,
  latitude = null,
  longitude = null,
  emergencyContact = '',
}) {
  const resolvedPatientId = Number(
    patientId || 0
  );
  const resolvedMemberId = Number(
    memberId || 0
  );

  const payload = {
    service_type: serviceType,
    disease_description: diseaseDescription,
    symptoms,
    urgency_level: urgencyLevel,
    preferred_time: preferredTime,
    delivery_address: deliveryAddress,
    delivery_latitude: latitude,
    delivery_longitude: longitude,
    emergency_contact: emergencyContact,
  };

  if (resolvedPatientId > 0) {
    payload.patient_id = resolvedPatientId;
  } else if (resolvedMemberId > 0) {
    payload.member_id = resolvedMemberId;
  }

  return request('create_appointment.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPatientAppointments(
  patientId
) {
  return request(
    `get_patient_appointments.php?${buildQuery({
      patient_id: patientId,
    })}`,
    {
      method: 'GET',
    }
  );
}

export async function getAvailableAppointments({
  role = 'Doctor',
  userId = null,
  memberId = null,
}) {
  const resolvedMemberId = memberId ?? userId;

  return request(
    `get_available_appointments.php?${buildQuery(
      {
        role,
        member_id: resolvedMemberId,
      }
    )}`,
    {
      method: 'GET',
    }
  );
}

export async function submitBid({
  appointmentId,
  providerUserId = null,
  providerMemberId = null,
  proposedFee,
  estimatedArrivalTime,
  providerNote = '',
}) {
  const resolvedMemberId =
    providerMemberId ?? providerUserId;

  return request('submit_bid.php', {
    method: 'POST',
    body: JSON.stringify({
      appointment_id: appointmentId,
      provider_member_id: resolvedMemberId,
      proposed_fee: proposedFee,
      estimated_arrival_time:
        estimatedArrivalTime,
      provider_note: providerNote,
    }),
  });
}

export async function getAppointmentBids(
  appointmentId
) {
  return request(
    `get_appointment_bids.php?${buildQuery({
      appointment_id: appointmentId,
    })}`,
    {
      method: 'GET',
    }
  );
}

export async function acceptBid({
  appointmentId,
  bidId,
  providerUserId = null,
}) {
  const body = {
    appointment_id: appointmentId,
    bid_id: bidId,
  };

  if (
    providerUserId !== null &&
    Number(providerUserId) > 0
  ) {
    body.provider_user_id = providerUserId;
  }

  return request('accept_bid.php', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getProviderAppointments(
  providerId,
  { useMemberId = true } = {}
) {
  return request(
    `get_provider_appointments.php?${buildQuery(
      useMemberId
        ? {
            provider_member_id: providerId,
          }
        : {
            provider_id: providerId,
          }
    )}`,
    {
      method: 'GET',
    }
  );
}

export async function markAppointmentArrived({
  appointmentId,
  patientId,
}) {
  return request(
    'mark_appointment_arrived.php',
    {
      method: 'POST',
      body: JSON.stringify({
        appointment_id: appointmentId,
        patient_id: patientId,
      }),
    }
  );
}

export async function startConsultation({
  appointmentId,
  providerMemberId,
}) {
  return request('start_consultation.php', {
    method: 'POST',
    body: JSON.stringify({
      appointment_id: appointmentId,
      provider_member_id: providerMemberId,
    }),
  });
}

export async function completeAppointment({
  appointmentId,
  role = '',
  completedByRole = '',
  providerId = null,
  providerMemberId = null,
  patientId = null,
}) {
  const effectiveRole = role || completedByRole || (patientId ? 'Patient' : 'Doctor');
  const normalizedRole = String(effectiveRole).toLowerCase();
  const effectiveProviderId = providerMemberId ?? providerId;

  const body = {
    appointment_id: appointmentId,
    role: effectiveRole,
  };

  if (normalizedRole === 'patient') {
    body.patient_id = patientId;
  } else if (normalizedRole === 'doctor') {
    body.provider_member_id = effectiveProviderId;
  } else if (normalizedRole === 'nurse') {
    body.provider_id = effectiveProviderId;
  }

  return request('complete_appointment.php', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ============================================================
// PRESCRIPTIONS
// ============================================================

export async function createPrescription({
  patientId,
  providerId,
  providerMemberId = null,
  providerName,
  providerRole,
  medicine = '',
  instruction = '',
  duration = '',
  notes = '',
  consultationFee = 0,
  items = [],
}) {
  const normalizedRole = String(
    providerRole || 'Doctor'
  ).toLowerCase();

  const resolvedProviderId =
    providerMemberId ?? providerId;

  const body = {
    patient_id: patientId,
    provider_name: providerName,
    provider_role: providerRole,
    medicine: String(medicine ?? '').trim(),
    instruction: String(
      instruction ?? ''
    ).trim(),
    duration: String(duration ?? '').trim(),
    notes: String(notes ?? '').trim(),
    consultation_fee:
      Number(consultationFee) || 0,
  };

  if (
    Array.isArray(items) &&
    items.length > 0
  ) {
    body.items = items.map((item) => ({
      drug_id: Number(item.drug_id) || 0,
      dosage: String(
        item.dosage ?? ''
      ).trim(),
      frequency: String(
        item.frequency ?? ''
      ).trim(),
      instruction: String(
        item.instruction ?? ''
      ).trim(),
      duration: String(
        item.duration ?? ''
      ).trim(),
    }));
  }

  if (normalizedRole === 'doctor') {
    body.provider_member_id =
      resolvedProviderId;
  } else {
    body.provider_id = resolvedProviderId;
  }

  return request('create_prescription.php', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getPrescriptions(
  patientId
) {
  return request(
    `get_prescriptions.php?${buildQuery({
      patient_id: patientId,
    })}`,
    {
      method: 'GET',
    }
  );
}

export async function getProviderPrescriptions(
  providerId,
  { role = 'Doctor' } = {}
) {
  const normalizedRole = role.toLowerCase();

  return request(
    `get_provider_prescriptions.php?${buildQuery(
      {
        role,
        ...(normalizedRole === 'doctor'
          ? {
              provider_member_id: providerId,
            }
          : {
              provider_id: providerId,
            }),
      }
    )}`,
    {
      method: 'GET',
    }
  );
}

// ============================================================
// DOCTOR MEDICINES
// ============================================================

export async function getDoctorDrugs({
  providerMemberId,
  search = '',
}) {
  const doctorMemberId = Number(
    providerMemberId
  );

  if (
    !Number.isInteger(doctorMemberId) ||
    doctorMemberId <= 0
  ) {
    return {
      success: false,
      drugs: [],
      message:
        'Valid doctor member ID is required',
    };
  }

  const cleanSearch = String(
    search ?? ''
  ).trim();

  const result = await request(
    `get_doctor_drugs.php?${buildQuery({
      provider_member_id: doctorMemberId,
      ...(cleanSearch
        ? { q: cleanSearch }
        : {}),
    })}`,
    {
      method: 'GET',
    }
  );

  return {
    ...result,
    drugs: Array.isArray(result?.drugs)
      ? result.drugs
      : [],
  };
}

export async function searchDrugs({
  providerMemberId,
  search = '',
}) {
  const doctorMemberId = Number(
    providerMemberId
  );

  if (
    !Number.isInteger(doctorMemberId) ||
    doctorMemberId <= 0
  ) {
    return {
      success: false,
      drugs: [],
      message:
        'Valid doctor member ID is required',
    };
  }

  const cleanSearch = String(
    search ?? ''
  ).trim();

  const result = await request(
    `search_drugs.php?${buildQuery({
      provider_member_id: doctorMemberId,
      ...(cleanSearch
        ? { q: cleanSearch }
        : {}),
    })}`,
    {
      method: 'GET',
    }
  );

  return {
    ...result,
    drugs: Array.isArray(result?.drugs)
      ? result.drugs
      : [],
  };
}

export async function addDoctorDrug({
  providerMemberId,
  drugName,
  genericName,
  unitPrice = 0,
}) {
  const doctorMemberId = Number(
    providerMemberId
  );

  const cleanDrugName = String(
    drugName ?? ''
  ).trim();

  const cleanGenericName = String(
    genericName ?? ''
  ).trim();

  if (
    !Number.isInteger(doctorMemberId) ||
    doctorMemberId <= 0
  ) {
    return {
      success: false,
      message:
        'Valid doctor member ID is required',
    };
  }

  if (!cleanDrugName) {
    return {
      success: false,
      message: 'Medicine name is required',
    };
  }

  if (!cleanGenericName) {
    return {
      success: false,
      message: 'Generic name is required',
    };
  }

  return request('add_doctor_drug.php', {
    method: 'POST',
    body: JSON.stringify({
      provider_member_id: doctorMemberId,
      drug_name: cleanDrugName,
      generic_name: cleanGenericName,
      unit_price: Math.max(
        0,
        Number(unitPrice) || 0
      ),
    }),
  });
}

// ============================================================
// INVOICES / PAYMENTS
// ============================================================

export async function createInvoice({
  appointmentId,
  providerMemberId,
}) {
  return request('create_invoice.php', {
    method: 'POST',
    body: JSON.stringify({
      appointment_id: appointmentId,
      provider_member_id: providerMemberId,
    }),
  });
}

export async function getPatientInvoices(
  patientId
) {
  return request(
    `get_patient_invoices.php?${buildQuery({
      patient_id: patientId,
    })}`,
    {
      method: 'GET',
    }
  );
}

export async function markInvoicePaid({
  invoiceId,
  patientId,
  paymentMethod,
}) {
  return request('mark_invoice_paid.php', {
    method: 'POST',
    body: JSON.stringify({
      invoice_id: invoiceId,
      patient_id: patientId,
      payment_method: paymentMethod,
    }),
  });
}

// ============================================================
// MEDICAL DOCUMENTS (ONLY ENDPOINTS THAT USE X-Session-Token)
// ============================================================

export async function listMedicalDocuments(
  patientId,
  sessionToken = null
) {
  const token = (
    sessionToken ?? getSessionToken()
  ).trim();

  if (!token) {
    return {
      success: false,
      documents: [],
      message:
        'Session token is missing. Please log out and sign in again to access medical documents.',
    };
  }

  return request(
    `list_medical_documents.php?${buildQuery({
      patient_id: patientId,
    })}`,
    {
      method: 'GET',
      headers: {
        'X-Session-Token': token,
      },
    }
  );
}

export const getMedicalDocuments =
  listMedicalDocuments;

export async function uploadMedicalDocument({
  patientId,
  file,
  sessionToken = null,
}) {
  const token = (
    sessionToken ?? getSessionToken()
  ).trim();

  if (!token) {
    return {
      success: false,
      message:
        'Session token is missing. Please log out and sign in again to upload medical documents.',
    };
  }

  if (!(file instanceof Blob)) {
    return {
      success: false,
      message:
        'Please select a valid document file (PDF, JPG, or PNG).',
    };
  }

  const formData = new FormData();
  formData.append(
    'patient_id',
    String(patientId)
  );
  formData.append(
    'document',
    file,
    file.name || 'medical_document.pdf'
  );

  return request(
    'upload_medical_document.php',
    {
      method: 'POST',
      headers: {
        'X-Session-Token': token,
      },
      body: formData,
    }
  );
}

export async function getMedicalDocumentFile(
  documentId,
  sessionToken = null
) {
  const token = (
    sessionToken ?? getSessionToken()
  ).trim();

  if (!token) {
    return {
      success: false,
      message:
        'Session token is missing. Please log out and sign in again to view medical documents.',
    };
  }

  try {
    // IMPORTANT: get_medical_document.php only allows headers `Accept, X-Session-Token`
    const response = await fetch(
      `${API_BASE_URL}/get_medical_document.php?${buildQuery(
        {
          document_id: documentId,
        }
      )}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: '*/*',
          'X-Session-Token': token,
        },
      }
    );

    const contentType =
      response.headers.get('content-type') ||
      'application/octet-stream';

    if (
      !response.ok ||
      contentType.includes('application/json')
    ) {
      const text = await response.text();
      let parsed = {};
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        // ignore JSON parse failure
      }

      return {
        success: false,
        message:
          parsed.message ||
          `Failed to load document (HTTP ${response.status})`,
        http_status: response.status,
      };
    }

    const blob = await response.blob();
    const disposition =
      response.headers.get(
        'content-disposition'
      ) || '';
    const match = disposition.match(
      /filename="?([^"]+)"?/i
    );
    const filename = match?.[1] || '';

    return {
      success: true,
      blob,
      contentType,
      filename,
    };
  } catch (error) {
    return {
      success: false,
      message: `Network error: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    };
  }
}

export async function deleteMedicalDocument(
  documentId,
  sessionToken = null
) {
  const token = (
    sessionToken ?? getSessionToken()
  ).trim();

  if (!token) {
    return {
      success: false,
      message:
        'Session token is missing. Please log out and sign in again to delete medical documents.',
    };
  }

  const body = new URLSearchParams();
  body.set(
    'document_id',
    String(documentId)
  );

  return request(
    'delete_medical_document.php',
    {
      method: 'POST',
      headers: {
        'X-Session-Token': token,
      },
      body,
    }
  );
}

// ============================================================
// UPLOAD URL RESOLUTION HELPER
// ============================================================

export function resolveUploadUrl(
  filePath,
  defaultSubdir = 'uploads/doctors/'
) {
  if (
    filePath === null ||
    filePath === undefined
  ) {
    return '';
  }

  const raw = String(filePath)
    .trim()
    .replace(/\\/g, '/');

  if (
    !raw ||
    raw.toLowerCase() === 'null' ||
    raw.toLowerCase() === 'undefined'
  ) {
    return '';
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const cleaned = raw.replace(/^\/+/, '');

  if (cleaned.startsWith('uploads/')) {
    return `${API_ROOT_URL}/${cleaned}`;
  }

  const prefix = String(defaultSubdir || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  return prefix
    ? `${API_ROOT_URL}/${prefix}/${cleaned}`
    : `${API_ROOT_URL}/${cleaned}`;
}
