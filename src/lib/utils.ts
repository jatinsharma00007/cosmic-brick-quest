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
