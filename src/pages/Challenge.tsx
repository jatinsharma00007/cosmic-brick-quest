import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Challenge = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-200 to-yellow-300 p-4">
      <Button
        onClick={() => navigate('/mode-select')}
        className="absolute top-4 left-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        &#8592; Modes
      </Button>
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-yellow-900 mb-2 drop-shadow-lg">Challenge Mode</h1>
        <p className="text-yellow-800 text-lg">Select your difficulty</p>
      </div>
      <div className="flex flex-col gap-6 w-full max-w-xs sm:max-w-md">
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/challenge-easy')}
        >
          Easy
        </Button>
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/challenge-medium')}
        >
          Medium
        </Button>
        <Button
          className="py-4 text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white shadow-xl rounded-xl"
          onClick={() => navigate('/challenge-hard')}
        >
          Hard
        </Button>
      </div>
    </div>
  );
};

export default Challenge; 