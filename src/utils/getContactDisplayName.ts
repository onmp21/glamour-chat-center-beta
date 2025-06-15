
/**
 * Centraliza a regra do nome_do_contato:
 * - Se mensagem do cliente, retorna nome real do contato se for válido; nunca retorna número.
 * - Se mensagem do agente, SEMPRE retorna null.
 */
export function getContactDisplayName({
  sender,
  contactName,
}: {
  sender: "customer" | "agent";
  contactName?: string | null;
}): string | null {
  if (sender === "customer") {
    // Retornar nome real se não for número e não for vazio.
    if (
      contactName &&
      contactName.trim() !== "" &&
      isNaN(Number(contactName.trim()))
    ) {
      return contactName.trim();
    }
    return null;
  }
  // Para agentes/internos nunca retorna nada!
  return null;
}
