// lib/featureFlags.js
// Mirrors where_is_my_doctor/frontend/lib/config/feature_flags.dart
// Controls visibility of temporarily hidden sections on the Patient Dashboard.

export const FeatureFlags = {
  // Ongoing Visit card on Patient Dashboard
  showOngoingVisitCard: false,

  // Search bar ("Search doctor, nurse, service...") on Patient Dashboard
  showProviderSearch: false,

  // "Nearby Doctors & Nurses" horizontal carousel on Patient Dashboard
  showNearbyProviders: false,

  // "Request Home Services" grid on Patient Dashboard
  showServiceRequestGrid: false,

  // "Reminders & Alerts" section on Patient Dashboard
  showRemindersAlerts: false,

  // "Pending Payments" card on Patient Dashboard
  // (Note: main Payments navigation tab remains visible)
  showPendingPayments: false,
};

export default FeatureFlags;

