
import { useEffect } from 'react';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  type?: string;
  image?: string;
}

export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    // Update document title
    if (config.title) {
      document.title = `${config.title} | Glamour Chat Center`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && config.description) {
      metaDescription.setAttribute('content', config.description);
    }

    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (config.keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', config.keywords);
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };

    if (config.title) {
      updateOGTag('og:title', config.title);
    }
    if (config.description) {
      updateOGTag('og:description', config.description);
    }
    if (config.type) {
      updateOGTag('og:type', config.type);
    }
    if (config.image) {
      updateOGTag('og:image', config.image);
    }

    updateOGTag('og:url', window.location.href);
  }, [config]);
};
