import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level68: LevelConfig = {
  id: 68,
  name: 'Level 68',
  description: 'Level 68 - Ready for challenge!',
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

export default level68;
