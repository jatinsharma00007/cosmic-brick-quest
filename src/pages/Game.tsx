import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Pause, Play, Home, Menu, Heart } from 'lucide-react';
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
  ballSpeed: number;
  paddleWidth: number;
  emptyChance: number;
  strongBrickChance: number;
  bombBrickChance: number;
}

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost' | 'levelFailed'>('playing');
  
  // Game objects with proper initial values
  const [paddle, setPaddle] = useState<Paddle>({ x: 350, y: 550, width: 100, height: 20 });
  const [ball, setBall] = useState<Ball>({ x: 400, y: 530, dx: 4, dy: -4, radius: 10, speed: 4 });
  const [bricks, setBricks] = useState<Brick[]>([]);

  // Render function that will be called on every frame
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 600);

    // Draw bricks
    bricks.forEach(brick => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Add border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        // Show hit count for multi-hit bricks
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

        // Special indicators for bomb bricks
        if (brick.type === 'bomb') {
          ctx.fillStyle = '#ffff00';
          ctx.font = 'bold 10px Arial';
          ctx.fillText('💣', brick.x + brick.width/2, brick.y + brick.height/2 + 3);
        }
      }
    });

    // Draw paddle
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [bricks, paddle, ball]);

  // Game loop that updates and renders
  const gameLoop = useCallback(() => {
    if (!isPaused && gameState === 'playing') {
      // Update paddle with keyboard
      if (keysRef.current['ArrowLeft']) {
        setPaddle(prev => ({ ...prev, x: Math.max(0, prev.x - 8) }));
      }
      if (keysRef.current['ArrowRight']) {
        setPaddle(prev => ({ ...prev, x: Math.min(800 - prev.width, prev.x + 8) }));
      }

      // Update ball position
      setBall(prevBall => {
        let newX = prevBall.x + prevBall.dx;
        let newY = prevBall.y + prevBall.dy;
        let newDx = prevBall.dx;
        let newDy = prevBall.dy;

        // Wall collisions
        if (newX <= prevBall.radius || newX >= 800 - prevBall.radius) {
          newDx = -newDx;
          newX = prevBall.x + newDx;
        }
        if (newY <= prevBall.radius) {
          newDy = -newDy;
          newY = prevBall.y + newDy;
        }

        // Ball lost - lose a life
        if (newY >= 600) {
          setLives(currentLives => {
            const newLives = currentLives - 1;
            if (newLives <= 0) {
              setGameState('levelFailed');
              toast.error('Level Failed! All lives lost!');
            } else {
              toast.warning(`Life lost! ${newLives} lives remaining`);
              setTimeout(() => resetBallAndPaddle(), 1000);
            }
            return newLives;
          });
          return prevBall;
        }

        // Paddle collision
        if (newY + prevBall.radius >= paddle.y && 
            newY - prevBall.radius <= paddle.y + paddle.height &&
            newX >= paddle.x && 
            newX <= paddle.x + paddle.width) {
          
          const hitPos = (newX - paddle.x) / paddle.width;
          const angle = (hitPos - 0.5) * Math.PI / 3;
          
          newDx = prevBall.speed * Math.sin(angle);
          newDy = -Math.abs(prevBall.speed * Math.cos(angle));
          newY = paddle.y - prevBall.radius;
        }

        // Brick collisions
        setBricks(currentBricks => {
          const updatedBricks = [...currentBricks];
          let scoreIncrease = 0;
          let hitDetected = false;

          for (let i = 0; i < updatedBricks.length; i++) {
            const brick = updatedBricks[i];
            if (!brick.destroyed && 
                newX + prevBall.radius >= brick.x && 
                newX - prevBall.radius <= brick.x + brick.width &&
                newY + prevBall.radius >= brick.y && 
                newY - prevBall.radius <= brick.y + brick.height) {
              
              if (!hitDetected) {
                newDy = -newDy;
                hitDetected = true;
              }

              brick.hits += 1;
              
              if (brick.hits >= brick.maxHits) {
                brick.destroyed = true;
                
                if (brick.type === 'bomb') {
                  // Destroy surrounding bricks
                  updatedBricks.forEach(otherBrick => {
                    if (!otherBrick.destroyed) {
                      const distance = Math.sqrt(
                        Math.pow(otherBrick.x + otherBrick.width/2 - (brick.x + brick.width/2), 2) + 
                        Math.pow(otherBrick.y + otherBrick.height/2 - (brick.y + brick.height/2), 2)
                      );
                      if (distance < 100) {
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

          // Check if all bricks destroyed
          if (updatedBricks.every(brick => brick.destroyed)) {
            setGameState('won');
            saveLevelProgress();
            toast.success('Level Complete! Well done!');
          }

          return updatedBricks;
        });

        return { ...prevBall, x: newX, y: newY, dx: newDx, dy: newDy };
      });
    }

    renderGame();
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, gameState, paddle, renderGame]);

  const getDifficultyConfig = (levelNumber: number): DifficultyConfig => {
    if (levelNumber <= 10) {
      return { 
        rows: 4, 
        cols: 7, 
        ballSpeed: 3, 
        paddleWidth: 120, 
        emptyChance: 0.3,
        strongBrickChance: 0,
        bombBrickChance: 0
      };
    } else if (levelNumber <= 30) {
      return { 
        rows: 6, 
        cols: 8, 
        ballSpeed: 4, 
        paddleWidth: 100, 
        emptyChance: 0.25,
        strongBrickChance: 0.1,
        bombBrickChance: 0
      };
    } else if (levelNumber <= 70) {
      return { 
        rows: 8, 
        cols: 10, 
        ballSpeed: 5, 
        paddleWidth: 80, 
        emptyChance: 0.2,
        strongBrickChance: 0.2,
        bombBrickChance: 0.05
      };
    } else {
      return { 
        rows: 10, 
        cols: 12, 
        ballSpeed: 6, 
        paddleWidth: 70, 
        emptyChance: 0.15,
        strongBrickChance: 0.3,
        bombBrickChance: 0.1
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

  const initializeGame = (levelNumber?: number) => {
    const currentLevel = levelNumber || level;
    const config = getDifficultyConfig(currentLevel);
    const newBricks = generateLevel(currentLevel);
    
    console.log(`Initializing game for level ${currentLevel}`);
    
    setScore(0);
    setLives(3);
    setGameState('playing');
    setIsPaused(false);
    
    const newPaddle = { 
      x: (800 - config.paddleWidth) / 2, 
      y: 550, 
      width: config.paddleWidth, 
      height: 20 
    };
    setPaddle(newPaddle);
    
    const newBall = {
      x: newPaddle.x + newPaddle.width / 2,
      y: newPaddle.y - 20,
      dx: config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      dy: -config.ballSpeed,
      radius: 10,
      speed: config.ballSpeed
    };
    setBall(newBall);
    
    setBricks(newBricks);
    
    console.log(`Game initialized with ${newBricks.length} bricks`);
  };

  const resetBallAndPaddle = () => {
    const config = getDifficultyConfig(level);
    
    const newPaddle = { 
      x: (800 - paddle.width) / 2, 
      y: 550, 
      width: paddle.width, 
      height: 20 
    };
    setPaddle(newPaddle);
    
    const newBall = {
      x: newPaddle.x + newPaddle.width / 2,
      y: newPaddle.y - 20,
      dx: config.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
      dy: -config.ballSpeed,
      radius: 10,
      speed: config.ballSpeed
    };
    setBall(newBall);
  };

  const setupEventListeners = () => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current[e.code] = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isPaused && gameState === 'playing') {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        setPaddle(prev => ({
          ...prev,
          x: Math.max(0, Math.min(800 - prev.width, mouseX - prev.width / 2))
        }));
      }
    }
  };

  const saveLevelProgress = () => {
    const saved = localStorage.getItem('brickBreakerProgress');
    const data = saved ? JSON.parse(saved) : {};
    
    const stars = calculateStars();
    data[`level_${level}`] = { 
      stars, 
      score: score,
      unlocked: true 
    };
    
    if (level < 100) {
      data[`level_${level + 1}`] = { 
        stars: data[`level_${level + 1}`]?.stars || 0,
        score: data[`level_${level + 1}`]?.score || 0,
        unlocked: true 
      };
    }
    
    localStorage.setItem('brickBreakerProgress', JSON.stringify(data));
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

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetLevel = () => {
    initializeGame(level);
    setGameState('playing');
    setIsPaused(false);
    setShowMenu(false);
  };

  const quitToMenu = () => {
    navigate('/level-select');
  };

  // Initialize game on component mount
  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam) {
      const newLevel = parseInt(levelParam);
      setLevel(newLevel);
      initializeGame(newLevel);
    } else {
      initializeGame(1);
    }
    
    document.title = `Level ${level} - Brick Breaker`;
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Start game loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Level change handler
  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam) {
      const newLevel = parseInt(levelParam);
      if (newLevel !== level) {
        setLevel(newLevel);
        initializeGame(newLevel);
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 relative">
      {/* Header */}
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
            onClick={() => setShowMenu(true)}
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Menu size={24} />
          </Button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center pt-4">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          className="border-4 border-white/20 rounded-lg shadow-2xl bg-gray-900"
        />
      </div>

      {/* Game Controls */}
      <div className="text-center mt-4 text-white/80">
        <p>Use mouse or arrow keys to move paddle • Space to pause</p>
        <p className="text-sm">Lives: {lives} • Red bricks explode • Gray bricks need 2 hits</p>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-2xl font-bold mb-6">Game Menu</h2>
            
            <Button 
              onClick={() => { setShowMenu(false); setIsPaused(false); }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play size={20} className="mr-2" />
              Resume
            </Button>
            
            <Button 
              onClick={() => { setShowMenu(false); setIsPaused(true); }}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              <Pause size={20} className="mr-2" />
              Pause
            </Button>
            
            <Button 
              onClick={resetLevel}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Restart Level
            </Button>
            
            <Button 
              onClick={quitToMenu}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Home size={20} className="mr-2" />
              Quit to Menu
            </Button>
          </div>
        </div>
      )}

      {gameState === 'won' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-green-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-3xl font-bold text-yellow-300">Level Complete!</h2>
            <p className="text-xl">Score: {score}</p>
            <p>Lives Remaining: {lives}</p>
            <p>Stars Earned: {'★'.repeat(calculateStars())}</p>
            <div className="space-x-4">
              <Button 
                onClick={() => navigate(`/game?level=${level + 1}`)} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={level >= 100}
              >
                {level >= 100 ? 'Game Complete!' : 'Next Level'}
              </Button>
              <Button onClick={quitToMenu} variant="outline">
                Level Select
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'levelFailed' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-red-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-3xl font-bold">Level Failed!</h2>
            <p className="text-xl">All lives lost!</p>
            <p>Score: {score}</p>
            <div className="space-x-4">
              <Button onClick={resetLevel} className="bg-green-600 hover:bg-green-700">
                Try Again
              </Button>
              <Button onClick={quitToMenu} variant="outline">
                Level Select
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
