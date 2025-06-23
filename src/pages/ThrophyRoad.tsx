import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ThrophyRoad = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-400 p-4">
      <Button
        onClick={() => navigate('/mode-select')}
        className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        &#8592; Modes
      </Button>
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-2 drop-shadow-lg">Throphy Road</h1>
        <p className="text-blue-800 text-lg mb-4">Endless Mode: Survive as long as you can! Bricks keep coming, and the challenge never ends.</p>
      </div>
      <div className="flex flex-col gap-6 w-full max-w-xs sm:max-w-md">
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/game?mode=throphy-road')}
        >
          Start Endless Mode
        </Button>
      </div>
    </div>
  );
};

export default ThrophyRoad; 