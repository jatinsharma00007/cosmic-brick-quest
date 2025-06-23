import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level3: LevelConfig = {
  id: 3,
  name: 'Triangle Formation',
  description: 'Bricks arranged in a triangular pattern.',
  difficulty: 'easy',
  paddleWidth: 120,
  ballSpeed: 4,
  unlocked: false,
  bricks: [
    createBrick(400, 100, 80, 30, '#9C27B0'),
    createBrick(350, 150, 80, 30, '#9C27B0'),
    createBrick(450, 150, 80, 30, '#9C27B0'),
    createBrick(300, 200, 80, 30, '#9C27B0'),
    createBrick(400, 200, 80, 30, '#9C27B0'),
    createBrick(500, 200, 80, 30, '#9C27B0'),
  ],
};

export default level3; 