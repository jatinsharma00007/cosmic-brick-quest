for ($i=7; $i -le 100; $i++) {
    $levelContent = @"
import { LevelConfig, createBrick } from '../../../lib/levelConfig';

const level$($i): LevelConfig = {
  id: $i,
  name: 'Level $i',
  description: 'Level $i - Ready for challenge!',
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

export default level$($i);
"@
    $levelContent | Out-File -FilePath "level$i.ts" -Encoding UTF8
    Write-Host "Created level$i.ts"
} 