
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Pause, Play, Home, Menu } from 'lucide-react';
import { toast } from 'sonner';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Game = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  
  // Game objects
  const [paddle, setPaddle] = useState<Paddle>({ x: 375, y: 550, width: 100, height: 20 });
  const [ball, setBall] = useState<Ball>({ x: 400, y: 300, dx: 4, dy: 4, radius: 10 });
  const [bricks, setBricks] = useState<Brick[]>([]);

  const gameLoopRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam) {
      setLevel(parseInt(levelParam));
    }
    
    document.title = `Level ${level} - Brick Breaker`;
    initializeGame();
    setupEventListeners();
    startGameLoop();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [level]);

  const initializeGame = () => {
    // Initialize bricks based on level
    const newBricks: Brick[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    const rows = Math.min(5 + Math.floor(level / 10), 10);
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 25;
    const padding = 5;
    const offsetTop = 80;
    const offsetLeft = (800 - (cols * (brickWidth + padding) - padding)) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newBricks.push({
          x: offsetLeft + col * (brickWidth + padding),
          y: offsetTop + row * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: colors[row % colors.length],
          destroyed: false
        });
      }
    }
    
    setBricks(newBricks);
    setScore(0);
    setGameState('playing');
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

  const startGameLoop = () => {
    const gameLoop = () => {
      if (!isPaused && gameState === 'playing') {
        updateGame();
        renderGame();
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  };

  const updateGame = () => {
    // Update paddle with keyboard
    if (keysRef.current['ArrowLeft']) {
      setPaddle(prev => ({ ...prev, x: Math.max(0, prev.x - 8) }));
    }
    if (keysRef.current['ArrowRight']) {
      setPaddle(prev => ({ ...prev, x: Math.min(800 - prev.width, prev.x + 8) }));
    }

    // Update ball position
    setBall(prev => {
      let newX = prev.x + prev.dx;
      let newY = prev.y + prev.dy;
      let newDx = prev.dx;
      let newDy = prev.dy;

      // Wall collisions
      if (newX <= prev.radius || newX >= 800 - prev.radius) {
        newDx = -newDx;
      }
      if (newY <= prev.radius) {
        newDy = -newDy;
      }

      // Ball lost
      if (newY >= 600) {
        setGameState('lost');
        toast.error('Game Over! Try again!');
        return prev;
      }

      // Paddle collision
      if (newY + prev.radius >= paddle.y && 
          newY - prev.radius <= paddle.y + paddle.height &&
          newX >= paddle.x && 
          newX <= paddle.x + paddle.width) {
        newDy = -Math.abs(newDy);
      }

      // Brick collisions
      setBricks(currentBricks => {
        const updatedBricks = [...currentBricks];
        let scoreIncrease = 0;

        for (let i = 0; i < updatedBricks.length; i++) {
          const brick = updatedBricks[i];
          if (!brick.destroyed && 
              newX >= brick.x && 
              newX <= brick.x + brick.width &&
              newY >= brick.y && 
              newY <= brick.y + brick.height) {
            
            updatedBricks[i] = { ...brick, destroyed: true };
            newDy = -newDy;
            scoreIncrease += 100;
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

      return { ...prev, x: newX, y: newY, dx: newDx, dy: newDy };
    });
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
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
      }
    });

    // Draw paddle
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
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
    
    // Unlock next level
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
    // Simple star calculation based on score
    if (score >= 3000) return 3;
    if (score >= 2000) return 2;
    return 1;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetLevel = () => {
    initializeGame();
    setGameState('playing');
    setIsPaused(false);
    setShowMenu(false);
  };

  const quitToMenu = () => {
    navigate('/level-select');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 relative">
      {/* Header */}
      <div className="bg-black/50 text-white p-4 flex justify-between items-center">
        <div className="font-bold text-lg">Level {level}/100</div>
        <div className="font-bold text-xl">Score: {score}</div>
        <Button 
          onClick={() => setShowMenu(true)}
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <Menu size={24} />
        </Button>
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

      {/* Game State Overlays */}
      {gameState === 'won' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-green-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-3xl font-bold text-yellow-300">Level Complete!</h2>
            <p className="text-xl">Score: {score}</p>
            <p>Stars Earned: {'★'.repeat(calculateStars())}</p>
            <div className="space-x-4">
              <Button onClick={() => navigate(`/game?level=${level + 1}`)} className="bg-blue-600 hover:bg-blue-700">
                Next Level
              </Button>
              <Button onClick={quitToMenu} variant="outline">
                Level Select
              </Button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-red-800 p-8 rounded-xl text-white text-center space-y-4">
            <h2 className="text-3xl font-bold">Game Over!</h2>
            <p className="text-xl">Score: {score}</p>
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
