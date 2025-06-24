import { LevelConfig, createBrick, createMaterialBrick } from '../../../lib/levelConfig';

const hardLevel1: LevelConfig = {
  id: 1,
  name: 'Hard Challenge 1',
  description: 'A tough start for hard mode.',
  difficulty: 'hard',
  paddleWidth: 90,
  ballSpeed: 5.5,
  unlocked: true,
  bricks: [
    createBrick(320, 100, 80, 30, '#FCA5A5'),
    createBrick(400, 100, 80, 30, '#FCA5A5'),
    createBrick(480, 100, 80, 30, '#FCA5A5'),
    createBrick(360, 150, 80, 30, '#EF4444'),
    createBrick(440, 150, 80, 30, '#EF4444'),
    createBrick(400, 200, 80, 30, '#B91C1C'),
  ],
};

export default hardLevel1; 