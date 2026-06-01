'use client';

import { useEffect } from 'react';

/**
 * Detects when custom fonts (Cinzel Decorative) finish loading
 * and adds .fonts-loaded to <html> to prevent FOUT (Flash of Unstyled Text).
 */
export default function FontLoader() {
  useEffect(() => {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }, []);
  return null;
}
