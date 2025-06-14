import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Pause, Play, Home, Menu, Heart, X, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
  hits: number;
  maxHits: number;
  type: 'normal' | 'strong' | 'bomb';
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
  strongBrickChance: number;
  bombBrickChance: number;
}

// Add game settings configuration at the top of the file, before the component
const GAME_SETTINGS = {
  ball: {
    baseSpeed: 10,
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
      emptyChance: 0.3,
      strongBrickChance: 0,
      bombBrickChance: 0
    },
    level2: {
      rows: 6,
      cols: 8,
      paddleWidth: 100,
      emptyChance: 0.25,
      strongBrickChance: 0.1,
      bombBrickChance: 0
    },
    level3: {
      rows: 8,
      cols: 10,
      paddleWidth: 80,
      emptyChance: 0.2,
      strongBrickChance: 0.2,
      bombBrickChance: 0.05
    },
    level4: {
      rows: 10,
      cols: 12,
      paddleWidth: 70,
      emptyChance: 0.15,
      strongBrickChance: 0.3,
      bombBrickChance: 0.1
    }
  }
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
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        if (brick.maxHits > 1) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${brick.maxHits - brick.hits}`, 
            brick.x + brick.width/2, 
            brick.y + brick.height/2 + 4
          );
        }

        if (brick.type === 'bomb') {
          ctx.fillStyle = '#ffff00';
          ctx.font = 'bold 10px Arial';
          ctx.fillText('💣', brick.x + brick.width/2, brick.y + brick.height/2 + 3);
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

        // Wall collisions
        if (newX <= prevBall.radius || newX >= GAME_SETTINGS.canvas.width - prevBall.radius) {
          newDx = -newDx;
          newX = prevBall.x + newDx;
        }
        if (newY <= prevBall.radius) {
          newDy = -newDy;
          newY = prevBall.y + newDy;
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

        // Paddle collision
        const currentPaddle = paddleRef.current;
        if (newY + prevBall.radius >= currentPaddle.y &&
          newY - prevBall.radius <= currentPaddle.y + currentPaddle.height &&
          newX >= currentPaddle.x &&
          newX <= currentPaddle.x + currentPaddle.width) {
          
          const hitPos = (newX - currentPaddle.x) / currentPaddle.width;
          const angle = (hitPos - 0.5) * Math.PI / 3;

          const speed = GAME_SETTINGS.ball.baseSpeed;
          newDx = speed * Math.sin(angle);
          newDy = -speed * Math.cos(angle);

          newX = prevBall.x + newDx;
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

      // Brick collision detection
      setBricks(currentBricks => {
        const updatedBricks = [...currentBricks];
        let scoreIncrease = 0;
        let hitDetected = false;
        const currentBall = ballRef.current;

        for (let i = 0; i < updatedBricks.length; i++) {
          const brick = updatedBricks[i];
          if (!brick.destroyed && 
            currentBall.x + currentBall.radius >= brick.x &&
            currentBall.x - currentBall.radius <= brick.x + brick.width &&
            currentBall.y + currentBall.radius >= brick.y &&
            currentBall.y - currentBall.radius <= brick.y + brick.height) {

            if (!hitDetected) {
              setBall(prev => ({ ...prev, dy: -prev.dy }));
              hitDetected = true;
            }

            brick.hits += 1;

            if (brick.hits >= brick.maxHits) {
              brick.destroyed = true;

              if (brick.type === 'bomb') {
                // Optimize bomb explosion by using a more efficient distance calculation
                const bombX = brick.x + brick.width / 2;
                const bombY = brick.y + brick.height / 2;
                const explosionRadius = 100;
                const explosionRadiusSquared = explosionRadius * explosionRadius;

                updatedBricks.forEach(otherBrick => {
                  if (!otherBrick.destroyed) {
                    const dx = (otherBrick.x + otherBrick.width / 2) - bombX;
                    const dy = (otherBrick.y + otherBrick.height / 2) - bombY;
                    if (dx * dx + dy * dy < explosionRadiusSquared) {
                      otherBrick.destroyed = true;
                      scoreIncrease += 100;
                    }
                  }
                });
                scoreIncrease += 500;
              } else if (brick.type === 'strong') {
                scoreIncrease += 200;
              } else {
                scoreIncrease += 100;
              }
            } else {
              brick.color = brick.color === '#888888' ? '#AAAAAA' : '#888888';
            }

            break;
          }
        }

        if (scoreIncrease > 0) {
          setScore(prev => prev + scoreIncrease);
        }

        if (updatedBricks.every(brick => brick.destroyed)) {
          // Save progress immediately when level is completed, only once
          if (!hasSavedWinRef.current) {
            const highScore = saveLevelProgress();
            setScore(highScore);
            hasSavedWinRef.current = true;
          }
          setGameState('won');
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
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    const brickWidth = 80;
    const brickHeight = 25;
    const padding = 5;
    const offsetTop = 80;
    const totalWidth = config.cols * (brickWidth + padding) - padding;
    const offsetLeft = (800 - totalWidth) / 2;

    console.log(`Generating level ${levelNumber} with config:`, config);

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (Math.random() > config.emptyChance) {
          let brickType: 'normal' | 'strong' | 'bomb' = 'normal';
          let maxHits = 1;
          let color = colors[row % colors.length];

          const rand = Math.random();
          if (rand < config.bombBrickChance) {
            brickType = 'bomb';
            maxHits = 1;
            color = '#FF4444';
          } else if (rand < config.bombBrickChance + config.strongBrickChance) {
            brickType = 'strong';
            maxHits = 2;
            color = '#888888';
          }

          newBricks.push({
            x: offsetLeft + col * (brickWidth + padding),
            y: offsetTop + row * (brickHeight + padding),
            width: brickWidth,
            height: brickHeight,
            color: color,
            destroyed: false,
            hits: 0,
            maxHits: maxHits,
            type: brickType
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else {
      keysRef.current[e.code] = true;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code !== 'Space') {
      keysRef.current[e.code] = false;
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
    const baseScore = bricks.length * 100;
    const lifeBonus = lives * 500;
    const totalPossible = baseScore + lifeBonus;
    const percentage = (score + lifeBonus) / totalPossible;
    
    if (percentage >= 0.9) return 3;
    if (percentage >= 0.7) return 2;
    return 1;
  };

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setIsPaused(prev => !prev);
    }
  }, [gameState]);

  const resetLevel = useCallback(() => {
    isInitializedRef.current = false;
    initializeGame(level);
    setReadyStateContext('restart');  // New context for restart
    setGameState('ready');
    setIsPaused(true);
    setShowMenu(false);
  }, [level, initializeGame]);

  const quitToMenu = () => {
    navigate('/level-select');
  };

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
    window.addEventListener('mouseup', handleMouseUp);
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
      window.removeEventListener('mouseup', handleMouseUp);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 relative">
      <div className="bg-black/50 text-white p-4 flex justify-between items-center">
        <div className="font-bold text-lg">Level {level}/100</div>
        <div className="font-bold text-xl">Score: {score}</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: lives }, (_, i) => (
              <Heart key={i} size={20} className="text-red-500 fill-red-500" />
            ))}
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

      <div className="text-center mt-4 text-white/80">
        <p>Use mouse or arrow keys to move paddle • Space to pause</p>
        <p className="text-sm">Lives: {lives} • Red bricks explode • Gray bricks need 2 hits</p>
        <p className="text-sm text-left ml-4 mt-2">FPS: {fps}</p>
      </div>

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
              <h2 className="text-2xl font-bold mb-6"><Pause size={20} className="mr-2" /> Pause</h2>

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
                Restart Level
              </Button>

              <Button
                onClick={quitToMenu}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Home size={20} className="mr-2" />
                Main Menu
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
                  <p>Stars Earned: {'★'.repeat(calculateStars())}</p>
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
    </div>
  );
};

export default Game;
