
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogData {
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  userId: string;
  userName: string;
}

export interface SessionInfo {
  timestamp: string;
  user_agent: string;
  current_url: string;
  session_info: {
    screen_resolution: string;
    viewport: string;
  };
}

export class AuditService {
  private static instance: AuditService;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private generateSessionInfo(): SessionInfo {
    return {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      current_url: window.location.href,
      session_info: {
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      }
    };
  }

  private enrichAuditData(data: AuditLogData): any {
    return {
      user_id: data.userId,
      user_name: data.userName,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      details: {
        ...data.details,
        ...this.generateSessionInfo()
      }
    };
  }

  async createLog(data: AuditLogData): Promise<void> {
    try {
      const enrichedData = this.enrichAuditData(data);
      
      console.log('📋 [AUDIT_SERVICE] Creating log:', enrichedData);

      // Usando insert direto no Supabase - RLS agora permite inserção
      const { data: result, error } = await supabase
        .from('audit_logs')
        .insert([enrichedData])
        .select()
        .single();

      if (error) {
        console.error('❌ [AUDIT_SERVICE] Error creating log:', error);
        
        // Fallback: tentar com função RPC se insert direto falhar
        try {
          const { error: rpcError } = await supabase.rpc('create_audit_log', {
            p_user_name: enrichedData.user_name,
            p_action: enrichedData.action,
            p_resource_type: enrichedData.resource_type,
            p_user_id: enrichedData.user_id,
            p_resource_id: enrichedData.resource_id,
            p_details: enrichedData.details
          });
          
          if (rpcError) {
            console.error('❌ [AUDIT_SERVICE] RPC fallback also failed:', rpcError);
          } else {
            console.log('✅ [AUDIT_SERVICE] Log created via RPC fallback');
          }
        } catch (rpcFallbackError) {
          console.error('❌ [AUDIT_SERVICE] RPC fallback error:', rpcFallbackError);
        }
        return;
      }

      console.log('✅ [AUDIT_SERVICE] Log created successfully:', result);
    } catch (error) {
      console.error('❌ [AUDIT_SERVICE] Unexpected error:', error);
    }
  }

  async getLogs(page = 0, limit = 50): Promise<any[]> {
    try {
      console.log('📋 [AUDIT_SERVICE] Fetching logs...');

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        console.error('❌ [AUDIT_SERVICE] Error fetching logs:', error);
        return [];
      }

      console.log(`✅ [AUDIT_SERVICE] Fetched ${data?.length || 0} logs`);
      return data || [];
    } catch (error) {
      console.error('❌ [AUDIT_SERVICE] Unexpected error fetching logs:', error);
      return [];
    }
  }
}
