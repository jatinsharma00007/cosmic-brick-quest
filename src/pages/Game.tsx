import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Pause, Play, Home, Menu, Heart, X, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';

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

// Game settings
const GAME_SETTINGS = {
  ball: {
    baseSpeed: 5,
    radius: 10,
    initialY: 540
  },
  paddle: {
    height: 20,
    moveSpeed: 10,
    initialY: 550
  },
  canvas: {
    width: 800,
    height: 600
  },
  lives: 3,
  difficulty: {
    level1: {
      rows: 4,
      cols: 7,
      paddleWidth: 120,
      emptyChance: 0.3
    },
    level2: {
      rows: 6,
      cols: 8,
      paddleWidth: 100,
      emptyChance: 0.25
    },
    level3: {
      rows: 8,
      cols: 10,
      paddleWidth: 80,
      emptyChance: 0.2
    },
    level4: {
      rows: 10,
      cols: 12,
      paddleWidth: 70,
      emptyChance: 0.15
    }
  }
};

// Score settings
const SCORE_SETTINGS = {
  normalBrick: 10,
  normalBrickColor: '#4B9CD3', // A nice medium blue color
  normalBrickShadow: '0 0 10px rgba(75, 156, 211, 0.5)',
  lifeBonus: 500,
  materialBricks: {
    gold: {
      name: 'Gold',
      color: '#facc15',
      points: 100,
      effect: '0 0 15px rgba(250, 204, 21, 0.7)'
    },
    silver: {
      name: 'Silver',
      color: '#d1d5db',
      points: 70,
      effect: '0 0 15px rgba(209, 213, 219, 0.7)'
    },
    bronze: {
      name: 'Bronze',
      color: '#b45309',
      points: 50,
      effect: '0 0 15px rgba(180, 83, 9, 0.7)'
    },
    emerald: {
      name: 'Emerald',
      color: '#22c55e',
      points: 120,
      effect: '0 0 15px rgba(34, 197, 94, 0.7)'
    },
    ruby: {
      name: 'Ruby',
      color: '#ef4444',
      points: 150,
      effect: '0 0 15px rgba(239, 68, 68, 0.7)'
    },
    sapphire: {
      name: 'Sapphire',
      color: '#3b82f6',
      points: 130,
      effect: '0 0 15px rgba(59, 130, 246, 0.7)'
    }
  }
};

// Control settings
const CONTROLS = {
  moveLeft: ['ArrowLeft', 'a', 'A'],
  moveRight: ['ArrowRight', 'd', 'D'],
  pause: [' '],
  menuOpen: ['m', 'M'],
  menuClose: ['Escape'],
};

// XP Bar with Stars component
const XPBarWithStars = ({ score, maxScore, stars }: { score: number, maxScore: number, stars: number }) => {
  const percent = Math.min(100, (score / maxScore) * 100);
  return (
    <div className="flex flex-col items-center w-[180px]">
      <div className="flex justify-between w-full mb-1 px-2">
        {[0, 1, 2].map(i => (
          <svg
            key={i}
            width="32" height="32" viewBox="0 0 32 32"
            className="drop-shadow"
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
      <div className="relative w-full h-6 rounded-full border-4 border-yellow-700 bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden shadow-lg">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-300 to-green-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 drop-shadow">
          {score} / {maxScore}
        </div>
      </div>
    </div>
  );
};

// Add Particle interface and component
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  shadow: string;
  size: number;
  rotation: number;
  scale: number;
  dx: number;
  dy: number;
  opacity: number;
  shape: 'square' | 'triangle';
}

// Add particle settings
const PARTICLE_SETTINGS = {
  count: { min: 8, max: 12 },
  size: { min: 4, max: 8 },
  speed: { min: 3, max: 6 },
  rotation: { min: -180, max: 180 },
  scale: { min: 0.8, max: 1.2 },
  duration: { min: 800, max: 1200 },
  shapes: ['square', 'triangle'] as const
};

// Add particle generation function
const generateParticles = (
  x: number,
  y: number,
  color: string,
  shadow: string,
  count: number
): Particle[] => {
  const particles: Particle[] = [];
  const brickWidth = 80; // Match the brick width from generateLevel
  const brickHeight = 25; // Match the brick height from generateLevel

  for (let i = 0; i < count; i++) {
    // Generate particles within the brick's boundaries
    const particleX = x - brickWidth / 2 + Math.random() * brickWidth;
    const particleY = y - brickHeight / 2 + Math.random() * brickHeight;

    const size = Math.random() * (PARTICLE_SETTINGS.size.max - PARTICLE_SETTINGS.size.min) + PARTICLE_SETTINGS.size.min;
    const speed = Math.random() * (PARTICLE_SETTINGS.speed.max - PARTICLE_SETTINGS.speed.min) + PARTICLE_SETTINGS.speed.min;

    // Calculate angle based on particle's position relative to brick center
    const dx = particleX - x;
    const dy = particleY - y;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI / 2; // Add some randomness to the angle

    particles.push({
      id: Math.random(),
      x: particleX,
      y: particleY,
      color,
      shadow,
      size,
      rotation: Math.random() * (PARTICLE_SETTINGS.rotation.max - PARTICLE_SETTINGS.rotation.min) + PARTICLE_SETTINGS.rotation.min,
      scale: Math.random() * (PARTICLE_SETTINGS.scale.max - PARTICLE_SETTINGS.scale.min) + PARTICLE_SETTINGS.scale.min,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      opacity: 1,
      shape: PARTICLE_SETTINGS.shapes[Math.floor(Math.random() * PARTICLE_SETTINGS.shapes.length)]
    });
  }
  return particles;
};

// Add ParticleRenderer component
const ParticleRenderer = ({ particles }: { particles: Particle[] }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: particle.shadow,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            opacity: particle.opacity,
            transition: 'all 0.8s ease-out',
            clipPath: particle.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
          }}
        />
      ))}
    </div>
  );
};

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
    setLiveStars(calculateStars());
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

        // Draw outer border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Draw inner border for material bricks
        if (brick.type === 'material' && brick.material) {
          const borderWidth = 4;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = borderWidth;
          ctx.strokeRect(
            brick.x + borderWidth / 2,
            brick.y + borderWidth / 2,
            brick.width - borderWidth,
            brick.height - borderWidth
          );
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (brick.type === 'material' && brick.material) {
          // Draw material name
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
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
    setPaddle(prev => ({
      ...prev,
      x: (GAME_SETTINGS.canvas.width - prev.width) / 2,
      y: GAME_SETTINGS.paddle.initialY
    }));

    const speed = GAME_SETTINGS.ball.baseSpeed;
    const angle = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4;
    setBall(prev => ({
      x: (GAME_SETTINGS.canvas.width - paddle.width) / 2 + paddle.width / 2,
      y: GAME_SETTINGS.ball.initialY,
      dx: speed * Math.sin(angle),
      dy: -speed * Math.cos(angle),
      radius: GAME_SETTINGS.ball.radius,
      speed: speed,
      baseSpeed: speed
    }));
    setReadyStateContext('retry');
    setGameState('ready');
    setIsPaused(true);
    setMouseX(null);
  }, [level, paddle.width, lives, gameState]);

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

                // Generate particles for brick breakage
                const particleCount = Math.floor(
                  Math.random() * (PARTICLE_SETTINGS.count.max - PARTICLE_SETTINGS.count.min) + PARTICLE_SETTINGS.count.min
                );

                let particleColor = SCORE_SETTINGS.normalBrickColor;
                let particleShadow = SCORE_SETTINGS.normalBrickShadow;

                if (brick.type === 'material' && brick.material) {
                  const material = SCORE_SETTINGS.materialBricks[brick.material];
                  particleColor = material.color;
                  particleShadow = material.effect;
                }

                // Get canvas offset for correct positioning
                const { left, top } = getCanvasOffset();
                const brickCenterX = left + brick.x + brick.width / 2;
                const brickCenterY = top + brick.y + brick.height / 2;

                const newParticles = generateParticles(
                  brickCenterX,
                  brickCenterY,
                  particleColor,
                  particleShadow,
                  particleCount
                );

                setParticles(prev => [...prev, ...newParticles]);

                // Floating score animation
                const fx = left + brick.x + brick.width / 2;
                const fy = top + brick.y + brick.height / 2;
                let value = SCORE_SETTINGS.normalBrick;

                if (brick.type === 'material' && brick.material) {
                  value = SCORE_SETTINGS.materialBricks[brick.material].points;
                }

                floatingScoreToAdd = { x: fx, y: fy, value };

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
    
    const brickWidth = 80;
    const brickHeight = 25;
    const offsetTop = 80;
    const totalWidth = config.cols * brickWidth;
    const offsetLeft = (800 - totalWidth) / 2;

    console.log(`Generating level ${levelNumber} with config:`, config);

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (Math.random() > config.emptyChance) {
          let brickType: 'normal' | 'material' = 'normal';
          let maxHits = 1;
          let color = SCORE_SETTINGS.normalBrickColor;
          let material: keyof typeof SCORE_SETTINGS.materialBricks | undefined;

          const rand = Math.random();
          if (rand < 0.3) {
            // 30% chance for material bricks
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
    
    console.log(`Generated ${newBricks.length} bricks for level ${levelNumber}`);
    return newBricks;
  };

  const initializeGame = useCallback((levelNumber?: number) => {
    if (isInitializedRef.current) return;

    const currentLevel = levelNumber || level;
    const config = getDifficultyConfig(currentLevel);
    const newBricks = generateLevel(currentLevel);
    
    console.log(`Initializing game for level ${currentLevel}`);
    
    setScore(0);
    setLives(GAME_SETTINGS.lives);
    setReadyStateContext('start');
    setGameState('ready');
    setIsPaused(false);
    setBricksBroken(0);
    
    const newPaddle = { 
      x: (800 - config.paddleWidth) / 2, 
      y: 550, 
      width: config.paddleWidth, 
      height: 20 
    };
    setPaddle(newPaddle);
    
    // Initialize ball with normalized velocity components
    const speed = GAME_SETTINGS.ball.baseSpeed;
    const angle = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4; // Random angle between -45 and 45 degrees
    const newBall = {
      x: newPaddle.x + newPaddle.width / 2,
      y: newPaddle.y - 20,
      dx: speed * Math.sin(angle),
      dy: -speed * Math.cos(angle),
      radius: 10,
      speed: speed,
      baseSpeed: speed
    };
    setBall(newBall);
    
    setBricks(newBricks);
    isInitializedRef.current = true;
    
    console.log(`Game initialized with ${newBricks.length} bricks`);
  }, [level]);

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
    
    const stars = calculateStars();
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

  const calculateStars = () => {
    const baseScore = bricks.length * SCORE_SETTINGS.normalBrick;
    const lifeBonus = lives * SCORE_SETTINGS.lifeBonus;
    const totalPossible = baseScore + lifeBonus;
    const percentage = (score + lifeBonus) / totalPossible;
    
    if (percentage >= 0.9) return 3;
    if (percentage >= 0.7) return 2;
    return 1;
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

  // Update the Game component to include particles state
  const [particles, setParticles] = useState<Particle[]>([]);

  // Add particle animation function
  const animateParticles = useCallback(() => {
    setParticles(prevParticles => {
      const updatedParticles = prevParticles.map(particle => ({
        ...particle,
        x: particle.x + particle.dx,
        y: particle.y + particle.dy,
        opacity: particle.opacity - 0.02,
        rotation: particle.rotation + 5,
        scale: particle.scale * 0.98
      }));

      // Remove particles that have faded out
      return updatedParticles.filter(p => p.opacity > 0);
    });
  }, []);

  // Add particle animation effect
  useEffect(() => {
    if (particles.length > 0) {
      const animationFrame = requestAnimationFrame(animateParticles);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [particles, animateParticles]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 relative">
      {/* Header Bar */}
      <div className="bg-black/50 text-white p-4 flex justify-between items-center">
        <div className="font-bold text-lg">Level {level}/100</div>
        {/* HUD Bar with XP Bar and Stars in header */}
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-1">
            🧱 <span className="ml-1">{bricksBroken}</span>
          </div>
          <XPBarWithStars score={score} maxScore={maxPossibleScore} stars={liveStars} />
          <div className="flex items-center gap-1">
            {Array.from({ length: lives }, (_, i) => (
              <Heart key={i} size={18} className="text-red-500 fill-red-500" />
            ))}
          </div>
        </div>
        <Button
          onClick={handleMenuOpen}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <Menu size={24} />
        </Button>
      </div>

      {/* Floating Score Animations */}
      <div className="absolute left-0 top-0 w-full h-full pointer-events-none z-40">
        {floatingScores.map(fs => (
          <span
            key={fs.id}
            style={{
              position: 'absolute',
              left: fs.x,
              top: fs.y,
              color: '#ffe066',
              fontWeight: 700,
              fontSize: 20,
              pointerEvents: 'none',
              opacity: 0.9,
              animation: 'floatScore 1s ease-out forwards',
            }}
            className="select-none"
          >
            +{fs.value}
          </span>
        ))}
        <style>{`
          @keyframes floatScore {
            0% { opacity: 0.9; transform: translateY(0); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-40px); }
          }
        `}</style>
      </div>

      <div className="flex justify-center pt-4">
        <canvas 
          ref={canvasRef} 
          width={GAME_SETTINGS.canvas.width}
          height={GAME_SETTINGS.canvas.height}
          className="border-4 border-white/20 rounded-lg shadow-2xl bg-gray-900 select-none"
          style={{
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        />
      </div>

      {/* <div className="text-center mt-4 text-white/80">
        <p>Use mouse or arrow keys to move paddle • Space to pause</p>
        <p className="text-sm">Lives: {lives} • Red bricks explode • Gray bricks need 2 hits</p>
        <p className="text-sm text-left ml-4 mt-2">FPS: {fps}</p>
      </div> */}

      {showMenu && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl text-white relative min-w-[300px]">
            <Button
              onClick={handleMenuClose}
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20"
            >
              <X size={24} />
            </Button>

            <div className="text-center space-y-4 mt-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center justify-center">
                <Pause size={20} className="mr-2" />
                Paused
              </h2>

              <Button 
                onClick={handleMenuClose}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Play size={20} className="mr-2" />
                Resume
              </Button>

              <Button
                onClick={resetLevel}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCcw size={20} className="mr-2" />
                Restart
              </Button>

              <Button
                onClick={quitToMenu}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Home size={20} className="mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-green-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-3xl font-bold text-yellow-300">Level Complete!</h2>
            {(() => {
              const saved = localStorage.getItem('brickBreakerProgress');
              const data = saved ? JSON.parse(saved) : {};
              const levelData = data[`level_${level}`] || { score: 0 };
              const isNewHighScore = score >= (levelData.score || 0);

              return (
                <>
                  <p className="text-xl">
                    {isNewHighScore ? (
                      <>
                        New High Score: {score}
                        {levelData.score > 0 && (
                          <span className="block text-yellow-300 text-sm mt-1">
                            Previous: {levelData.score}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        Score: {score}
                        <span className="block text-yellow-300 text-sm mt-1">
                          High Score: {levelData.score}
                        </span>
                      </>
                    )}
                  </p>
                  <p>Lives Remaining: {lives}</p>
                  <p>Stars Earned: {'★'.repeat(liveStars)}</p>
                </>
              );
            })()}
            <div className="space-x-4">
              <Button 
                onClick={() => navigate(`/game?level=${level + 1}`)} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={level >= 100}
              >
                {level >= 100 ? 'Game Complete!' : 'Next Level'}
              </Button>
              <Button onClick={quitToMenu} className='text-black' variant="outline">
                Level Select
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'levelFailed' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-red-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-3xl text-green-400 font-bold">Better luck next time!</h2>
            <p className="text-xl">All lives lost!</p>
            <p>Score: {score}</p>
            <div className="space-x-4">
              <Button onClick={resetLevel} className="bg-green-600 hover:bg-green-700">
                Try Again
              </Button>
              <Button onClick={quitToMenu} className='text-green-600' variant="outline">
                Level Select
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-gray-800 p-6 rounded-xl text-white text-center">
            {(() => {
              const message = getReadyMessage();
              return (
                <>
                  <h2 className="text-3xl font-bold mb-4 text-yellow-400">
                    {message.title}
                  </h2>
                  {message.showSubtitle && (
                    <p className="text-lg mb-2 text-white/80">
                      {message.subtitle}
                    </p>
                  )}
                  <p className="text-5xl font-bold text-yellow-400 animate-pulse mt-4">
                    {countdown}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add ParticleRenderer */}
      <ParticleRenderer particles={particles} />
    </div>
  );
};

export default Game;
