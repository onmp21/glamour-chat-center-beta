
import { AuditService, AuditLogData } from '@/services/AuditService';
import { AuditLoggerFactory, User } from '@/services/audit/AuditLoggerFactory';

export class MockAuditService extends AuditService {
  private logs: AuditLogData[] = [];

  async createLog(data: AuditLogData): Promise<void> {
    this.logs.push(data);
    console.log('🧪 [MOCK_AUDIT] Log created:', data);
  }

  async getLogs(page = 0, limit = 50): Promise<any[]> {
    const start = page * limit;
    const end = start + limit;
    return this.logs.slice(start, end);
  }

  getLogsSync(): AuditLogData[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsByAction(action: string): AuditLogData[] {
    return this.logs.filter(log => log.action === action);
  }

  getLogsByResourceType(resourceType: string): AuditLogData[] {
    return this.logs.filter(log => log.resourceType === resourceType);
  }
}

export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  name: 'Test User',
  username: 'testuser',
  ...overrides
});

export const createTestLoggers = (user: User | null = createTestUser()) => {
  return {
    dashboard: AuditLoggerFactory.createDashboardLogger(user),
    channel: AuditLoggerFactory.createChannelLogger(user),
    conversation: AuditLoggerFactory.createConversationLogger(user),
    navigation: AuditLoggerFactory.createNavigationLogger(user),
    ui: AuditLoggerFactory.createUILogger(user),
    profile: AuditLoggerFactory.createProfileLogger(user),
    credentials: AuditLoggerFactory.createCredentialsLogger(user),
    notifications: AuditLoggerFactory.createNotificationLogger(user)
  };
};
