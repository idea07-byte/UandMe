import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const COUNTRY_CODES = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'QA', dialCode: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', dialCode: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', dialCode: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪' },
];

/**
 * Resolves any country identifier (ISO code 'IN', dial code '+91' or '91') to its 2-letter ISO code.
 */
export function getCountryIso(codeOrDial) {
  if (!codeOrDial) return 'IN';
  const clean = codeOrDial.toString().trim().toUpperCase();

  // 1. Direct ISO match (e.g. 'IN', 'US')
  const byCode = COUNTRY_CODES.find((c) => c.code === clean);
  if (byCode) return byCode.code;

  // 2. Dial code match (e.g. '+91', '91')
  const dial = clean.startsWith('+') ? clean : `+${clean}`;
  const byDial = COUNTRY_CODES.find((c) => c.dialCode === dial);
  if (byDial) return byDial.code;

  return 'IN';
}

/**
 * Resolves any country identifier to standard dial code (e.g. '+91').
 */
export function getDialCode(codeOrDial) {
  if (!codeOrDial) return '+91';
  const clean = codeOrDial.toString().trim();

  // 1. Dial code match
  const dial = clean.startsWith('+') ? clean : `+${clean}`;
  const byDial = COUNTRY_CODES.find((c) => c.dialCode === dial);
  if (byDial) return byDial.dialCode;

  // 2. ISO match
  const byCode = COUNTRY_CODES.find((c) => c.code.toUpperCase() === clean.toUpperCase());
  if (byCode) return byCode.dialCode;

  return dial;
}

/**
 * Normalizes and validates any telephone input into standard E.164 format (+919876543210).
 * Robust against ISO codes, dial codes ('+91', '91'), spaces, hyphens, and 10-digit national numbers.
 *
 * @param {string} rawNumber
 * @param {string} defaultCountry - Can be ISO 'IN' or dial code '+91' or '91'
 * @returns {{ isValid: boolean, e164: string, formatted: string, country: string, error?: string }}
 */
export function normalizePhone(rawNumber, defaultCountry = 'IN') {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return { isValid: false, e164: '', formatted: '', country: 'IN', error: 'Phone number is required' };
  }

  const cleaned = rawNumber.replace(/\u00A0/g, ' ').trim();
  const digitsOnly = cleaned.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 5) {
    return { isValid: false, e164: '', formatted: cleaned, country: 'IN', error: 'Please enter a valid phone number' };
  }

  const isoCountry = getCountryIso(defaultCountry);
  const dialCode = getDialCode(defaultCountry);
  const cleanDial = dialCode.replace('+', '');

  // Strip accidental leading zero (e.g. 06379756227 -> 6379756227)
  // or country code entered without plus (e.g. 916379756227 -> 6379756227)
  let effectiveDigits = digitsOnly;
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    effectiveDigits = digitsOnly.slice(1);
  } else if (cleanDial && digitsOnly.startsWith(cleanDial) && digitsOnly.length === cleanDial.length + 10) {
    effectiveDigits = digitsOnly.slice(cleanDial.length);
  }

  // 1. If user typed full number starting with +
  if (cleaned.startsWith('+')) {
    try {
      const phoneNumber = parsePhoneNumberFromString(cleaned);
      if (phoneNumber && phoneNumber.isValid()) {
        return {
          isValid: true,
          e164: phoneNumber.number,
          formatted: phoneNumber.formatInternational(),
          national: phoneNumber.formatNational(),
          country: phoneNumber.country || isoCountry,
        };
      }
    } catch {}

    if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
      return {
        isValid: true,
        e164: `+${digitsOnly}`,
        formatted: `+${digitsOnly}`,
        national: digitsOnly,
        country: isoCountry,
      };
    }
  }

  // 2. Try prepending dial code (+91...) with effective digits
  const withDialCode = `${dialCode}${effectiveDigits}`;
  try {
    const phoneNumberWithDial = parsePhoneNumberFromString(withDialCode);
    if (phoneNumberWithDial && phoneNumberWithDial.isValid()) {
      return {
        isValid: true,
        e164: phoneNumberWithDial.number,
        formatted: phoneNumberWithDial.formatInternational(),
        national: phoneNumberWithDial.formatNational(),
        country: phoneNumberWithDial.country || isoCountry,
      };
    }
  } catch {}

  // 3. Try parsing with ISO country context
  try {
    const phoneNumberIso = parsePhoneNumberFromString(effectiveDigits, isoCountry);
    if (phoneNumberIso && phoneNumberIso.isValid()) {
      return {
        isValid: true,
        e164: phoneNumberIso.number,
        formatted: phoneNumberIso.formatInternational(),
        national: phoneNumberIso.formatNational(),
        country: phoneNumberIso.country || isoCountry,
      };
    }
  } catch {}

  // 4. Standard 10-digit mobile numbers (e.g. India 6379756227, US, etc.)
  if (effectiveDigits.length === 10) {
    const formatted = isoCountry === 'IN'
      ? `${dialCode} ${effectiveDigits.slice(0, 5)} ${effectiveDigits.slice(5)}`
      : `${dialCode} (${effectiveDigits.slice(0, 3)}) ${effectiveDigits.slice(3, 6)}-${effectiveDigits.slice(6)}`;

    return {
      isValid: true,
      e164: `${dialCode}${effectiveDigits}`,
      formatted,
      national: effectiveDigits,
      country: isoCountry,
    };
  }

  // 5. Fallback for any international number 7-15 digits
  if (digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    return {
      isValid: true,
      e164: `${dialCode}${digitsOnly}`,
      formatted: `${dialCode} ${digitsOnly}`,
      national: digitsOnly,
      country: isoCountry,
    };
  }

  return {
    isValid: false,
    e164: '',
    formatted: cleaned,
    country: isoCountry,
    error: 'Please enter a valid phone number',
  };
}
