// Game configuration and constants for Brick Breaker

export const GAME_SETTINGS = {
    ball: {
        baseSpeed: 7,
        radius: 10,
        initialY: 540
    },
    paddle: {
        height: 20,
        moveSpeed: 7,
        initialY: 550
    },
    canvas: {
        width: 800,
        height: 600,
        aspectRatio: 4 / 3
    },
    lives: 3,
    difficulty: {
        level1: {
            rows: 4,
            cols: 7,
            paddleWidth: 120,
            emptyChance: 0.3
        },
        level2: {
            rows: 6,
            cols: 8,
            paddleWidth: 100,
            emptyChance: 0.25
        },
        level3: {
            rows: 8,
            cols: 10,
            paddleWidth: 80,
            emptyChance: 0.2
        },
        level4: {
            rows: 10,
            cols: 12,
            paddleWidth: 70,
            emptyChance: 0.15
        }
    }
};

export const SCORE_SETTINGS = {
    normalBrick: 10,
    normalBrickColor: '#4B9CD3',
    normalBrickShadow: '0 0 10px rgba(75, 156, 211, 0.5)',
    lifeBonus: 500,
    materialBricks: {
        gold: {
            name: 'Gold',
            color: '#facc15',
            points: 100,
            effect: '0 0 15px rgba(250, 204, 21, 0.7)'
        },
        silver: {
            name: 'Silver',
            color: '#d1d5db',
            points: 70,
            effect: '0 0 15px rgba(209, 213, 219, 0.7)'
        },
        bronze: {
            name: 'Bronze',
            color: '#b45309',
            points: 50,
            effect: '0 0 15px rgba(180, 83, 9, 0.7)'
        },
        emerald: {
            name: 'Emerald',
            color: '#22c55e',
            points: 120,
            effect: '0 0 15px rgba(34, 197, 94, 0.7)'
        },
        ruby: {
            name: 'Ruby',
            color: '#ef4444',
            points: 150,
            effect: '0 0 15px rgba(239, 68, 68, 0.7)'
        },
        sapphire: {
            name: 'Sapphire',
            color: '#3b82f6',
            points: 130,
            effect: '0 0 15px rgba(59, 130, 246, 0.7)'
        }
    }
};

export const CONTROLS = {
    moveLeft: ['ArrowLeft', 'a', 'A'],
    moveRight: ['ArrowRight', 'd', 'D'],
    pause: [' '],
    menuOpen: ['m', 'M'],
    menuClose: ['Escape'],
};

// Size settings for desktop and mobile
export const GAME_SIZES = {
    desktop: {
        paddleWidth: 120, // default for level1, can be overridden by difficulty
        paddleHeight: 20,
        brickWidth: 80,
        brickHeight: 25,
        ballRadius: 10,
    },
    mobile: {
        paddleWidth: 140,
        paddleHeight: 28,
        brickWidth: 100,
        brickHeight: 36,
        ballRadius: 16,
    }
}; 