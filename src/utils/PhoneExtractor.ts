
export class PhoneExtractor {
  static extractPhoneFromSessionId(sessionId: string): string {
    if (!sessionId) return '';
    // Remove sufixo @s.whatsapp.net ou outros, retorna só os dígitos
    const match = sessionId.match(/(\d{10,15})/);
    return match ? match[1] : sessionId.replace(/@.*$/, '');
  }

  static isValidPhoneNumber(phone: string): boolean {
    return /^\d{10,15}$/.test(phone);
  }
}
