import { SCORE_SETTINGS } from './config';

export interface LevelBrick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'normal' | 'material' | 'specialEffect' | 'mystery' | 'behavior' | 'powerUp' | 'bonus';
  material?: keyof typeof SCORE_SETTINGS.materialBricks;
  specialEffect?: keyof typeof SCORE_SETTINGS.specialEffectBricks;
  mystery?: keyof typeof SCORE_SETTINGS.mysteryBricks;
  behavior?: keyof typeof SCORE_SETTINGS.behaviorBricks;
  powerUp?: keyof typeof SCORE_SETTINGS.powerUpBricks;
  bonus?: keyof typeof SCORE_SETTINGS.bonusBricks;
  maxHits: number;
  hits: number;
  destroyed: boolean;
  // For moving bricks
  moveSpeed?: number;
  moveDirection?: 'horizontal' | 'vertical';
  moveRange?: number;
  originalX?: number;
  originalY?: number;
  // For explosive bricks
  explosionRadius?: number;
  // For portal bricks
  portalTarget?: { x: number; y: number };
}

export interface LevelConfig {
  id: number | string;
  name: string;
  description: string;
  bricks: LevelBrick[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master';
  paddleWidth: number;
  ballSpeed: number;
  unlocked: boolean;
}

export const createBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  type: 'normal' | 'material' | 'specialEffect' | 'mystery' | 'behavior' | 'powerUp' | 'bonus' = 'normal',
  material?: keyof typeof SCORE_SETTINGS.materialBricks,
  specialEffect?: keyof typeof SCORE_SETTINGS.specialEffectBricks,
  mystery?: keyof typeof SCORE_SETTINGS.mysteryBricks,
  behavior?: keyof typeof SCORE_SETTINGS.behaviorBricks,
  powerUp?: keyof typeof SCORE_SETTINGS.powerUpBricks,
  bonus?: keyof typeof SCORE_SETTINGS.bonusBricks,
  maxHits: number = 1
): LevelBrick => ({
  x, y, width, height, color, type, material, specialEffect, mystery, behavior, powerUp, bonus, maxHits, hits: 0, destroyed: false
});

export const createMaterialBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  material: keyof typeof SCORE_SETTINGS.materialBricks
): LevelBrick => {
  const materialConfig = SCORE_SETTINGS.materialBricks[material];
  return createBrick(x, y, width, height, materialConfig.color, 'material', material);
};

export const createSpecialEffectBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  specialEffect: keyof typeof SCORE_SETTINGS.specialEffectBricks,
  explosionRadius?: number,
  portalTarget?: { x: number; y: number }
): LevelBrick => {
  const effectConfig = SCORE_SETTINGS.specialEffectBricks[specialEffect];
  return {
    ...createBrick(x, y, width, height, effectConfig.color, 'specialEffect', undefined, specialEffect),
    explosionRadius,
    portalTarget
  };
};

export const createMysteryBrick = (
  x: number,
  y: number,
  width: number,
  height: number
): LevelBrick => {
  const mysteryConfig = SCORE_SETTINGS.mysteryBricks.mystery;
  return createBrick(x, y, width, height, mysteryConfig.color, 'mystery', undefined, undefined, 'mystery');
};

export const createBehaviorBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  behavior: keyof typeof SCORE_SETTINGS.behaviorBricks,
  moveSpeed?: number,
  moveDirection?: 'horizontal' | 'vertical',
  moveRange?: number
): LevelBrick => {
  const behaviorConfig = SCORE_SETTINGS.behaviorBricks[behavior];
  return {
    ...createBrick(x, y, width, height, behaviorConfig.color, 'behavior', undefined, undefined, undefined, behavior),
    moveSpeed,
    moveDirection,
    moveRange,
    originalX: x,
    originalY: y
  };
};

export const createPowerUpBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  powerUp: keyof typeof SCORE_SETTINGS.powerUpBricks
): LevelBrick => {
  const powerUpConfig = SCORE_SETTINGS.powerUpBricks[powerUp];
  return createBrick(x, y, width, height, powerUpConfig.color, 'powerUp', undefined, undefined, undefined, undefined, powerUp);
};

export const createBonusBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  bonus: keyof typeof SCORE_SETTINGS.bonusBricks
): LevelBrick => {
  const bonusConfig = SCORE_SETTINGS.bonusBricks[bonus];
  return createBrick(x, y, width, height, bonusConfig.color, 'bonus', undefined, undefined, undefined, undefined, undefined, bonus);
}; 