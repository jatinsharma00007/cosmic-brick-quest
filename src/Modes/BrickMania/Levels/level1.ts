import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level1: LevelConfig = {
  id: 1,
  name: 'First Steps',
  description: 'Welcome to Cosmic Brick Quest! Break these simple bricks to get started.',
  difficulty: 'easy',
  paddleWidth: 120,
  ballSpeed: 4,
  unlocked: true,
  bricks: [
    createBrick(300, 100, 80, 30, '#4CAF50'),
    createBrick(400, 100, 80, 30, '#4CAF50'),
    createBrick(500, 100, 80, 30, '#4CAF50'),
    createBrick(350, 150, 80, 30, '#4CAF50'),
    createBrick(450, 150, 80, 30, '#4CAF50'),
  ],
};

export default level1; 