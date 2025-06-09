
import React from 'react';
import { MensagensRefactored } from './mensagens/MensagensRefactored';

interface MensagensProps {
  isDarkMode: boolean;
  onSectionChange: (section: string) => void;
  initialChannel?: string | null;
  initialPhone?: string | null;
}

export const Mensagens: React.FC<MensagensProps> = (props) => {
  return <MensagensRefactored {...props} />;
};
