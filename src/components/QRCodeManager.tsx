
import React from 'react';
import { QRCodeManagerFixed } from './QRCodeManagerFixed';

interface QRCodeManagerProps {
  isDarkMode: boolean;
  channelId: string;
}

export const QRCodeManager: React.FC<QRCodeManagerProps> = (props) => {
  return <QRCodeManagerFixed {...props} />;
};
