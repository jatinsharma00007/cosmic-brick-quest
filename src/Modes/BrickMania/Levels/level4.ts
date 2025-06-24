import { LevelConfig, createBrick, createMaterialBrick } from '../../../lib/levelConfig';

const level4: LevelConfig = {
  id: 4,
  name: 'Bronze Descent',
  description: 'An inverted pyramid with your first material bricks: Bronze!',
  difficulty: 'medium',
  paddleWidth: 110,
  ballSpeed: 3.7,
  unlocked: false,
  bricks: [
    // Top Row (widest)
    createBrick(200, 80, 80, 30, '#FFB300'),
    createBrick(300, 80, 80, 30, '#FFB300'),
    createBrick(400, 80, 80, 30, '#FFB300'),
    createBrick(500, 80, 80, 30, '#FFB300'),
    createBrick(600, 80, 80, 30, '#FFB300'),

    // Middle Row
    createBrick(250, 120, 80, 30, '#FFA000'),
    createMaterialBrick(350, 120, 80, 30, 'bronze'),
    createBrick(450, 120, 80, 30, '#FFA000'),

    // Bottom Row (tip of the pyramid)
    createMaterialBrick(400, 160, 80, 30, 'bronze'),
  ],
};

export default level4;
