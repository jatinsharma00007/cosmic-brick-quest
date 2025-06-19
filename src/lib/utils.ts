import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps game (canvas) coordinates to overlay (screen) coordinates.
 * @param canvas The canvas element
 * @param gameX The x coordinate in game space
 * @param gameY The y coordinate in game space
 * @returns The { x, y } in overlay/screen space
 */
export function gameToOverlayCoords(canvas: HTMLCanvasElement | null, gameX: number, gameY: number): { x: number, y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const scaleX = canvas.clientWidth / canvas.width;
  const scaleY = canvas.clientHeight / canvas.height;
  return {
    x: gameX * scaleX,
    y: gameY * scaleY,
  };
}

/**
 * Prevents unwanted browser interactions during gameplay
 * - Text selection
 * - Context menus
 * - Zoom gestures
 * - Double-tap zoom
 * - Scrolling while in game area
 * 
 * @param targetElement The element to apply the fixes to (usually game container)
 * @param options Optional configuration settings
 * @returns A cleanup function to remove all event listeners
 */
export function applyGameInteractionFix(
  targetElement: HTMLElement,
  options: {
    preventSelection?: boolean,
    preventContextMenu?: boolean,
    preventZoom?: boolean,
    preventScroll?: boolean,
    addViewportMeta?: boolean
  } = {}
): () => void {
  const {
    preventSelection = true,
    preventContextMenu = true,
    preventZoom = true,
    preventScroll = true,
    addViewportMeta = true
  } = options;
  
  const listeners: Array<[string, EventListener, HTMLElement | Document | Window]> = [];
  let metaTag: HTMLMetaElement | null = null;
  
  // Add event listener and track for cleanup
  const addListener = (
    eventName: string, 
    handler: EventListener, 
    element: HTMLElement | Document | Window
  ) => {
    element.addEventListener(eventName, handler, { passive: false });
    listeners.push([eventName, handler, element]);
  };
  
  // Prevent text selection
  if (preventSelection) {
    const selectionHandler = (e: Event) => e.preventDefault();
    addListener('selectstart', selectionHandler, targetElement);
    
    // Apply styles
    targetElement.style.userSelect = 'none';
    targetElement.style.webkitUserSelect = 'none';
    targetElement.style.mozUserSelect = 'none';
    targetElement.style.msUserSelect = 'none';
  }
  
  // Prevent context menu
  if (preventContextMenu) {
    const contextMenuHandler = (e: Event) => e.preventDefault();
    addListener('contextmenu', contextMenuHandler, targetElement);
  }
  
  // Prevent zoom gestures (pinch-to-zoom)
  if (preventZoom) {
    const touchMoveHandler = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    // Prevent double-tap zoom
    const touchEndHandler = (e: TouchEvent) => {
      e.preventDefault();
      // Allow clicks for game controls to work
      if (e.target instanceof HTMLElement) {
        if (e.target.tagName.toLowerCase() === 'button' || 
           e.target.tagName.toLowerCase() === 'a' ||
           e.target.role === 'button') {
          e.target.click();
        }
      }
    };
    
    addListener('touchmove', touchMoveHandler as EventListener, targetElement);
    addListener('touchend', touchEndHandler as EventListener, targetElement);
    
    // Viewport meta tag to prevent zoom
    if (addViewportMeta) {
      metaTag = document.createElement('meta');
      metaTag.name = 'viewport';
      metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(metaTag);
    }
  }
  
  // Prevent scrolling
  if (preventScroll) {
    let initialTouchY: number | null = null;
    
    const touchStartHandler = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        initialTouchY = e.touches[0].clientY;
      }
    };
    
    const touchMoveScrollHandler = (e: TouchEvent) => {
      if (initialTouchY !== null && e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const isScrollingUp = currentY > initialTouchY;
        const isScrollingDown = currentY < initialTouchY;
        
        // Only prevent default if we're at the top or bottom of the page
        // This allows scrolling in menus but prevents pull-to-refresh
        if ((isScrollingUp && window.scrollY <= 0) || 
           (isScrollingDown && window.innerHeight + window.scrollY >= document.body.scrollHeight)) {
          e.preventDefault();
        }
      }
    };
    
    // Apply overflow hidden to body when in fullscreen game mode
    const originalBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      height: document.body.style.height
    };
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    
    addListener('touchstart', touchStartHandler as EventListener, targetElement);
    addListener('touchmove', touchMoveScrollHandler as EventListener, targetElement);
    
    // Prevent bounce scrolling in iOS
    const preventBounceScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    
    addListener('touchmove', preventBounceScroll as EventListener, document);
  }
  
  // Return cleanup function
  return () => {
    // Remove all event listeners
    listeners.forEach(([eventName, handler, element]) => {
      element.removeEventListener(eventName, handler);
    });
    
    // Remove meta tag if added
    if (metaTag && metaTag.parentNode) {
      metaTag.parentNode.removeChild(metaTag);
    }
    
    // Restore original body styles
    if (preventScroll) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.height = '';
      document.body.style.width = '';
    }
    
    // Reset styles on target element
    if (preventSelection) {
      targetElement.style.userSelect = '';
      targetElement.style.webkitUserSelect = '';
      targetElement.style.mozUserSelect = '';
      targetElement.style.msUserSelect = '';
    }
  };
}
