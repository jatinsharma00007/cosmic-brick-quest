import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Lock, Star } from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import useGameInteraction from '@/hooks/use-game-interaction';
import mediumChallengeLevels from '@/Modes/Challenge/Medium';

interface LevelData {
  stars: number;
  score: number;
  unlocked: boolean;
}

const ChallengeMedium = () => {
  const navigate = useNavigate();
  const [levelData, setLevelData] = useState<{ [key: string]: LevelData }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchedLevel, setTouchedLevel] = useState<number | null>(null);
  const isNavigatingRef = useRef(false);

  useGameInteraction(containerRef, {
    preventSelection: true,
    preventContextMenu: true,
    preventZoom: true,
    preventScroll: false,
    addViewportMeta: true
  });

  useEffect(() => {
    document.title = "Challenge Medium - Brick Breaker";
    loadLevelData();
  }, []);

  const loadLevelData = () => {
    const saved = localStorage.getItem('challengeMediumProgress');
    const data = saved ? JSON.parse(saved) : {};
    const initialData: { [key: string]: LevelData } = {};
    for (let i = 1; i <= mediumChallengeLevels.length; i++) {
      initialData[`level_${i}`] = {
        stars: data[`level_${i}`]?.stars || 0,
        score: data[`level_${i}`]?.score || 0,
        unlocked: i === 1 || data[`level_${i}`]?.unlocked || false
      };
    }
    setLevelData(initialData);
  };

  const handleLevelClick = useCallback((level: number, event?: React.MouseEvent | React.TouchEvent) => {
    if (event) event.preventDefault();
    if (isNavigatingRef.current) return;
    const levelKey = `level_${level}`;
    if (levelData[levelKey]?.unlocked) {
      isNavigatingRef.current = true;
      setTimeout(() => {
        navigate(`/game?mode=challenge&difficulty=medium&level=${level}`);
        setTimeout(() => { isNavigatingRef.current = false; }, 500);
      }, 100);
    }
  }, [levelData, navigate]);

  const handleTouchStart = useCallback((level: number, e: React.TouchEvent) => {
    e.stopPropagation();
    const levelKey = `level_${level}`;
    if (levelData[levelKey]?.unlocked) setTouchedLevel(level);
  }, [levelData]);

  const handleTouchEnd = useCallback((level: number, e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchedLevel(null);
    if ('ontouchstart' in window) handleLevelClick(level, e);
  }, [handleLevelClick]);

  const handleTouchCancel = useCallback(() => { setTouchedLevel(null); }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-yellow-200 to-orange-400 py-8 px-4" ref={containerRef}>
      <Button
        onClick={() => navigate('/challenge')}
        className="fixed top-2 left-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg z-50"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        <ArrowLeftIcon />
      </Button>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-yellow-900 mb-2 sm:mb-4 drop-shadow-lg">
            CHALLENGE - MEDIUM
          </h1>
          <p className="text-yellow-900/80 text-base sm:text-lg">
            Choose your challenge • {mediumChallengeLevels.length} levels to conquer
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-4 max-w-full sm:max-w-4xl mx-auto">
          {Array.from({ length: mediumChallengeLevels.length }, (_, i) => {
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
                  text-yellow-900 font-bold text-xs xs:text-sm sm:text-base md:text-lg
                  transition-all duration-200 transform
                  ${isUnlocked 
                    ? `bg-gradient-to-br from-yellow-400 to-orange-500 
                       ${isTouched ? 'scale-95 from-yellow-500 to-orange-600' : 'hover:scale-110 hover:from-yellow-500 hover:to-orange-600'} 
                       shadow-lg active:scale-95` 
                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-50
                `}
              >
                {!isUnlocked && (
                  <Lock size={14} className="absolute top-1 right-1 text-gray-300" />
                )}
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="font-bold text-base sm:text-lg md:text-xl lg:text-lg xl:text-base">{level}</span>
                  {isUnlocked && data && renderStars(data.stars)}
                  {data && data.score > 0 && (
                    <span className="text-xs sm:text-sm md:text-base lg:text-xs xl:text-xs text-yellow-900/70">
                      {data.score}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-center mt-6 sm:mt-8 text-yellow-900/60">
          <p>Complete levels to unlock new challenges</p>
          <p className="text-xs sm:text-sm">Earn up to 3 stars per level</p>
        </div>
      </div>
    </div>
  );
};

export default ChallengeMedium; 