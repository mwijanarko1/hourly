/**
 * Validate checklist item text
 */
export function validateChecklistItem(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Checklist item cannot be empty' };
  }
  
  if (text.trim().length > 200) {
    return { isValid: false, error: 'Checklist item must be less than 200 characters' };
  }
  
  return { isValid: true };
}

/**
 * Sanitize text input
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
