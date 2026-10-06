/** Domain enums. Keep in sync with `healthmatrix-app/server/src/constants/index.ts`. */

export const SPECIALTIES = [
  "general_medicine",
  "diabetes_endocrinology",
  "cardiology",
  "paediatrics",
  "gynaecology",
  "dermatology",
  "psychiatry",
  "nutrition",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  general_medicine: "General medicine",
  diabetes_endocrinology: "Diabetes and endocrinology",
  cardiology: "Cardiology",
  paediatrics: "Paediatrics",
  gynaecology: "Gynaecology",
  dermatology: "Dermatology",
  psychiatry: "Psychiatry",
  nutrition: "Nutrition",
};

/**
 * More specialties offered as suggestions in onboarding. Doctors can also type their own; these
 * and typed ones are stored as written, the `SPECIALTIES` above as their keys.
 */
export const MORE_SPECIALTIES = [
  "Orthopaedics",
  "ENT (Otorhinolaryngology)",
  "Ophthalmology",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
  "Nephrology",
  "Urology",
  "Oncology",
  "General surgery",
  "Rheumatology",
  "Obstetrics",
  "Family medicine",
  "Geriatrics",
  "Radiology",
  "Pathology",
  "Anaesthesiology",
  "Physiotherapy",
  "Dentistry",
  "Ayurveda",
  "Homoeopathy",
] as const;

/** Languages suggested in onboarding: English and India's 22 scheduled languages. */
export const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Gujarati",
  "Punjabi",
  "Odia",
  "Urdu",
  "Assamese",
  "Bodo",
  "Dogri",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Manipuri",
  "Nepali",
  "Sanskrit",
  "Santali",
  "Sindhi",
] as const;

/** India's 28 states and 8 union territories. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const READING_FLAGS = ["normal", "watch", "borderline", "high", "low"] as const;

export const CONSULT_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;

export const CONSULT_MODES = ["video", "video_from_pod"] as const;

export const PRESCRIPTION_STATUSES = ["draft", "signed"] as const;

/** How the doctor gave Ekaay the prescription to draft. */
export const PRESCRIPTION_SOURCES = ["voice_note", "photo", "typed"] as const;

export const TEST_ORDER_STATUSES = ["awaiting_booking", "booked", "result_back", "reviewed"] as const;

export const ACCESS_STATUSES = ["pending", "active", "expired", "revoked"] as const;

/** Who shared the OTP that opened the record. */
export const ACCESS_APPROVERS = ["patient", "nominee"] as const;

export const PLAN_IDS = ["essential", "plus", "family", "senior_care", "community"] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const GENDERS = ["male", "female", "other"] as const;

export const RECORD_TYPES = ["pod_screening", "lab_report", "prescription", "vaccination"] as const;

/** How a record entered the locker. */
export const RECORD_SOURCES = ["pod", "upload", "whatsapp", "abha", "consult"] as const;

export const BOOKING_STATUSES = ["booked", "completed", "cancelled", "no_show"] as const;

export const POD_TIERS = ["arc_one", "arc_plus", "arc_pro", "arc_max"] as const;

export const POD_SITE_TYPES = [
  "residential_society",
  "corporate_campus",
  "clinic",
  "pharmacy",
  "community_centre",
  "government_health_centre",
] as const;

/** Where a QR code is carried. */
export const QR_CARRIERS = ["card", "lock_screen", "helmet_sticker", "tag"] as const;

export const QR_STATUSES = ["active", "revoked"] as const;

/** Fields a member can expose on the public emergency view (layer 1). */
export const EMERGENCY_FIELDS = [
  "photo",
  "bloodGroup",
  "allergies",
  "conditions",
  "medicines",
  "emergencyContacts",
  "organDonor",
  "insurance",
] as const;

export const ALERT_CHANNELS = ["sms", "whatsapp"] as const;

/** Kinds of app reminder. Keep in sync with `healthmatrix-app/src/server/constants.ts`. */
export const REMINDER_KINDS = ["medicine", "test", "vaccine"] as const;

export const VACCINE_ROUTES = ["intramuscular", "subcutaneous", "intradermal", "oral", "intranasal"] as const;

export const VACCINE_DOSE_UNITS = ["mL", "drops", "dose"] as const;

export const VACCINE_SITES = [
  "left_upper_arm",
  "right_upper_arm",
  "left_thigh",
  "right_thigh",
  "buttock",
] as const;

export const VACCINE_SCHEDULES = ["one_time", "recurring"] as const;

export const INTERVAL_UNITS = ["days", "weeks", "months", "years"] as const;

export const VACCINATION_STATUSES = ["draft", "scheduled", "cancelled"] as const;

/** Vaccines suggested on a prescription: India's UIP schedule and common IAP additions. Doctors can type others. */
export const VACCINE_SUGGESTIONS = [
  "BCG",
  "Hepatitis B",
  "OPV (oral polio)",
  "IPV (inactivated polio)",
  "Pentavalent (DPT-HepB-Hib)",
  "Hexavalent (DTaP-IPV-HepB-Hib)",
  "Rotavirus",
  "PCV (pneumococcal conjugate)",
  "PPSV23 (pneumococcal polysaccharide)",
  "MR (measles-rubella)",
  "MMR",
  "JE (Japanese encephalitis)",
  "DPT booster",
  "Tdap",
  "Td (tetanus-diphtheria)",
  "Typhoid conjugate",
  "Hepatitis A",
  "Varicella (chickenpox)",
  "HPV",
  "Influenza",
  "COVID-19",
  "Rabies",
  "Meningococcal",
  "Cholera",
  "Zoster (shingles)",
] as const;

/** Common brands in India for a suggested vaccine. A vaccine missing here just gets no suggestions. */
export const VACCINE_BRANDS: Partial<Record<(typeof VACCINE_SUGGESTIONS)[number], string[]>> = {
  "Hepatitis B": ["Engerix-B", "Genevac B", "Shanvac-B", "Revac-B"],
  "IPV (inactivated polio)": ["Imovax Polio", "Poliorix"],
  "Pentavalent (DPT-HepB-Hib)": ["Pentavac", "Easyfive-TT", "Pentaxim"],
  "Hexavalent (DTaP-IPV-HepB-Hib)": ["Hexaxim", "Infanrix Hexa"],
  Rotavirus: ["Rotavac", "Rotasiil", "Rotarix", "RotaTeq"],
  "PCV (pneumococcal conjugate)": ["Prevenar 13", "Pneumosil", "Synflorix", "Vaxneuvance"],
  "PPSV23 (pneumococcal polysaccharide)": ["Pneumovax 23"],
  MMR: ["Tresivac", "Priorix", "M-M-R II"],
  "MR (measles-rubella)": ["MR-VAC"],
  Tdap: ["Boostrix", "Adacel"],
  "Typhoid conjugate": ["Typbar-TCV", "ZyVac TCV", "Typhibev"],
  "Hepatitis A": ["Havrix", "Avaxim", "Biovac-A"],
  "Varicella (chickenpox)": ["Varivax", "Varilrix", "Nexipox"],
  HPV: ["Gardasil 9", "Gardasil", "Cervavac", "Cervarix"],
  Influenza: ["Vaxigrip Tetra", "Fluarix Tetra", "Influvac Tetra", "FluQuadri"],
  "COVID-19": ["Covishield", "Covaxin", "Corbevax"],
  Rabies: ["Rabipur", "Verorab", "Abhayrab", "Indirab"],
  Meningococcal: ["Menactra", "MenQuadfi"],
  "JE (Japanese encephalitis)": ["Jeev", "JENVAC", "Ixiaro"],
  "Zoster (shingles)": ["Shingrix"],
};
