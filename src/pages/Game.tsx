import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Pause, Play, Home, Menu, Heart, X, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';
import { GAME_SETTINGS, SCORE_SETTINGS, CONTROLS, GAME_SIZES } from '../lib/config';
import { gameToOverlayCoords } from '../lib/utils';
import ParticleEffect from '@/components/ParticleEffect';
import { getParticleSettings } from '@/lib/particleConfig';

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
  <div className="bg-black/50 text-white p-2 sm:p-4 flex flex-wrap justify-between items-center gap-2">
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
      <Menu size={25} className="sm:w-6 sm:h-6" />
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
}

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isResettingRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(GAME_SETTINGS.lives);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost' | 'levelFailed'>('ready');
  
  const [isDragging, setIsDragging] = useState(false);
  const [paddle, setPaddle] = useState<Paddle>({ x: 350, y: 550, width: 100, height: 20 });
  const [ball, setBall] = useState<Ball>({
    x: 400,
    y: 530,
    dx: 4,
    dy: -4,
    radius: 10,
    speed: 4,
    baseSpeed: 4
  });
  const [bricks, setBricks] = useState<Brick[]>([]);

  // Add a ref to track if game is initialized
  const isInitializedRef = useRef(false);

  const [mouseX, setMouseX] = useState<number | null>(null);

  // Add refs for frequently accessed values to avoid re-renders
  const gameStateRef = useRef(gameState);
  const isPausedRef = useRef(isPaused);
  const paddleRef = useRef(paddle);
  const ballRef = useRef(ball);
  const bricksRef = useRef(bricks);

  // Add FPS tracking refs
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const [fps, setFps] = useState(0);

  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [readyStateContext, setReadyStateContext] = useState<'start' | 'resume' | 'retry' | 'restart'>('start');
  const livesRef = useRef(lives);

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
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
    // Ensure isPaused is properly synced with gameState
    if (gameState === 'playing') {
      isPausedRef.current = false;
    } else if (gameState === 'ready') {
      isPausedRef.current = true;
    }
  }, [gameState]);

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

  // Update livesRef when lives change
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  // Live star calculation
  useEffect(() => {
    setLiveStars(calculateStars(score, lives, bricks));
  }, [score, lives, bricks]);

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
  }, []); // Empty dependency array since we're using refs

  // Move resetBallAndPaddle before gameLoop
  const resetBallAndPaddle = useCallback(() => {
    if (lives <= 0 || gameState === 'levelFailed' || gameState === 'won') {
      return;
    }

    const config = getDifficultyConfig(level);
    const sizes = isMobile ? GAME_SIZES.mobile : GAME_SIZES.desktop;
    const paddleWidth = sizes.paddleWidth;
    const paddleHeight = sizes.paddleHeight;
    setPaddle(prev => ({
      ...prev,
      x: (GAME_SETTINGS.canvas.width - paddleWidth) / 2,
      y: GAME_SETTINGS.paddle.initialY,
      width: paddleWidth,
      height: paddleHeight,
    }));

    const speed = GAME_SETTINGS.ball.baseSpeed;
    const angle = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4;
    const ballRadius = sizes.ballRadius;
    setBall(prev => ({
      x: (GAME_SETTINGS.canvas.width - paddleWidth) / 2 + paddleWidth / 2,
      y: GAME_SETTINGS.ball.initialY,
      dx: speed * Math.sin(angle),
      dy: -speed * Math.cos(angle),
      radius: ballRadius,
      speed: speed,
      baseSpeed: speed
    }));
    setReadyStateContext('retry');
    setGameState('ready');
    setIsPaused(true);
    setMouseX(null);
  }, [level, lives, gameState, isMobile]);

  const gameLoop = useCallback(() => {
    // Check both refs for game state
    const isGamePlaying = gameStateRef.current === 'playing' && !isPausedRef.current;

    if (isGamePlaying) {
      // Update paddle with keyboard
      if (keysRef.current['ArrowLeft']) {
        setPaddle(prev => ({
          ...prev,
          x: Math.max(0, prev.x - GAME_SETTINGS.paddle.moveSpeed)
        }));
      }
      if (keysRef.current['ArrowRight']) {
        setPaddle(prev => ({
          ...prev,
          x: Math.min(GAME_SETTINGS.canvas.width - prev.width, prev.x + GAME_SETTINGS.paddle.moveSpeed)
        }));
      }

      // Update paddle with mouse movement
      if (mouseX !== null && isDragging) {
        setPaddle(prev => {
          const targetX = Math.max(0, Math.min(GAME_SETTINGS.canvas.width - prev.width, mouseX - prev.width / 2));
          return { ...prev, x: targetX };
        });
      }

      // Use requestAnimationFrame timestamp for smooth animation
      const updateBall = (prevBall: Ball) => {
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
        if (newY >= GAME_SETTINGS.canvas.height && gameStateRef.current === 'playing') {
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
                const particleSettings = getParticleSettings();

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
    }

    // Always render and schedule next frame
    renderGame();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [renderGame, isDragging, mouseX, resetBallAndPaddle]);

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
    setReadyStateContext('start');
    setGameState('ready');
    setIsPaused(false);
    setBricksBroken(0);
    
    const sizes = isMobile ? GAME_SIZES.mobile : GAME_SIZES.desktop;
    const paddleWidth = sizes.paddleWidth;
    const paddleHeight = sizes.paddleHeight;
    const newPaddle = { 
      x: (GAME_SETTINGS.canvas.width - paddleWidth) / 2, 
      y: 550, 
      width: paddleWidth,
      height: paddleHeight 
    };
    setPaddle(newPaddle);
    
    // Initialize ball with normalized velocity components
    const speed = GAME_SETTINGS.ball.baseSpeed;
    const angle = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4; // Random angle between -45 and 45 degrees
    const ballRadius = sizes.ballRadius;
    const newBall = {
      x: newPaddle.x + newPaddle.width / 2,
      y: newPaddle.y - 20,
      dx: speed * Math.sin(angle),
      dy: -speed * Math.cos(angle),
      radius: ballRadius,
      speed: speed,
      baseSpeed: speed
    };
    setBall(newBall);
    
    setBricks(newBricks);
    isInitializedRef.current = true;
  }, [level, isMobile]);

  const handleMenuOpen = useCallback(() => {
    setShowMenu(true);
    setIsPaused(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setShowMenu(false);
    setReadyStateContext('resume');
    setGameState('ready');
    setIsPaused(true);
  }, []);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setIsPaused(prev => !prev);
    }
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (CONTROLS.pause.includes(e.key) || CONTROLS.pause.includes(e.code)) {
      e.preventDefault();
      togglePause();
    } else if (CONTROLS.menuOpen.includes(e.key)) {
      e.preventDefault();
      handleMenuOpen();
    } else if (CONTROLS.menuClose.includes(e.key)) {
      e.preventDefault();
      if (showMenu) handleMenuClose();
    } else if (CONTROLS.moveLeft.includes(e.key) || CONTROLS.moveLeft.includes(e.code)) {
      keysRef.current['ArrowLeft'] = true;
    } else if (CONTROLS.moveRight.includes(e.key) || CONTROLS.moveRight.includes(e.code)) {
      keysRef.current['ArrowRight'] = true;
    } else {
      keysRef.current[e.code] = true;
    }
  }, [showMenu, handleMenuOpen, handleMenuClose, togglePause]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!(CONTROLS.pause.includes(e.key) || CONTROLS.pause.includes(e.code))) {
      if (CONTROLS.moveLeft.includes(e.key) || CONTROLS.moveLeft.includes(e.code)) {
        keysRef.current['ArrowLeft'] = false;
      } else if (CONTROLS.moveRight.includes(e.key) || CONTROLS.moveRight.includes(e.code)) {
        keysRef.current['ArrowRight'] = false;
      } else {
        keysRef.current[e.code] = false;
      }
    }
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 0 && gameState === 'playing') {
      setIsDragging(true);
    }
  }, [gameState]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPaused || gameState !== 'playing') return;
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const newMouseX = (e.clientX - rect.left) * scaleX;
    setMouseX(newMouseX);
  }, [isPaused, gameState, isDragging]);

  const handleDoubleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (gameState === 'playing') {
      setIsDragging(true);
    }
  }, [gameState]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const saveLevelProgress = () => {
    const saved = localStorage.getItem('brickBreakerProgress');
    const data = saved ? JSON.parse(saved) : {};
    
    const stars = calculateStars(score, lives, bricks);
    const currentLevelData = data[`level_${level}`] || { score: 0, stars: 0 };

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
    setReadyStateContext('start');
    setGameState('ready');
    setIsPaused(true);
    setShowMenu(false);
    setBricksBroken(0);
  }, [level, initializeGame]);

  const quitToMenu = () => {
    navigate('/level-select');
  };

  const getReadyMessage = () => {
    switch (readyStateContext) {
      case 'start':
        return {
          title: 'Get Ready',
          subtitle: 'Game Starts In',
          showSubtitle: true
        };
      case 'resume':
        return {
          title: 'Game Resumes In',
          subtitle: '',
          showSubtitle: true
        };
      case 'restart':
        return {
          title: 'Level Restarts In',
          subtitle: '',
          showSubtitle: false
        };
      case 'retry':
        const remainingLives = livesRef.current;
        if (remainingLives === 2) {
          return {
            title: 'Retry In',
            subtitle: '',
            showSubtitle: false
          };
        }
        if (remainingLives === 1) {
          return {
            title: 'Last Chance',
            subtitle: '',
            showSubtitle: false
          };
        }
        return {
          title: 'Retry',
          subtitle: '',
          showSubtitle: false
        };
      default:
        return {
          title: 'Get Ready',
          subtitle: 'Game Starts In',
          showSubtitle: true
        };
    }
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
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [searchParams, level, initializeGame, handleMouseDown, handleMouseUp, handleMouseMove, handleDoubleClick, handleContextMenu, handleKeyDown, handleKeyUp]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  useEffect(() => {
    if (lives === 0 && gameState !== 'levelFailed') {
      setGameState('levelFailed');
    }
  }, [lives, gameState]);

  // Add countdown effect with context
  useEffect(() => {
    if (gameState === 'ready') {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            setGameState('playing');
            setIsPaused(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [gameState]);

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

  // Add touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (gameState === 'playing') {
      setIsDragging(true);
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const newMouseX = (touch.clientX - rect.left) * scaleX;
      setMouseX(newMouseX);
    }
  }, [gameState]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!isDragging || isPaused || gameState !== 'playing') return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const newMouseX = (touch.clientX - rect.left) * scaleX;
    setMouseX(newMouseX);
  }, [isDragging, isPaused, gameState]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Add touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 relative flex flex-col">
      {/* Header Bar */}
      <GameHUD level={level} bricksBroken={bricksBroken} score={score} maxPossibleScore={maxPossibleScore} liveStars={liveStars} lives={lives} handleMenuOpen={handleMenuOpen} />

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

      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl text-white text-center w-full max-w-[300px] sm:min-w-[300px]">
            {(() => {
              const message = getReadyMessage();
              return (
                <>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-yellow-400">
                    {message.title}
                  </h2>
                  {message.showSubtitle && (
                    <p className="text-base sm:text-lg mb-2 text-white/80">
                      {message.subtitle}
                    </p>
                  )}
                  <p className="text-4xl sm:text-5xl font-bold text-yellow-400 animate-pulse mt-3 sm:mt-4">
                    {countdown}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
