
export enum MessageFormat {
  LANGCHAIN_OBJECT = 'LANGCHAIN_OBJECT',
  LANGCHAIN_STRING = 'LANGCHAIN_STRING', 
  LEGACY_N8N = 'LEGACY_N8N',
  SIMPLE_JSON = 'SIMPLE_JSON',
  UNKNOWN = 'UNKNOWN'
}

export interface FormatDetectionResult {
  format: MessageFormat;
  confidence: number;
  rawData: any;
}

export class MessageFormatDetector {
  static detect(messageJson: any): FormatDetectionResult {
    if (!messageJson) {
      return { format: MessageFormat.UNKNOWN, confidence: 0, rawData: messageJson };
    }

    let data = messageJson;
    
    // Se é string, tentar fazer parse
    if (typeof messageJson === 'string') {
      try {
        data = JSON.parse(messageJson);
        console.log('🔍 String parsed successfully:', data);
      } catch (error) {
        console.log('🔍 String não é JSON válido, tratando como texto simples');
        return { format: MessageFormat.SIMPLE_JSON, confidence: 0.5, rawData: messageJson };
      }
    }

    console.log('🔍 Detectando formato para:', data);

    // LANGCHAIN_OBJECT: Objeto complexo com additional_kwargs, response_metadata, tool_calls
    if (data && typeof data === 'object' && 
        (data.additional_kwargs !== undefined || data.response_metadata !== undefined || data.tool_calls !== undefined)) {
      console.log('📋 LANGCHAIN_OBJECT detectado');
      return { format: MessageFormat.LANGCHAIN_OBJECT, confidence: 0.9, rawData: data };
    }

    // SIMPLE_JSON: Formato simples com type e content (PRIORIDADE ALTA)
    if (data && typeof data === 'object' && data.type && data.content !== undefined) {
      console.log('📝 SIMPLE_JSON detectado - type:', data.type, 'content presente:', data.content !== undefined);
      return { format: MessageFormat.SIMPLE_JSON, confidence: 0.9, rawData: data };
    }

    // LEGACY_N8N: Objeto simples com message field
    if (data && typeof data === 'object' && data.message !== undefined && 
        !data.type && !data.content && !data.additional_kwargs) {
      console.log('🔧 LEGACY_N8N detectado');
      return { format: MessageFormat.LEGACY_N8N, confidence: 0.8, rawData: data };
    }

    console.log('❓ Formato desconhecido');
    return { format: MessageFormat.UNKNOWN, confidence: 0, rawData: data };
  }
}
