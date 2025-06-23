import { SCORE_SETTINGS } from './config';

export interface LevelBrick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'normal' | 'material';
  material?: keyof typeof SCORE_SETTINGS.materialBricks;
  maxHits: number;
  hits: number;
  destroyed: boolean;
}

export interface LevelConfig {
  id: number | string;
  name: string;
  description: string;
  bricks: LevelBrick[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master';
  paddleWidth: number;
  ballSpeed: number;
  isCrazyLevel: boolean;
  unlocked: boolean;
  requiredLevel?: number; // For crazy levels, which regular level unlocks them
}

// Helper function to create a brick
const createBrick = (
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  color: string, 
  type: 'normal' | 'material' = 'normal',
  material?: keyof typeof SCORE_SETTINGS.materialBricks,
  maxHits: number = 1
): LevelBrick => ({
  x, y, width, height, color, type, material, maxHits, hits: 0, destroyed: false
});

// Helper function to create material brick
const createMaterialBrick = (
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  material: keyof typeof SCORE_SETTINGS.materialBricks
): LevelBrick => {
  const materialConfig = SCORE_SETTINGS.materialBricks[material];
  return createBrick(x, y, width, height, materialConfig.color, 'material', material, 1);
};

// Level configurations - First 11 levels as examples
export const LEVEL_CONFIGS: LevelConfig[] = [
  // Level 1 - Tutorial Level
  {
    id: 1,
    name: "First Steps",
    description: "Welcome to Cosmic Brick Quest! Break these simple bricks to get started.",
    difficulty: 'easy',
    paddleWidth: 120,
    ballSpeed: 4,
    isCrazyLevel: false,
    unlocked: true,
    bricks: [
      createBrick(300, 100, 80, 30, '#4CAF50'),
      createBrick(400, 100, 80, 30, '#4CAF50'),
      createBrick(500, 100, 80, 30, '#4CAF50'),
      createBrick(350, 150, 80, 30, '#4CAF50'),
      createBrick(450, 150, 80, 30, '#4CAF50'),
    ]
  },
  // Level 2
  {
    id: 2,
    name: "Double Trouble",
    description: "Two rows of bricks to test your skills.",
    difficulty: 'easy',
    paddleWidth: 120,
    ballSpeed: 4,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createBrick(300, 100, 80, 30, '#2196F3'),
      createBrick(400, 100, 80, 30, '#2196F3'),
      createBrick(500, 100, 80, 30, '#2196F3'),
      createBrick(600, 100, 80, 30, '#2196F3'),
      createBrick(200, 100, 80, 30, '#2196F3'),
      createBrick(300, 150, 80, 30, '#FF9800'),
      createBrick(400, 150, 80, 30, '#FF9800'),
      createBrick(500, 150, 80, 30, '#FF9800'),
      createBrick(600, 150, 80, 30, '#FF9800'),
      createBrick(200, 150, 80, 30, '#FF9800'),
    ]
  },
  // Level 3
  {
    id: 3,
    name: "Triangle Formation",
    description: "Bricks arranged in a triangular pattern.",
    difficulty: 'easy',
    paddleWidth: 120,
    ballSpeed: 4,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createBrick(400, 100, 80, 30, '#9C27B0'),
      createBrick(350, 150, 80, 30, '#9C27B0'),
      createBrick(450, 150, 80, 30, '#9C27B0'),
      createBrick(300, 200, 80, 30, '#9C27B0'),
      createBrick(400, 200, 80, 30, '#9C27B0'),
      createBrick(500, 200, 80, 30, '#9C27B0'),
    ]
  },
  // Level 4
  {
    id: 4,
    name: "Material Introduction",
    description: "Meet your first special material bricks!",
    difficulty: 'easy',
    paddleWidth: 120,
    ballSpeed: 4,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createBrick(300, 100, 80, 30, '#4CAF50'),
      createMaterialBrick(400, 100, 80, 30, 'iron'),
      createBrick(500, 100, 80, 30, '#4CAF50'),
      createBrick(350, 150, 80, 30, '#4CAF50'),
      createMaterialBrick(450, 150, 80, 30, 'copper'),
      createBrick(550, 150, 80, 30, '#4CAF50'),
    ]
  },
  // Level 5
  {
    id: 5,
    name: "The Gateway",
    description: "Complete this level to unlock your first Crazy Level!",
    difficulty: 'easy',
    paddleWidth: 120,
    ballSpeed: 4,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createBrick(300, 100, 80, 30, '#F44336'),
      createBrick(400, 100, 80, 30, '#F44336'),
      createBrick(500, 100, 80, 30, '#F44336'),
      createBrick(350, 150, 80, 30, '#FF9800'),
      createBrick(450, 150, 80, 30, '#FF9800'),
      createBrick(400, 200, 80, 30, '#4CAF50'),
    ]
  },
  // Crazy Level 1 (unlocked after Level 5)
  {
    id: 'crazy_1',
    name: "🎉 CRAZY: Bouncy Castle",
    description: "Everything bounces! Even the walls! Pure chaos and fun!",
    difficulty: 'easy',
    paddleWidth: 150,
    ballSpeed: 6,
    isCrazyLevel: true,
    unlocked: false,
    requiredLevel: 5,
    bricks: [
      createBrick(200, 80, 60, 25, '#FF6B6B'),
      createBrick(300, 80, 60, 25, '#4ECDC4'),
      createBrick(400, 80, 60, 25, '#45B7D1'),
      createBrick(500, 80, 60, 25, '#96CEB4'),
      createBrick(600, 80, 60, 25, '#FFEAA7'),
      createBrick(250, 120, 60, 25, '#DDA0DD'),
      createBrick(350, 120, 60, 25, '#98D8C8'),
      createBrick(450, 120, 60, 25, '#F7DC6F'),
      createBrick(550, 120, 60, 25, '#BB8FCE'),
      createBrick(300, 160, 60, 25, '#85C1E9'),
      createBrick(400, 160, 60, 25, '#F8C471'),
      createBrick(500, 160, 60, 25, '#82E0AA'),
    ]
  },
  // Level 7
  {
    id: 7,
    name: "Narrow Escape",
    description: "A narrower paddle makes this more challenging.",
    difficulty: 'medium',
    paddleWidth: 100,
    ballSpeed: 4.5,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createBrick(300, 100, 80, 30, '#3F51B5'),
      createBrick(400, 100, 80, 30, '#3F51B5'),
      createBrick(500, 100, 80, 30, '#3F51B5'),
      createBrick(600, 100, 80, 30, '#3F51B5'),
      createBrick(200, 100, 80, 30, '#3F51B5'),
      createBrick(350, 150, 80, 30, '#673AB7'),
      createBrick(450, 150, 80, 30, '#673AB7'),
      createBrick(550, 150, 80, 30, '#673AB7'),
      createBrick(250, 150, 80, 30, '#673AB7'),
      createBrick(300, 200, 80, 30, '#E91E63'),
      createBrick(400, 200, 80, 30, '#E91E63'),
      createBrick(500, 200, 80, 30, '#E91E63'),
    ]
  },
  // Level 8
  {
    id: 8,
    name: "Material Mix",
    description: "A variety of materials to test your skills.",
    difficulty: 'medium',
    paddleWidth: 100,
    ballSpeed: 4.5,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createMaterialBrick(300, 100, 80, 30, 'iron'),
      createBrick(400, 100, 80, 30, '#4CAF50'),
      createMaterialBrick(500, 100, 80, 30, 'copper'),
      createBrick(350, 150, 80, 30, '#FF9800'),
      createMaterialBrick(450, 150, 80, 30, 'gold'),
      createBrick(550, 150, 80, 30, '#2196F3'),
      createBrick(250, 150, 80, 30, '#9C27B0'),
      createMaterialBrick(400, 200, 80, 30, 'silver'),
    ]
  },
  // Level 9
  {
    id: 9,
    name: "Speed Challenge",
    description: "Faster ball speed increases the challenge.",
    difficulty: 'medium',
    paddleWidth: 100,
    ballSpeed: 5.5,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createBrick(300, 100, 80, 30, '#FF5722'),
      createBrick(400, 100, 80, 30, '#FF5722'),
      createBrick(500, 100, 80, 30, '#FF5722'),
      createBrick(600, 100, 80, 30, '#FF5722'),
      createBrick(200, 100, 80, 30, '#FF5722'),
      createBrick(350, 150, 80, 30, '#FF9800'),
      createBrick(450, 150, 80, 30, '#FF9800'),
      createBrick(550, 150, 80, 30, '#FF9800'),
      createBrick(250, 150, 80, 30, '#FF9800'),
      createBrick(300, 200, 80, 30, '#4CAF50'),
      createBrick(400, 200, 80, 30, '#4CAF50'),
      createBrick(500, 200, 80, 30, '#4CAF50'),
    ]
  },
  // Level 10
  {
    id: 10,
    name: "The Gauntlet",
    description: "Complete this to unlock your second Crazy Level!",
    difficulty: 'medium',
    paddleWidth: 100,
    ballSpeed: 5.5,
    isCrazyLevel: false,
    unlocked: false,
    bricks: [
      createMaterialBrick(300, 100, 80, 30, 'iron'),
      createBrick(400, 100, 80, 30, '#F44336'),
      createMaterialBrick(500, 100, 80, 30, 'copper'),
      createBrick(350, 150, 80, 30, '#FF9800'),
      createMaterialBrick(450, 150, 80, 30, 'gold'),
      createBrick(550, 150, 80, 30, '#2196F3'),
      createBrick(250, 150, 80, 30, '#9C27B0'),
      createMaterialBrick(400, 200, 80, 30, 'silver'),
      createBrick(300, 200, 80, 30, '#4CAF50'),
      createBrick(500, 200, 80, 30, '#E91E63'),
    ]
  },
  // Crazy Level 2 (unlocked after Level 10)
  {
    id: 'crazy_2',
    name: "🎉 CRAZY: Rainbow Rush",
    description: "Every brick is a different color! Can you catch them all?",
    difficulty: 'medium',
    paddleWidth: 120,
    ballSpeed: 7,
    isCrazyLevel: true,
    unlocked: false,
    requiredLevel: 10,
    bricks: [
      createBrick(200, 80, 70, 25, '#FF0000'),   // Red
      createBrick(290, 80, 70, 25, '#FF7F00'),   // Orange
      createBrick(380, 80, 70, 25, '#FFFF00'),   // Yellow
      createBrick(470, 80, 70, 25, '#00FF00'),   // Green
      createBrick(560, 80, 70, 25, '#0000FF'),   // Blue
      createBrick(650, 80, 70, 25, '#4B0082'),   // Indigo
      createBrick(245, 120, 70, 25, '#9400D3'),  // Violet
      createBrick(335, 120, 70, 25, '#FF1493'),  // Deep Pink
      createBrick(425, 120, 70, 25, '#00CED1'),  // Dark Turquoise
      createBrick(515, 120, 70, 25, '#FFD700'),  // Gold
      createBrick(605, 120, 70, 25, '#FF69B4'),  // Hot Pink
      createBrick(290, 160, 70, 25, '#32CD32'),  // Lime Green
      createBrick(380, 160, 70, 25, '#FF4500'),  // Orange Red
      createBrick(470, 160, 70, 25, '#8A2BE2'),  // Blue Violet
      createBrick(560, 160, 70, 25, '#FF6347'),  // Tomato
    ]
  },
];

// Helper functions for level management
export const getLevelConfig = (levelId: number | string): LevelConfig | undefined => {
  return LEVEL_CONFIGS.find(level => level.id === levelId);
};

export const getNextLevel = (currentLevelId: number | string): LevelConfig | undefined => {
  const currentIndex = LEVEL_CONFIGS.findIndex(level => level.id === currentLevelId);
  if (currentIndex === -1 || currentIndex === LEVEL_CONFIGS.length - 1) {
    return undefined;
  }
  return LEVEL_CONFIGS[currentIndex + 1];
};

export const getPreviousLevel = (currentLevelId: number | string): LevelConfig | undefined => {
  const currentIndex = LEVEL_CONFIGS.findIndex(level => level.id === currentLevelId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return LEVEL_CONFIGS[currentIndex - 1];
};

export const getCrazyLevelForRegularLevel = (regularLevelId: number): LevelConfig | undefined => {
  // Crazy levels are unlocked after every 5th level
  if (regularLevelId % 5 === 0) {
    const crazyLevelId = `crazy_${regularLevelId / 5}`;
    return getLevelConfig(crazyLevelId);
  }
  return undefined;
};

export const isCrazyLevelUnlocked = (crazyLevelId: string): boolean => {
  const crazyLevel = getLevelConfig(crazyLevelId);
  if (!crazyLevel || !crazyLevel.isCrazyLevel) {
    return false;
  }
  // Check if the required regular level is completed
  const requiredLevel = crazyLevel.requiredLevel;
  if (!requiredLevel) {
    return false;
  }
  // This will be checked against saved progress
  const saved = localStorage.getItem('brickBreakerProgress');
  const data = saved ? JSON.parse(saved) : {};
  const requiredLevelData = data[`level_${requiredLevel}`];
  return requiredLevelData?.completed || false;
};

export const getTotalLevels = (): number => {
  return LEVEL_CONFIGS.filter(level => !level.isCrazyLevel).length;
};

export const getRegularLevels = (): LevelConfig[] => {
  return LEVEL_CONFIGS.filter(level => !level.isCrazyLevel);
};

export const getCrazyLevels = (): LevelConfig[] => {
  return LEVEL_CONFIGS.filter(level => level.isCrazyLevel);
};

export const getUnlockedLevels = (): LevelConfig[] => {
  const saved = localStorage.getItem('brickBreakerProgress');
  const data = saved ? JSON.parse(saved) : {};
  return LEVEL_CONFIGS.map(level => {
    if (level.id === 1) {
      return { ...level, unlocked: true };
    }
    if (level.isCrazyLevel) {
      return { ...level, unlocked: isCrazyLevelUnlocked(level.id as string) };
    }
    // For regular levels, check if previous level is completed
    const previousLevel = getPreviousLevel(level.id);
    if (!previousLevel) {
      return { ...level, unlocked: true };
    }
    const previousLevelData = data[`level_${previousLevel.id}`];
    return { ...level, unlocked: previousLevelData?.completed || false };
  });
}; 