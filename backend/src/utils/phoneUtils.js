import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

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
 * Normalizes and validates any telephone input into standard E.164 format (+919876543210).
 * Handles partial inputs, national numbers, and international prefixes.
 *
 * @param {string} rawNumber
 * @param {string} defaultCountry
 * @returns {{ isValid: boolean, e164: string, formatted: string, country: string, error?: string }}
 */
export function normalizePhone(rawNumber, defaultCountry = 'IN') {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return { isValid: false, e164: '', formatted: '', country: defaultCountry, error: 'Phone number is required' };
  }

  const cleaned = rawNumber.trim();
  try {
    const phoneNumber = parsePhoneNumberFromString(cleaned, defaultCountry);
    if (phoneNumber && phoneNumber.isValid()) {
      return {
        isValid: true,
        e164: phoneNumber.number, // e.g. "+919876543210"
        formatted: phoneNumber.formatInternational(), // e.g. "+91 98765 43210"
        national: phoneNumber.formatNational(),
        country: phoneNumber.country || defaultCountry,
      };
    }
  } catch (err) {
    // Fall through to manual fallback validation
  }

  // Graceful fallback for numbers with standard lengths
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('+') && digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    return {
      isValid: true,
      e164: `+${digitsOnly}`,
      formatted: `+${digitsOnly}`,
      country: defaultCountry,
    };
  }

  // If provided as 10 digits without + and default country is IN
  if (digitsOnly.length === 10 && defaultCountry === 'IN') {
    return {
      isValid: true,
      e164: `+91${digitsOnly}`,
      formatted: `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`,
      country: 'IN',
    };
  }

  return {
    isValid: false,
    e164: '',
    formatted: cleaned,
    country: defaultCountry,
    error: 'Please enter a valid phone number with country code',
  };
}

