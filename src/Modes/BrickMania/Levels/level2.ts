import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level2: LevelConfig = {
  id: 2,
  name: 'Double Trouble',
  description: 'Two rows of bricks to test your timing.',
  difficulty: 'easy',
  paddleWidth: 130, // Slightly smaller paddle
  ballSpeed: 3.2,   // Slightly faster ball
  unlocked: false,
  bricks: [
    // First row
    createBrick(240, 100, 80, 30, '#03A9F4'),
    createBrick(340, 100, 80, 30, '#03A9F4'),
    createBrick(440, 100, 80, 30, '#03A9F4'),
    createBrick(540, 100, 80, 30, '#03A9F4'),
    createBrick(640, 100, 80, 30, '#03A9F4'),

    // Second row
    createBrick(290, 140, 80, 30, '#0288D1'),
    createBrick(390, 140, 80, 30, '#0288D1'),
    createBrick(490, 140, 80, 30, '#0288D1'),
    createBrick(590, 140, 80, 30, '#0288D1'),
  ],
};

export default level2;
