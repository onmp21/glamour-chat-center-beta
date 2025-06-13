import React, { useEffect, useRef, useState } from 'react';

interface InfiniteScrollProps {
  loadMore: () => Promise<boolean>; // Retorna true se há mais itens para carregar
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number; // Distância do final para acionar carregamento (em pixels)
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  loadMore,
  hasMore,
  isLoading = false,
  threshold = 200,
  loadingComponent = <div className="p-4 text-center">Carregando...</div>,
  endComponent = <div className="p-4 text-center text-gray-500">Fim dos resultados</div>,
  className = '',
  children,
}) => {
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Função para carregar mais itens
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      setError(null);
      await loadMore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mais itens');
      console.error('Erro no InfiniteScroll:', err);
    } finally {
      setLoading(false);
    }
  };

  // Configurar Intersection Observer para detectar quando o sentinel está visível
  useEffect(() => {
    if (!hasMore || loading) return;

    // Desconectar observer anterior se existir
    if (observer.current) {
      observer.current.disconnect();
    }

    // Criar novo observer
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0.1,
      }
    );

    // Observar o elemento sentinel
    if (sentinelRef.current) {
      observer.current.observe(sentinelRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, loading, threshold]);

  // Atualizar estado de loading quando a prop isLoading mudar
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  return (
    <div className={`infinite-scroll-container ${className}`} ref={containerRef}>
      {children}
      
      {/* Elemento sentinel para detectar quando chegou ao final */}
      <div ref={sentinelRef} className="h-1" />
      
      {/* Indicador de carregamento */}
      {loading && loadingComponent}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="p-4 text-center text-red-500">
          {error}
          <button 
            onClick={() => handleLoadMore()} 
            className="ml-2 text-blue-500 underline"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {/* Componente de fim da lista */}
      {!hasMore && !loading && endComponent}
    </div>
  );
};

export default InfiniteScroll;

