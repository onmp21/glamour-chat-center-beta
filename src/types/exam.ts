
export interface ExamRecord {
  id: string;
  pacienteName: string;
  celular: string;
  instagram?: string;
  cidade: 'Canarana' | 'Souto Soares' | 'João Dourado' | 'América Dourada';
  dataExame: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  createdAt: string;
}

export interface ExamFormData {
  pacienteName: string;
  celular: string;
  instagram?: string;
  cidade: 'Canarana' | 'Souto Soares' | 'João Dourado' | 'América Dourada';
  dataAgendamento: Date;
  tipoExame: string;
  observacoes?: string;
}
