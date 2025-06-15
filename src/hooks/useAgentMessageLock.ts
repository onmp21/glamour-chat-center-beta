
import { useRef } from "react";

/**
 * Hook para garantir que não sejam feitos envios duplicados muito rapidamente.
 * Fornece beginLock e endLock para bloquear envios rápidos.
 */
export function useAgentMessageLock(delayMs: number = 700) {
  const lockRef = useRef(false);

  function beginLock(): boolean {
    if (lockRef.current) return false;
    lockRef.current = true;
    setTimeout(() => {
      lockRef.current = false;
    }, delayMs);
    return true;
  }

  return { beginLock };
}
