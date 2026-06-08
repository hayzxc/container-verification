// Re-export from shared package for local convenience
export { normalizedContainerIdRegex, containerIdSchema } from "@container-verification/shared";

// ISO 6346 check digit validator (full standard implementation)
// Owner code (4 letters) + serial (6 digits) + check digit (1 digit)
export function validateIso6346CheckDigit(containerId: string): boolean {
  if (!/^[A-Z]{4}\d{7}$/.test(containerId)) return false;

  const charValues: Record<string, number> = {};
  let value = 0;
  for (let i = 0; i < 26; i++) {
    // A=10, B=12, C=13, ... (skip multiples of 11)
    value++;
    if (value % 11 === 0) value++;
    charValues[String.fromCharCode(65 + i)] = value;
  }
  for (let i = 0; i < 10; i++) {
    charValues[String(i)] = i;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = containerId[i];
    const weight = Math.pow(2, i);
    sum += (charValues[char] ?? 0) * weight;
  }

  const checkDigit = sum % 11 % 10;
  return checkDigit === parseInt(containerId[10], 10);
}
