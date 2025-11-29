/**
 * Normalize a string by removing accents/diacritics
 * e.g., "Appétit" -> "Appetit"
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

/**
 * Check if two strings are equivalent when normalized
 */
export function areStringsEquivalent(str1: string, str2: string): boolean {
  return normalizeString(str1.toLowerCase()) === normalizeString(str2.toLowerCase());
}
