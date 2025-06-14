
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Brick Breaker - Classic Arcade Game";
  }, []);

  const handleStart = () => {
    navigate('/level-select');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-900 rounded animate-pulse"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-green-900 rounded animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-red-900 rounded animate-ping"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-blue-900 rounded animate-pulse"></div>
      </div>

      <div className="text-center z-10 animate-fade-in">
        <h1 className="text-8xl font-bold text-white mb-4 drop-shadow-2xl tracking-wider">
          BRICK
        </h1>
        <h2 className="text-6xl font-bold text-yellow-300 mb-8 drop-shadow-xl tracking-wide">
          BREAKER
        </h2>
        
        <div className="space-y-6">
          <Button 
            onClick={handleStart}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-12 text-2xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            START GAME
          </Button>
        </div>

        <div className="mt-12 text-white/80 text-lg">
          <p>Break all bricks to advance to the next level!</p>
          <p className="text-sm mt-2">Use mouse or arrow keys to control the paddle</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
