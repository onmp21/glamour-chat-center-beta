
// Função para extrair telefone do session_id no novo formato
export const extractPhoneFromSessionId = (sessionId: string) => {
  console.log(`🔍 [SESSION_PARSER] Extracting phone from session_id: "${sessionId}"`);
  
  // Para todos os canais: formato padrão "TELEFONE-NOME"
  const parts = sessionId.split('-');
  if (parts.length > 1 && /^\d{10,15}$/.test(parts[0])) {
    console.log(`📞 [SESSION_PARSER] Standard format - extracted phone: "${parts[0]}"`);
    return parts[0];
  }
  
  // Fallback: procurar por sequência de números
  const phoneMatch = sessionId.match(/(\d{10,15})/);
  const phone = phoneMatch ? phoneMatch[1] : sessionId;
  console.log(`🔄 [SESSION_PARSER] Fallback - extracted phone: "${phone}"`);
  return phone;
};

// Função para extrair nome do session_id no novo formato
export const extractNameFromSessionId = (sessionId: string) => {
  console.log(`👤 [SESSION_PARSER] Extracting name from session_id: "${sessionId}"`);
  
  // Para formato padrão: "TELEFONE-NOME", extrair nome
  const parts = sessionId.split('-');
  if (parts.length > 1) {
    const name = parts.slice(1).join('-').trim();
    console.log(`📝 [SESSION_PARSER] Standard format - extracted name: "${name}"`);
    return name || 'Cliente';
  }
  
  // Fallback
  console.log(`🔄 [SESSION_PARSER] Fallback - using session_id as name`);
  return sessionId || 'Cliente';
};

// Função para normalizar session_id para consistência
export const normalizeSessionId = (sessionId: string, channelId: string): string => {
  console.log(`🔧 [SESSION_PARSER] Normalizing session_id: "${sessionId}" for channel: "${channelId}"`);
  
  const phone = extractPhoneFromSessionId(sessionId);
  const name = extractNameFromSessionId(sessionId);
  
  // Manter formato original se já estiver correto
  if (sessionId.includes('-') && /^\d{10,15}-/.test(sessionId)) {
    console.log(`✅ [SESSION_PARSER] Session_id already normalized: "${sessionId}"`);
    return sessionId;
  }
  
  // Normalizar para formato padrão
  const normalized = `${phone}-${name}`;
  console.log(`🔧 [SESSION_PARSER] Normalized to: "${normalized}"`);
  return normalized;
};
