import { useEffect, useRef } from 'react';
import { applyGameInteractionFix } from '@/lib/utils';

interface GameInteractionOptions {
  preventSelection?: boolean;
  preventContextMenu?: boolean;
  preventZoom?: boolean;
  preventScroll?: boolean;
  addViewportMeta?: boolean;
  enabled?: boolean;
}

/**
 * Hook for optimizing game interactions by preventing unwanted browser behaviors
 * 
 * @param elementRef Ref to the HTML element that should receive the optimizations
 * @param options Configuration options for which behaviors to prevent
 */
const useGameInteraction = (
  elementRef: React.RefObject<HTMLElement>,
  options: GameInteractionOptions = {}
) => {
  const {
    preventSelection = true,
    preventContextMenu = true,
    preventZoom = true,
    preventScroll = true,
    addViewportMeta = true,
    enabled = true
  } = options;
  
  const cleanupFnRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    // Only apply if enabled and element exists
    if (enabled && elementRef.current) {
      // Apply interaction optimizations
      cleanupFnRef.current = applyGameInteractionFix(elementRef.current, {
        preventSelection,
        preventContextMenu,
        preventZoom,
        preventScroll,
        addViewportMeta
      });
      
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🎮 Game interaction optimizations applied');
      }
    }
    
    // Cleanup function
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🎮 Game interaction optimizations removed');
        }
      }
    };
  }, [elementRef, preventSelection, preventContextMenu, preventZoom, preventScroll, addViewportMeta, enabled]);
  
  // Return methods to manually enable/disable (useful for modals, etc)
  return {
    disable: () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
      }
    },
    enable: () => {
      if (!cleanupFnRef.current && elementRef.current) {
        cleanupFnRef.current = applyGameInteractionFix(elementRef.current, {
          preventSelection,
          preventContextMenu,
          preventZoom,
          preventScroll,
          addViewportMeta
        });
      }
    }
  };
};

export default useGameInteraction; 