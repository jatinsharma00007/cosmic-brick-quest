import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Pause, Play, Home, Menu, Heart, X, RefreshCcw, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';
import { GAME_SETTINGS, SCORE_SETTINGS, CONTROLS, GAME_SIZES } from '../lib/config';
import { gameToOverlayCoords } from '../lib/utils';
import ParticleEffect from '@/components/ParticleEffect';
import { getParticleSettings, adjustSettingsForPerformance } from '@/lib/particleConfig';
import useGameInteraction from '@/hooks/use-game-interaction';

import drag from '/assets/drag.png';
import tap from '/assets/tap.png';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
  hits: number;
  maxHits: number;
  type: 'normal' | 'material';
  material?: keyof typeof SCORE_SETTINGS.materialBricks;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  speed: number;
  baseSpeed: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DifficultyConfig {
  rows: number;
  cols: number;
  paddleWidth: number;
  emptyChance: number;
}

// Floating score type
interface FloatingScore {
  id: number;
  x: number;
  y: number;
  value: number;
}

// HUD Component
interface GameHUDProps {
  level: number;
  bricksBroken: number;
  score: number;
  maxPossibleScore: number;
  liveStars: number;
  lives: number;
  handleMenuOpen: () => void;
}
const GameHUD = React.memo(({ level, bricksBroken, score, maxPossibleScore, liveStars, lives, handleMenuOpen }: GameHUDProps) => (
  <div className="bg-black/50 text-white p-2 sm:p-4 pb-4 sm:pb-4 flex flex-wrap justify-between items-center gap-2 relative">
    <div className="font-bold text-base sm:text-lg">Level {level}/100</div>
    <div className="flex gap-2 sm:gap-8 items-center">
      <div className="flex items-center gap-1 text-sm sm:text-base">
        🧱 <span className="ml-1">{bricksBroken}</span>
      </div>
      <XPBarWithStars score={score} maxScore={maxPossibleScore} stars={liveStars} />
      <div className="flex items-center gap-1">
        {Array.from({ length: lives }, (_, i) => (
          <Heart key={i} size={16} className="text-red-500 fill-red-500 sm:w-[18px] sm:h-[18px]" />
        ))}
      </div>
    </div>
    <Button
      onClick={handleMenuOpen}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleMenuOpen()}
      variant="ghost"
      size="icon"
      className="text-white hover:bg-white/20"
      role="button"
      aria-label="Open Menu"
      tabIndex={0}
    >
      <Pause size={25} className="sm:w-6 sm:h-6" />
    </Button>
  </div>
));

// XP Bar with Stars component
const XPBarWithStars = ({ score, maxScore, stars }: { score: number, maxScore: number, stars: number }) => {
  const percent = Math.min(100, (score / maxScore) * 100);
  return (
    <div className="flex flex-col items-center w-[120px] sm:w-[180px]">
      <div className="flex justify-between w-full mb-1 px-1 sm:px-2">
        {[0, 1, 2].map(i => (
          <svg
            key={i}
            width="24" height="24" viewBox="0 0 32 32"
            className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow"
            style={{ filter: 'drop-shadow(0 2px 2px #0008)' }}
          >
            <polygon
              points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12"
              fill={i < stars ? '#FFD700' : '#444'}
              stroke="#C9A100"
              strokeWidth="2"
            />
          </svg>
        ))}
      </div>
      <div className="relative w-full h-4 sm:h-6 rounded-full border-2 sm:border-4 border-yellow-700 bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden shadow-lg">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-300 to-green-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-800 drop-shadow">
          {score} / {maxScore}
        </div>
      </div>
    </div>
  );
};

// Pause Menu Component
interface PauseMenuProps {
  handleMenuClose: () => void;
  resetLevel: () => void;
  quitToMenu: () => void;
}
const PauseMenu = React.memo(({ handleMenuClose, resetLevel, quitToMenu }: PauseMenuProps) => (
  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 p-4 sm:p-8 rounded-xl text-white relative w-full max-w-[300px] sm:min-w-[300px]">
      <Button
        onClick={handleMenuClose}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleMenuClose()}
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-white hover:bg-white/20"
        aria-label="Close Menu"
        tabIndex={0}
      >
        <X size={20} className="sm:w-6 sm:h-6" />
      </Button>
      <div className="text-center space-y-3 sm:space-y-4 mt-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center justify-center">
          <Pause size={16} className="mr-2 sm:w-5 sm:h-5" />
          Paused
        </h2>
        <Button onClick={handleMenuClose} className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base">
          <Play size={16} className="mr-2 sm:w-5 sm:h-5" /> Resume
        </Button>
        <Button onClick={resetLevel} className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
          <RefreshCcw size={16} className="mr-2 sm:w-5 sm:h-5" /> Restart
        </Button>
        <Button onClick={quitToMenu} className="w-full bg-red-600 hover:bg-red-700 text-sm sm:text-base">
          <Home size={16} className="mr-2 sm:w-5 sm:h-5" /> Home
        </Button>
      </div>
    </div>
  </div>
));

// Level Complete Modal Component
interface LevelCompleteModalProps {
  level: number;
  score: number;
  lives: number;
  liveStars: number;
  navigate: (path: string) => void;
  quitToMenu: () => void;
}
const LevelCompleteModal = React.memo(({ level, score, lives, liveStars, navigate, quitToMenu }: LevelCompleteModalProps) => {
  const saved = localStorage.getItem('brickBreakerProgress');
  const data = saved ? JSON.parse(saved) : {};
  const levelData = data[`level_${level}`] || { score: 0 };
  const isNewHighScore = score >= (levelData.score || 0);
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-green-800 p-4 sm:p-8 rounded-xl text-white text-center space-y-3 sm:space-y-4 w-full max-w-[300px] sm:min-w-[300px]">
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-300">Level Complete!</h2>
        <p className="text-lg sm:text-xl">
          {isNewHighScore ? (
            <>
              High Score: {score}
              {levelData.score > 0 && (
                <span className="block text-yellow-300 text-sm sm:text-base mt-1">Previous: {levelData.score}</span>
              )}
            </>
          ) : (
            <>
              Score: {score}
              <span className="block text-yellow-300 text-sm sm:text-base mt-1">High Score: {levelData.score}</span>
            </>
          )}
        </p>
        <p className="text-sm sm:text-base">Lives Remaining: {lives}</p>
        <p className="text-sm sm:text-base">Stars Earned: {'★'.repeat(liveStars)}</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-center">
          <Button onClick={() => navigate(`/game?level=${level + 1}`)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-sm sm:text-base" disabled={level >= 100}>
            {level >= 100 ? 'Game Complete!' : 'Next Level'}
          </Button>
          <Button onClick={quitToMenu} className='w-full sm:w-auto text-black text-sm sm:text-base' variant="outline">
            Level Select
          </Button>
        </div>
      </div>
    </div>
  );
});

// Level Failed Modal Component
interface LevelFailedModalProps {
  score: number;
  resetLevel: () => void;
  quitToMenu: () => void;
}
const LevelFailedModal = React.memo(({ score, resetLevel, quitToMenu }: LevelFailedModalProps) => (
  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-red-800 p-4 sm:p-8 rounded-xl text-white text-center space-y-3 sm:space-y-4 w-full max-w-[300px] sm:min-w-[300px]">
      <h2 className="text-2xl sm:text-3xl text-green-400 font-bold">Better luck next time!</h2>
      <p className="text-lg sm:text-xl">All lives lost!</p>
      <p className="text-sm sm:text-base">Score: {score}</p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-center">
        <Button onClick={resetLevel} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm sm:text-base">Try Again</Button>
        <Button onClick={quitToMenu} className='w-full sm:w-auto text-green-600 text-sm sm:text-base' variant="outline">Level Select</Button>
      </div>
    </div>
  </div>
));

// Debounced resize handler
function useDebouncedResize(callback: () => void, delay = 100) {
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(callback, delay);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [callback, delay]);
}

// Helper: Calculate stars based on score and lives
function calculateStars(score: number, lives: number, bricks: Brick[]): number {
  const baseScore = bricks.length * SCORE_SETTINGS.normalBrick;
  const lifeBonus = lives * SCORE_SETTINGS.lifeBonus;
  const totalPossible = baseScore + lifeBonus;
  const percentage = (score + lifeBonus) / totalPossible;
  if (percentage >= 0.9) return 3;
  if (percentage >= 0.7) return 2;
  return 1;
}

// Helper: Calculate max possible score for XP bar
function getMaxPossibleScore(bricks: Brick[]): number {
  return bricks.length * 100 + GAME_SETTINGS.lives * 500;
}

// Add ParticleEffectState interface
interface ParticleEffectState {
  id: number;
  x: number;
  y: number;
  color: string;
  glow: boolean;
  count?: number;
  size?: number;
  duration?: number;
  intensity?: number;
}

const Game = () => {
  // Add a ref for the game container
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isResettingRef = useRef(false);
  // Add a flag to track if we're currently processing a frame
  const isProcessingFrameRef = useRef(false);

  // Add refs for touch controls
  const touchActiveRef = useRef(false);
  const touchDirectionRef = useRef<'left' | 'right' | null>(null);
  const isDraggingRef = useRef(false);
  const lastTouchXRef = useRef(0);
  const hasTouchSupportRef = useRef(false);
  
  // Add refs for mouse controls
  const mouseStartPosRef = useRef<{x: number, y: number} | null>(null);
  const mouseStartTimeRef = useRef<number | null>(null);
  const isMouseDragDetectedRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(GAME_SETTINGS.lives);
  // Only using 'ready', 'playing', 'won', and 'levelFailed' states - 'lost' is unused
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'levelFailed'>('ready');
  
  const [paddle, setPaddle] = useState<Paddle>({ x: 350, y: 550, width: 100, height: 20 });
  const [ball, setBall] = useState<Ball>({
    x: 400,
    y: 530,
    dx: 0,  // Start with no horizontal movement
    dy: 0,  // Start with no vertical movement
    radius: 10,
    speed: 0,  // Start with no speed
    baseSpeed: 4
  });
  const [bricks, setBricks] = useState<Brick[]>([]);

  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);
  const paddleRef = useRef(paddle);
  const ballRef = useRef(ball);
  const bricksRef = useRef(bricks);

  // Add a ref to track if game is initialized
  const isInitializedRef = useRef(false);

  // Add FPS tracking refs
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const [fps, setFps] = useState(0);

  // Add a ref to ensure we only save once per win
  const hasSavedWinRef = useRef(false);

  const [bricksBroken, setBricksBroken] = useState(0);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [levelStartTime, setLevelStartTime] = useState<number>(Date.now());
  const [liveStars, setLiveStars] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const floatingScoreId = useRef(0);

  // Calculate max possible score for XP bar
  const maxPossibleScore = bricks.length * 100 + GAME_SETTINGS.lives * 500;
  const xpPercent = Math.min(100, (score / maxPossibleScore) * 100);

  // Add collision cooldown tracking
  const collisionCooldownRef = useRef<number>(0);
  const COLLISION_COOLDOWN = 5; // frames

  // Add particle effects
  const [particleEffects, setParticleEffects] = useState<ParticleEffectState[]>([]);
  const particleEffectId = useRef(0);

  // Add mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [touchHintVisible, setTouchHintVisible] = useState(true);
  
  // Add a state to track if we should show keyboard controls
  const [showKeyboardControls, setShowKeyboardControls] = useState(false);
  const [keyboardHintVisible, setKeyboardHintVisible] = useState(true);
  
  // Add state for help button functionality
  const [showControlsHelp, setShowControlsHelp] = useState(false);
  const [hintsShownBefore, setHintsShownBefore] = useState(false);
  const wasGamePausedBeforeHelp = useRef(false);
  
  // Add states for countdown
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(2);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if hints have been shown before
  useEffect(() => {
    const hintsShown = localStorage.getItem('controlsHintsShown');
    setHintsShownBefore(hintsShown === 'true');
  }, []);
  
  // Show initial hints only for level 1 and if not seen before
  useEffect(() => {
    if (level === 1 && !hintsShownBefore && gameState === 'ready') {
      setTouchHintVisible(true);
      setKeyboardHintVisible(true);
    } else {
      setTouchHintVisible(false);
      setKeyboardHintVisible(false);
    }
  }, [level, hintsShownBefore, gameState]);

  // Detect if we're on desktop
  useEffect(() => {
    const checkDesktop = () => {
      const isDesktopDevice = window.innerWidth >= 768 && !hasTouchSupportRef.current;
      setShowKeyboardControls(isDesktopDevice);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Reset hint visibility when game state changes to ready, but only on level 1
  useEffect(() => {
    if (gameState === 'ready' && level === 1 && !hintsShownBefore) {
      setTouchHintVisible(true);
      setKeyboardHintVisible(true);
    }
  }, [gameState, level, hintsShownBefore]);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Check for touch support
      hasTouchSupportRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setShowTouchControls(isMobileDevice && hasTouchSupportRef.current);
      setTouchHintVisible(true); // Reset hint visibility when device type changes
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update gameStateRef when gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
    
    // Apply state-specific pause rules:
    // - 'ready' state should NOT be paused to allow paddle movement
    // - 'playing' state can be either paused or unpaused
    // - 'won' and 'levelFailed' states don't need special handling
    if (gameState === 'ready') {
      // In ready state, we want to allow paddle movement but prevent ball movement
      // So we set isPausedRef to false to allow the game loop to run
      isPausedRef.current = false;
      setIsPaused(false);
      
      if (GAME_SETTINGS.debug) {
        console.log('Game in READY state - allowing paddle movement');
      }
    }
  }, [gameState]);

  // Add a debug effect to monitor key state
  useEffect(() => {
    if (GAME_SETTINGS.debug) {
      const checkKeyState = () => {
        if (gameStateRef.current === 'ready') {
          console.log('Key state in READY:', 
            'Left:', keysRef.current['ArrowLeft'], 
            'Right:', keysRef.current['ArrowRight'],
            'isPaused:', isPausedRef.current
          );
        }
      };
      
      const interval = setInterval(checkKeyState, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    paddleRef.current = paddle;
  }, [paddle]);

  useEffect(() => {
    ballRef.current = ball;
  }, [ball]);

  useEffect(() => {
    bricksRef.current = bricks;
  }, [bricks]);

  // Live star calculation
  useEffect(() => {
    setLiveStars(calculateStars(score, lives, bricks));
  }, [score, lives, bricks]);

  // Add this debug function after the renderGame function
  const renderDebugInfo = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!GAME_SETTINGS.debug) return;
    
    const currentBall = ballRef.current;
    
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    
    const debugInfo = [
      `Ball: x=${currentBall.x.toFixed(1)} y=${currentBall.y.toFixed(1)}`,
      `Speed: ${currentBall.speed.toFixed(2)}`,
      `Direction: dx=${currentBall.dx.toFixed(2)} dy=${currentBall.dy.toFixed(2)}`,
      `Game: ${gameStateRef.current} ${isPausedRef.current ? 'PAUSED' : 'RUNNING'}`,
    ];
    
    debugInfo.forEach((line, i) => {
      ctx.fillText(line, 10, GAME_SETTINGS.canvas.height - 60 + (i * 15));
    });
    
    ctx.restore();
  }, []);

  // Update the renderGame function to include the debug info
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Update FPS counter
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastFpsUpdateRef.current;

    if (elapsed >= 1000) { // Update FPS every second
      fpsRef.current = Math.round((frameCountRef.current * 1000) / elapsed);
      setFps(fpsRef.current);
      frameCountRef.current = 0;
      lastFpsUpdateRef.current = now;
    }

    // Clear the entire canvas at once
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Use the refs for current values
    const currentBricks = bricksRef.current;
    const currentPaddle = paddleRef.current;
    const currentBall = ballRef.current;

    // Batch brick rendering
    ctx.save();
    currentBricks.forEach(brick => {
      if (!brick.destroyed) {
        // Draw brick shadow for material bricks
        if (brick.type === 'material' && brick.material) {
          const material = SCORE_SETTINGS.materialBricks[brick.material];
          ctx.shadowColor = material.color;
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }

        // Draw main brick
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Draw outer border (darker color for both types)
        ctx.strokeStyle = darkenHexColor(brick.color, 0.25);
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Draw inner border (darker color for both types)
        const inset = 4;
        ctx.fillStyle = darkenHexColor(brick.color, 0.25);
        ctx.fillRect(
          brick.x + inset,
          brick.y + inset,
          brick.width - 2 * inset,
          brick.height - 2 * inset
        );

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (brick.type === 'material' && brick.material) {
          // Draw material name
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            SCORE_SETTINGS.materialBricks[brick.material].name,
            brick.x + brick.width / 2,
            brick.y + brick.height / 2 + 3
          );
        }
      }
    });
    ctx.restore();

    // Draw paddle
    ctx.save();
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(currentPaddle.x, currentPaddle.y, currentPaddle.width, currentPaddle.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentPaddle.x, currentPaddle.y, currentPaddle.width, currentPaddle.height);
    ctx.restore();

    // Draw ball
    ctx.save();
    ctx.beginPath();
    ctx.arc(currentBall.x, currentBall.y, currentBall.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw FPS counter
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${fpsRef.current}`, 10, canvas.height - 10);
    ctx.restore();

    renderDebugInfo(ctx);
  }, [renderDebugInfo]);

  // Move resetBallAndPaddle before gameLoop
  const resetBallAndPaddle = useCallback(() => {
    if (lives <= 0 || gameState === 'levelFailed' || gameState === 'won') {
      return;
    }

    const config = getDifficultyConfig(level);
    const sizes = isMobile ? GAME_SIZES.mobile : GAME_SIZES.desktop;
    const paddleWidth = sizes.paddleWidth;
    const paddleHeight = sizes.paddleHeight;

    // Determine paddle Y position based on device type
    let paddleY;
    if (window.innerWidth < 768) { // Mobile
      paddleY = GAME_SETTINGS.paddle.mobileInitialY;
    } else if (window.innerWidth < 1024) { // Tablet
      paddleY = GAME_SETTINGS.paddle.tabletInitialY;
    } else { // Desktop
      paddleY = GAME_SETTINGS.paddle.initialY;
    }

    setPaddle(prev => ({
      ...prev,
      x: (GAME_SETTINGS.canvas.width - paddleWidth) / 2,
      y: paddleY,
      width: paddleWidth,
      height: paddleHeight,
    }));

    const ballRadius = sizes.ballRadius;
    setBall(prev => ({
      x: (GAME_SETTINGS.canvas.width - paddleWidth) / 2 + paddleWidth / 2,
      y: paddleY - ballRadius - 2, // Position ball just above paddle
      dx: 0,  // No horizontal movement
      dy: 0,  // No vertical movement
      radius: ballRadius,
      speed: 0,  // No speed
      baseSpeed: GAME_SETTINGS.ball.baseSpeed
    }));
    
    // Set game to ready state so player can position paddle before launch
    setGameState('ready');
    
    // Reset touch controls
    touchActiveRef.current = false;
    touchDirectionRef.current = null;
    isDraggingRef.current = false;
    setTouchHintVisible(true);
    setKeyboardHintVisible(true);
    
    // Reset keyboard state
    Object.keys(keysRef.current).forEach(key => {
      keysRef.current[key] = false;
    });
  }, [level, lives, gameState, isMobile]);

  // Add these refs for smooth movement at the top with other refs
  const targetPaddleXRef = useRef<number | null>(null);
  const paddleVelocityRef = useRef(0);
  const PADDLE_SMOOTH_SPEED = 15; // Speed for smooth movement
  const MAX_PADDLE_VELOCITY = 25; // Maximum velocity for smooth movement
  
  // For smoother touch movement
  const smoothTransitionSpeedRef = useRef(GAME_SETTINGS.paddle.smoothingFactor); // Lerp factor for movement (0.0 - 1.0)
  const lastFrameTimeRef = useRef(Date.now());
  const frameRateAdjustmentRef = useRef(1);

  // Modify the gameLoop function to include smooth paddle movement
  const gameLoop = useCallback(() => {
    // Prevent multiple frames from being processed simultaneously
    if (isProcessingFrameRef.current) {
      // Already processing a frame, schedule next one and return
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Mark that we're processing a frame
    isProcessingFrameRef.current = true;
    
    // Calculate frame time delta for consistent movement regardless of frame rate
    const now = Date.now();
    const deltaTime = Math.min(32, now - lastFrameTimeRef.current) / 16.667; // Cap at 32ms, normalize to 60fps
    lastFrameTimeRef.current = now;
    frameRateAdjustmentRef.current = deltaTime;
    
    try {
      // Get current state values directly from refs for consistency
      const currentGameState = gameStateRef.current;
      const isPaused = isPausedRef.current;
      
      // Debug state logging (only if debug enabled)
      if (GAME_SETTINGS.debug && frameCountRef.current % 60 === 0) { // Log once per second approximately
        console.log(`GameLoop check - State: ${currentGameState}, Paused: ${isPaused}, AnimationFrame: ${!!animationRef.current}`);
        
        if (currentGameState === 'ready') {
          console.log('Paddle position:', paddleRef.current.x, 'Keys:', 
            'Left:', keysRef.current['ArrowLeft'], 
            'Right:', keysRef.current['ArrowRight']
          );
        }
      }
      
      // Process paddle movement in both ready and playing states, as long as not paused
      if (!isPaused && (currentGameState === 'ready' || currentGameState === 'playing')) {
        // Keyboard controls - immediate movement
        if (keysRef.current['ArrowLeft']) {
          setPaddle(prev => {
            const newX = Math.max(0, prev.x - GAME_SETTINGS.paddle.moveSpeed);
            if (GAME_SETTINGS.debug && currentGameState === 'ready' && frameCountRef.current % 60 === 0) {
              console.log('Moving paddle LEFT:', prev.x, '->', newX);
            }
            targetPaddleXRef.current = newX; // Update target position
            return {
            ...prev,
              x: newX
            };
          });
        }
        if (keysRef.current['ArrowRight']) {
          setPaddle(prev => {
            const newX = Math.min(GAME_SETTINGS.canvas.width - prev.width, prev.x + GAME_SETTINGS.paddle.moveSpeed);
            if (GAME_SETTINGS.debug && currentGameState === 'ready' && frameCountRef.current % 60 === 0) {
              console.log('Moving paddle RIGHT:', prev.x, '->', newX);
            }
            targetPaddleXRef.current = newX; // Update target position
            return {
              ...prev,
              x: newX
            };
          });
        }

        // Update paddle with touch controls (tap method)
        if (touchActiveRef.current && touchDirectionRef.current) {
          if (touchDirectionRef.current === 'left') {
            setPaddle(prev => {
              const newX = Math.max(0, prev.x - GAME_SETTINGS.paddle.moveSpeed * 1.2); // Slightly faster for touch
              targetPaddleXRef.current = newX;
              return {
                ...prev,
                x: newX
              };
            });
          } else if (touchDirectionRef.current === 'right') {
            setPaddle(prev => {
              const newX = Math.min(GAME_SETTINGS.canvas.width - prev.width, prev.x + GAME_SETTINGS.paddle.moveSpeed * 1.2);
              targetPaddleXRef.current = newX;
              return {
                ...prev,
                x: newX
              };
            });
          }
        }

        // Handle smooth movement towards target position (for drag method)
        if (targetPaddleXRef.current !== null) {
          const currentPaddle = paddleRef.current;
          const targetX = targetPaddleXRef.current;
          const distance = targetX - currentPaddle.x;
          
          // If we're close enough to target, snap to it and clear the target
          if (Math.abs(distance) < 2) {
            setPaddle(prev => ({
              ...prev,
              x: targetX
            }));
            paddleVelocityRef.current = 0;
            
            // Only clear target if not currently dragging
            if (!isDraggingRef.current) {
              targetPaddleXRef.current = null;
            }
          } else {
            // For touch dragging, use smoother lerp-based movement
            if (isDraggingRef.current) {
              // Smooth movement using lerp (linear interpolation)
              // Adjust the speed factor based on frame rate for consistent feel
              const lerpFactor = smoothTransitionSpeedRef.current * frameRateAdjustmentRef.current;
              
              // Calculate new position with lerp
              const newX = currentPaddle.x + (distance * lerpFactor);
              
              setPaddle(prev => ({
                ...prev,
                x: Math.max(0, Math.min(GAME_SETTINGS.canvas.width - prev.width, newX))
              }));
            } else {
              // For non-touch movement (keyboard/mouse), use the velocity-based approach
              // Otherwise move towards target with acceleration and deceleration
              // Calculate desired velocity based on distance
              const desiredVelocity = Math.sign(distance) * Math.min(Math.abs(distance) * 0.2, MAX_PADDLE_VELOCITY);
              
              // Smooth acceleration/deceleration
              paddleVelocityRef.current += (desiredVelocity - paddleVelocityRef.current) * 0.2;
              
              // Apply velocity to paddle position
              setPaddle(prev => ({
                ...prev,
                x: Math.max(0, Math.min(GAME_SETTINGS.canvas.width - prev.width, prev.x + paddleVelocityRef.current))
              }));
            }
          }
        }
        
        // Update ball position only if game is playing
        if (currentGameState === 'playing') {
          // Ball movement and collision logic for playing state
        const updateBall = (prevBall: Ball) => {
          if (prevBall.speed === 0) return prevBall; // Don't move ball if speed is 0

          let newX = prevBall.x + prevBall.dx;
          let newY = prevBall.y + prevBall.dy;
          let newDx = prevBall.dx;
          let newDy = prevBall.dy;

          // Wall collisions with bounce effect
          if (newX <= prevBall.radius) {
            newDx = Math.abs(newDx);
            newX = prevBall.radius;
          } else if (newX >= GAME_SETTINGS.canvas.width - prevBall.radius) {
            newDx = -Math.abs(newDx);
            newX = GAME_SETTINGS.canvas.width - prevBall.radius;
          }
          if (newY <= prevBall.radius) {
            newDy = Math.abs(newDy);
            newY = prevBall.radius;
          }

          // Ball lost - lose a life
          if (newY >= GAME_SETTINGS.canvas.height && currentGameState === 'playing') {
            if (!isResettingRef.current) {
              isResettingRef.current = true;
              setLives(currentLives => {
                if (currentLives > 1) {
                  setTimeout(() => {
                    isResettingRef.current = false;
                    resetBallAndPaddle();
                  }, 1000);
                } else {
                  isResettingRef.current = false;
                }
                return currentLives - 1;
              });
            }
            return prevBall;
          }

          // Enhanced paddle collision with angle calculation
          const currentPaddle = paddleRef.current;
          if (newY + prevBall.radius >= currentPaddle.y &&
            newY - prevBall.radius <= currentPaddle.y + currentPaddle.height &&
            newX >= currentPaddle.x &&
            newX <= currentPaddle.x + currentPaddle.width) {
            
            // Calculate hit position relative to paddle center (-1 to 1)
            const hitPos = (newX - (currentPaddle.x + currentPaddle.width / 2)) / (currentPaddle.width / 2);

            // Calculate bounce angle (max 75 degrees)
            const angle = hitPos * (Math.PI / 3);

            // Maintain ball speed but adjust direction
            const speed = Math.sqrt(prevBall.dx * prevBall.dx + prevBall.dy * prevBall.dy);
            newDx = speed * Math.sin(angle);
            newDy = -speed * Math.cos(angle);

            // Ensure ball doesn't get stuck in paddle
            newY = currentPaddle.y - prevBall.radius;

            return {
              ...prevBall,
              x: newX,
              y: newY,
              dx: newDx,
              dy: newDy,
              speed: speed,
              baseSpeed: speed
            };
          }

          return { ...prevBall, x: newX, y: newY, dx: newDx, dy: newDy };
        };

        setBall(updateBall);

        // Enhanced brick collision detection
        setBricks(currentBricks => {
          const updatedBricks = [...currentBricks];
          let scoreIncrease = 0;
          let hitDetected = false;
          const currentBall = ballRef.current;
          let newBricksBroken = 0;
          let floatingScoreToAdd: { x: number, y: number, value: number } | null = null;

          // Check collision cooldown
          if (collisionCooldownRef.current > 0) {
            collisionCooldownRef.current--;
            return updatedBricks;
          }

          for (let i = 0; i < updatedBricks.length; i++) {
            const brick = updatedBricks[i];
            if (!brick.destroyed) {
              if (isBallCollidingWithBrick(currentBall, brick)) {
                // Resolve collision and update ball direction
                const { dx, dy, speed } = resolveBallBrickCollision(currentBall, brick);
                setBall(prev => ({ ...prev, dx, dy, speed }));
                hitDetected = true;

                // Set collision cooldown
                collisionCooldownRef.current = COLLISION_COOLDOWN;

                brick.hits += 1;

                if (brick.hits >= brick.maxHits) {
                  brick.destroyed = true;
                  newBricksBroken++;

                  // Add particle effect with device-specific settings
                  const isMaterial = brick.type === 'material';
                  const shouldGlow = isMaterial && ['gold', 'silver'].includes(brick.material || '');
                    const baseSettings = getParticleSettings();
                    const particleSettings = adjustSettingsForPerformance(baseSettings);

                  setParticleEffects(prev => [
                    ...prev,
                    {
                      id: particleEffectId.current++,
                      x: brick.x + brick.width / 2,
                      y: brick.y + brick.height / 2,
                      color: brick.color,
                      glow: shouldGlow,
                      count: shouldGlow ? particleSettings.count + 3 : particleSettings.count,
                      size: shouldGlow ? particleSettings.size + 0.5 : particleSettings.size,
                      duration: shouldGlow ? particleSettings.duration + 300 : particleSettings.duration,
                      intensity: shouldGlow ? particleSettings.intensity + 0.2 : particleSettings.intensity
                    }
                  ]);

                  // Floating score animation - use brick position
                  let value = SCORE_SETTINGS.normalBrick;
                  if (brick.type === 'material' && brick.material) {
                    value = SCORE_SETTINGS.materialBricks[brick.material].points;
                  }

                  floatingScoreToAdd = {
                    x: brick.x + brick.width / 2,
                    y: brick.y + brick.height / 2,
                    value
                  };

                  if (brick.type === 'material' && brick.material) {
                    scoreIncrease += SCORE_SETTINGS.materialBricks[brick.material].points;
                  } else {
                    scoreIncrease += SCORE_SETTINGS.normalBrick;
                  }
                }

                break;
              }
            }
          }

          if (scoreIncrease > 0) {
            setTimeout(() => setScore(prev => prev + scoreIncrease), 0);
          }
          if (newBricksBroken > 0) {
            setBricksBroken(prev => prev + newBricksBroken);
          }
          if (floatingScoreToAdd) {
            setFloatingScores(prev => [
              ...prev,
              {
                id: floatingScoreId.current++,
                x: floatingScoreToAdd.x,
                y: floatingScoreToAdd.y,
                value: floatingScoreToAdd.value,
              },
            ]);
            setTimeout(() => {
              setFloatingScores(prev => prev.filter(fs => fs.id !== floatingScoreId.current - 1));
            }, 1000);
          }

          if (updatedBricks.every(brick => brick.destroyed)) {
            if (!hasSavedWinRef.current) {
              const highScore = saveLevelProgress();
              setScore(highScore);
              hasSavedWinRef.current = true;
            }
            setGameState('won');
            setTimeout(() => {
              setShowSummary(true);
              setSummaryData({
                time: Math.floor((Date.now() - levelStartTime) / 1000),
                stars: liveStars,
                score,
              });
            }, 800);
          }

          return updatedBricks;
        });
        } else if (currentGameState === 'ready') {
          // Keep ball attached to paddle when in ready state
        setBall(prev => ({
          ...prev,
          x: paddleRef.current.x + paddleRef.current.width / 2,
            y: paddleRef.current.y - prev.radius - 2 // Position ball just above paddle
        }));
        }
      }

      // Always render and schedule next frame
      renderGame();
      animationRef.current = requestAnimationFrame(gameLoop);
      
    } catch (error) {
      console.error('Error in game loop:', error);
      // Make sure we still continue the game loop even if there's an error
      animationRef.current = requestAnimationFrame(gameLoop);
    } finally {
      // Make sure to reset the processing flag
      isProcessingFrameRef.current = false;
    }
  }, [renderGame, resetBallAndPaddle]);

  const getDifficultyConfig = (levelNumber: number): DifficultyConfig => {
    const { difficulty } = GAME_SETTINGS;

    if (levelNumber <= 10) {
      return { 
        ...difficulty.level1
      };
    } else if (levelNumber <= 30) {
      return { 
        ...difficulty.level2
      };
    } else if (levelNumber <= 70) {
      return { 
        ...difficulty.level3
      };
    } else {
      return { 
        ...difficulty.level4
      };
    }
  };

  const generateLevel = (levelNumber: number): Brick[] => {
    const config = getDifficultyConfig(levelNumber);
    const newBricks: Brick[] = [];
    const materialTypes = Object.keys(SCORE_SETTINGS.materialBricks) as Array<keyof typeof SCORE_SETTINGS.materialBricks>;
    
    const sizes = isMobile ? GAME_SIZES.mobile : GAME_SIZES.desktop;
    const brickWidth = sizes.brickWidth;
    const brickHeight = sizes.brickHeight;
    const offsetTop = 80;
    const totalWidth = config.cols * brickWidth;
    const offsetLeft = (GAME_SETTINGS.canvas.width - totalWidth) / 2;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (Math.random() > config.emptyChance) {
          let brickType: 'normal' | 'material' = 'normal';
          let maxHits = 1;
          let color = SCORE_SETTINGS.normalBrickColor;
          let material: keyof typeof SCORE_SETTINGS.materialBricks | undefined;

          const rand = Math.random();
          if (rand < 0.3) {
            brickType = 'material';
            maxHits = 1;
            const randomMaterial = materialTypes[Math.floor(Math.random() * materialTypes.length)];
            material = randomMaterial;
            color = SCORE_SETTINGS.materialBricks[randomMaterial].color;
          }

          newBricks.push({
            x: offsetLeft + col * brickWidth,
            y: offsetTop + row * brickHeight,
            width: brickWidth,
            height: brickHeight,
            color: color,
            destroyed: false,
            hits: 0,
            maxHits: maxHits,
            type: brickType,
            material
          });
        }
      }
    }

    return newBricks;
  };

  const initializeGame = useCallback((levelNumber?: number) => {
    if (isInitializedRef.current) return;

    const currentLevel = levelNumber || level;
    const config = getDifficultyConfig(currentLevel);
    const newBricks = generateLevel(currentLevel);

    setScore(0);
    setLives(GAME_SETTINGS.lives);
    setGameState('ready');
    // In ready state, we want the game loop to run so player can move paddle
    isPausedRef.current = false;
    setIsPaused(false);
    setBricksBroken(0);
    
    // Reset touch control state
    touchActiveRef.current = false;
    touchDirectionRef.current = null;
    isDraggingRef.current = false;
    setTouchHintVisible(true);
    setKeyboardHintVisible(true);
    
    // Reset keyboard state
    Object.keys(keysRef.current).forEach(key => {
      keysRef.current[key] = false;
    });
    
    const sizes = isMobile ? GAME_SIZES.mobile : GAME_SIZES.desktop;
    const paddleWidth = sizes.paddleWidth;
    const paddleHeight = sizes.paddleHeight;

    // Determine paddle Y position based on device type
    let paddleY;
    if (window.innerWidth < 768) { // Mobile
      paddleY = GAME_SETTINGS.paddle.mobileInitialY;
    } else if (window.innerWidth < 1024) { // Tablet
      paddleY = GAME_SETTINGS.paddle.tabletInitialY;
    } else { // Desktop
      paddleY = GAME_SETTINGS.paddle.initialY;
    }

    const newPaddle = { 
      x: (GAME_SETTINGS.canvas.width - paddleWidth) / 2, 
      y: paddleY, 
      width: paddleWidth,
      height: paddleHeight 
    };
    setPaddle(newPaddle);

    const ballRadius = sizes.ballRadius;
    const newBall = {
      x: newPaddle.x + newPaddle.width / 2,
      y: newPaddle.y - ballRadius - 2, // Position ball just above paddle
      dx: 0,  // No horizontal movement
      dy: 0,  // No vertical movement
      radius: ballRadius,
      speed: 0,  // No speed
      baseSpeed: GAME_SETTINGS.ball.baseSpeed
    };
    setBall(newBall);
    
    setBricks(newBricks);
    isInitializedRef.current = true;
  }, [level, isMobile]);

  const handleMenuOpen = useCallback(() => {
    if (GAME_SETTINGS.debug) {
      console.log('Menu opened - pausing game');
    }
    
    // Reset touch control state when opening menu
    touchActiveRef.current = false;
    touchDirectionRef.current = null;
    isDraggingRef.current = false;
    
    // Always pause the game when menu opens, but keep the current gameState
    // This allows us to distinguish between 'ready' and 'playing' states when resuming
    isPausedRef.current = true;
    setIsPaused(true);
    setShowMenu(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setShowMenu(false);
    
    // When closing the menu:
    // - If game was in 'playing' state, always unpause and resume gameplay
    // - If game was in 'ready' state, unpause to allow paddle movement
    if (gameState === 'playing') {
      if (GAME_SETTINGS.debug) {
        console.log('Menu closed - resuming gameplay');
      }
      
      // Always unpause when closing menu in playing state
      isPausedRef.current = false;
      setIsPaused(false);
      
      // Reset touch control state
      touchActiveRef.current = false;
      touchDirectionRef.current = null;
      isDraggingRef.current = false;
      
      // CRITICAL: Use setTimeout to ensure state updates have been processed
      // before restarting the animation frame
      setTimeout(() => {
        // Force restart the animation frame to ensure immediate resume
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
        renderGame(); // Force an immediate render
        animationRef.current = requestAnimationFrame(gameLoop);
        
        if (GAME_SETTINGS.debug) {
          console.log('Animation frame forcefully restarted after menu close');
        }
      }, 0);
    } else if (gameState === 'ready') {
      // In ready state, unpause to allow paddle movement
      isPausedRef.current = false;
      setIsPaused(false);
      
      // Reset touch control state
      touchActiveRef.current = false;
      touchDirectionRef.current = null;
      isDraggingRef.current = false;
      
      // Force restart animation frame
      setTimeout(() => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
        renderGame();
        animationRef.current = requestAnimationFrame(gameLoop);
      }, 0);
    }
    // Won and levelFailed states don't need any special handling when closing menu
  }, [gameState, gameLoop, renderGame]);

  // Update the startGame function to mark hints as shown
  const startGame = useCallback(() => {
    if (gameState === 'ready') {
      // Hide hints immediately when ball is launched
      setTouchHintVisible(false);
      setKeyboardHintVisible(false);
      
      // Mark that hints have been shown
      localStorage.setItem('controlsHintsShown', 'true');
      setHintsShownBefore(true);
      
      // Set ball in motion with random initial angle
      const speed = GAME_SETTINGS.ball.baseSpeed;
      // Use a narrower angle range for more predictable launch (between -30 and 30 degrees)
      const angle = (Math.random() * (Math.PI / 3)) - (Math.PI / 6);
      setBall(prev => ({
        ...prev,
        dx: Math.sin(angle) * speed,
        dy: -Math.cos(angle) * speed, // Always launch upward
        speed: speed
      }));
      
      // Change state to playing and ensure game is unpaused
      setGameState('playing');
      isPausedRef.current = false;
      setIsPaused(false);
      
      if (GAME_SETTINGS.debug) {
        console.log('Game started - transitioning from ready to playing state');
      }
    }
  }, [gameState]);

  // Handle showing help controls
  const toggleControlsHelp = useCallback(() => {
    if (!showControlsHelp) {
      // Store current pause state before showing help
      wasGamePausedBeforeHelp.current = isPausedRef.current;
      
      // Pause the game when showing controls, but remember the state
      isPausedRef.current = true;
      setIsPaused(true);
      
      // Show appropriate controls based on device
      setShowControlsHelp(true);
    } else {
      // Hide controls help
      setShowControlsHelp(false);
      
      // Handle state restoration based on game state:
      if (gameState === 'ready') {
        // Always unpause in ready state to allow paddle movement
        isPausedRef.current = false;
        setIsPaused(false);
      } else if (gameState === 'playing') {
        // For playing state, start the countdown if it wasn't paused before
        if (!wasGamePausedBeforeHelp.current) {
          // Start countdown
          setCountdownValue(2);
          setShowCountdown(true);
          
          // Clear any existing countdown
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          
          // Start new countdown
          countdownTimerRef.current = setInterval(() => {
            setCountdownValue(prev => {
              if (prev <= 1) {
                // When countdown reaches 0, clear interval and unpause game
                if (countdownTimerRef.current) {
                  clearInterval(countdownTimerRef.current);
                  countdownTimerRef.current = null;
                }
                setShowCountdown(false);
                
                // Unpause the game
                isPausedRef.current = false;
                setIsPaused(false);
                
                // Force restart animation frame
                if (animationRef.current) {
                  cancelAnimationFrame(animationRef.current);
                  animationRef.current = undefined;
                }
                renderGame(); // Force an immediate render
                animationRef.current = requestAnimationFrame(gameLoop);
                
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // If it was paused before, just keep it paused
          isPausedRef.current = true;
          setIsPaused(true);
        }
      }
    }
  }, [showControlsHelp, gameState, renderGame, gameLoop]);
  
  // Handle key or touch to dismiss controls help
  const handleDismissControlsHelp = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
    if (showControlsHelp) {
      // Only proceed for direct button clicks or ESC key
      if (e && e instanceof KeyboardEvent && e.key !== 'Escape') {
        return; // Don't close for keys other than ESC
      }
      
      // Prevent event from propagating to avoid triggering game actions
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Hide the controls help
      setShowControlsHelp(false);
      
      // Handle game state correctly:
      // - For 'ready' state: Always keep it unpaused to allow paddle movement
      // - For 'playing' state: Show countdown then restore previous pause state
      if (gameState === 'ready') {
        // In ready state, ensure the game remains unpausable to allow paddle movement
        isPausedRef.current = false;
        setIsPaused(false);
      } else if (gameState === 'playing') {
        // For playing state, start the countdown if it wasn't paused before
        if (!wasGamePausedBeforeHelp.current) {
          // Start countdown
          setCountdownValue(2);
          setShowCountdown(true);
          
          // Clear any existing countdown
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          
          // Start new countdown
          countdownTimerRef.current = setInterval(() => {
            setCountdownValue(prev => {
              if (prev <= 1) {
                // When countdown reaches 0, clear interval and unpause game
                if (countdownTimerRef.current) {
                  clearInterval(countdownTimerRef.current);
                  countdownTimerRef.current = null;
                }
                setShowCountdown(false);
                
                // Unpause the game
                isPausedRef.current = false;
                setIsPaused(false);
                
                // Force restart animation frame
                if (animationRef.current) {
                  cancelAnimationFrame(animationRef.current);
                  animationRef.current = undefined;
                }
                renderGame(); // Force an immediate render
                animationRef.current = requestAnimationFrame(gameLoop);
                
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // If it was paused before, just keep it paused
          isPausedRef.current = true;
          setIsPaused(true);
        }
      }
    }
  }, [showControlsHelp, gameState, renderGame, gameLoop]);
  
  // Clean up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);
  
  // Add keyboard listener for dismissing help
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only close help menu on Escape key
      if (showControlsHelp && e.key === 'Escape') {
        handleDismissControlsHelp(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showControlsHelp, handleDismissControlsHelp]);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      // Toggle pause state for active gameplay
      const newIsPaused = !isPausedRef.current;
      
      if (GAME_SETTINGS.debug) {
        console.log(`Toggle pause from ${isPausedRef.current ? 'PAUSED' : 'RUNNING'} to ${newIsPaused ? 'PAUSED' : 'RUNNING'}`);
      }
      
      // Reset touch control state when pausing
      if (newIsPaused) {
        touchActiveRef.current = false;
        touchDirectionRef.current = null;
        isDraggingRef.current = false;
      }
      
      // Immediately update both the ref and state to ensure synchronization
      isPausedRef.current = newIsPaused;
      setIsPaused(newIsPaused);
      
      // If we're unpausing, force restart the animation frame for immediate response
      if (!newIsPaused) {
        // Use setTimeout to ensure state updates have been processed
        setTimeout(() => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
          }
          renderGame(); // Force an immediate render
          animationRef.current = requestAnimationFrame(gameLoop);
          
          if (GAME_SETTINGS.debug) {
            console.log('Animation frame forcefully restarted after spacebar unpause');
          }
        }, 0);
      }
      
      // We don't change gameState here, just isPaused
      // This ensures we know the game is in 'playing' mode but temporarily paused
    } else if (gameStateRef.current === 'ready') {
      // If in ready state, start the game (which will set to playing and unpause)
      startGame();
    }
    // Won and levelFailed states don't respond to pause toggle
  }, [startGame, gameLoop, renderGame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // If control help is open, only allow closing it
    if (showControlsHelp) {
      handleDismissControlsHelp(e);
      return;
    }
    
    // Special handling for menu keys that always work
    if (CONTROLS.menuClose.includes(e.key)) {
      e.preventDefault();
      if (showMenu) {
        handleMenuClose();
        return;
      }
    }
    
    // Don't respond to other key presses if menu is open
    if (showMenu) {
      return;
    }

    if (CONTROLS.pause.includes(e.key) || CONTROLS.pause.includes(e.code)) {
      e.preventDefault();
      togglePause();
    } else if (CONTROLS.menuOpen.includes(e.key)) {
      e.preventDefault();
      handleMenuOpen();
    } else if (CONTROLS.moveLeft.includes(e.key) || CONTROLS.moveLeft.includes(e.code)) {
      // Allow left-right movement in both ready and playing states
      keysRef.current['ArrowLeft'] = true;
      if (GAME_SETTINGS.debug && gameStateRef.current === 'ready') {
        console.log('LEFT key pressed in ready state');
      }
    } else if (CONTROLS.moveRight.includes(e.key) || CONTROLS.moveRight.includes(e.code)) {
      // Allow left-right movement in both ready and playing states
      keysRef.current['ArrowRight'] = true;
      if (GAME_SETTINGS.debug && gameStateRef.current === 'ready') {
        console.log('RIGHT key pressed in ready state');
      }
    } else if (CONTROLS.startGame.includes(e.key) || CONTROLS.startGame.includes(e.code)) {
      // Launch the ball with up arrow key if in ready state
      if (gameState === 'ready') {
        if (GAME_SETTINGS.debug) {
          console.log('UP key pressed - launching ball');
        }
        startGame();
      }
    } else {
      keysRef.current[e.code] = true;
    }
  }, [showMenu, handleMenuOpen, handleMenuClose, togglePause, gameState, startGame, showControlsHelp, handleDismissControlsHelp]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!(CONTROLS.pause.includes(e.key) || CONTROLS.pause.includes(e.code))) {
      if (CONTROLS.moveLeft.includes(e.key) || CONTROLS.moveLeft.includes(e.code)) {
        keysRef.current['ArrowLeft'] = false;
        if (GAME_SETTINGS.debug && gameStateRef.current === 'ready') {
          console.log('LEFT key released in ready state');
        }
      } else if (CONTROLS.moveRight.includes(e.key) || CONTROLS.moveRight.includes(e.code)) {
        keysRef.current['ArrowRight'] = false;
        if (GAME_SETTINGS.debug && gameStateRef.current === 'ready') {
          console.log('RIGHT key released in ready state');
        }
      } else {
        keysRef.current[e.code] = false;
      }
    }
  }, []);

  const saveLevelProgress = () => {
    const saved = localStorage.getItem('brickBreakerProgress');
    const data = saved ? JSON.parse(saved) : {};
    
    const stars = calculateStars(score, lives, bricks);
    const currentLevelData = data[`level_${level}`] || { score: 0 };

    // Only update score if it's higher than the previous high score
    const newScore = Math.max(currentLevelData.score || 0, score);

    data[`level_${level}`] = { 
      stars: Math.max(currentLevelData.stars || 0, stars),
      score: newScore,
      unlocked: true,
      completed: true  // Add a completed flag
    };
    
    if (level < 100) {
      data[`level_${level + 1}`] = { 
        stars: data[`level_${level + 1}`]?.stars || 0,
        score: data[`level_${level + 1}`]?.score || 0,
        unlocked: true,
        completed: data[`level_${level + 1}`]?.completed || false
      };
    }
    
    localStorage.setItem('brickBreakerProgress', JSON.stringify(data));
    return newScore;
  };

  const resetLevel = useCallback(() => {
    isInitializedRef.current = false;
    initializeGame(level);
    setGameState('ready');
    // Update both the ref and state for pause
    isPausedRef.current = true;
    setIsPaused(true);
    setShowMenu(false);
    setBricksBroken(0);
  }, [level, initializeGame]);

  const quitToMenu = () => {
    navigate('/level-select');
  };

  // Helper: get canvas position for floating score
  const getCanvasOffset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: 0, top: 0 };
    const rect = canvas.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  };

  function gameToOverlayCoords(gameX: number, gameY: number): { x: number, y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const scaleX = canvas.clientWidth / canvas.width;
    const scaleY = canvas.clientHeight / canvas.height;
    return {
      x: gameX * scaleX,
      y: gameY * scaleY,
    };
  }

  // Handle visibility change and focus events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, pause the game if it was playing
        if (gameStateRef.current === 'playing' && !isPausedRef.current) {
          if (GAME_SETTINGS.debug) {
            console.log('Tab hidden - auto-pausing game');
          }
          isPausedRef.current = true;
          setIsPaused(true);
        }
      } else {
        // Tab is visible again, restart the animation frame
        // regardless of whether it was already running
        if (canvasRef.current) {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
          }
          renderGame(); // Force an immediate render
          animationRef.current = requestAnimationFrame(gameLoop);
          
          if (GAME_SETTINGS.debug) {
            console.log('Animation frame restarted after tab becomes visible');
          }
        }
      }
    };

    const handleFocus = () => {
      // When window regains focus, always restart the animation frame
      // This is critical for resuming after F12 or tab switching
      if (canvasRef.current) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
        renderGame(); // Force an immediate render
        animationRef.current = requestAnimationFrame(gameLoop);
        
        if (GAME_SETTINGS.debug) {
          console.log('Animation frame restarted after window focus');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [gameLoop, renderGame]);

  useEffect(() => {
    const levelParam = searchParams.get('level');
    const newLevel = levelParam ? parseInt(levelParam) : 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      isInitializedRef.current = false;
      initializeGame(newLevel);
    } else if (!isInitializedRef.current) {
      initializeGame(newLevel);
    }
    
    document.title = `Level ${newLevel} - Brick Breaker`;

    const canvas = canvasRef.current;
    if (!canvas) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [searchParams, level, initializeGame, handleKeyDown, handleKeyUp]);

  // Add canvasReady state
  const [canvasReady, setCanvasReady] = useState(false);

  // Poll for canvas readiness after mount and on resize
  useEffect(() => {
    let raf: number;
    function checkReady() {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        setCanvasReady(true);
      } else {
        raf = requestAnimationFrame(checkReady);
      }
    }
    checkReady();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Only start animation/game loop and renderGame when canvas is ready and bricks are set
  useEffect(() => {
    if (canvasReady && bricks.length > 0) {
      // Initial render
      renderGame();
      
      // Start the game loop and ensure it's only running once
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(gameLoop);
      
      // Cleanup function to cancel animation frame on unmount
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
      };
    }
  }, [canvasReady, bricks, renderGame, gameLoop]);

  useEffect(() => {
    if (lives === 0 && gameState !== 'levelFailed') {
      setGameState('levelFailed');
    }
  }, [lives, gameState]);

  // Add a cleanup effect to save progress when component unmounts
  useEffect(() => {
    return () => {
      // Save progress when component unmounts (tab closed, navigation, etc.)
      if (gameState === 'won') {
        saveLevelProgress();
      }
    };
  }, [gameState]);

  // Reset hasSavedWinRef when level/game restarts
  useEffect(() => {
    if (gameState !== 'won') {
      hasSavedWinRef.current = false;
    }
  }, [gameState, level]);

  // Update the collision helper functions
  const isBallCollidingWithBrick = (ball: Ball, brick: Brick): boolean => {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;

    return (distanceX ** 2 + distanceY ** 2) < (ball.radius ** 2);
  };

  const resolveBallBrickCollision = (ball: Ball, brick: Brick): { dx: number, dy: number, speed: number } => {
    const ballCenterX = ball.x;
    const ballCenterY = ball.y;

    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;

    // Calculate normalized distance from ball to brick center
    const dx = (ballCenterX - brickCenterX) / (brick.width / 2);
    const dy = (ballCenterY - brickCenterY) / (brick.height / 2);

    // Calculate collision normal
    const normalX = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0;
    const normalY = Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0;

    // Handle corner collisions
    const isCornerCollision = Math.abs(dx) > 0.8 && Math.abs(dy) > 0.8;

    let newDx = ball.dx;
    let newDy = ball.dy;
    let newSpeed = ball.speed;

    if (isCornerCollision) {
      // Corner collision: reflect both components
      newDx = -ball.dx;
      newDy = -ball.dy;
      // Add extra speed for corner hits
      newSpeed *= 1.1;
    } else {
      // Regular collision: reflect based on normal
      if (normalX !== 0) newDx = -ball.dx;
      if (normalY !== 0) newDy = -ball.dy;
      // Standard speed increase
      newSpeed *= 1.05;
    }

    // Ensure minimum speed
    newSpeed = Math.max(newSpeed, GAME_SETTINGS.ball.baseSpeed);
    // Cap maximum speed
    newSpeed = Math.min(newSpeed, GAME_SETTINGS.ball.baseSpeed * 2);

    return { dx: newDx, dy: newDy, speed: newSpeed };
  };

  // Helper to darken a hex color
  function darkenHexColor(hex: string, amount: number = 0.2): string {
    // Remove # if present
    hex = hex.replace('#', '');
    // Parse r, g, b
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    // Darken each channel
    r = Math.max(0, Math.floor(r * (1 - amount)));
    g = Math.max(0, Math.floor(g * (1 - amount)));
    b = Math.max(0, Math.floor(b * (1 - amount)));
    // Return as hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Add canvas scaling function
  const scaleCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = Math.min(
      containerWidth / GAME_SETTINGS.canvas.width,
      containerHeight / GAME_SETTINGS.canvas.height
    );

    // Update canvas style dimensions
    canvas.style.width = `${GAME_SETTINGS.canvas.width * scale}px`;
    canvas.style.height = `${GAME_SETTINGS.canvas.height * scale}px`;

    // Update game settings based on scale
    const scaledSettings = {
      ball: {
        ...GAME_SETTINGS.ball,
        radius: GAME_SETTINGS.ball.radius * scale
      },
      paddle: {
        ...GAME_SETTINGS.paddle,
        height: GAME_SETTINGS.paddle.height * scale,
        moveSpeed: GAME_SETTINGS.paddle.moveSpeed * scale
      }
    };

    return scaledSettings;
  }, []);

  // Debounce the resize event
  useDebouncedResize(() => {
    const scaledSettings = scaleCanvas();
    if (scaledSettings) {
      // Update ball and paddle dimensions
      setBall(prev => ({
        ...prev,
        radius: scaledSettings.ball.radius
      }));
      setPaddle(prev => ({
        ...prev,
        height: scaledSettings.paddle.height
      }));
    }
  }, 100);

  // Single tap/click is now used to launch the ball
  
  // Add control preferences
  const [touchControlPreference, setTouchControlPreference] = useState<'tap' | 'drag'>('drag');
  
  // Add tracking for touch position and timing to distinguish between taps and drags
  const touchStartPosRef = useRef<{x: number, y: number} | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);
  const isDragDetectedRef = useRef(false);
  const TAP_THRESHOLD = 10; // pixels
  const TAP_TIME = 200; // ms - increased from 10ms to be more forgiving
  
  // Initialize control preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('touchControlPreference');
    if (savedPreference === 'tap' || savedPreference === 'drag') {
      setTouchControlPreference(savedPreference);
    }
  }, []);
  
  // Function to save touch control preference
  const saveTouchControlPreference = useCallback((preference: 'tap' | 'drag') => {
    setTouchControlPreference(preference);
    localStorage.setItem('touchControlPreference', preference);
  }, []);
  
  // Update touch handler to use the selected control preference
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (showControlsHelp) return;
    if (isPausedRef.current || showMenu) return;
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - canvasRect.left;
    const touchY = touch.clientY - canvasRect.top;
    // Store the initial touch position and time
    touchStartPosRef.current = { x: touchX, y: touchY };
    touchStartTimeRef.current = performance.now();
    isDragDetectedRef.current = false;
    
    // Set smoothing factor specifically for touch input
    smoothTransitionSpeedRef.current = GAME_SETTINGS.paddle.touchSmoothingFactor;
    
    const isMobile = window.innerWidth < 768;

    // For non-mobile devices, use existing logic
    if (!isMobile) {
      // Check if paddle can be dragged (in both ready and playing states)
      const currentPaddle = paddleRef.current;
      const paddleLeft = currentPaddle.x * (canvas.clientWidth / canvas.width);
      const paddleRight = (currentPaddle.x + currentPaddle.width) * (canvas.clientWidth / canvas.width);
      const paddleTop = currentPaddle.y * (canvas.clientHeight / canvas.height);
      const paddleBottom = (currentPaddle.y + currentPaddle.height) * (canvas.clientHeight / canvas.height);
      const isTouchOnPaddle = (
        touchX >= paddleLeft && 
        touchX <= paddleRight && 
        touchY >= paddleTop && 
        touchY <= paddleBottom
      );
      
      if (gameStateRef.current === 'ready') {
        // For drag controls in ready state, allow dragging from anywhere
        if ((touchControlPreference === 'drag' || isTouchOnPaddle)) {
          isDraggingRef.current = true;
          lastTouchXRef.current = touchX;
          const scaleFactor = canvas.width / canvas.clientWidth;
          targetPaddleXRef.current = Math.max(0, Math.min(canvas.width - paddleRef.current.width, 
            (touchX * scaleFactor) - (paddleRef.current.width / 2)));
        }
      } else if (gameStateRef.current === 'playing') {
        if (touchControlPreference === 'drag') {
          isDraggingRef.current = true;
          lastTouchXRef.current = touchX;
          const scaleFactor = canvas.width / canvas.clientWidth;
          targetPaddleXRef.current = Math.max(0, Math.min(canvas.width - paddleRef.current.width, 
            (touchX * scaleFactor) - (paddleRef.current.width / 2)));
        } else if (touchControlPreference === 'tap') {
          touchActiveRef.current = true;
          touchDirectionRef.current = touchX < canvas.clientWidth / 2 ? 'left' : 'right';
        }
      }
    } 
    // For mobile devices, use simplified logic - always allow drag anywhere
    else {
      // Mobile devices - just store the initial position, no paddle updates yet
      // We'll wait for actual movement in touchmove to update paddle
      lastTouchXRef.current = touchX;
      // Don't set targetPaddleXRef here - only do it during touchmove
    }
  }, [showMenu, showControlsHelp, touchControlPreference]);
  
  // Update mouse handler to implement single-click for launching and dragging for positioning
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // If control help is open, ignore mouse events
    if (showControlsHelp) return;
    
    if (isPausedRef.current || showMenu) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    // Store mouse start position and time for tap vs. drag detection
    mouseStartPosRef.current = { x: mouseX, y: mouseY };
    mouseStartTimeRef.current = performance.now();
    isMouseDragDetectedRef.current = false;
    
    // Set smoothing factor specifically for mouse input
    smoothTransitionSpeedRef.current = GAME_SETTINGS.paddle.mouseSmoothingFactor;
    
    // Check if mouse is on the paddle
    const currentPaddle = paddleRef.current;
    const paddleLeft = currentPaddle.x * (canvas.clientWidth / canvas.width);
    const paddleRight = (currentPaddle.x + currentPaddle.width) * (canvas.clientWidth / canvas.width);
    const paddleTop = currentPaddle.y * (canvas.clientHeight / canvas.height);
    const paddleBottom = (currentPaddle.y + currentPaddle.height) * (canvas.clientHeight / canvas.height);
    
    const isMouseOnPaddle = (
      mouseX >= paddleLeft && 
      mouseX <= paddleRight && 
      mouseY >= paddleTop && 
      mouseY <= paddleBottom
    );
    
    // If we're clicking on the paddle, start potential drag but don't launch
    if (isMouseOnPaddle) {
      // Only track position for potential drag, but don't move paddle yet
      // Wait for mousemove to confirm it's a drag
      return;
    }
    
    // For non-paddle clicks, we'll determine if it's a click or drag on mouseup
    // Don't launch ball here - do it in mouseup if it's a true click
  }, [showMenu, showControlsHelp]);
  
  // Add touch control handlers
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (showControlsHelp) return;
    if (isPausedRef.current || showMenu) return;
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (gameStateRef.current !== 'ready' && gameStateRef.current !== 'playing') return;
    const canvasRect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - canvasRect.left;
    const touchY = touch.clientY - canvasRect.top;
    const isMobile = window.innerWidth < 768;

    // Check if this touch has moved enough to be considered a drag
    if (touchStartPosRef.current) {
      const dx = touchX - touchStartPosRef.current.x;
      const dy = touchY - touchStartPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > TAP_THRESHOLD) {
        isDragDetectedRef.current = true;
      }
      if (!isDragDetectedRef.current && touchStartTimeRef.current !== null) {
        if (performance.now() - touchStartTimeRef.current > TAP_TIME) {
          isDragDetectedRef.current = true;
        }
      }
    }

    // Non-mobile devices: use existing preference-based logic
    if (!isMobile) {
      if (isDraggingRef.current && (gameStateRef.current === 'ready' || 
          (gameStateRef.current === 'playing' && touchControlPreference === 'drag'))) {
        const scaleFactor = canvas.width / canvas.clientWidth;
        targetPaddleXRef.current = Math.max(0, Math.min(canvas.width - paddleRef.current.width, 
          (touchX * scaleFactor) - (paddleRef.current.width / 2)));
        lastTouchXRef.current = touchX;
        // Set isDraggingRef to true so gameLoop will use smooth movement
        isDraggingRef.current = true;
      } else if (gameStateRef.current === 'playing' && touchControlPreference === 'tap') {
        touchDirectionRef.current = touchX < canvas.clientWidth / 2 ? 'left' : 'right';
        touchActiveRef.current = true;
      }
    } 
    // Mobile devices: only update paddle if we've detected a drag
    else {
      const scaleFactor = canvas.width / canvas.clientWidth;
      
      // Only update paddle position if this is a real drag (moved more than threshold)
      if (isDragDetectedRef.current) {
        // Don't set paddle position directly - use targetPaddleXRef so gameLoop handles smooth movement
        targetPaddleXRef.current = Math.max(0, Math.min(canvas.width - paddleRef.current.width, 
          (touchX * scaleFactor) - (paddleRef.current.width / 2)));
        lastTouchXRef.current = touchX;
        
        // Set dragging flag to true for smooth interpolation in gameLoop
        isDraggingRef.current = true;

        // If we're in the ready state, keep the ball attached to the paddle
        // But don't set it directly - we'll let the gameLoop handle this
      }
    }
  }, [showMenu, showControlsHelp, touchControlPreference]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const endTime = performance.now();
    let isTap = false;
    const isMobile = window.innerWidth < 768;

    // Debug log
    console.log('TouchEnd - gameState:', gameStateRef.current, 
      'isDragDetected:', isDragDetectedRef.current,
      'touchStartTime:', touchStartTimeRef.current ? (endTime - touchStartTimeRef.current) + 'ms' : 'null');

    if (touchStartPosRef.current && touchStartTimeRef.current !== null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const touch = e.changedTouches[0];
        const canvasRect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - canvasRect.left;
        const touchY = touch.clientY - canvasRect.top;
        const dx = touchX - touchStartPosRef.current.x;
        const dy = touchY - touchStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = endTime - touchStartTimeRef.current;
        
        console.log('Tap check - distance:', distance, 'duration:', duration, 
          'isDrag:', isDragDetectedRef.current, 'threshold:', TAP_THRESHOLD);
        
        // Check if this was a tap (both for mobile and non-mobile)
        if (distance <= TAP_THRESHOLD && duration <= TAP_TIME && !isDragDetectedRef.current) {
          isTap = true;
          console.log('TAP DETECTED!');
          
          // On mobile, we don't need to check if tap was on paddle
          if (isMobile) {
            if (gameStateRef.current === 'ready') {
              console.log('Launching ball on mobile tap');
              startGame(); // Launch the ball
            }
          } 
          // For non-mobile, check if tap was on the paddle
          else {
            // Check if tap was on paddle
            const currentPaddle = paddleRef.current;
            const paddleLeft = currentPaddle.x * (canvas.clientWidth / canvas.width);
            const paddleRight = (currentPaddle.x + currentPaddle.width) * (canvas.clientWidth / canvas.width);
            const paddleTop = currentPaddle.y * (canvas.clientHeight / canvas.height);
            const paddleBottom = (currentPaddle.y + currentPaddle.height) * (canvas.clientHeight / canvas.height);
            const isTouchOnPaddle = (
              touchX >= paddleLeft && 
              touchX <= paddleRight && 
              touchY >= paddleTop && 
              touchY <= paddleBottom
            );
            
            // Launch ball only if tap was not on paddle
            if (gameStateRef.current === 'ready' && !isTouchOnPaddle) {
              startGame();
            }
          }
        }
      }
    }

    // Reset touch tracking
    touchActiveRef.current = false;
    touchDirectionRef.current = null;
    isDraggingRef.current = false;
    touchStartPosRef.current = null;
    touchStartTimeRef.current = null;
    isDragDetectedRef.current = false;
    
    // Reset the velocity to prevent drift after a drag ends
    paddleVelocityRef.current = 0;
  }, [gameStateRef, startGame]);

  // Add mouse controls for desktop users
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // If control help is open, ignore mouse events
    if (showControlsHelp) return;
    
    if (isPausedRef.current || showMenu) return;
    if (gameStateRef.current !== 'ready' && gameStateRef.current !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check for drag detection
    if (mouseStartPosRef.current && e.buttons === 1) {
      const canvasRect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;
      
      // Calculate distance moved
      const dx = mouseX - mouseStartPosRef.current.x;
      const dy = mouseY - mouseStartPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if mouse has moved enough to be considered a drag
      if (distance > TAP_THRESHOLD) {
        isMouseDragDetectedRef.current = true;
      }
      
      // If it's a drag (moved > threshold) or on paddle, update paddle position
      if (isMouseDragDetectedRef.current) {
        const scaleFactor = canvas.width / canvas.clientWidth;
        
        // Set target position and mark as dragging for smooth movement 
        targetPaddleXRef.current = Math.max(0, Math.min(canvas.width - paddleRef.current.width, 
          (mouseX * scaleFactor) - (paddleRef.current.width / 2)));
        
        // Enable smooth interpolation in the game loop
        isDraggingRef.current = true;
      }
    }
  }, [showMenu, showControlsHelp]);

  // Add mouseup handler to detect clicks vs drags
  const handleMouseUp = useCallback((e: MouseEvent) => {
    const endTime = performance.now();
    let isClick = false;
    
    if (mouseStartPosRef.current && mouseStartTimeRef.current !== null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        const dx = mouseX - mouseStartPosRef.current.x;
        const dy = mouseY - mouseStartPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = endTime - mouseStartTimeRef.current;
        
        // Check if this was a click (short duration, little movement)
        if (distance <= TAP_THRESHOLD && duration <= TAP_TIME && !isMouseDragDetectedRef.current) {
          isClick = true;
          
          // Check if click was on paddle
          const currentPaddle = paddleRef.current;
          const paddleLeft = currentPaddle.x * (canvas.clientWidth / canvas.width);
          const paddleRight = (currentPaddle.x + currentPaddle.width) * (canvas.clientWidth / canvas.width);
          const paddleTop = currentPaddle.y * (canvas.clientHeight / canvas.height);
          const paddleBottom = (currentPaddle.y + currentPaddle.height) * (canvas.clientHeight / canvas.height);
          
          const isMouseOnPaddle = (
            mouseX >= paddleLeft && 
            mouseX <= paddleRight && 
            mouseY >= paddleTop && 
            mouseY <= paddleBottom
          );
          
          // Launch ball only if click was not on paddle and in ready state
          if (gameStateRef.current === 'ready' && !isMouseOnPaddle) {
            startGame();
          }
        }
      }
    }
    
    // Reset mouse tracking
    mouseStartPosRef.current = null;
    mouseStartTimeRef.current = null;
    isMouseDragDetectedRef.current = false;
    
    // Reset dragging state and velocity on mouse up
    isDraggingRef.current = false;
    paddleVelocityRef.current = 0;
  }, [gameStateRef, startGame]);

  // Add mouse event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Add touch event listeners
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Add mouse event listeners for desktop
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      // Remove event listeners
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Add a special handler for the touch controls hint to allow starting the game
  const handleHintTouchStart = useCallback((e: React.TouchEvent) => {
    // If control help is open, do not trigger game actions
    if (showControlsHelp) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Prevent any action on single tap of hint - require double-tap
    e.preventDefault();
    e.stopPropagation();
  }, [showControlsHelp]);

  // Apply game interaction optimizations to prevent unwanted behaviors
  useGameInteraction(gameContainerRef, {
    // Enable all optimizations by default
    preventSelection: true,
    preventContextMenu: true,
    preventZoom: true,
    preventScroll: true,
    addViewportMeta: true,
    // Only enable when not in a menu or modal
    enabled: !showMenu && !showControlsHelp && !showSummary && 
      !['won', 'levelFailed'].includes(gameState)
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 relative flex flex-col">
      {/* Game UI Container with relative positioning */}
      <div className="flex flex-col w-full relative" ref={gameContainerRef}>
        {/* Header Bar */}
        <GameHUD level={level} bricksBroken={bricksBroken} score={score} maxPossibleScore={maxPossibleScore} liveStars={liveStars} lives={lives} handleMenuOpen={handleMenuOpen} />

        {/* Controls Help Button - Better responsive positioning */}
        <div className="absolute right-4 z-40" style={{ 
          top: isMobile ? '5.2rem' : '6.6rem'
        }}>
          <div className="relative group">
            <Button
              onClick={toggleControlsHelp}
              variant="ghost"
              size="icon"
              className="bg-gray-800/70 text-white hover:bg-gray-700/80 shadow-lg"
              aria-label="Controls Help"
            >
              <HelpCircle size={isMobile ? 18 : 20} />
            </Button>
            
            {/* Tooltip - only show touch preference info for mobile/tablet */}
            {hasTouchSupportRef.current && (
              <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                Click for controls help and to change your touch control preference ({touchControlPreference === 'drag' ? 'currently using drag' : 'currently using tap'})
              </div>
            )}
          </div>
        </div>

      {/* Pause Indicator - only show when gameplay is paused but menu is not open */}
        {isPaused && gameState === 'playing' && !showMenu && !showControlsHelp && !showCountdown && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-black/50 p-4 rounded-lg text-white flex flex-col items-center text-2xl font-bold animate-pulse">
            <span className="block text-center">PAUSED</span>
            <div className="text-sm mt-2 text-center">Press SPACE to resume</div>
          </div>
        </div>
      )}
        
        {/* Countdown overlay - shown after closing help menu */}
        {showCountdown && gameState === 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-black/50 p-8 rounded-lg text-white flex flex-col items-center justify-center">
              <span className="text-5xl font-bold animate-pulse">{countdownValue}</span>
              <span className="text-base mt-2">Game resumes in...</span>
            </div>
          </div>
        )}

      {/* Game Container */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative">
        <div
          className={`relative w-full mx-auto ${isMobile ? '' : 'max-w-[800px] aspect-[4/3]'}`}
          style={isMobile ? { height: '80vh', maxWidth: '100vw', aspectRatio: '4/3' } : {}}
        >
          {/* Game Grid Container */}
          <div className="absolute inset-0 grid" style={{
            gridTemplateColumns: `repeat(${GAME_SETTINGS.canvas.width / 80}, 1fr)`,
            gridTemplateRows: `repeat(${GAME_SETTINGS.canvas.height / 25}, 1fr)`,
          }}>
            {/* Particle Effects */}
            {particleEffects.map(effect => (
              <ParticleEffect
                key={effect.id}
                x={effect.x}
                y={effect.y}
                color={effect.color}
                count={effect.glow ? 15 : 12}
                size={effect.glow ? 5 : 4}
                duration={effect.glow ? 1500 : 1200}
                intensity={effect.glow ? 1.2 : 1}
                glow={effect.glow}
              />
            ))}

            {/* Floating Score Overlay */}
            <div className="absolute inset-0 pointer-events-none z-40">
              {floatingScores.map(fs => {
                const { x, y } = gameToOverlayCoords(fs.x, fs.y);
                const canvas = canvasRef.current;
                if (!canvas) return null;
                const scaleX = canvas.clientWidth / canvas.width;
                return (
                  <span
                    key={fs.id}
                    className="absolute select-none text-yellow-400 font-bold"
                    style={{
                      left: x,
                      top: y,
                      fontSize: `${Math.min(20 * scaleX, 20)}px`,
                      opacity: 0.9,
                      animation: 'floatScore 1s ease-out forwards',
                      position: 'absolute',
                      pointerEvents: 'none',
                      willChange: 'transform, opacity'
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    +{fs.value}
                  </span>
                );
              })}
              <style>{`
                @keyframes floatScore {
                  0% { opacity: 0.9; transform: translateY(0); }
                  80% { opacity: 1; }
                  100% { opacity: 0; transform: translateY(-40px); }
                }
              `}</style>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={GAME_SETTINGS.canvas.width}
              height={GAME_SETTINGS.canvas.height}
              className="w-full h-full border-4 border-white/20 rounded-lg shadow-2xl bg-gray-900 select-none"
              style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                gridColumn: '1 / -1',
                gridRow: '1 / -1'
              }}
            />
              
              {/* Initial Controls Hints - Only show on level 1 and first time */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                {/* Touch Controls Hint */}
                {showTouchControls && touchHintVisible && (gameState === 'ready') && !showMenu && !showControlsHelp && !['won', 'levelFailed'].includes(gameState) && level === 1 && !hintsShownBefore && (
                  <div 
                    className="pointer-events-auto cursor-pointer"
                    onTouchStart={handleHintTouchStart}
                  >
                    <div className="bg-black/70 p-3 rounded-xl text-white text-center transition-opacity duration-300 animate-fadeIn">
                      <p className="text-base font-bold mb-2">Ready Player?</p>
                      <div className="flex justify-center gap-4 mb-1">
                        <div className="flex flex-col items-center">
                          <img src={drag} alt="Drag" className={`w-10 h-10 mb-1 ${touchControlPreference === 'drag' ? 'animate-bounce' : ''}`} />
                          <span className="text-xs font-bold">
                            {touchControlPreference === 'drag' ? 'DRAG' : 'POSITION'}
                          </span>
          </div>
                        <div className="flex flex-col items-center">
                          <img src={tap} alt="Tap" className={`w-10 h-10 mb-1 ${touchControlPreference === 'tap' ? 'animate-pulse' : ''}`} />
                          <span className="text-xs font-bold">
                            {touchControlPreference === 'tap' ? 'TAP SIDES' : 'TAP TO LAUNCH'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs mt-1 animate-pulse font-bold">
                        {touchControlPreference === 'drag' 
                          ? 'Position paddle, then tap to start!' 
                          : 'Tap screen to launch ball!'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Keyboard Controls Hint */}
                {showKeyboardControls && keyboardHintVisible && (gameState === 'ready') && !showMenu && !showControlsHelp && !['won', 'levelFailed'].includes(gameState) && level === 1 && !hintsShownBefore && (
                  <div className="pointer-events-none">
                    <div className="bg-black/70 p-3 rounded-xl text-white text-center animate-fadeIn">
                      <p className="text-base font-bold mb-2">Ready Player?</p>
                      <div className="flex justify-center gap-6 mb-1">
                        <div className="flex flex-col items-center">
                          <div className="flex gap-1 mb-1">
                            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">←</div>
                            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">→</div>
                          </div>
                          <span className="text-xs font-bold">MOVE</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center mb-1">↑</div>
                          <span className="text-xs font-bold">LAUNCH</span>
                        </div>
                      </div>
                      <p className="text-xs mt-2 animate-pulse font-bold">Position paddle, press ↑ to start!</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Controls Help Modal - Shown when help button is clicked */}
              {showControlsHelp && (
                <div 
                  className="absolute inset-0 flex items-center justify-center z-50 bg-black/70"
                >
                  <div className="bg-gray-800 p-5 rounded-xl text-white max-w-md mx-auto relative">
                    {/* Close button */}
                    <button 
                      onClick={handleDismissControlsHelp}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 rounded-full p-1.5 text-white transition-colors"
                      aria-label="Close controls help"
                    >
                      <X size={16} />
                    </button>
                    
                    <h2 className="text-xl font-bold mb-4 text-center">Controls</h2>
                    
                    {/* Show appropriate controls based on device */}
                    {hasTouchSupportRef.current ? (
                      <div className="space-y-5">
                        {/* Touch Control Preference Selection */}
                        <div className="mb-6 bg-gray-700/50 p-4 rounded-lg">
                          <h3 className="font-bold mb-3">Touch Control Preference</h3>
                          <div className="flex items-center justify-between gap-3">
                            <button
                              className={`px-4 py-2 rounded-lg flex-1 ${
                                touchControlPreference === 'drag' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-600 text-gray-300'
                              }`}
                              onClick={() => saveTouchControlPreference('drag')}
                            >
                              Drag Controls
                            </button>
                            <button
                              className={`px-4 py-2 rounded-lg flex-1 ${
                                touchControlPreference === 'tap' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-600 text-gray-300'
                              }`}
                              onClick={() => saveTouchControlPreference('tap')}
                            >
                              Tap Controls
                            </button>
                          </div>
                          <p className="text-xs text-gray-300 mt-2">
                            {touchControlPreference === 'drag' 
                              ? 'Drag anywhere on screen to position paddle exactly where you touch (precise control)' 
                              : 'Tap left or right side of screen to move paddle continuously in that direction'}
                          </p>
                          <p className="text-xs text-gray-300 mt-1 italic">
                            Note: In the ready state, both controls are available to position the paddle
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <img src={drag} alt="Drag" className="w-12 h-12" />
                          <div>
                            <h3 className="font-bold">Drag Controls</h3>
                            <p className="text-sm text-gray-300">
                              {touchControlPreference === 'drag' 
                                ? 'Touch and drag anywhere on screen to position paddle exactly under your finger (precise positioning)' 
                                : 'Touch and drag to position paddle (only available before launching the ball)'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <img src={tap} alt="Tap" className="w-12 h-12" />
                          <div>
                            <h3 className="font-bold">Tap Controls</h3>
                            <p className="text-sm text-gray-300">
                              {touchControlPreference === 'tap' 
                                ? 'Tap left or right side of screen to move paddle continuously in that direction' 
                                : 'Tap left or right side of screen to move paddle (not available during gameplay)'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <img src={tap} alt="Double Tap" className="w-12 h-12" />
                          <div>
                            <h3 className="font-bold">Tap To Launch</h3>
                            <p className="text-sm text-gray-300">Tap anywhere (except the paddle) to launch the ball from the ready position</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">←</div>
                            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">→</div>
                          </div>
                          <div>
                            <h3 className="font-bold">Position Paddle</h3>
                            <p className="text-sm text-gray-300">Use left and right arrow keys to position paddle</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">↑</div>
                          <div>
                            <h3 className="font-bold">Launch Ball</h3>
                            <p className="text-sm text-gray-300">Press up arrow to launch ball from ready position</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-sm">Space</span>
                          </div>
                          <div>
                            <h3 className="font-bold">Pause Game</h3>
                            <p className="text-sm text-gray-300">Press space bar to pause/resume game</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-xs">Mouse</span>
                          </div>
                          <div>
                            <h3 className="font-bold">Mouse Controls</h3>
                            <p className="text-sm text-gray-300">Drag to position paddle, double-click to launch!</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Show different help text based on device type */}
                    <p className="mt-6 text-center text-sm text-yellow-300">
                      {hasTouchSupportRef.current ? "" : "Press ESC key or click the X button to close"}
                    </p>
                  </div>
                </div>
              )}
              
              <style dangerouslySetInnerHTML={{
                __html: `
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                  }
                `
              }} />
            </div>
          </div>
        </div>
      </div>

      {showMenu && (
        <PauseMenu handleMenuClose={handleMenuClose} resetLevel={resetLevel} quitToMenu={quitToMenu} />
      )}

      {gameState === 'won' && (
        <LevelCompleteModal level={level} score={score} lives={lives} liveStars={liveStars} navigate={navigate} quitToMenu={quitToMenu} />
      )}

      {gameState === 'levelFailed' && (
        <LevelFailedModal score={score} resetLevel={resetLevel} quitToMenu={quitToMenu} />
      )}
    </div>
  );
};

export default Game;
