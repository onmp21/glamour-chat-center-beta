import React, { useState } from 'react';
import { ConversationStatsCardsRealtime } from './dashboard/ConversationStatsCardsRealtime';
import { ExamStatsCardsCompact } from './dashboard/ExamStatsCardsCompact';
import { ChannelsSection } from './dashboard/ChannelsSection';
import { RecentActivitiesSectionRealtime } from './dashboard/RecentActivitiesSectionRealtime';
import { ChatOverlay } from './mensagens/ChatOverlay';
import { cn } from '@/lib/utils';
import { useExams } from '@/hooks/useExams';
import { BarChart3 } from 'lucide-react';
interface DashboardProps {
  isDarkMode: boolean;
  onSectionSelect: (section: string) => void;
}
export const Dashboard: React.FC<DashboardProps> = ({
  isDarkMode,
  onSectionSelect
}) => {
  const {
    exams
  } = useExams();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const handleChannelClick = (channelId: string) => {
    console.log('🔥 Dashboard channel clicked:', channelId);
    setSelectedChannelId(channelId);
  };
  const handleCloseOverlay = () => {
    setSelectedChannelId(null);
  };

  // Calcular estatísticas de exames - SEM POLLING, apenas dados já carregados
  const examStats = {
    totalExams: exams.length,
    examsThisMonth: exams.filter(exam => {
      const examDate = new Date(exam.appointmentDate);
      const now = new Date();
      return examDate.getMonth() === now.getMonth() && examDate.getFullYear() === now.getFullYear();
    }).length,
    examsThisWeek: exams.filter(exam => {
      const examDate = new Date(exam.appointmentDate);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return examDate >= weekAgo && examDate <= now;
    }).length
  };
  return <div className={cn("h-full flex flex-col", isDarkMode ? "bg-[#09090b]" : "bg-gray-50")}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-full", isDarkMode ? "bg-[#27272a]" : "bg-[#b5103c]/10")}>
            <BarChart3 size={32} className="text-[#b5103c]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={cn("text-3xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>
              Painel de Controle
            </h1>
            <p className={cn("text-lg", isDarkMode ? "text-[#9ca3af]" : "text-gray-600")}>Gerencie suas conversas </p>
          </div>
        </div>
      </div>

      {/* Conteúdo - TODOS OS COMPONENTES USAM APENAS REALTIME */}
      <div className="flex-1 p-6 pt-0 space-y-6 overflow-auto">
        <div className="space-y-6">
          <ConversationStatsCardsRealtime isDarkMode={isDarkMode} />
          <ExamStatsCardsCompact isDarkMode={isDarkMode} totalExams={examStats.totalExams} examsThisMonth={examStats.examsThisMonth} examsThisWeek={examStats.examsThisWeek} />
          <ChannelsSection isDarkMode={isDarkMode} onChannelClick={handleChannelClick} />
          <RecentActivitiesSectionRealtime isDarkMode={isDarkMode} />
        </div>
      </div>
      
      {/* Chat Overlay */}
      {selectedChannelId && <ChatOverlay channelId={selectedChannelId} isDarkMode={isDarkMode} onClose={handleCloseOverlay} />}
    </div>;
};