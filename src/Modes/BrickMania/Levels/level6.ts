import { LevelConfig, createBrick, createMaterialBrick, createSpecialEffectBrick } from '../../../lib/levelConfig';

const level6: LevelConfig = {
  id: 6,
  name: 'Ring of Fire',
  description: 'A circular ring of bricks with a volatile core.',
  difficulty: 'medium',
  paddleWidth: 100,
  ballSpeed: 4.2,
  unlocked: false,
  bricks: [
    // Outer ring (bronze)
    createMaterialBrick(300, 100, 80, 30, 'bronze'),
    createMaterialBrick(380, 80, 80, 30, 'bronze'),
    createMaterialBrick(460, 80, 80, 30, 'bronze'),
    createMaterialBrick(540, 100, 80, 30, 'bronze'),
    createMaterialBrick(560, 180, 80, 30, 'bronze'),
    createMaterialBrick(460, 220, 80, 30, 'bronze'),
    createMaterialBrick(380, 220, 80, 30, 'bronze'),
    createMaterialBrick(280, 180, 80, 30, 'bronze'),

    // Inner cross (iron)
    createMaterialBrick(380, 150, 80, 30, 'iron'),
    createMaterialBrick(460, 150, 80, 30, 'iron'),
    createMaterialBrick(420, 120, 80, 30, 'iron'),
    createMaterialBrick(420, 180, 80, 30, 'iron'),

    // Center explosive core
    createSpecialEffectBrick(420, 150, 80, 30, 'explosive', 120),
  ],
};

export default level6;
