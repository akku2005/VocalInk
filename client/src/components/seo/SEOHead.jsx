import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildAbsoluteUrl, getSiteUrl } from '../../utils/siteUrl';

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
  canonical,
  article // New: article metadata object
}) => {
  const location = useLocation();
  const baseUrl = getSiteUrl();
  const currentUrl = buildAbsoluteUrl(canonical || url || location?.pathname || '/');
  const defaultImage = `${baseUrl}/images/og-default.png`; // Fallback OG image

  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | VocalInk`;
    } else {
      document.title = 'VocalInk - The Human Blog Network';
    }

    // Update meta tags
    updateMetaTag('description', description || 'VocalInk is an AI-powered, gamified blogging platform where reading earns you as much as writing.');
    updateMetaTag('keywords', keywords.join(', ') || 'blog, blogging, AI, TTS, voice, gamification');
    updateMetaTag('author', author || 'VocalInk');

    // Open Graph tags
    updateMetaTag('og:title', title || 'VocalInk');
    updateMetaTag('og:description', description || 'The Human Blog Network - AI-powered blogging with gamification');
    updateMetaTag('og:image', image || defaultImage);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'VocalInk');
    updateMetaTag('og:locale', 'en_US');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@vocalink'); // Update with your Twitter handle
    updateMetaTag('twitter:creator', '@vocalink');
    updateMetaTag('twitter:title', title || 'VocalInk');
    updateMetaTag('twitter:description', description || 'The Human Blog Network');
    updateMetaTag('twitter:image', image || defaultImage);
    updateMetaTag('twitter:image:alt', title || 'VocalInk');

    // Article specific tags
    if (type === 'article' && article) {
      updateMetaTag('article:published_time', publishedTime || article.publishedAt);
      updateMetaTag('article:modified_time', modifiedTime || article.updatedAt);
      updateMetaTag('article:author', author || article.author);
      updateMetaTag('article:section', section || article.category);

      // Add individual article:tag meta tags
      const articleTags = tags.length > 0 ? tags : article.tags || [];
      articleTags.forEach((tag, index) => {
        updateMetaTag(`article:tag:${index}`, tag);
      });
    }

    // Robots meta tag
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }

    // Additional SEO meta tags
    updateMetaTag('theme-color', '#4F46E5'); // Primary color
    updateMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');

    // Canonical URL
    updateCanonical(currentUrl);

    // Auto-generate structured data for articles if not provided
    let finalStructuredData = structuredData;

    if (type === 'article' && !structuredData && article) {
      finalStructuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": image || defaultImage,
        "author": {
          "@type": "Person",
          "name": author || article.author || "Anonymous"
        },
        "publisher": {
          "@type": "Organization",
          "name": "VocalInk",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`
          }
        },
        "datePublished": publishedTime || article.publishedAt,
        "dateModified": modifiedTime || article.updatedAt || article.publishedAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": currentUrl
        },
        "keywords": (tags.length > 0 ? tags : article.tags || []).join(', ')
      };
    }

    // Add structured data
    if (finalStructuredData) {
      addStructuredData(finalStructuredData);
    }

    // Cleanup function
    return () => {
      // Remove structured data on unmount
      if (finalStructuredData) {
        removeStructuredData();
      }
    };
  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, section, tags, structuredData, noindex, currentUrl, article, baseUrl, defaultImage]);

  const updateMetaTag = (name, content) => {
    if (!content) return;

    let meta = document.querySelector(`meta[name="${name}"]`) ||
      document.querySelector(`meta[property="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      if (name.startsWith('og:') || name.startsWith('article:')) {
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
    // Remove existing structured data first
    removeStructuredData();

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
