import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level2: LevelConfig = {
  id: 2,
  name: 'Double Trouble',
  description: 'Two rows of bricks to test your skills.',
  difficulty: 'easy',
  paddleWidth: 120,
  ballSpeed: 4,
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
  ],
};

export default level2; 