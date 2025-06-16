
export type ReportType = 'conversations' | 'channels' | 'exams' | 'custom';

export interface ReportFilters {
  channel_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  report_type: ReportType;
  custom_prompt?: string;
}
