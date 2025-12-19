import { useEffect } from 'react';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';

export default function Builder() {
  // Initialize Telegram Web App viewport
  useEffect(() => {
    const tg = window.Telegram?.WebApp as any;
    if (tg) {
      tg.expand?.();
      tg.enableClosingConfirmation?.();
      
      // Set CSS variable for viewport height
      const setViewportHeight = () => {
        const vh = tg.viewportStableHeight || window.innerHeight;
        document.documentElement.style.setProperty('--tg-viewport-stable-height', `${vh}px`);
      };
      
      setViewportHeight();
      tg.onEvent?.('viewportChanged', setViewportHeight);
      
      return () => {
        tg.offEvent?.('viewportChanged', setViewportHeight);
      };
    }
  }, []);

  return <BuilderCanvas />;
}
