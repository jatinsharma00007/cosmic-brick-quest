import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level1: LevelConfig = {
  id: 1,
  name: 'Getting Started',
  description: 'A simple flat row to warm up.',
  difficulty: 'easy',
  paddleWidth: 140,
  ballSpeed: 3,
  unlocked: true,
  bricks: [
    createBrick(200, 100, 80, 30, '#4CAF50'),
    createBrick(300, 100, 80, 30, '#4CAF50'),
    createBrick(400, 100, 80, 30, '#4CAF50'),
    createBrick(500, 100, 80, 30, '#4CAF50'),
    createBrick(600, 100, 80, 30, '#4CAF50'),
  ],
};

export default level1;
