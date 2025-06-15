import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const CRACK_DELAY = 10;

const Index = () => {
  const navigate = useNavigate();
  const [isCracked, setIsCracked] = useState(false);
  const [isShattering, setIsShattering] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  useEffect(() => {
    document.title = "Brick Breaker - Classic Arcade Game";
    const crackTimer = setTimeout(() => setIsCracked(true), CRACK_DELAY);
    return () => clearTimeout(crackTimer);
  }, []);

  const handleStart = () => {
    setIsShattering(true);
    setIsZooming(true);
    setTimeout(() => navigate('/level-select'), 1500);
  };


  // Helper for shatter animation
  const logoWords = [
    { text: "BRICK", className: "mb-2" },
    { text: "BREAKER", className: "mb-8" }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center relative overflow-hidden transition-all duration-1000 ${isZooming ? 'animate-zoom-in' : ''}`}>
      <div className={`text-center z-10 transition-all duration-1000 ${isZooming ? 'animate-fade-out' : 'animate-fade-in'}`}>
        {/* Both BRICK and BREAKER with font and crack/shatter effects */}
        {logoWords.map((word, wIdx) => (
          <div key={word.text} className={word.className}>
            {word.text.split('').map((letter, i) => (
              <span
                key={`${letter}-${i}-${isCracked ? 'cracked' : 'normal'}-${isShattering ? 'shattering' : 'intact'}`}

                className={`
  inline-block text-9xl font-bold tracking-wide relative transition-all duration-500
  font-crash
  ${isCracked ? 'text-red-500 cracked-text animate-crack-flicker' : 'text-red-500'}
  ${isShattering ? 'breaker-shatter' : ''}
`}

                style={{
                  animationDelay: isCracked ? `${i * 0.07 + wIdx * 0.2}s` : '0s',
                  '--shatter-x': `${Math.random() * 400 - 200}px`,
                  '--shatter-y': `${Math.random() * 200 + 100}px`,
                  '--shatter-rot': `${Math.random() * 60 - 30}deg`,
                } as React.CSSProperties}
              >
                {letter}
              </span>
            ))}
          </div>
        ))}

        <div className={`space-y-6 transition-all duration-500 ${isZooming ? 'opacity-0' : 'opacity-100'}`}>
          <Button
            onClick={handleStart}
            disabled={isShattering}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-12 text-2xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isShattering ? 'LAUNCHING...' : 'START GAME'}
          </Button>
        </div>

        <div className={`mt-12 text-white/80 text-lg transition-all duration-500 ${isZooming ? 'opacity-0' : 'opacity-100'}`}>
          <p>eeta ka javab patharr se!</p>
          
        </div>
      </div>

      {/* CSS for crack, flicker, and shatter */}
      <style>{`
  .cracked-text {
    text-shadow:
      2px 2px 0 #ff4444,
      -1px -1px 0 #ffff44,
      1px -1px 0 #44ff44,
      -1px 1px 0 #4444ff,
      0 0 10px rgba(255, 0, 0, 0.5);
    filter: drop-shadow(0 0 15px rgba(255, 255, 0, 0.3));
  }

  .animate-crack-flicker {
    animation: crack-flicker 5s steps(1, end) infinite;
  }

  @keyframes crack-flicker {
    0%   { opacity: 1; filter: brightness(1); }
    2%   { opacity: 0.7; filter: brightness(1.5); }
    4%   { opacity: 0.5; filter: brightness(0.7); }
    6%   { opacity: 1; filter: brightness(1.2); }
    8%   { opacity: 0.8; filter: brightness(1.5); }
    10%  { opacity: 1; filter: brightness(1); }
    100% { opacity: 1; filter: brightness(1); }
  }
`}</style>

    </div>
  );
};

export default Index;
