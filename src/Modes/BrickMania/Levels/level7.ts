import { LevelConfig, createBrick, createMaterialBrick, createBehaviorBrick, createMysteryBrick, createBonusBrick, createSpecialEffectBrick, createPowerUpBrick } from '../../../lib/levelConfig';

const level7: LevelConfig = {
  id: 7,
  name: 'Testing Ground',
  description: 'A test lab for all available bricks. Observe and debug behaviors.',
  difficulty: 'hard',
  paddleWidth: 120,
  ballSpeed: 4,
  unlocked: true,
  bricks: [
    // ── Normal Brick Row
    createBrick(100, 50, 80, 30, '#4B9CD3'),

    // ── Material Bricks Row
    createMaterialBrick(100, 100, 80, 30, 'bronze'),
    createMaterialBrick(200, 100, 80, 30, 'iron'),
    createMaterialBrick(300, 100, 80, 30, 'copper'),
    createMaterialBrick(400, 100, 80, 30, 'silver'),
    createMaterialBrick(500, 100, 80, 30, 'gold'),
    createMaterialBrick(600, 100, 80, 30, 'emerald'),
    createMaterialBrick(700, 100, 80, 30, 'sapphire'),
    createMaterialBrick(800, 100, 80, 30, 'ruby'),

    // ── Special Effect Bricks Row
    createSpecialEffectBrick(100, 160, 80, 30, 'explosive'),
    createSpecialEffectBrick(200, 160, 80, 30, 'freeze'),
    createSpecialEffectBrick(300, 160, 80, 30, 'speedBoost'),
    createSpecialEffectBrick(400, 160, 80, 30, 'portal'),
    createSpecialEffectBrick(500, 160, 80, 30, 'mirror'),

    // ── Power-Up Bricks Row
    createPowerUpBrick(100, 220, 80, 30, 'multiBall'),
    createPowerUpBrick(200, 220, 80, 30, 'enlargePaddle'),
    createPowerUpBrick(300, 220, 80, 30, 'shrinkPaddle'),
    createPowerUpBrick(400, 220, 80, 30, 'slowBall'),
    createPowerUpBrick(500, 220, 80, 30, 'laserPaddle'),

    // ── Behavior + Mystery + Bonus
    createBehaviorBrick(100, 280, 80, 30, 'moving'),
    createMysteryBrick(200, 280, 80, 30),
    createBonusBrick(300, 280, 80, 30, 'lifeBrick'),
  ],
};

export default level7;
