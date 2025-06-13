
export class ReportService {
  static async generateReport(query: string, providerId: string) {
    // Mock implementation
    return {
      id: Date.now().toString(),
      title: 'Relatório Gerado',
      content: `Relatório baseado na consulta: ${query}`,
      created_at: new Date().toISOString(),
      provider_id: providerId
    };
  }

  static async getReportHistory() {
    // Mock implementation
    return [];
  }
}
