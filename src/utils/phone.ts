/** India mobile country code (E.164). */
export const INDIA_COUNTRY_CODE = '+91';

/** Strip to up to 10 national digits for display/input (handles +91 / 91 prefixes). */
export function extractTenDigitMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function isValidIndianMobile10(value: string): boolean {
  return /^\d{10}$/.test(extractTenDigitMobile(value));
}

/** Format 10-digit national number as E.164 for the API (+91XXXXXXXXXX). */
export function formatIndianPhoneForApi(value: string): string {
  const ten = extractTenDigitMobile(value);
  if (!/^\d{10}$/.test(ten)) {
    return value.trim();
  }
  return `${INDIA_COUNTRY_CODE}${ten}`;
}
