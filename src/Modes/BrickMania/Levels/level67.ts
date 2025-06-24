import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level67: LevelConfig = {
  id: 67,
  name: 'Level 67',
  description: 'Level 67 - Ready for challenge!',
  difficulty: 'easy',
  paddleWidth: 140,
  ballSpeed: 3,
  unlocked: false,
  bricks: [
    createBrick(200, 100, 80, 30, '#FF9800'),
    createBrick(300, 100, 80, 30, '#FF9800'),
    createBrick(400, 100, 80, 30, '#FF9800'),
    createBrick(500, 100, 80, 30, '#FF9800'),
    createBrick(600, 100, 80, 30, '#FF9800'),
  ],
};

export default level67;
