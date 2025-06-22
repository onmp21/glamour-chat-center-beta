
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Settings,
  Wifi,
  CheckCircle,
  RotateCcw,
  Plus,
  QrCode,
  Trash2,
  LogOut,
  Link,
  Unlink
} from 'lucide-react';
import { EvolutionApiService } from '@/services/EvolutionApiService';
import { useInternalChannels } from '@/hooks/useInternalChannels';
import { channelMappingService, ChannelInstanceMapping } from "@/services/ChannelInstanceMappingService";

interface ApiConnection {
  baseUrl: string;
  apiKey: string;
  isValidated: boolean;
  instances: Array<{
    instanceName: string;
    status: string;
    profileName?: string;
  }>;
}

interface QrCodeModal {
  isOpen: boolean;
  qrCode: string;
  instanceName: string;
  loading: boolean;
}

interface EvolutionApiSettingsProps {
  isDarkMode?: boolean;
  channelId?: string;
}

export const EvolutionApiSettings: React.FC<EvolutionApiSettingsProps> = ({ 
  isDarkMode = false,
  channelId = "default"
}) => {
  const { toast } = useToast();
  const { channels: availableChannels } = useInternalChannels();

  const [apiConnection, setApiConnection] = useState<ApiConnection>({
    baseUrl: '',
    apiKey: '',
    isValidated: false,
    instances: []
  });

  const [validatingApi, setValidatingApi] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [deletingInstance, setDeletingInstance] = useState<string | null>(null);
  const [loggingOutInstance, setLoggingOutInstance] = useState<string | null>(null);
  
  const [qrCodeModal, setQrCodeModal] = useState<QrCodeModal>({
    isOpen: false,
    qrCode: '',
    instanceName: '',
    loading: false
  });

  const [selectedChannelForMapping, setSelectedChannelForMapping] = useState('');
  const [selectedInstanceForMapping, setSelectedInstanceForMapping] = useState('');
  const [linkingChannel, setLinkingChannel] = useState(false);
  const [channel
