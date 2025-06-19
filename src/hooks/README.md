# Game Interaction Hooks

## useGameInteraction

A custom React hook that optimizes the gameplay experience by preventing unwanted browser behaviors that can interrupt gameplay.

### Features

- Prevents text selection during gameplay
- Blocks context menus on right-click
- Prevents zoom gestures (pinch-to-zoom)
- Prevents double-tap zoom on mobile
- Stops scrolling while playing
- Adds appropriate viewport meta tags

### Usage

```tsx
import { useRef } from 'react';
import useGameInteraction from '@/hooks/use-game-interaction';

function GameComponent() {
  // Create a ref to attach to your game container
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Apply optimizations with default settings
  useGameInteraction(gameContainerRef);
  
  // Or with custom settings
  useGameInteraction(gameContainerRef, {
    preventSelection: true,
    preventContextMenu: true,
    preventZoom: true,
    preventScroll: true,
    addViewportMeta: true,
    enabled: true // can be toggled based on game state
  });
  
  return (
    <div ref={gameContainerRef}>
      {/* Game content */}
    </div>
  );
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| preventSelection | true | Prevents text selection during gameplay |
| preventContextMenu | true | Blocks context menus on right-click |
| preventZoom | true | Prevents zoom gestures (pinch-to-zoom) |
| preventScroll | true | Prevents scrolling while playing |
| addViewportMeta | true | Adds viewport meta tag to prevent zoom |
| enabled | true | Master toggle for all optimizations |

### Dynamic Control

The hook returns control methods you can use to manually enable/disable optimizations:

```tsx
const { enable, disable } = useGameInteraction(gameContainerRef, { 
  // options 
});

// Later in your code:
if (showingMenu) {
  disable(); // Temporarily disable during menu navigation
} else {
  enable();  // Re-enable during gameplay
}
```

### Implementation Details

The hook uses the `applyGameInteractionFix` utility from `@/lib/utils.ts` which adds DOM event listeners and CSS styles to prevent unwanted interactions. All listeners are automatically cleaned up when the component unmounts.

## Implementation Across Game Pages

- **Game.tsx**: Full optimizations applied, preventing all unwanted interactions
- **LevelSelect.tsx**: Most optimizations applied but scrolling is allowed for level selection
- **Index.tsx**: Basic optimizations for home screen with scrolling allowed

## Best Practices

1. Apply to the outermost container of your game area
2. Disable optimizations when showing menus or dialogs that need scrolling
3. Consider user needs - don't prevent scrolling on pages with lots of content 