import { supabase } from '@/integrations/supabase/client';

interface Base64ConversionResult {
  success: boolean;
  htmlUrl?: string;
  error?: string;
}

interface MediaConversionOptions {
  fileName?: string;
  channelId?: string;
  sessionId?: string;
  messageId?: string;
}

export class Base64ToHtmlService {
  private readonly STORAGE_BUCKET = 'media-html-storage';

  /**
   * Detectar o tipo de mídia baseado no cabeçalho Base64
   */
  private detectMediaType(base64Data: string): {
    mimeType: string;
    extension: string;
    isSupported: boolean;
  } {
    // Remover prefixo data: se existir
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // Detectar tipo baseado no cabeçalho Base64
    const header = cleanBase64.substring(0, 20);
    
    // Mapear assinaturas Base64 para tipos MIME
    const signatures: Record<string, { mimeType: string; extension: string }> = {
      '/9j/': { mimeType: 'image/jpeg', extension: 'jpg' },
      'iVBORw0KGgo': { mimeType: 'image/png', extension: 'png' },
      'R0lGODlh': { mimeType: 'image/gif', extension: 'gif' },
      'UklGR': { mimeType: 'image/webp', extension: 'webp' },
      'JVBERi0': { mimeType: 'application/pdf', extension: 'pdf' },
      'UEsDBBQ': { mimeType: 'application/zip', extension: 'zip' },
      'SUQz': { mimeType: 'audio/mp3', extension: 'mp3' },
      'T2dnUw': { mimeType: 'audio/ogg', extension: 'ogg' },
      'AAAA': { mimeType: 'video/mp4', extension: 'mp4' }
    };

    for (const [signature, info] of Object.entries(signatures)) {
      if (header.startsWith(signature)) {
        return { ...info, isSupported: true };
      }
    }

    // Tipo não detectado, assumir como binário genérico
    return {
      mimeType: 'application/octet-stream',
      extension: 'bin',
      isSupported: false
    };
  }

  /**
   * Converter Base64 para HTML visualizável
   */
  private generateHtmlForMedia(
    base64Data: string, 
    mediaInfo: { mimeType: string; extension: string; isSupported: boolean },
    options: MediaConversionOptions = {}
  ): string {
    const { fileName = 'media', channelId = 'unknown', sessionId = 'unknown' } = options;
    
    // Limpar Base64 e adicionar prefixo data: se necessário
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const dataUrl = `data:${mediaInfo.mimeType};base64,${cleanBase64}`;

    // Template HTML base
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mídia - ${fileName}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .media-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: auto;
        }
        .media-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
        }
        .media-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin: 0 0 5px 0;
        }
        .media-info {
            font-size: 12px;
            color: #666;
            margin: 0;
        }
        .media-content {
            text-align: center;
        }
        img, video, audio {
            max-width: 100%;
            max-height: 70vh;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .download-link {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: #b5103c;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            transition: background 0.2s;
        }
        .download-link:hover {
            background: #9d0e34;
        }
        .unsupported {
            text-align: center;
            padding: 40px 20px;
            color: #666;
        }
        .unsupported-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .media-container { padding: 15px; }
            img, video, audio { max-height: 60vh; }
        }
    </style>
</head>
<body>
    <div class="media-container">
        <div class="media-header">
            <h1 class="media-title">${fileName}</h1>
            <p class="media-info">
                Tipo: ${mediaInfo.mimeType} | 
                Canal: ${channelId} | 
                Sessão: ${sessionId}
            </p>
        </div>
        <div class="media-content">
            ${this.generateMediaElement(dataUrl, mediaInfo, fileName)}
        </div>
    </div>
</body>
</html>`;

    return htmlTemplate;
  }

  /**
   * Gerar elemento HTML específico para o tipo de mídia
   */
  private generateMediaElement(
    dataUrl: string, 
    mediaInfo: { mimeType: string; extension: string; isSupported: boolean },
    fileName: string
  ): string {
    if (!mediaInfo.isSupported) {
      return `
        <div class="unsupported">
            <div class="unsupported-icon">📄</div>
            <h3>Tipo de arquivo não suportado para visualização</h3>
            <p>Este arquivo não pode ser visualizado diretamente no navegador.</p>
            <a href="${dataUrl}" download="${fileName}" class="download-link">
                📥 Baixar Arquivo
            </a>
        </div>
      `;
    }

    if (mediaInfo.mimeType.startsWith('image/')) {
      return `
        <img src="${dataUrl}" alt="${fileName}" />
        <br>
        <a href="${dataUrl}" download="${fileName}" class="download-link">
            📥 Baixar Imagem
        </a>
      `;
    }

    if (mediaInfo.mimeType.startsWith('video/')) {
      return `
        <video controls>
            <source src="${dataUrl}" type="${mediaInfo.mimeType}">
            Seu navegador não suporta a reprodução de vídeo.
        </video>
        <br>
        <a href="${dataUrl}" download="${fileName}" class="download-link">
            📥 Baixar Vídeo
        </a>
      `;
    }

    if (mediaInfo.mimeType.startsWith('audio/')) {
      return `
        <audio controls style="width: 100%; max-width: 400px;">
            <source src="${dataUrl}" type="${mediaInfo.mimeType}">
            Seu navegador não suporta a reprodução de áudio.
        </audio>
        <br>
        <a href="${dataUrl}" download="${fileName}" class="download-link">
            📥 Baixar Áudio
        </a>
      `;
    }

    if (mediaInfo.mimeType === 'application/pdf') {
      return `
        <iframe src="${dataUrl}" width="100%" height="600px" style="border: none; border-radius: 8px;">
            <p>Seu navegador não suporta a visualização de PDF.</p>
        </iframe>
        <br>
        <a href="${dataUrl}" download="${fileName}" class="download-link">
            📥 Baixar PDF
        </a>
      `;
    }

    // Fallback para outros tipos
    return `
      <div class="unsupported">
          <div class="unsupported-icon">📎</div>
          <h3>Arquivo: ${fileName}</h3>
          <p>Tipo: ${mediaInfo.mimeType}</p>
          <a href="${dataUrl}" download="${fileName}" class="download-link">
              📥 Baixar Arquivo
          </a>
      </div>
    `;
  }

  /**
   * Converter Base64 para HTML e armazenar no Supabase Storage
   */
  async convertBase64ToHtml(
    base64Data: string, 
    options: MediaConversionOptions = {}
  ): Promise<Base64ConversionResult> {
    try {
      console.log('🔄 [BASE64_TO_HTML] Iniciando conversão Base64 para HTML');

      // Detectar tipo de mídia
      const mediaInfo = this.detectMediaType(base64Data);
      console.log('📋 [BASE64_TO_HTML] Tipo de mídia detectado:', mediaInfo);

      // Gerar HTML
      const htmlContent = this.generateHtmlForMedia(base64Data, mediaInfo, options);

      // Gerar nome único para o arquivo HTML
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const fileName = options.fileName || 'media';
      const htmlFileName = `${fileName}-${timestamp}-${uniqueId}.html`;

      // Fazer upload para o Supabase Storage
      console.log('☁️ [BASE64_TO_HTML] Fazendo upload para Supabase Storage');

      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(htmlFileName, htmlContent, {
          contentType: 'text/html',
          upsert: false
        });

      if (error) {
        console.error('❌ [BASE64_TO_HTML] Erro no upload:', error);
        return {
          success: false,
          error: `Erro no upload: ${error.message}`
        };
      }

      // Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(htmlFileName);

      console.log('✅ [BASE64_TO_HTML] Conversão concluída com sucesso');

      return {
        success: true,
        htmlUrl: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ [BASE64_TO_HTML] Erro na conversão:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Converter múltiplos Base64 para HTML em lote
   */
  async convertMultipleBase64ToHtml(
    conversions: Array<{
      base64Data: string;
      options: MediaConversionOptions;
    }>
  ): Promise<Array<Base64ConversionResult & { originalIndex: number }>> {
    console.log(`🔄 [BASE64_TO_HTML] Iniciando conversão em lote de ${conversions.length} itens`);

    const results = await Promise.allSettled(
      conversions.map((conversion, index) =>
        this.convertBase64ToHtml(conversion.base64Data, conversion.options)
          .then(result => ({ ...result, originalIndex: index }))
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Erro na conversão',
          originalIndex: index
        };
      }
    });
  }

  /**
   * Limpar arquivos HTML antigos (manutenção)
   */
  async cleanupOldHtmlFiles(olderThanDays: number = 30): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      console.log(`🧹 [BASE64_TO_HTML] Limpando arquivos HTML mais antigos que ${olderThanDays} dias`);

      // Listar todos os arquivos no bucket
      const { data: files, error: listError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list();

      if (listError) {
        return {
          success: false,
          deletedCount: 0,
          error: `Erro ao listar arquivos: ${listError.message}`
        };
      }

      if (!files || files.length === 0) {
        return {
          success: true,
          deletedCount: 0
        };
      }

      // Filtrar arquivos antigos
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldFiles = files.filter(file => {
        const fileDate = new Date(file.created_at || file.updated_at || 0);
        return fileDate < cutoffDate && file.name.endsWith('.html');
      });

      if (oldFiles.length === 0) {
        return {
          success: true,
          deletedCount: 0
        };
      }

      // Deletar arquivos antigos
      const filesToDelete = oldFiles.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove(filesToDelete);

      if (deleteError) {
        return {
          success: false,
          deletedCount: 0,
          error: `Erro ao deletar arquivos: ${deleteError.message}`
        };
      }

      console.log(`✅ [BASE64_TO_HTML] ${oldFiles.length} arquivos antigos removidos`);

      return {
        success: true,
        deletedCount: oldFiles.length
      };

    } catch (error) {
      console.error('❌ [BASE64_TO_HTML] Erro na limpeza:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verificar se o bucket de storage existe e criar se necessário
   */
  async ensureStorageBucketExists(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 [BASE64_TO_HTML] Verificando bucket de storage');

      // Tentar listar arquivos para verificar se o bucket existe
      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .list('', { limit: 1 });

      if (error && error.message.includes('not found')) {
        console.log('📦 [BASE64_TO_HTML] Bucket não encontrado, tentando criar');
        
        // Tentar criar o bucket (pode falhar se não tiver permissões)
        const { error: createError } = await supabase.storage
          .createBucket(this.STORAGE_BUCKET, {
            public: true,
            allowedMimeTypes: ['text/html'],
            fileSizeLimit: 10485760 // 10MB
          });

        if (createError) {
          console.error('❌ [BASE64_TO_HTML] Erro ao criar bucket:', createError);
          return {
            success: false,
            error: `Erro ao criar bucket: ${createError.message}`
          };
        }

        console.log('✅ [BASE64_TO_HTML] Bucket criado com sucesso');
      }

      return { success: true };

    } catch (error) {
      console.error('❌ [BASE64_TO_HTML] Erro ao verificar bucket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

// Instância singleton do serviço
export const base64ToHtmlService = new Base64ToHtmlService();

