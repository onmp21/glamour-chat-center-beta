
import { AuditService, AuditLogData } from '../AuditService';

export interface User {
  id: string;
  name?: string;
  username?: string;
}

export abstract class BaseAuditLogger {
  protected auditService: AuditService;
  protected user: User | null;

  constructor(user: User | null) {
    this.auditService = AuditService.getInstance();
    this.user = user;
  }

  protected async createLog(
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.user?.id) {
      console.warn(`🚫 [${resourceType.toUpperCase()}_LOGGER] No authenticated user for action:`, action);
      return;
    }

    const logData: AuditLogData = {
      action,
      resourceType,
      resourceId,
      details,
      userId: this.user.id,
      userName: this.user.name || this.user.username || 'Usuário'
    };

    await this.auditService.createLog(logData);
  }

  protected isUserAuthenticated(): boolean {
    return !!this.user?.id;
  }
}

export class DashboardAuditLogger extends BaseAuditLogger {
  async logAction(action: string, resourceId: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'dashboard', resourceId, details);
    }
  }
}

export class ChannelAuditLogger extends BaseAuditLogger {
  async logAction(action: string, channelId: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'channel', channelId, details);
    }
  }
}

export class ConversationAuditLogger extends BaseAuditLogger {
  async logAction(action: string, conversationId: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'conversation', conversationId, details);
    }
  }
}

export class NavigationAuditLogger extends BaseAuditLogger {
  async logAction(action: string, section: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'navigation', section, details);
    }
  }
}

export class UIAuditLogger extends BaseAuditLogger {
  async logAction(action: string, component: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'ui_interaction', component, details);
    }
  }
}

export class ProfileAuditLogger extends BaseAuditLogger {
  async logAction(action: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'profile', this.user!.id, details);
    }
  }
}

export class CredentialsAuditLogger extends BaseAuditLogger {
  async logAction(action: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'credentials', this.user!.id, details);
    }
  }
}

export class NotificationAuditLogger extends BaseAuditLogger {
  async logAction(action: string, details?: Record<string, any>): Promise<void> {
    if (this.isUserAuthenticated()) {
      await this.createLog(action, 'notifications', this.user!.id, details);
    }
  }
}

export class AuditLoggerFactory {
  static createDashboardLogger(user: User | null): DashboardAuditLogger {
    return new DashboardAuditLogger(user);
  }

  static createChannelLogger(user: User | null): ChannelAuditLogger {
    return new ChannelAuditLogger(user);
  }

  static createConversationLogger(user: User | null): ConversationAuditLogger {
    return new ConversationAuditLogger(user);
  }

  static createNavigationLogger(user: User | null): NavigationAuditLogger {
    return new NavigationAuditLogger(user);
  }

  static createUILogger(user: User | null): UIAuditLogger {
    return new UIAuditLogger(user);
  }

  static createProfileLogger(user: User | null): ProfileAuditLogger {
    return new ProfileAuditLogger(user);
  }

  static createCredentialsLogger(user: User | null): CredentialsAuditLogger {
    return new CredentialsAuditLogger(user);
  }

  static createNotificationLogger(user: User | null): NotificationAuditLogger {
    return new NotificationAuditLogger(user);
  }
}
