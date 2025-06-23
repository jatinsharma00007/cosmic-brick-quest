import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Lock, Star } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import useGameInteraction from '@/hooks/use-game-interaction';

interface LevelData {
  stars: number;
  score: number;
  unlocked: boolean;
}

const BrickMania = () => {
  const navigate = useNavigate();
  const [levelData, setLevelData] = useState<{ [key: string]: LevelData }>({});
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [totalStars, setTotalStars] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Add state for touch feedback
  const [touchedLevel, setTouchedLevel] = useState<number | null>(null);
  // Add flag to track if navigation is in progress
  const isNavigatingRef = useRef(false);
  
  // Apply game interaction optimizations with scroll allowed for level selection
  useGameInteraction(containerRef, {
    preventSelection: true,
    preventContextMenu: true,
    preventZoom: true,
    // Allow scrolling since this is a level selection page with potentially many levels
    preventScroll: false,
    addViewportMeta: true
  });

  useEffect(() => {
    document.title = "Brick Mania - Brick Breaker";
    loadLevelData();
  }, []);

  const loadLevelData = () => {
    const saved = localStorage.getItem('brickBreakerProgress');
    const data = saved ? JSON.parse(saved) : {};
    
    // Initialize with level 1 unlocked
    const initialData: { [key: string]: LevelData } = {};
    for (let i = 1; i <= 100; i++) {
      initialData[`level_${i}`] = {
        stars: data[`level_${i}`]?.stars || 0,
        score: data[`level_${i}`]?.score || 0,
        unlocked: i === 1 || data[`level_${i}`]?.unlocked || false
      };
    }
    
    setLevelData(initialData);
  };

  // Enhanced level selection handler with debounce to prevent double navigation
  const handleLevelClick = useCallback((level: number, event?: React.MouseEvent | React.TouchEvent) => {
    // Prevent default behavior to avoid any browser-specific issues
    if (event) {
      event.preventDefault();
    }
    
    // Check if we're already navigating to prevent double navigation
    if (isNavigatingRef.current) {
      return;
    }
    
    const levelKey = `level_${level}`;
    if (levelData[levelKey]?.unlocked) {
      // Set navigating flag to true to prevent duplicate navigation
      isNavigatingRef.current = true;
      
      // Navigate with a slight delay to allow touch feedback to show
      setTimeout(() => {
        navigate(`/game?level=${level}`);
        // Reset the flag after a longer timeout to ensure navigation completes
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 500);
      }, 100);
    }
  }, [levelData, navigate]);

  // Touch event handlers
  const handleTouchStart = useCallback((level: number, e: React.TouchEvent) => {
    // Prevent default to avoid any potential double-firing with click events
    e.stopPropagation();
    
    const levelKey = `level_${level}`;
    if (levelData[levelKey]?.unlocked) {
      setTouchedLevel(level);
    }
  }, [levelData]);

  const handleTouchEnd = useCallback((level: number, e: React.TouchEvent) => {
    // Prevent default to avoid any potential double-firing with click events
    e.stopPropagation();
    
    setTouchedLevel(null);
    // On touch devices, handle navigation in the touch handler
    // and prevent the click handler from firing
    if ('ontouchstart' in window) {
      handleLevelClick(level, e);
    }
  }, [handleLevelClick]);

  const handleTouchCancel = useCallback(() => {
    setTouchedLevel(null);
  }, []);

  const renderStars = (stars: number) => (
    <div className="flex justify-center mt-1">
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          className={`
            ${stars >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            mx-0.5 sm:mx-1
            w-5 h-5 sm:w-6 sm:h-6 lg:w-4 lg:h-4
          `}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-purple-900 py-8 px-4" ref={containerRef}>
      <Button
        onClick={() => navigate('/')}
        className="fixed top-2 left-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        <ArrowLeftIcon />
      </Button>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
            BRICK MANIA
          </h1>
          <p className="text-white/80 text-base sm:text-lg">
            Choose your challenge • 100 levels to conquer
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-4 max-w-full sm:max-w-4xl mx-auto">
          {Array.from({ length: 100 }, (_, i) => {
            const level = i + 1;
            const levelKey = `level_${level}`;
            const data = levelData[levelKey];
            const isUnlocked = data?.unlocked || false;
            const isTouched = touchedLevel === level;

            return (
              <button
                key={level}
                onClick={(e) => 'ontouchstart' in window ? null : handleLevelClick(level, e)}
                onTouchStart={(e) => handleTouchStart(level, e)}
                onTouchEnd={(e) => handleTouchEnd(level, e)}
                onTouchCancel={handleTouchCancel}
                disabled={!isUnlocked}
                aria-label={`Level ${level}${!isUnlocked ? ' (locked)' : ''}`}
                className={`
                  w-full aspect-square rounded-lg flex flex-col items-center justify-center
                  text-white font-bold text-xs xs:text-sm sm:text-base md:text-lg
                  transition-all duration-200 transform
                  ${isUnlocked 
                    ? `bg-gradient-to-br from-blue-500 to-cyan-600 
                       ${isTouched ? 'scale-95 from-blue-600 to-cyan-700' : 'hover:scale-110 hover:from-blue-600 hover:to-cyan-700'} 
                       shadow-lg active:scale-95` 
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50
                `}
              >
                {!isUnlocked && (
                  <Lock size={14} className="absolute top-1 right-1 text-gray-300" />
                )}
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="font-bold text-base sm:text-lg md:text-xl lg:text-lg xl:text-base">{level}</span>
                  {isUnlocked && data && renderStars(data.stars)}
                  {data && data.score > 0 && (
                    <span className="text-xs sm:text-sm md:text-base lg:text-xs xl:text-xs text-white/70">
                      {data.score}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-6 sm:mt-8 text-white/60">
          <p>Complete levels to unlock new challenges</p>
          <p className="text-xs sm:text-sm">Earn up to 3 stars per level</p>
        </div>
      </div>
    </div>
  );
};

export default BrickMania;
