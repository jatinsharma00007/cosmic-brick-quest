import { LevelConfig, createBrick, createMaterialBrick } from '../../../lib/levelConfig';

const level4: LevelConfig = {
  id: 4,
  name: 'Material Introduction',
  description: 'Meet your first special material bricks!',
  difficulty: 'easy',
  paddleWidth: 120,
  ballSpeed: 4,
  unlocked: false,
  bricks: [
    createBrick(300, 100, 80, 30, '#4CAF50'),
    createMaterialBrick(400, 100, 80, 30, 'iron'),
    createBrick(500, 100, 80, 30, '#4CAF50'),
    createBrick(350, 150, 80, 30, '#4CAF50'),
    createMaterialBrick(450, 150, 80, 30, 'copper'),
    createBrick(550, 150, 80, 30, '#4CAF50'),
  ],
};

export default level4; 