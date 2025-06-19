interface ParticleDeviceSettings {
    size: number;
    count: number;
    duration: number;
    intensity: number;
    glowIntensity: number;
}

interface ParticleSettings {
    desktop: ParticleDeviceSettings;
    tablet: ParticleDeviceSettings;
    mobile: ParticleDeviceSettings;
}

export const PARTICLE_SETTINGS: ParticleSettings = {
    desktop: {
        size: 4,
        count: 12,
        duration: 1200,
        intensity: 1,
        glowIntensity: 10
    },
    tablet: {
        size: 3.5,
        count: 10,
        duration: 1100,
        intensity: 0.9,
        glowIntensity: 8
    },
    mobile: {
        size: 2.5,
        count: 8,
        duration: 600,
        intensity: 0.7,
        glowIntensity: 5
    }
};

// Helper function to get device type based on screen width
export const getDeviceType = (width: number): keyof ParticleSettings => {
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
};

// Helper function to get particle settings for current device
export const getParticleSettings = (): ParticleDeviceSettings => {
    const width = window.innerWidth;
    return PARTICLE_SETTINGS[getDeviceType(width)];
};

// Performance detection and settings adjustment
const performanceCache = {
    lastCheck: 0,
    fps: 60,
    adjustmentFactor: 1.0
};

// Helper to adjust settings based on detected performance
export const adjustSettingsForPerformance = (settings: ParticleDeviceSettings): ParticleDeviceSettings => {
    const now = performance.now();
    
    // Only check performance every 5 seconds
    if (now - performanceCache.lastCheck > 5000) {
        // Simple FPS estimation based on requestAnimationFrame timing
        let frameCount = 0;
        let lastTime = performance.now();
        
        const checkFps = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                // Calculate FPS and store it
                performanceCache.fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                
                // Adjust factor based on FPS
                if (performanceCache.fps < 30) {
                    performanceCache.adjustmentFactor = 0.5; // Reduce particle effects by half
                } else if (performanceCache.fps < 45) {
                    performanceCache.adjustmentFactor = 0.75; // Reduce by 25%
                } else {
                    performanceCache.adjustmentFactor = 1.0; // No reduction
                }
                
                performanceCache.lastCheck = now;
                return;
            }
            
            requestAnimationFrame(checkFps);
        };
        
        requestAnimationFrame(checkFps);
    }
    
    // Apply adjustment factor to settings
    const isMobile = window.innerWidth < 768;
    const adjustmentFactor = isMobile ? performanceCache.adjustmentFactor : 1.0;
    
    return {
        ...settings,
        count: Math.max(3, Math.floor(settings.count * adjustmentFactor)),
        size: settings.size * adjustmentFactor,
        glowIntensity: settings.glowIntensity * adjustmentFactor
    };
}; 