
import jsPDF from 'jspdf';

export interface ReportData {
  title: string;
  category: string;
  description: string;
  data: any[];
  generatedAt: Date;
  summary?: {
    totalConversations?: number;
    resolvedConversations?: number;
    pendingConversations?: number;
    averageResponseTime?: string;
    totalExams?: number;
    completedExams?: number;
    canceledExams?: number;
    averageWaitTime?: string;
    systemUptime?: string;
    averageLoadTime?: string;
    totalRequests?: number;
    errorRate?: string;
    totalUsers?: number;
    activeUsers?: number;
    averageSessionTime?: string;
    mostActiveUser?: string;
    totalChannels?: number;
    activeChannels?: number;
    mostActiveChannel?: string;
    leastActiveChannel?: string;
  };
  charts?: {
    channels?: Array<{ name: string; conversations: number; resolved?: number; percentage?: number }>;
    examTypes?: Array<{ type: string; count: number; percentage: number }>;
    users?: Array<{ name: string; sessions: number; hours: number }>;
    metrics?: Array<{ metric: string; value: string; status: string }>;
  };
}

export class EnhancedReportPDFService {
  static generatePDF(reportData: ReportData): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 30;

    // Header igual ao preview
    this.addHeader(doc, reportData, pageWidth);
    yPosition = 70;

    // Resumo Executivo igual ao preview
    if (reportData.summary) {
      yPosition = this.addExecutiveSummary(doc, reportData.summary, pageWidth, yPosition, reportData.category);
      yPosition += 20;
    }

    // Análise Gráfica igual ao preview
    if (reportData.charts) {
      yPosition = this.addChartsSection(doc, reportData.charts, pageWidth, yPosition, reportData.category);
      yPosition += 20;
    }

    // Dados Detalhados igual ao preview
    if (reportData.data && reportData.data.length > 0) {
      this.addDataTable(doc, reportData.data, pageWidth, yPosition, pageHeight);
    }

    return doc;
  }

  private static addHeader(doc: jsPDF, reportData: ReportData, pageWidth: number) {
    // Background cinza claro no header
    doc.setFillColor(248, 250, 252); // bg-slate-50
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Título principal
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Preview: ${reportData.title}`, 20, 25);
    
    // Descrição
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(reportData.description, 20, 38);

    // Botão Baixar PDF simulado
    doc.setFillColor(181, 16, 60); // bg-[#b5103c]
    doc.roundedRect(pageWidth - 70, 10, 50, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('↓ Baixar PDF', pageWidth - 62, 25);
  }

  private static addExecutiveSummary(doc: jsPDF, summary: any, pageWidth: number, yPosition: number, category: string): number {
    // Ícone e título igual ao preview
    doc.setTextColor(181, 16, 60); // text-[#b5103c]
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('📈 Resumo Executivo', 20, yPosition);
    yPosition += 20;

    // Cards de métricas em layout horizontal
    const cardWidth = (pageWidth - 60) / 3;
    let xPosition = 20;

    if (category === 'Conversas') {
      this.addMetricCard(doc, 'Total de Conversas', summary.totalConversations?.toString() || '176', xPosition, yPosition, cardWidth);
      this.addMetricCard(doc, 'Resolvidas', summary.resolvedConversations?.toString() || '143', xPosition + cardWidth + 10, yPosition, cardWidth, true);
      this.addMetricCard(doc, 'Tempo Médio', summary.averageResponseTime || '4.4min', xPosition + (cardWidth + 10) * 2, yPosition, cardWidth);
    }

    return yPosition + 50;
  }

  private static addMetricCard(doc: jsPDF, title: string, value: string, x: number, y: number, width: number, isSuccess = false) {
    // Card com fundo branco e borda
    doc.setFillColor(255, 255, 255); // bg-white
    doc.setDrawColor(229, 231, 235); // border-gray-200
    doc.roundedRect(x, y, width, 40, 5, 5, 'FD');

    // Título do card
    doc.setTextColor(107, 114, 128); // text-gray-500
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(title, x + 8, y + 15);

    // Valor com cor condicional
    if (isSuccess) {
      doc.setTextColor(34, 197, 94); // text-green-500
    } else {
      doc.setTextColor(15, 23, 42); // text-slate-900
    }
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(value, x + 8, y + 30);
  }

  private static addChartsSection(doc: jsPDF, charts: any, pageWidth: number, yPosition: number, category: string): number {
    // Título da seção
    doc.setTextColor(181, 16, 60);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('📊 Análise Gráfica', 20, yPosition);
    yPosition += 20;

    if (charts.channels && charts.channels.length > 0) {
      yPosition = this.addChannelsChart(doc, charts.channels, pageWidth, yPosition);
    }

    return yPosition;
  }

  private static addChannelsChart(doc: jsPDF, channels: any[], pageWidth: number, yPosition: number): number {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Conversas por Canal', 20, yPosition);
    yPosition += 15;

    const maxConversations = Math.max(...channels.map(c => c.conversations));
    
    channels.forEach((channel, index) => {
      const barY = yPosition + (index * 15);
      
      // Nome do canal
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(channel.name, 20, barY + 8);

      // Barra vermelha igual ao preview
      const barWidth = (channel.conversations / maxConversations) * 80;
      doc.setFillColor(181, 16, 60); // bg-[#b5103c]
      doc.roundedRect(120, barY + 2, barWidth, 8, 2, 2, 'F');

      // Valor
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, 'bold');
      doc.text(channel.conversations.toString(), 120 + barWidth + 10, barY + 8);
    });

    return yPosition + (channels.length * 15) + 15;
  }

  private static addDataTable(doc: jsPDF, data: any[], pageWidth: number, yPosition: number, pageHeight: number): number {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 30;
    }

    // Título da seção
    doc.setTextColor(181, 16, 60);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('🕘 Dados Detalhados', 20, yPosition);
    yPosition += 20;

    const headers = Object.keys(data[0]);
    const columnWidth = (pageWidth - 40) / headers.length;

    // Headers da tabela com fundo cinza
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'D');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    
    headers.forEach((header, index) => {
      const headerText = header.charAt(0).toUpperCase() + header.slice(1).replace('_', ' ');
      doc.text(headerText, 25 + (index * columnWidth), yPosition + 5);
    });
    yPosition += 18;

    // Dados da tabela com linhas alternadas
    doc.setFont(undefined, 'normal');
    doc.setTextColor(15, 23, 42);
    
    data.slice(0, 1).forEach((row, rowIndex) => {
      // Linha com fundo alternado
      if (rowIndex % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, yPosition - 3, pageWidth - 40, 12, 'F');
      }

      headers.forEach((header, colIndex) => {
        const value = row[header] || '-';
        const text = String(value).substring(0, 15);
        doc.text(text, 25 + (colIndex * columnWidth), yPosition + 5);
      });
      yPosition += 12;
    });

    return yPosition + 20;
  }

  static downloadPDF(doc: jsPDF, filename: string) {
    doc.save(`${filename}.pdf`);
  }

  static generateMockData(reportType: string): ReportData {
    const baseData = {
      'conversations-daily': {
        title: 'Relatório de Conversas Diárias',
        category: 'Conversas',
        description: 'Análise detalhada das conversas registradas no sistema por dia',
        data: [
          { canal: 'Canarana', conversas: 45, resolvidas: 38, pendentes: 7, tempo_medio: '4.2min' }
        ],
        summary: {
          totalConversations: 176,
          resolvedConversations: 143,
          pendingConversations: 33,
          averageResponseTime: '4.4min'
        },
        charts: {
          channels: [
            { name: 'Canarana', conversations: 45 },
            { name: 'Souto Soares', conversations: 52 },
            { name: 'João Dourado', conversations: 38 },
            { name: 'América Dourada', conversations: 41 }
          ]
        },
        generatedAt: new Date()
      }
    };

    return baseData[reportType as keyof typeof baseData] || baseData['conversations-daily'];
  }
}
