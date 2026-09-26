export const APP_CONFIG = {
  pagination: {
    defaultPage: 1,
    defaultLimit: 25,
    maxLimit: 100,
  },
  session: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
  },
  security: {
    bcryptRounds: 10,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
} as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const DOCUMENT_TYPES = [
  'aadhaar',
  'pan',
  'passport',
  'driving_license',
  'voter_id',
  'bank_passbook',
  'medical_certificate',
  'police_verification',
  'education_certificate',
  'experience_letter',
  'photo',
  'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
