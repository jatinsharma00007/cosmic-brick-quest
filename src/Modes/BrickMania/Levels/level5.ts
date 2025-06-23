import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level5: LevelConfig = {
  id: 5,
  name: 'The Gateway',
  description: 'A challenging level to test your skills.',
  difficulty: 'easy',
  paddleWidth: 120,
  ballSpeed: 4,
  unlocked: false,
  bricks: [
    createBrick(300, 100, 80, 30, '#F44336'),
    createBrick(400, 100, 80, 30, '#F44336'),
    createBrick(500, 100, 80, 30, '#F44336'),
    createBrick(350, 150, 80, 30, '#FF9800'),
    createBrick(450, 150, 80, 30, '#FF9800'),
    createBrick(400, 200, 80, 30, '#4CAF50'),
  ],
};

export default level5; 