
import React from 'react';
import { useSEO } from '@/hooks/useSEO';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  children?: React.ReactNode;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  children
}) => {
  useSEO({
    title,
    description,
    keywords,
    type: 'website'
  });

  return <>{children}</>;
};
