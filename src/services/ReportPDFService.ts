
import jsPDF from 'jspdf';

export interface ReportData {
  title: string;
  category: string;
  description: string;
  data: any[];
  generatedAt: Date;
}

export class ReportPDFService {
  static generatePDF(reportData: ReportData): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(reportData.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Subtitle
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Categoria: ${reportData.category}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Gerado em: ${reportData.generatedAt.toLocaleDateString('pt-BR')} às ${reportData.generatedAt.toLocaleTimeString('pt-BR')}`, 20, yPosition);
    yPosition += 15;

    // Description
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Descrição:', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const descriptionLines = doc.splitTextToSize(reportData.description, pageWidth - 40);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 5 + 10;

    // Data section
    if (reportData.data && reportData.data.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Dados do Relatório:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      // Table headers
      const headers = Object.keys(reportData.data[0]);
      let xPosition = 20;
      const columnWidth = (pageWidth - 40) / headers.length;

      // Draw headers
      doc.setFont(undefined, 'bold');
      headers.forEach((header, index) => {
        doc.text(header, xPosition + (index * columnWidth), yPosition);
      });
      yPosition += 8;

      // Draw line under headers
      doc.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
      yPosition += 3;

      // Draw data rows
      doc.setFont(undefined, 'normal');
      reportData.data.slice(0, 25).forEach((row, rowIndex) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        headers.forEach((header, colIndex) => {
          const value = row[header] || '-';
          const text = String(value).substring(0, 20);
          doc.text(text, xPosition + (colIndex * columnWidth), yPosition);
        });
        yPosition += 6;
      });

      if (reportData.data.length > 25) {
        yPosition += 10;
        doc.text(`... e mais ${reportData.data.length - 25} registros`, 20, yPosition);
      }
    }

    // Footer - corrigindo o método para a versão atual do jsPDF
    const totalPages = (doc as any).internal.pages.length - 1; // Correção para a API atual
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
      doc.text('Gerado pelo Sistema de Atendimento', 20, pageHeight - 10);
    }

    return doc;
  }

  static downloadPDF(doc: jsPDF, filename: string) {
    doc.save(`${filename}.pdf`);
  }

  static async generateReportWithRealData(reportId: string, supabase: any): Promise<ReportData> {
    const reportConfigs = {
      'conversations-daily': {
        title: 'Relatório de Conversas Diárias',
        category: 'Conversas',
        description: 'Análise detalhada das conversas registradas no sistema por dia',
        query: () => supabase.from('canarana_conversas').select('*').order('id', { ascending: false }).limit(100)
      },
      'conversations-channel': {
        title: 'Relatório por Canal',
        category: 'Conversas',
        description: 'Distribuição e performance das conversas por canal de atendimento',
        query: () => supabase.from('canarana_conversas').select('*').order('id', { ascending: false }).limit(100)
      },
      'exams-monthly': {
        title: 'Relatório Mensal de Exames',
        category: 'Exames',
        description: 'Estatísticas completas dos exames agendados e realizados no período',
        query: () => supabase.from('exams').select('patient_name, city, appointment_date, status, exam_type').order('appointment_date', { ascending: false }).limit(100)
      },
      'users-activity': {
        title: 'Relatório de Atividade dos Usuários',
        category: 'Equipe',
        description: 'Métricas de produtividade e atividade dos membros da equipe',
        query: () => supabase.from('user_profiles').select('*').limit(50)
      },
      'satisfaction-analysis': {
        title: 'Análise de Satisfação',
        category: 'Qualidade',
        description: 'Análise detalhada da satisfação baseada em feedbacks e avaliações',
        query: () => supabase.from('canarana_conversas').select('*').order('id', { ascending: false }).limit(100)
      },
      'performance-trends': {
        title: 'Tendências de Performance',
        category: 'Análise',
        description: 'Análise de tendências e padrões de performance ao longo do tempo',
        query: () => supabase.from('canarana_conversas').select('*').order('id', { ascending: false }).limit(100)
      }
    };

    const config = reportConfigs[reportId as keyof typeof reportConfigs];
    if (!config) {
      throw new Error(`Configuração de relatório não encontrada para: ${reportId}`);
    }

    const { data, error } = await config.query();
    if (error) {
      console.error('Erro ao buscar dados:', error);
      throw error;
    }

    return {
      title: config.title,
      category: config.category,
      description: config.description,
      data: data || [],
      generatedAt: new Date()
    };
  }
}
