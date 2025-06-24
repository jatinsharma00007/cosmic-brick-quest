import { LevelConfig, createBrick, createMaterialBrick } from '../../../lib/levelConfig';

const level5: LevelConfig = {
  id: 5,
  name: 'Iron Cross',
  description: 'A cross-shaped challenge with Iron bricks at its heart.',
  difficulty: 'medium',
  paddleWidth: 105,
  ballSpeed: 3.9,
  unlocked: false,
  bricks: [
    // Vertical part of the cross
    createBrick(400, 60, 80, 30, '#90CAF9'),
    createBrick(400, 100, 80, 30, '#64B5F6'),
    createMaterialBrick(400, 140, 80, 30, 'iron'), // center Iron block
    createBrick(400, 180, 80, 30, '#64B5F6'),
    createBrick(400, 220, 80, 30, '#90CAF9'),

    // Horizontal part of the cross
    createBrick(240, 140, 80, 30, '#64B5F6'),
    createBrick(320, 140, 80, 30, '#42A5F5'),
    createMaterialBrick(480, 140, 80, 30, 'iron'),
    createBrick(560, 140, 80, 30, '#42A5F5'),
    createBrick(640, 140, 80, 30, '#64B5F6'),
  ],
};

export default level5;
