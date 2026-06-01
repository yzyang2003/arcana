'use client';

import { useEffect } from 'react';

/**
 * Detects when custom fonts (Cinzel Decorative) finish loading
 * and adds .fonts-loaded to <html> to prevent FOUT (Flash of Unstyled Text).
 * Includes a 3s fallback timeout so titles are never permanently invisible.
 */
export default function FontLoader() {
  useEffect(() => {
    let resolved = false;
    const markLoaded = () => {
      if (resolved) return;
      resolved = true;
      document.documentElement.classList.add('fonts-loaded');
    };

    // Wait for fonts, but fallback after 3s
    document.fonts.ready.then(markLoaded);
    const fallbackTimer = setTimeout(markLoaded, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);
  return null;
}
