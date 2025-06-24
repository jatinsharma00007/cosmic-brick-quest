import { LevelConfig, createBrick, createMaterialBrick } from '../../lib/levelConfig';

const endlessLevel1: LevelConfig = {
  id: 1,
  name: 'Endless Start',
  description: 'The endless journey begins. Survive as long as you can!',
  difficulty: 'medium',
  paddleWidth: 110,
  ballSpeed: 5,
  unlocked: true,
  bricks: [
    createBrick(300, 100, 80, 30, '#60A5FA'),
    createBrick(400, 100, 80, 30, '#60A5FA'),
    createBrick(500, 100, 80, 30, '#60A5FA'),
    createBrick(350, 150, 80, 30, '#2563EB'),
    createBrick(450, 150, 80, 30, '#2563EB'),
    createBrick(400, 200, 80, 30, '#1E3A8A'),
  ],
};

export default endlessLevel1; 