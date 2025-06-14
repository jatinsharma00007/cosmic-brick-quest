import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [showCracked, setShowCracked] = useState(false);
  const [showShatter, setShowShatter] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [screenFlicker, setScreenFlicker] = useState(false);
  const breakerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Brick Breaker - Classic Arcade Game";
    
    // Show cracked font after 2 seconds
    const crackTimer = setTimeout(() => {
      setShowCracked(true);
      setScreenFlicker(true);
      
      // Stop flicker after animation
      setTimeout(() => setScreenFlicker(false), 300);
    }, 2000);

    return () => clearTimeout(crackTimer);
  }, []);

  const handleStart = () => {
    // Trigger shatter and zoom
    setShowShatter(true);
    setIsZooming(true);
    
    // Navigate after zoom animation completes
    setTimeout(() => {
      navigate('/level-select');
    }, 1500);
  };

  const BrickLetter = ({ children, delay = 0 }: { children: string; delay?: number }) => (
    <div 
      className="inline-block bg-gradient-to-b from-orange-400 to-red-600 text-white font-bold border-2 border-red-800 shadow-lg px-2 py-1 mx-1 transform hover:scale-105 transition-transform"
      style={{
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        animationDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  );

  const ShatterLetter = ({ children, index }: { children: string; index: number }) => {
    const randomX = Math.random() * 400 - 200;
    const randomY = Math.random() * 300 + 100;
    const randomRotate = Math.random() * 360;
    
    return (
      <span 
        className={`inline-block font-bold transition-all duration-1000 ${
          showShatter ? 'animate-shatter' : ''
        } ${showCracked ? 'font-cracked text-red-400' : 'font-orbitron text-yellow-300'}`}
        style={{
          '--random-x': `${randomX}px`,
          '--random-y': `${randomY}px`,
          '--random-rotate': `${randomRotate}deg`,
          animationDelay: showShatter ? `${index * 0.1}s` : '0s',
          textShadow: !showCracked ? '3px 3px 6px rgba(0,0,0,0.8)' : '2px 2px 4px rgba(0,0,0,0.8)',
        } as React.CSSProperties}
      >
        {children}
      </span>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center relative overflow-hidden transition-all duration-1000 ${
      isZooming ? 'animate-zoom-in' : ''
    } ${screenFlicker ? 'animate-screen-flicker' : ''}`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-900 rounded animate-pulse"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-green-900 rounded animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-red-900 rounded animate-ping"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-blue-900 rounded animate-pulse"></div>
        
        {/* Floating brick particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-2 bg-orange-600 opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`text-center z-10 transition-all duration-1000 ${
        isZooming ? 'animate-fade-out' : 'animate-fade-in'
      }`}>
        {/* BRICK - Built with brick-like divs */}
        <div className="flex justify-center items-center mb-4">
          {'BRICK'.split('').map((letter, index) => (
            <BrickLetter key={index} delay={index * 0.1}>
              {letter}
            </BrickLetter>
          ))}
        </div>

        {/* BREAKER - With font switching and shatter effects */}
        <div 
          ref={breakerRef}
          className={`text-6xl font-bold mb-8 drop-shadow-xl tracking-wide relative transition-font ${
            showCracked ? 'animate-font-transition' : ''
          }`}
        >
          {'BREAKER'.split('').map((letter, index) => (
            <ShatterLetter key={index} index={index}>
              {letter}
            </ShatterLetter>
          ))}
        </div>
        
        <div className={`space-y-6 transition-all duration-500 ${isZooming ? 'opacity-0' : 'opacity-100'}`}>
          <Button 
            onClick={handleStart}
            disabled={isZooming}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-12 text-2xl rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isZooming ? 'LAUNCHING...' : 'START GAME'}
          </Button>
        </div>

        <div className={`mt-12 text-white/80 text-lg transition-all duration-500 ${isZooming ? 'opacity-0' : 'opacity-100'}`}>
          <p>Break all bricks to advance to the next level!</p>
          <p className="text-sm mt-2">Use mouse or arrow keys to control the paddle</p>
          
          {/* Insert Coin style blinking message */}
          <div className="mt-6 animate-pulse">
            <p className="text-yellow-300 text-sm font-mono">
              ► INSERT COIN TO CONTINUE ◄
            </p>
          </div>
        </div>
      </div>

      {/* Screen flash effect during zoom */}
      {isZooming && (
        <div className="absolute inset-0 bg-white animate-pulse opacity-20 z-20"></div>
      )}
    </div>
  );
};

export default Index;
