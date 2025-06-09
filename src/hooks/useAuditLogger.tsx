
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuditService } from '@/services/AuditService';
import { useAuditLoggers } from './useAuditLoggers';

export const useAuditLogger = () => {
  const { user } = useAuth();
  const loggers = useAuditLoggers();

  const createAuditLog = useCallback(async (
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ) => {
    if (!user?.id) {
      console.warn('🚫 [AUDIT] Tentativa de log sem usuário autenticado:', { action, resourceType });
      return;
    }

    try {
      const auditService = AuditService.getInstance();
      await auditService.createLog({
        action,
        resourceType,
        resourceId,
        details,
        userId: user.id,
        userName: user.name || user.username || 'Usuário'
      });
    } catch (error) {
      console.error('❌ [AUDIT] Erro ao criar log:', error);
    }
  }, [user]);

  const logDashboardAction = useCallback((action: string, resourceId: string, details?: Record<string, any>) => {
    if (loggers.dashboard && user?.id) {
      loggers.dashboard.logAction(action, resourceId, details);
    }
  }, [loggers.dashboard, user?.id]);

  const logChannelAction = useCallback((action: string, channelId: string, details?: Record<string, any>) => {
    if (loggers.channel && user?.id) {
      loggers.channel.logAction(action, channelId, details);
    }
  }, [loggers.channel, user?.id]);

  const logConversationAction = useCallback((action: string, conversationId: string, details?: Record<string, any>) => {
    if (loggers.conversation && user?.id) {
      loggers.conversation.logAction(action, conversationId, details);
    }
  }, [loggers.conversation, user?.id]);

  const logNavigationAction = useCallback((action: string, section: string, details?: Record<string, any>) => {
    if (loggers.navigation && user?.id) {
      loggers.navigation.logAction(action, section, details);
    }
  }, [loggers.navigation, user?.id]);

  const logUIAction = useCallback((action: string, component: string, details?: Record<string, any>) => {
    if (loggers.ui && user?.id) {
      loggers.ui.logAction(action, component, details);
    }
  }, [loggers.ui, user?.id]);

  const logProfileAction = useCallback((action: string, details?: Record<string, any>) => {
    if (loggers.profile && user?.id) {
      loggers.profile.logAction(action, details);
    }
  }, [loggers.profile, user?.id]);

  const logCredentialsAction = useCallback((action: string, details?: Record<string, any>) => {
    if (loggers.credentials && user?.id) {
      loggers.credentials.logAction(action, details);
    }
  }, [loggers.credentials, user?.id]);

  const logNotificationAction = useCallback((action: string, details?: Record<string, any>) => {
    if (loggers.notifications && user?.id) {
      loggers.notifications.logAction(action, details);
    }
  }, [loggers.notifications, user?.id]);

  return {
    createAuditLog,
    logDashboardAction,
    logChannelAction,
    logConversationAction,
    logNavigationAction,
    logUIAction,
    logProfileAction,
    logCredentialsAction,
    logNotificationAction,
    loggers
  };
};
