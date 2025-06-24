import { LevelConfig, createBrick, createMaterialBrick } from '../../../lib/levelConfig';

const easyLevel1: LevelConfig = {
  id: 1,
  name: 'Easy Challenge 1',
  description: 'A gentle start for challenge mode.',
  difficulty: 'easy',
  paddleWidth: 130,
  ballSpeed: 3.5,
  unlocked: true,
  bricks: [
    createBrick(320, 120, 80, 30, '#A7F3D0'),
    createBrick(420, 120, 80, 30, '#A7F3D0'),
    createBrick(520, 120, 80, 30, '#A7F3D0'),
    createBrick(370, 170, 80, 30, '#6EE7B7'),
    createBrick(470, 170, 80, 30, '#6EE7B7'),
    createMaterialBrick(400, 220, 80, 30, 'gold'),
  ],
};

export default easyLevel1; 