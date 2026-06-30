export function normalizePhoneNumber(value: string) {
  const compact = value.replace(/[\s().-]/g, "");
  if (compact.startsWith("+")) return compact;
  if (/^\d{10}$/.test(compact)) return `+91${compact}`;
  if (/^91\d{10}$/.test(compact)) return `+${compact}`;
  return compact;
}

export function isValidPhoneNumber(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export function normalizeAndValidatePhoneNumber(value: string) {
  const phone = normalizePhoneNumber(value.trim());
  return isValidPhoneNumber(phone) ? phone : null;
}
