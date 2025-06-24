// Game configuration and constants for Brick Breaker

export const GAME_SETTINGS = {
    ball: {
        baseSpeed: 7,
        radius: 10,
        initialY: 540
    },
    paddle: {
        height: 20,
        moveSpeed: 7,
        initialY: 550,
        mobileInitialY: 500,  // Higher position for mobile devices
        tabletInitialY: 500,  // Slightly higher position for tablets
        smoothingFactor: 0.25, // Default lerp factor for paddle movement (0-1, higher = more responsive)
        mouseSmoothingFactor: 0.15, // Default lerp factor for mouse movement (slower than touch)
        touchSmoothingFactor: 0.3, // Default lerp factor for touch movement (faster than mouse)
    },
    canvas: {
        width: 800,
        height: 600,
        aspectRatio: 4 / 3
    },
    lives: 3,
    debug: false, // Set to true to show debug information
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

export const SCORE_SETTINGS = {
    normalBrick: 10,
    normalBrickColor: '#4B9CD3',
    normalBrickShadow: '0 0 10px rgba(75, 156, 211, 0.5)',
    lifeBonus: 500,
    materialBricks: {
      gold: {
        name: 'Gold',
        color: '#facc15',
        points: 100,
        effect: '0 0 15px rgba(250, 204, 21, 0.7)',
      },
      silver: {
        name: 'Silver',
        color: '#d1d5db',
        points: 70,
        effect: '0 0 15px rgba(209, 213, 219, 0.7)',
      },
      bronze: {
        name: 'Bronze',
        color: '#b45309',
        points: 50,
        effect: '0 0 15px rgba(180, 83, 9, 0.7)',
      },
      iron: {
        name: 'Iron',
        color: '#6b7280',
        points: 80,
        effect: '0 0 15px rgba(107, 114, 128, 0.7)',
      },
      copper: {
        name: 'Copper',
        color: '#b87333',
        points: 90,
        effect: '0 0 15px rgba(184, 115, 51, 0.7)',
      },
      emerald: {
        name: 'Emerald',
        color: '#22c55e',
        points: 120,
        effect: '0 0 15px rgba(34, 197, 94, 0.7)',
      },
      ruby: {
        name: 'Ruby',
        color: '#ef4444',
        points: 150,
        effect: '0 0 15px rgba(239, 68, 68, 0.7)',
      },
      sapphire: {
        name: 'Sapphire',
        color: '#3b82f6',
        points: 130,
        effect: '0 0 15px rgba(59, 130, 246, 0.7)',
      }
    },
    specialEffectBricks: {
      explosive: {
        name: 'Explosive Brick',
        color: '#e11d48',
        points: 200,
        effect: '0 0 15px rgba(225, 29, 72, 0.7)'
      },
      freeze: {
        name: 'Freeze Brick',
        color: '#38bdf8',
        points: 70,
        effect: '0 0 15px rgba(56, 189, 248, 0.7)'
      },
      speedBoost: {
        name: 'Speed Boost Brick',
        color: '#f97316',
        points: 70,
        effect: '0 0 15px rgba(249, 115, 22, 0.7)'
      },
      portal: {
        name: 'Portal Brick',
        color: '#9333ea',
        points: 130,
        effect: '0 0 15px rgba(147, 51, 234, 0.7)'
      },
      mirror: {
        name: 'Mirror Brick',
        color: '#a3e635',
        points: 110,
        effect: '0 0 15px rgba(163, 230, 53, 0.7)'
      }
    },
    mysteryBricks: {
      mystery: {
        name: 'Mystery Brick',
        color: '#a855f7',
        points: 0, // Set dynamically in game (0–150)
        effect: '0 0 15px rgba(168, 85, 247, 0.7)'
      }
    },
    behaviorBricks: {
      moving: {
        name: 'Moving Brick',
        color: '#f43f5e',
        points: 100,
        effect: '0 0 15px rgba(244, 63, 94, 0.7)'
      }
    },
    powerUpBricks: {
      multiBall: {
        name: 'Multi-Ball Brick',
        color: '#eab308',
        points: 150,
        effect: '0 0 15px rgba(234, 179, 8, 0.7)'
      },
      enlargePaddle: {
        name: 'Paddle Enlarge Brick',
        color: '#14b8a6',
        points: 80,
        effect: '0 0 15px rgba(20, 184, 166, 0.7)'
      },
      shrinkPaddle: {
        name: 'Paddle Shrink Brick',
        color: '#991b1b',
        points: -20,
        effect: '0 0 15px rgba(153, 27, 27, 0.7)'
      },
      slowBall: {
        name: 'Slow Ball Brick',
        color: '#60a5fa',
        points: 80,
        effect: '0 0 15px rgba(96, 165, 250, 0.7)'
      },
      laserPaddle: {
        name: 'Laser Paddle Brick',
        color: '#be123c',
        points: 120,
        effect: '0 0 15px rgba(190, 18, 60, 0.7)'
      }
    },
    bonusBricks: {
      lifeBrick: {
        name: 'Life Brick',
        color: '#16a34a',
        points: 500,
        effect: '0 0 20px rgba(22, 163, 74, 0.8)'
      }
    }
  };
  

export const CONTROLS = {
    moveLeft: ['ArrowLeft', 'a', 'A'],
    moveRight: ['ArrowRight', 'd', 'D'],
    startGame: ['ArrowUp', 'w', 'W'],  // New control for starting the game
    pause: [' '],
    menuOpen: ['m', 'M'],
    menuClose: ['Escape'],
};

// Size settings for desktop and mobile
export const GAME_SIZES = {
    desktop: {
        paddleWidth: 120, // default for level1, can be overridden by difficulty
        paddleHeight: 20,
        brickWidth: 80,
        brickHeight: 25,
        ballRadius: 10,
    },
    mobile: {
        paddleWidth: 140,
        paddleHeight: 28,
        brickWidth: 100,
        brickHeight: 36,
        ballRadius: 16,
    }
}; 