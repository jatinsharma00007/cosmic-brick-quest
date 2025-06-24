import { LevelConfig, createBrick, createMaterialBrick } from '../../../lib/levelConfig';

const mediumLevel1: LevelConfig = {
  id: 1,
  name: 'Medium Challenge 1',
  description: 'A step up in challenge.',
  difficulty: 'medium',
  paddleWidth: 110,
  ballSpeed: 4.5,
  unlocked: true,
  bricks: [
    createBrick(300, 100, 80, 30, '#FDE68A'),
    createBrick(400, 100, 80, 30, '#FDE68A'),
    createBrick(500, 100, 80, 30, '#FDE68A'),
    createBrick(350, 150, 80, 30, '#F59E42'),
    createBrick(450, 150, 80, 30, '#F59E42'),
    createBrick(400, 200, 80, 30, '#FBBF24'),
  ],
};

export default mediumLevel1; 