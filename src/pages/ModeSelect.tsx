import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ModeSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-cyan-900 p-4">
      <Button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        &#8592; Home
      </Button>
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 drop-shadow-lg">Select Mode</h1>
        <p className="text-white/80 text-lg">Choose your adventure</p>
      </div>
      <div className="flex flex-col gap-6 w-full max-w-xs sm:max-w-md">
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/brick-mania')}
        >
          Brick Mania
          <span className="block text-xs font-normal mt-1">100 unique levels</span>
        </Button>
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/challenge')}
        >
          Challenge
          <span className="block text-xs font-normal mt-1">Easy, Medium, Hard</span>
        </Button>
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/throphy-road')}
        >
          Throphy Road
          <span className="block text-xs font-normal mt-1">Endless Mode</span>
        </Button>
      </div>
    </div>
  );
};

export default ModeSelect; 