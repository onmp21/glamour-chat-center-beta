
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, RotateCcw } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string;
  instanceName: string;
  loading: boolean;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onOpenChange,
  qrCode,
  instanceName,
  loading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 p-4">
          {loading ? (
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4 animate-spin" />
              <span>Gerando QR Code...</span>
            </div>
          ) : qrCode ? (
            <>
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64 border border-gray-300 rounded-lg"
              />
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Escaneie com seu WhatsApp</p>
                <p className="text-xs text-gray-500">Instância: {instanceName}</p>
                <p className="text-xs text-gray-400">QR Code expira em alguns minutos</p>
              </div>
            </>
          ) : (
            <p className="text-red-500">Erro ao carregar QR Code</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
