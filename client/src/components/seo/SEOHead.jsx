import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ 
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  structuredData,
  noindex = false,
  canonical
}) => {
  const location = useLocation();
  const currentUrl = canonical || `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', author);
    
    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'VocalInk');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Article specific tags
    if (type === 'article') {
      updateMetaTag('article:published_time', publishedTime);
      updateMetaTag('article:modified_time', modifiedTime);
      updateMetaTag('article:section', section);
      updateMetaTag('article:tag', tags.join(', '));
    }
    
    // Robots meta tag
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }
    
    // Canonical URL
    updateCanonical(currentUrl);
    
    // Structured data
    if (structuredData) {
      addStructuredData(structuredData);
    }

    // Cleanup function
    return () => {
      // Remove structured data on unmount
      if (structuredData) {
        removeStructuredData();
      }
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, section, tags, structuredData, noindex, currentUrl]);

  const updateMetaTag = (name, content) => {
    if (!content) return;
    
    let meta = document.querySelector(`meta[name="${name}"]`) || 
               document.querySelector(`meta[property="${name}"]`);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (name.startsWith('og:')) {
        meta.setAttribute('property', name);
      } else if (name.startsWith('twitter:')) {
        meta.setAttribute('name', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };

  const updateCanonical = (url) => {
    let canonical = document.querySelector('link[rel="canonical"]');
    
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    
    canonical.setAttribute('href', url);
  };

  const addStructuredData = (data) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data';
    document.head.appendChild(script);
  };

  const removeStructuredData = () => {
    const script = document.getElementById('structured-data');
    if (script) {
      script.remove();
    }
  };

  return null; // This component doesn't render anything
};

export default SEOHead; 