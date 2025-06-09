
export class PhoneExtractor {
  static extractPhoneFromSessionId(sessionId: string): string {
    if (!sessionId) return '';
    
    const parts = sessionId.split('-');
    if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
      return parts[0];
    }
    
    const phoneMatch = sessionId.match(/(\d{10,15})/);
    return phoneMatch ? phoneMatch[1] : sessionId;
  }

  static isValidPhoneNumber(phone: string): boolean {
    return /^\d{10,15}$/.test(phone);
  }
}
