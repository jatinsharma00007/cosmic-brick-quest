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
  unlocked: boolean;
}

export const createBrick = (
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

export const createMaterialBrick = (
  x: number,
  y: number,
  width: number,
  height: number,
  material: keyof typeof SCORE_SETTINGS.materialBricks
): LevelBrick => {
  const materialConfig = SCORE_SETTINGS.materialBricks[material];
  return createBrick(x, y, width, height, materialConfig.color, 'material', material, 1);
}; 