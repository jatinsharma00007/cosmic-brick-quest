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
  
  // Check if we're on the level select page
  const isLevelSelectPage = window.location.pathname.includes('level-select');
  
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
    // Use type assertion for vendor-specific properties
    (targetElement.style as any).MozUserSelect = 'none';
    (targetElement.style as any).msUserSelect = 'none';
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
    
    // Modified touchEndHandler to only prevent default for double-taps
    // but allow normal tap behavior for buttons and links
    let lastTapTime = 0;
    const touchEndHandler = (e: TouchEvent) => {
      // Special handling for level select page - don't interfere with button clicks
      if (isLevelSelectPage && e.target instanceof HTMLElement && 
          (e.target.tagName.toLowerCase() === 'button' || 
           e.target.closest('button') ||
           e.target.role === 'button')) {
        // Don't prevent default or do anything that might interfere with button clicks
        return;
      }
      
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300; // ms
      
      // Check if this is a double-tap (potential zoom trigger)
      if (now - lastTapTime < DOUBLE_TAP_DELAY) {
        // Only prevent default for double-taps to prevent zoom
        e.preventDefault();
      }
      
      // Store the tap time for double-tap detection
      lastTapTime = now;
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
    
    // Don't apply fixed position to body when preventScroll is true but we're in the level select
    // This allows scrolling in the level select page
    if (!isLevelSelectPage) {
      // Apply overflow hidden to body when in fullscreen game mode
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.height = '100%';
      document.body.style.width = '100%';
    }
    
    addListener('touchstart', touchStartHandler as EventListener, targetElement);
    addListener('touchmove', touchMoveScrollHandler as EventListener, targetElement);
    
    // Prevent bounce scrolling in iOS, but not on level select page
    const preventBounceScroll = (e: TouchEvent) => {
      // Don't prevent default on level select page or if the target is a button
      const isButton = e.target instanceof HTMLElement && 
        (e.target.tagName.toLowerCase() === 'button' || 
         e.target.closest('button') ||
         e.target.role === 'button' ||
         e.target.tagName.toLowerCase() === 'a');
      
      if (!isLevelSelectPage && !isButton) {
        e.preventDefault();
      }
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
      // Use type assertion for vendor-specific properties
      (targetElement.style as any).MozUserSelect = '';
      (targetElement.style as any).msUserSelect = '';
    }
  };
}
